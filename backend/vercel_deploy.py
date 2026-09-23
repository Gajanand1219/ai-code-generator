"""
Vercel deployment service for generated websites.

Prepares deployment files, communicates with the
Vercel API and returns the deployed website URL.

Author: Gajanan Deshmukh
"""

import os
import re
import httpx

from fastapi import APIRouter
from pydantic import BaseModel

from utils import logger

router = APIRouter()

VERCEL_TOKEN = os.getenv("VERCEL_TOKEN", "").strip()
VERCEL_TEAM_ID = os.getenv("VERCEL_TEAM_ID", "").strip()

class DeployRequest(BaseModel):
    code: str
    project_name: str = "autogen-site"
    prompt: str = ""


class DeployResponse(BaseModel):
    success: bool
    url: str | None = None
    deployment_id: str | None = None
    project_name: str | None = None
    error: str | None = None


def create_vercel_project_name(prompt: str) -> str:
    """
    Convert user's prompt into a clean Vercel project name.

    Example:
    'Create a calculator website'
    -> calculator

    'Build a modern portfolio website'
    -> modern-portfolio

    'Create an AI chatbot for a shop'
    -> ai-chatbot-shop
    """

    if not prompt:
        return "generated-site"

    text = prompt.lower().strip()

    # Remove common website-generation words
    remove_words = [
        "create",
        "build",
        "make",
        "generate",
        "develop",
        "design",
        "website",
        "web",
        "site",
        "application",
        "app",
        "page",
        "landing",
        "please",
        "a",
        "an",
        "the",
    ]

    for word in remove_words:
        text = re.sub(
            rf"\b{re.escape(word)}\b",
            " ",
            text,
        )

    # Keep only letters/numbers
    text = re.sub(r"[^a-z0-9\s-]", "", text)

    # Convert spaces to -
    text = re.sub(r"\s+", "-", text)

    # Remove duplicate -
    text = re.sub(r"-+", "-", text)

    text = text.strip("-")

    # Fallback
    if not text:
        text = "generated-site"

    # Vercel project names should be reasonably short
    return text[:50].strip("-")

@router.post("/deploy", response_model=DeployResponse)
async def deploy_to_vercel(req: DeployRequest):

    code = (req.code or "").strip()

    if not code:
        return DeployResponse(
            success=False,
            error="No website code provided."
        )

    vercel_token = os.getenv("VERCEL_TOKEN", "").strip()

    if not vercel_token:
        return DeployResponse(
            success=False,
            error="VERCEL_TOKEN is not configured in backend .env"
        )

    # ------------------------------------------------------------
    # Create safe Vercel project name
    # ------------------------------------------------------------

    project_name = (req.project_name or "").strip()

    if not project_name:
        project_name = create_vercel_project_name(req.prompt or "")

    project_name = re.sub(
        r"[^a-zA-Z0-9-]+",
        "-",
        project_name.lower()
    )

    project_name = re.sub(
        r"-+",
        "-",
        project_name
    ).strip("-")

    project_name = project_name[:50].strip("-")

    if not project_name:
        project_name = "autogen-site"

    # ------------------------------------------------------------
    # Deployment payload
    # ------------------------------------------------------------

    deployment_payload = {
        "name": project_name,
        "target": "production",
        "files": [
            {
                "file": "index.html",
                "data": code
            }
        ],
        "projectSettings": {
            "framework": None
        }
    }

    if VERCEL_TEAM_ID:
        deployment_payload["teamId"] = VERCEL_TEAM_ID

    try:

        logger.info(
            f"🚀 Starting Vercel deployment: {project_name}"
        )

        async with httpx.AsyncClient(
            timeout=httpx.Timeout(
                connect=20.0,
                read=120.0,
                write=120.0,
                pool=20.0
            )
        ) as client:

            # ====================================================
            # 1. CREATE PRODUCTION DEPLOYMENT
            # ====================================================

            deployment_response = await client.post(
                "https://api.vercel.com/v13/deployments",
                headers={
                    "Authorization": f"Bearer {vercel_token}",
                    "Content-Type": "application/json",
                },
                json=deployment_payload
            )

            if deployment_response.status_code not in (200, 201):

                logger.error(
                    "❌ Vercel deployment failed: "
                    f"{deployment_response.status_code} "
                    f"{deployment_response.text}"
                )

                try:
                    error_data = deployment_response.json()

                    message = (
                        error_data.get("error", {}).get("message")
                        or error_data.get("message")
                        or deployment_response.text
                    )

                except Exception:
                    message = deployment_response.text

                return DeployResponse(
                    success=False,
                    error=(
                        f"Vercel deployment failed "
                        f"(HTTP {deployment_response.status_code}): "
                        f"{message}"
                    )
                )

            deployment_data = deployment_response.json()

            deployment_id = deployment_data.get("id")
            deployment_url = deployment_data.get("url")

            if not deployment_url:

                logger.error(
                    "Vercel did not return a deployment URL: "
                    f"{deployment_data}"
                )

                return DeployResponse(
                    success=False,
                    error="Vercel did not return a deployment URL."
                )

            if not deployment_url.startswith(
                ("http://", "https://")
            ):
                deployment_url = (
                    f"https://{deployment_url}"
                )

            logger.info(
                f"✅ Deployment created: {deployment_url}"
            )

            # ====================================================
            # 2. DISABLE PROJECT DEPLOYMENT PROTECTION
            # ====================================================
            #
            # Vercel API supports:
            #
            # {
            #     "ssoProtection": null,
            #     "passwordProtection": null
            # }
            #
            # This makes the project's deployment URLs public.
            # ====================================================

            protection_url = (
                "https://api.vercel.com/v9/projects/"
                f"{project_name}"
            )

            protection_params = {}

            if VERCEL_TEAM_ID:
                protection_params["teamId"] = VERCEL_TEAM_ID

            protection_response = await client.patch(
                protection_url,
                params=protection_params,
                headers={
                    "Authorization": f"Bearer {vercel_token}",
                    "Content-Type": "application/json",
                },
                json={
                    "ssoProtection": None,
                    "passwordProtection": None
                }
            )

            if protection_response.status_code not in (200, 201):

                logger.warning(
                    "⚠️ Deployment succeeded, but automatic "
                    "public-access configuration failed: "
                    f"{protection_response.status_code} "
                    f"{protection_response.text}"
                )

                # Do NOT mark deployment as failed.
                # The website itself was successfully deployed.

                protection_warning = (
                    "Website deployed successfully, but Vercel "
                    "Deployment Protection could not be disabled "
                    "automatically. Open Project Settings → "
                    "Deployment Protection and select None."
                )

            else:

                logger.info(
                    "🌐 Vercel Deployment Protection disabled."
                )

                protection_warning = None

            # ====================================================
            # 3. FINAL RESPONSE
            # ====================================================

            return DeployResponse(
                success=True,
                url=deployment_url,
                deployment_id=deployment_id,
                project_name=project_name,
                error=protection_warning
            )

    except httpx.TimeoutException:

        logger.exception(
            "⏱️ Vercel deployment timed out"
        )

        return DeployResponse(
            success=False,
            error="Vercel deployment timed out. Please try again."
        )

    except httpx.HTTPError as exc:

        logger.exception(
            f"🌐 Vercel HTTP error: {exc}"
        )

        return DeployResponse(
            success=False,
            error=f"Could not communicate with Vercel: {exc}"
        )

    except Exception as exc:

        logger.exception(
            f"❌ Unexpected Vercel deployment error: {exc}"
        )

        return DeployResponse(
            success=False,
            error=str(exc)
        )

