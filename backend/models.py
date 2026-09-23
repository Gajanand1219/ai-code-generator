"""
Pydantic data models for the AI Code Generator.

Defines request, response and session schemas
used for API validation and data exchange.

Author: Gajanan Deshmukh
"""
import os
import re
from typing import Optional, Tuple, Dict, Any, List
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import uuid

from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# GROQ CONFIGURATION
# ============================================================

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = os.getenv(
    "GROQ_BASE_URL",
    "https://api.groq.com/openai/v1"
)
GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

# Optional APIs
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

API_PORT = int(os.getenv("API_PORT", "8000"))


# ============================================================
# CONFIG VALIDATION
# ============================================================

if not GROQ_API_KEY:
    raise RuntimeError(
        "Missing required GROQ_API_KEY in .env file"
    )


# ============================================================
# DATA MODELS
# ============================================================

class CodeModificationType(str, Enum):
    CREATE = "create"
    MODIFY = "modify"
    ENHANCE = "enhance"
    DEBUG = "debug"
    REFACTOR = "refactor"


@dataclass
class CodeSession:
    session_id: str
    original_prompt: str
    current_code: str
    html_part: str
    css_part: str
    js_part: str
    modification_history: List[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "original_prompt": self.original_prompt,
            "current_code": self.current_code,
            "html_length": len(self.html_part),
            "css_length": len(self.css_part),
            "js_length": len(self.js_part),
            "modification_count": len(self.modification_history),
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat()
        }


# ============================================================
# PYDANTIC REQUEST / RESPONSE MODELS
# ============================================================

class CodeRequest(BaseModel):
    prompt: str

    language: Optional[str] = "html"

    include_css: Optional[bool] = True

    include_js: Optional[bool] = True

    session_id: Optional[str] = None

    modification_type: Optional[CodeModificationType] = (
        CodeModificationType.CREATE
    )

    ai_model: Optional[str] = GROQ_MODEL

    creativity_level: Optional[int] = 7


class CodeResponse(BaseModel):
    success: bool

    html: Optional[str] = None

    css: Optional[str] = None

    js: Optional[str] = None

    full_code: Optional[str] = None

    session_id: Optional[str] = None

    is_modification: Optional[bool] = False

    modification_summary: Optional[str] = None

    modification_details: Optional[Dict[str, Any]] = None

    ai_model_used: Optional[str] = None

    creativity_applied: Optional[float] = None

    error: Optional[str] = None


class SessionResponse(BaseModel):
    success: bool

    session: Dict[str, Any]

    analysis: Optional[Dict[str, Any]] = None


class AnalyzeRequest(BaseModel):
    code: str


class AnalyzeResponse(BaseModel):
    success: bool

    analysis: Dict[str, Any]

    suggestions: List[Dict[str, Any]]

    error: Optional[str] = None


# ============================================================
# VERCEL DEPLOYMENT
# ============================================================

class DeployRequest(BaseModel):
    code: str
    project_name: str = "autogen-site"


class DeployResponse(BaseModel):
    success: bool
    url: str | None = None
    deployment_id: str | None = None
    project_name: str | None = None
    error: str | None = None