"""
FastAPI application for the AI Code Generator.

Provides REST APIs for code generation, modification,
analysis, session management and website deployment.

Author: Gajanan Deshmukh
"""


import os
import logging

from typing import Optional, Tuple, Dict, Any, List

from datetime import datetime

from fastapi import FastAPI, HTTPException

from fastapi.middleware.cors import CORSMiddleware

import uvicorn

import hashlib
import re
import httpx

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

from pydantic import BaseModel

# ============================================================
# GROQ / OPENAI COMPATIBLE CLIENT
# ============================================================

try:
    from openai import OpenAI

    HAS_GROQ_CLIENT = True

except ImportError:

    HAS_GROQ_CLIENT = False

    OpenAI = None


# ============================================================
# IMPORT CONFIGURATION
# ============================================================

from models import (
    GROQ_API_KEY,
    GROQ_BASE_URL,
    GROQ_MODEL,
    ANTHROPIC_API_KEY,
    GOOGLE_API_KEY,
    API_PORT,

    CodeRequest,
    CodeResponse,
    SessionResponse,
    AnalyzeRequest,
    AnalyzeResponse,

    CodeModificationType
)


from utils import (
    logger,
    CodeAnalyzer,
    CodeModifier,
    SessionManager,
    calculate_temperature,
    extract_code_blocks,
    combine_code,
    generate_modification_summary
)

# ============================================================
# SCREENSHOT / VISION AI
# ============================================================
try:
    from ai_service import (
        analyze_screenshot_with_mistral,
        run_vision_to_website,
    )
    HAS_MISTRAL_VISION = True
except ImportError as e:
    HAS_MISTRAL_VISION = False
    analyze_screenshot_with_mistral = None
    run_vision_to_website = None
    logger.warning(f"Mistral Vision service unavailable: {e}")


# ============================================================
# LOGGING
# ============================================================

logging.basicConfig(level=logging.INFO)

# ============================================================
# VERCEL DEPLOYMENT
# ============================================================

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


class ScreenshotAnalysisRequest(BaseModel):
    image_data_url: str
    prompt: Optional[str] = None


class ImageWebsiteRequest(BaseModel):
    image_data_url: str
    prompt: str = "Recreate this website from the screenshot."
    existing_code: str = ""
    session_id: Optional[str] = None

# ============================================================
# INITIALIZE GROQ CLIENT
# ============================================================

groq_client = None


if HAS_GROQ_CLIENT and GROQ_API_KEY:

    try:

        groq_client = OpenAI(
            api_key=GROQ_API_KEY,
            base_url=GROQ_BASE_URL
        )

        logger.info(
            "✅ Successfully initialized Groq client"
        )

        logger.info(
            f"   Base URL: {GROQ_BASE_URL}"
        )

        logger.info(
            f"   Default Model: {GROQ_MODEL}"
        )

    except Exception as e:

        logger.error(
            f"❌ Failed to initialize Groq client: {e}"
        )

        groq_client = None


# ============================================================
# SESSION MANAGER
# ============================================================

session_manager = SessionManager()


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="AutoGen Progressive Code Generator API",
    description=(
        "Advanced code generation with intelligent "
        "modifications and Groq AI"
    ),
    version="2.2.0"
)


# ============================================================
# CORS
# ============================================================

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://shivyogelectronics.vercel.app",
]

# Optional extra frontend origins from .env
_extra_cors = os.getenv("CORS_ORIGINS", "")
if _extra_cors:
    for _origin in _extra_cors.split(","):
        _origin = _origin.strip().rstrip("/")
        if _origin and _origin not in origins:
            origins.append(_origin)


app.add_middleware(
    CORSMiddleware,

    allow_origins=origins,

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ============================================================
# GROQ CHAT COMPLETION
# ============================================================

def run_groq_chat_completion(
    messages: list,
    model: str,
    temperature: float = 0.7,
    max_tokens: int = 5000
) -> str:

    global groq_client

    if not groq_client:

        logger.error(
            "Groq client not initialized"
        )

        raise RuntimeError(
            "Groq client not initialized"
        )


    try:

        logger.info(
            f"Calling Groq with model: {model}"
        )


        params = {
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }


        logger.info(
            f"Groq parameters: "
            f"temperature={temperature}, "
            f"max_tokens={max_tokens}"
        )


        response = groq_client.chat.completions.create(
            **params
        )


        if (
            hasattr(response, "choices")
            and response.choices
        ):

            content = response.choices[0].message.content

            logger.info(
                "✅ Successfully received response from Groq"
            )

            return content or ""


        logger.error(
            f"Unexpected Groq response: {response}"
        )

        return str(response)


    except Exception as e:

        logger.error(
            f"Groq API error: {str(e)}"
        )

        raise RuntimeError(
            f"Groq API call failed: {e}"
        )






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





# ============================================================
# MINIMAL GROQ COMPLETION
# ============================================================

def run_groq_chat_completion_minimal(
    messages: list,
    model: str
) -> str:

    global groq_client


    if not groq_client:

        raise RuntimeError(
            "Groq client not initialized"
        )


    try:

        logger.info(
            f"Calling Groq minimal completion: {model}"
        )


        response = groq_client.chat.completions.create(
            model=model,
            messages=messages
        )


        if (
            hasattr(response, "choices")
            and response.choices
        ):

            return (
                response.choices[0]
                .message
                .content
                or ""
            )


        return str(response)


    except Exception as e:

        logger.error(
            f"Groq API error: {e}"
        )

        raise RuntimeError(
            f"Groq API call failed: {e}"
        )


# ============================================================
# CLAUDE
# ============================================================

def run_claude_completion(
    messages: list,
    temperature: float = 0.7,
    max_tokens: int = 3000
) -> str:

    try:

        import anthropic


        if not ANTHROPIC_API_KEY:

            logger.warning(
                "Anthropic API key not configured. "
                "Falling back to Groq."
            )

            return run_groq_chat_completion_minimal(
                messages,
                GROQ_MODEL
            )


        client = anthropic.Anthropic(
            api_key=ANTHROPIC_API_KEY
        )


        system_message = ""

        user_message = ""


        for msg in messages:

            if msg["role"] == "system":

                system_message = msg["content"]

            elif msg["role"] == "user":

                user_message = msg["content"]


        response = client.messages.create(

            model="claude-3-opus-20240229",

            max_tokens=max_tokens,

            temperature=temperature,

            system=system_message,

            messages=[
                {
                    "role": "user",
                    "content": user_message
                }
            ]
        )


        return response.content[0].text


    except ImportError:

        logger.warning(
            "Anthropic package not installed. "
            "Falling back to Groq."
        )

        return run_groq_chat_completion_minimal(
            messages,
            GROQ_MODEL
        )


    except Exception as e:

        logger.error(
            f"Claude API error: {e}. Falling back to Groq."
        )

        return run_groq_chat_completion_minimal(
            messages,
            GROQ_MODEL
        )


# ============================================================
# GEMINI
# ============================================================

def run_gemini_completion(
    messages: list,
    temperature: float = 0.7,
    max_tokens: int = 3000
) -> str:

    logger.warning(
        "Gemini integration not configured. "
        "Falling back to Groq."
    )

    return run_groq_chat_completion_minimal(
        messages,
        GROQ_MODEL
    )


# ============================================================
# MAIN AI COMPLETION
# ============================================================

def run_ai_completion(
    messages: list,
    ai_model: str,
    creativity_level: int,
    is_modification: bool
) -> Tuple[str, str, float]:

    temperature = calculate_temperature(
        creativity_level,
        is_modification
    )


    if temperature is None:

        # Groq does support temperature,
        # so use a safe default.
        temperature = 0.7


    logger.info(
        f"Using Groq AI: {GROQ_MODEL}, "
        f"temperature={temperature}, "
        f"creativity={creativity_level}"
    )


    try:

        # Always use configured Groq model.
        actual_model = GROQ_MODEL


        content = run_groq_chat_completion(

            messages=messages,

            model=actual_model,

            temperature=temperature,

            max_tokens=6000
        )


        return (
            content,
            actual_model,
            temperature
        )


    except Exception as e:

        logger.error(
            f"Groq model failed: {e}"
        )

        raise RuntimeError(
            f"Groq AI model failed: {e}"
        )


# ============================================================
# BUILD MESSAGES
# ============================================================

def build_messages(
    request: CodeRequest,
    session=None
) -> Tuple[str, List[Dict[str, str]]]:

    is_modification = (

        request.modification_type
        != CodeModificationType.CREATE

        and session

        and session.current_code

        and len(session.current_code.strip()) > 0
    )


    if is_modification:

        context = CodeModifier.create_context_prompt(

            session.current_code,

            request.prompt,

            request.modification_type.value
        )


        system_message = f"""
        You are an expert web developer.

        Create clean, modern, responsive {request.language.upper()} code.

        IMPORTANT:
        The generated website MUST be fully functional, not just visually attractive.

        GUIDELINES:

        1. Return complete runnable code.

        2. Use separate code blocks:
        ```html
        ```css
        ```javascript

        3. Make the UI modern and professional.

        4. Ensure mobile responsiveness.

        5. Use semantic HTML5.

        6. Add appropriate CSS.

        7. Include JavaScript when needed.

        8. Do not include explanations outside code blocks.

        9. ALL navigation links MUST work.

        10. NEVER use:
            href="#"
            href="javascript:void(0)"
            dead links
            placeholder links

        11. Every navbar link must point to a real destination.

        12. For single-page websites:
            - Home -> #home
            - About -> #about
            - Services -> #services
            - Products -> #products
            - Menu -> #menu
            - Gallery -> #gallery
            - Contact -> #contact

        13. Every referenced section ID MUST actually exist in the HTML.

        14. Example:
            <a href="#about">About</a>
            must have:
            <section id="about">...</section>

        15. Add:
            html {{
                scroll-behavior: smooth;
            }}

        16. Important buttons MUST work.
            For example:
            - "Explore Menu" -> scroll to #menu
            - "Learn More" -> scroll to relevant section
            - "Get Started" -> scroll to relevant section
            - "Contact Us" -> scroll to #contact

        17. Use real JavaScript interactions for:
            - buttons
            - forms
            - search
            - menus
            - modals
            - tabs
            - filters
            - toggles
            when applicable.

        18. Forms must have working submit behavior.
            Do not create buttons that do nothing.

        19. External links must use valid URLs and:
            target="_blank"
            rel="noopener noreferrer"
            when appropriate.

        20. Before returning the code, verify:
            - Every href points somewhere valid.
            - Every #section link has a matching id.
            - Every important button has an action.
            - No placeholder "#" links remain.
            - No dead buttons remain.

            FUNCTIONALITY IS AS IMPORTANT AS DESIGN.


        9. The generated project must work immediately inside a Live Preview iframe.

        10. Generate a completely standalone HTML document.

        11. ALL CSS MUST be inside ONE <style> block inside <head>.

        12. ALL JavaScript MUST be inside ONE <script> block before </body>.

        13. NEVER reference local external files:
            - styles.css
            - style.css
            - app.js
            - script.js
            - main.js
            - index.js

        14. NEVER duplicate <style> blocks.

        15. NEVER duplicate <script> blocks unless multiple scripts are genuinely required.

        16. Do not include the same CSS rules more than once.

        17. Do not include the same JavaScript functionality more than once.

        18. The generated HTML must work when assigned directly to iframe.srcDoc.

        19. Do not depend on files that are not included in the returned HTML.

        20. Do not include localhost URLs unless the user explicitly requests them.

        21. Do not include the AutoGen AI application itself inside generated output.

        22. The generated website must be independent from the code generator UI.

        23. Before returning code, verify:
            - exactly one main <style> block
            - exactly one main <script> block
            - no styles.css reference
            - no script.js reference
            - no app.js reference
            - no duplicate CSS
            - no duplicate JavaScript
            - all buttons have functionality
            - all internal links have valid targets

        24. If the website requires an API:
            - NEVER expose a real secret API key in frontend code.
            - Use a clearly documented backend endpoint such as /api/chat.
            - If no backend is available, provide a functional demo/mock response instead.

        User Request:
        {request.prompt}
        """


        user_message = f"""
Make the following modification
to the existing code:

{request.prompt}

Return the complete modified code
with all changes applied.
"""


    else:

        system_message = f"""
You are an expert web developer.

Create clean, modern, responsive
{request.language.upper()} code.

GUIDELINES:

1. Return complete runnable code.

2. Use separate code blocks:
   HTML
   CSS
   JavaScript

3. Make the UI modern and professional.

4. Ensure mobile responsiveness.

5. Use semantic HTML5.

6. Add appropriate CSS.

7. Include JavaScript when needed.

8. Do not include explanations outside
   code blocks.

User Request:
{request.prompt}
"""


        user_message = (
            f"Create {request.language.upper()} "
            f"code for: {request.prompt}"
        )


    messages = [

        {
            "role": "system",
            "content": system_message
        },

        {
            "role": "user",
            "content": user_message
        }
    ]


    return system_message, messages


# ============================================================
# ROOT
# ============================================================

@app.get("/")
async def root():

    return {

        "message":
            "AutoGen Progressive Code Generator API v2.2",

        "version": "2.2.0",

        "provider": "Groq",

        "features": [

            "Intelligent code analysis",

            "Progressive modifications",

            "Context-aware generation",

            "Session management",

            "Groq AI",

            "GPT-OSS 120B",

            "Creativity Level Control"
        ],

        "supported_ai_models": [

            GROQ_MODEL
        ],

        "endpoints": {

            "generate":
                "/generate (POST)",

            "sessions":
                "/sessions/{session_id} (GET)",

            "analyze":
                "/analyze (POST)",

            "examples":
                "/examples (GET)",

            "health":
                "/health (GET)"
        },

        "groq_config": {

            "base_url":
                GROQ_BASE_URL,

            "default_model":
                GROQ_MODEL
        }
    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
async def health_check():

    test_success = False

    test_error = None


    if groq_client:

        try:

            test_response = (
                groq_client
                .chat
                .completions
                .create(

                    model=GROQ_MODEL,

                    messages=[
                        {
                            "role": "user",
                            "content":
                                "Say Hello in one word."
                        }
                    ],

                    max_tokens=20
                )
            )


            if (
                hasattr(test_response, "choices")
                and test_response.choices
            ):

                test_success = True


        except Exception as e:

            test_error = str(e)


    return {

        "status":
            "healthy"
            if test_success
            else "unhealthy",

        "timestamp":
            datetime.now().isoformat(),

        "provider":
            "Groq",

        "model":
            GROQ_MODEL,

        "groq_client_initialized":
            groq_client is not None,

        "groq_test_success":
            test_success,

        "groq_test_error":
            test_error,

        "groq_base_url":
            GROQ_BASE_URL
    }


# ============================================================
# ANALYZE
# ============================================================

@app.post(
    "/analyze",
    response_model=AnalyzeResponse
)
async def analyze_code(req: AnalyzeRequest):

    try:

        analysis = (
            CodeAnalyzer
            .analyze_structure(req.code)
        )


        suggestions = (
            CodeAnalyzer
            .find_modification_points(
                req.code,
                ""
            )
        )


        return AnalyzeResponse(

            success=True,

            analysis=analysis,

            suggestions=suggestions
        )


    except Exception as e:

        return AnalyzeResponse(

            success=False,

            analysis={},

            suggestions=[],

            error=str(e)
        )


# ============================================================
# GENERATE
# ============================================================

@app.post(
    "/generate",
    response_model=CodeResponse
)
async def generate_code(req: CodeRequest):

    try:

        logger.info(
            f"Generation request: "
            f"{req.prompt[:100]}... "
            f"(type={req.modification_type}, "
            f"model={req.ai_model}, "
            f"creativity={req.creativity_level})"
        )


        # ============================================================
        # PROJECT SESSION CONTINUITY
        # ============================================================
        # Only CREATE can start a new project.
        # MODIFY / ENHANCE / DEBUG / REFACTOR must use the existing
        # session and therefore the existing project code.
        session = None
        is_create_request = (
            req.modification_type == CodeModificationType.CREATE
        )

        if req.session_id:
            session = session_manager.get_session(req.session_id)

            if not session:
                return CodeResponse(
                    success=False,
                    error=(
                        "Project session not found. "
                        "Please create the project again before modifying it."
                    )
                )

        elif not is_create_request:
            return CodeResponse(
                success=False,
                error=(
                    "No active project session. "
                    "Create a project first, then use Modify, "
                    "Add Feature, Fix Bug, or Refactor."
                )
            )

        else:
            req.session_id = session_manager.create_session(req.prompt)
            session = session_manager.get_session(req.session_id)

        # Modification check
        is_modification = (

            req.modification_type
            != CodeModificationType.CREATE

            and session

            and session.current_code

            and len(
                session.current_code.strip()
            ) > 0
        )


        # Build messages
        system_msg, messages = build_messages(
            req,
            session
        )


        # Generate
        logger.info(
            f"Calling Groq model: {GROQ_MODEL}"
        )


        assistant_text, ai_model_used, temperature_applied = (
            run_ai_completion(

                messages,

                req.ai_model,

                req.creativity_level,

                is_modification
            )
        )


        # Parse code
        blocks = extract_code_blocks(
            assistant_text
        )


        html_block = blocks.get(
            "html",
            ""
        )

        css_block = blocks.get(
            "css",
            ""
        )

        js_block = blocks.get(
            "js",
            ""
        )


        if (
            not html_block
            and assistant_text.strip()
        ):

            html_block = assistant_text.strip()


        # Combine
        full_code = combine_code(

            html_block,

            css_block,

            js_block,

            req.include_css,

            req.include_js
        )


        # Summary
        modification_summary = (
            generate_modification_summary(

                req,

                session.current_code
                if session and is_modification
                else "",

                full_code
            )
        )


        # Modification record
        modification_record = {

            "timestamp":
                datetime.now().isoformat(),

            "prompt":
                req.prompt,

            "type":
                req.modification_type.value,

            "ai_model":
                ai_model_used,

            "creativity_level":
                req.creativity_level,

            "temperature_applied":
                temperature_applied,

            "summary":
                modification_summary
        }


        # Update session
        session_manager.update_session(

            req.session_id,

            full_code,

            html_block,

            css_block,

            js_block,

            modification_record
        )


        response_data = {

            "success":
                True,

            "html":
                html_block or full_code,

            "css":
                css_block,

            "js":
                js_block,

            "full_code":
                full_code,

            "session_id":
                req.session_id,

            "is_modification":
                is_modification,

            "modification_summary":
                modification_summary[
                    "description"
                ],

            "modification_details":
                modification_summary,

            "ai_model_used":
                ai_model_used,

            "creativity_applied":
                temperature_applied
        }


        return CodeResponse(
            **response_data
        )


    except Exception as e:

        logger.exception(
            "Error generating code"
        )


        return CodeResponse(

            success=False,

            error=str(e),

            ai_model_used=(
                GROQ_MODEL
            )
        )



# ============================================================
# SCREENSHOT -> UI SPECIFICATION
# ============================================================

@app.post("/analyze-screenshot")
async def analyze_screenshot(req: ScreenshotAnalysisRequest):
    try:
        if not HAS_MISTRAL_VISION or analyze_screenshot_with_mistral is None:
            return {
                "success": False,
                "error": "Mistral Vision service is not available. Check MISTRAL_API_KEY and ai_service.py."
            }

        if not req.image_data_url.startswith("data:image/"):
            return {
                "success": False,
                "error": "Please upload a valid image."
            }

        specification = analyze_screenshot_with_mistral(
            image_data_url=req.image_data_url,
            prompt=req.prompt
        )

        return {
            "success": True,
            "specification": specification,
            "ai_model_used": os.getenv("MISTRAL_VISION_MODEL", "ministral-14b-2512")
        }

    except Exception as e:
        logger.exception("Screenshot analysis failed")
        return {"success": False, "error": str(e)}


# ============================================================
# SCREENSHOT -> WEBSITE
# ============================================================

@app.post("/generate-from-image")
async def generate_from_image(req: ImageWebsiteRequest):
    try:
        if not HAS_MISTRAL_VISION or run_vision_to_website is None:
            return {
                "success": False,
                "error": "Mistral Vision service is not available. Check MISTRAL_API_KEY and ai_service.py."
            }

        if not req.image_data_url.startswith("data:image/"):
            return {
                "success": False,
                "error": "Please upload a valid image."
            }

        # Reuse the existing BuildCode project session when supplied.
        session = None
        if req.session_id:
            session = session_manager.get_session(req.session_id)
            if not session:
                return {"success": False, "error": "Project session not found."}
        else:
            req.session_id = session_manager.create_session("Screenshot -> Website")
            session = session_manager.get_session(req.session_id)

        existing_code = (req.existing_code or "").strip()
        if not existing_code and session and session.current_code:
            existing_code = session.current_code

        assistant_text = run_vision_to_website(
            image_data_url=req.image_data_url,
            prompt=req.prompt,
            existing_code=existing_code
        )

        blocks = extract_code_blocks(assistant_text)
        html_block = blocks.get("html", "")
        css_block = blocks.get("css", "")
        js_block = blocks.get("js", "")

        if not html_block and assistant_text.strip():
            html_block = assistant_text.strip()

        full_code = combine_code(
            html_block,
            css_block,
            js_block,
            True,
            True
        )

        modification_record = {
            "timestamp": datetime.now().isoformat(),
            "prompt": req.prompt,
            "type": "SCREENSHOT_TO_WEBSITE",
            "ai_model": os.getenv("MISTRAL_VISION_MODEL", "ministral-14b-2512") + " + " + GROQ_MODEL,
        }

        session_manager.update_session(
            req.session_id,
            full_code,
            html_block,
            css_block,
            js_block,
            modification_record
        )

        return {
            "success": True,
            "session_id": req.session_id,
            "html": html_block or full_code,
            "css": css_block,
            "js": js_block,
            "full_code": full_code,
            "ai_model_used": os.getenv("MISTRAL_VISION_MODEL", "ministral-14b-2512") + " + " + GROQ_MODEL
        }

    except Exception as e:
        logger.exception("Image to website generation failed")
        return {"success": False, "error": str(e)}


# ============================================================
# DEPLOY GENERATED WEBSITE TO VERCEL
# ============================================================
#
# Every project deployed by this endpoint is configured as PUBLIC:
# - Vercel Authentication disabled
# - Password Protection disabled
#
# The Vercel token remains backend-only in .env.
# ============================================================

@app.post("/deploy", response_model=DeployResponse)
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


# ============================================================
# SESSION
# ============================================================

@app.get(
    "/sessions/{session_id}"
)
async def get_session(
    session_id: str
):

    session = (
        session_manager
        .get_session(session_id)
    )


    if not session:

        raise HTTPException(
            status_code=404,
            detail="Session not found"
        )


    analysis = (

        CodeAnalyzer
        .analyze_structure(
            session.current_code
        )

        if session.current_code

        else {}
    )


    return SessionResponse(

        success=True,

        session=session.to_dict(),

        analysis=analysis
    )


@app.delete(
    "/sessions/{session_id}"
)
async def delete_session(
    session_id: str
):

    session_manager.delete_session(
        session_id
    )


    return {

        "success": True,

        "message":
            "Session deleted"
    }


@app.get("/sessions")
async def list_sessions():

    sessions = []


    for (
        session_id,
        session
    ) in session_manager.sessions.items():

        sessions.append(
            session.to_dict()
        )


    return {

        "success": True,

        "count":
            len(sessions),

        "sessions":
            sessions
    }


# ============================================================
# CORS DEBUG
# ============================================================

logger.info(f"Allowed CORS origins: {origins}")


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    logger.info(
        "Starting AutoGen Progressive "
        "Code Generator API"
    )

    logger.info(
        f"Groq Base URL: {GROQ_BASE_URL}"
    )

    logger.info(
        f"Groq Model: {GROQ_MODEL}"
    )

    logger.info(
        f"Groq Client Initialized: "
        f"{groq_client is not None}"
    )


    if groq_client:

        try:

            logger.info(
                "Testing Groq connection..."
            )


            test_response = (
                groq_client
                .chat
                .completions
                .create(

                    model=GROQ_MODEL,

                    messages=[
                        {
                            "role": "user",
                            "content":
                                "Hello, are you working?"
                        }
                    ],

                    max_tokens=20
                )
            )


            logger.info(
                "✅ Groq connection test successful"
            )


        except Exception as e:

            logger.error(
                f"❌ Groq connection test failed: {e}"
            )


    uvicorn.run(

        "main:app",

        host="0.0.0.0",

        port=API_PORT,

        reload=True
    )