"""
Project generation endpoint.

Validation: a project name is REQUIRED. There is no default/placeholder
name applied anywhere — Pydantic's min_length=1 on
ProjectGenerateRequest.name plus this explicit check means an empty name
is rejected with a clear 422 before any AI call is made.
"""
from fastapi import APIRouter, HTTPException
import logging

from app.schemas import ProjectGenerateRequest
from app.services.ai_generation import generate_project
from app.services.fallback_generator import build_fallback

router = APIRouter(prefix="/generate", tags=["Generate"])
logger = logging.getLogger(__name__)


@router.post("/")
async def generate(payload: ProjectGenerateRequest):
    name = payload.name.strip()
    intent = payload.intent.strip()

    if not name:
        raise HTTPException(422, "A project name is required — it cannot be blank")
    if not intent:
        raise HTTPException(422, "Please describe what you want to build")

    try:
        result = await generate_project(name, intent, payload.stack)
        result["source"] = "ai"
        return result
    except Exception as exc:
        logger.warning("AI generation failed, using fallback: %s", exc)
        result = build_fallback(name, intent, payload.stack)
        result["source"] = "fallback"
        return result
