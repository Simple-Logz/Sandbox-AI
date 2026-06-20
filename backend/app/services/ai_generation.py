"""
AI project generation.

This is the single biggest security fix versus the old architecture: the
Anthropic API key now lives only in this process's environment variables
(via app.config.settings) and is never sent to, or callable from, the
browser. The frontend calls our own /generate endpoint; we call Anthropic
from here, server-side.
"""
import json
import re
from typing import Any

import anthropic

from app.config import settings

_client: anthropic.Anthropic | None = None


def _get_client() -> anthropic.Anthropic:
    global _client
    if _client is None:
        _client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
    return _client


def is_website_intent(intent: str, stack: list[str]) -> bool:
    """Detect a customer-facing website request vs a backend API request."""
    website_signal = re.search(
        r"\bpages?\b|website|homepage|landing page|gallery|menu|booking|"
        r"reservation|appointment|enroll|membership|portfolio|listing|"
        r"catalog|storefront|branding|tagline",
        intent,
        re.IGNORECASE,
    )
    backend_stack = any(re.search(r"fastapi|django|express", s, re.IGNORECASE) for s in stack)
    return bool(website_signal) and not backend_stack


def _extract_json(raw: str) -> dict[str, Any]:
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        raise ValueError("Model did not return JSON")
    return json.loads(match.group(0))


WEBSITE_PROMPT_TEMPLATE = """You are a senior frontend engineer and brand designer at a top-tier digital agency. A client has described a business website they want built. Generate a COMPLETE, PRODUCTION-READY Next.js website — real working pages with real content, not lorem ipsum.

INTENT: "{intent}"
PROJECT NAME: {name}
{stack_note}

CRITICAL RULES:
1. Build EVERY page mentioned in the intent as a real Next.js page with complete, realistic content.
2. Every component must be COMPLETE, WORKING React/TypeScript code. No TODOs.
3. App Router (app/ directory), TypeScript, Tailwind CSS utility classes only.
4. Include real forms (booking, contact, quote, etc.) with field validation.
5. README must explain how to run it locally and how to customize branding.

Respond ONLY with valid JSON, no markdown fences:
{{
  "description": "one-sentence summary",
  "architecture": [{{"layer": "...", "tech": "...", "desc": "..."}}],
  "files": {{ "README.md": "...", "package.json": "...", "app/page.tsx": "...", "...": "..." }}
}}
Build at least 4 distinct pages beyond the homepage if the intent lists that many."""

API_PROMPT_TEMPLATE = """You are a senior software engineer and architect. Generate a COMPLETE, PRODUCTION-READY project scaffold for this intent — real code, not tutorials.

INTENT: "{intent}"
PROJECT NAME: {name}
{stack_note}

CRITICAL RULES:
1. Every model, route, and field must be SPECIFIC to the intent. No generic "Item" models.
2. Every file must be COMPLETE, working code. No TODOs, no "pass" stubs.
3. Modern best practices: Pydantic v2, async, proper error handling, typed responses.
4. At least 5 domain-specific API endpoints.
5. README with domain context, API reference, and deployment instructions.

Respond ONLY with valid JSON, no markdown fences:
{{
  "description": "one-sentence summary",
  "architecture": [{{"layer": "...", "tech": "...", "desc": "..."}}],
  "files": {{ "README.md": "...", "main.py": "...", "app/models.py": "...", "...": "..." }}
}}"""


async def generate_project(name: str, intent: str, stack: list[str]) -> dict[str, Any]:
    """
    Calls Claude to generate a project scaffold. Raises on failure — the
    caller (the /generate route) decides whether to fall back to a
    template-based generator or surface the error to the user.
    """
    if not settings.anthropic_api_key:
        raise RuntimeError("ANTHROPIC_API_KEY is not configured on the server")

    website = is_website_intent(intent, stack)
    stack_note = f"Requested stack: {', '.join(stack)}." if stack else ""
    template = WEBSITE_PROMPT_TEMPLATE if website else API_PROMPT_TEMPLATE
    prompt = template.format(intent=intent, name=name, stack_note=stack_note)

    client = _get_client()
    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=16000,
        messages=[{"role": "user", "content": prompt}],
    )
    raw_text = message.content[0].text if message.content else ""
    return _extract_json(raw_text)
