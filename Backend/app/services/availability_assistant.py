from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.services.google_calendar_service import create_event, list_events
from app.services.openai_service import ask_openai


def _dt_from_iso(value: str) -> datetime:
    # Accept common "Z" suffix
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def _events_context(db: Session, *, user_id: int, from_at: datetime, to_at: datetime) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    events = list_events(db, user_id=user_id, from_at=from_at, to_at=to_at)
    for e in (events or [])[:60]:
        start = (e.get("start") or {}).get("dateTime") or (e.get("start") or {}).get("date") or ""
        end = (e.get("end") or {}).get("dateTime") or (e.get("end") or {}).get("date") or ""
        items.append(
            {
                "title": str(e.get("summary") or "Event"),
                "start": start,
                "end": end,
                "location": str(e.get("location") or ""),
            }
        )
    return items


@dataclass
class AvailabilityChatResult:
    reply: str
    created_event: dict[str, Any] | None = None


def _langchain_available() -> bool:
    try:
        import langchain_core  # noqa: F401
    except Exception:
        return False
    return True


def _gemini_available() -> bool:
    try:
        import langchain_google_genai  # noqa: F401
    except Exception:
        return False
    return True


def _openai_available() -> bool:
    try:
        import langchain_openai  # noqa: F401
    except Exception:
        return False
    return True


def availability_chat(
    db: Session,
    *,
    user_id: int,
    message: str,
    now: datetime | None = None,
    horizon_days: int = 14,
) -> AvailabilityChatResult:
    """
    Calendar-aware assistant:
    - Fetch upcoming Google Calendar events for context
    - Use LangChain (if installed) + OpenAI to decide whether to create an event
    - If scheduling requested, create an event through Google Calendar API
    """

    now = now or datetime.now(timezone.utc)
    horizon = now + timedelta(days=horizon_days)

    try:
        events_context = _events_context(db, user_id=user_id, from_at=now, to_at=horizon)
    except Exception:
        events_context = []

    # Prefer LangChain pipeline; fall back to existing `ask_openai` behavior.
    #
    # Provider selection:
    # - Gemini if GEMINI_API_KEY is set
    # - Otherwise OpenAI if OPENAI_API_KEY is set
    if _langchain_available() and settings.gemini_api_key and _gemini_available():
        from pydantic import BaseModel, Field
        from langchain_google_genai import ChatGoogleGenerativeAI

        model_name = settings.gemini_model or "models/gemini-2.0-flash"
        if not model_name.startswith("models/"):
            model_name = f"models/{model_name}"

        class Action(BaseModel):
            intent: Literal["create_event", "query", "other"] = Field(
                description="create_event if the user wants to book/schedule/add something to the calendar; query if asking about availability; other otherwise."
            )
            title: str = ""
            start_at: str = Field(default="", description="ISO datetime (prefer UTC with Z) or empty if unknown")
            end_at: str = Field(default="", description="ISO datetime (prefer UTC with Z) or empty if unknown")
            location: str = ""
            notes: str = ""

        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.gemini_api_key,
            temperature=0.2,
        )

        try:
            action = llm.with_structured_output(Action).invoke(
                [
                    (
                        "system",
                        "You are a scheduling assistant. Extract the user's intent and event details.\n"
                        "Return accurate datetimes. If the user did not specify time/date, leave fields empty.",
                    ),
                    ("user", f"Now (UTC): {now.isoformat()}\nUser message: {message}"),
                ]
            )
        except Exception as exc:
            return AvailabilityChatResult(
                reply=(
                    "AI service error while analyzing your request (Gemini). "
                    "Check your GEMINI_API_KEY and model name.\n\n"
                    f"Details: {exc}"
                ),
                created_event=None,
            )

        created: dict[str, Any] | None = None
        if action.intent == "create_event":
            if action.title and action.start_at and action.end_at:
                try:
                    created = create_event(
                        db,
                        user_id=user_id,
                        title=action.title,
                        start_at=_dt_from_iso(action.start_at),
                        end_at=_dt_from_iso(action.end_at),
                        location=action.location or "",
                    )
                except Exception:
                    created = None

            try:
                reply = llm.invoke(
                    [
                        (
                            "system",
                            "You are an academic availability assistant. Be concise and practical.\n"
                            "Use the provided calendar events as truth.\n"
                            "- If an event was created, confirm with title + time.\n"
                            "- If scheduling details are missing, ask ONLY the missing details.\n",
                        ),
                        ("user", message),
                        ("system", f"Upcoming events JSON:\n{json.dumps(events_context)}"),
                        ("system", f"Extracted action JSON:\n{action.model_dump_json()}"),
                        ("system", f"Created event JSON (null if not created):\n{json.dumps(created)}"),
                    ]
                ).content.strip()
            except Exception as exc:
                if created:
                    reply = "Done — I created that event in your Google Calendar."
                else:
                    reply = (
                        "AI service error while generating the response (Gemini).\n\n"
                        f"Details: {exc}"
                    )

            return AvailabilityChatResult(reply=reply, created_event=created)

        try:
            reply = llm.invoke(
                [
                    (
                        "system",
                        "You are an academic availability assistant. Be concise and practical.\n"
                        "Use the provided upcoming events JSON as context. If data is insufficient, ask a short follow-up.",
                    ),
                    ("user", message),
                    ("system", f"Upcoming events JSON:\n{json.dumps(events_context)}"),
                ]
            ).content.strip()
        except Exception as exc:
            reply = (
                "AI service error while generating the response (Gemini).\n\n"
                f"Details: {exc}"
            )

        return AvailabilityChatResult(reply=reply, created_event=None)

    if _langchain_available() and settings.openai_api_key and _openai_available():
        from pydantic import BaseModel, Field
        from langchain_openai import ChatOpenAI

        class Action(BaseModel):
            intent: Literal["create_event", "query", "other"] = Field(
                description="create_event if the user wants to book/schedule/add something to the calendar; query if asking about availability; other otherwise."
            )
            title: str = ""
            start_at: str = Field(default="", description="ISO datetime (prefer UTC with Z) or empty if unknown")
            end_at: str = Field(default="", description="ISO datetime (prefer UTC with Z) or empty if unknown")
            location: str = ""
            notes: str = ""

        llm = ChatOpenAI(model=settings.openai_model, temperature=0.2, api_key=settings.openai_api_key)

        action: Action
        try:
            action = llm.with_structured_output(Action).invoke(
                [
                    (
                        "system",
                        "You are a scheduling assistant. Extract the user's intent and event details.\n"
                        "Return accurate datetimes. If the user did not specify time/date, leave fields empty.",
                    ),
                    ("user", f"Now (UTC): {now.isoformat()}\nUser message: {message}"),
                ]
            )
        except Exception as exc:
            # If the LLM is unreachable/quota-limited, return a clear message instead of a generic fallback.
            return AvailabilityChatResult(
                reply=(
                    "AI service error while analyzing your request. "
                    "This is usually an OpenAI billing/quota or API-key issue.\n\n"
                    f"Details: {exc}"
                ),
                created_event=None,
            )

        created: dict[str, Any] | None = None
        if action.intent == "create_event":
            if action.title and action.start_at and action.end_at:
                try:
                    created = create_event(
                        db,
                        user_id=user_id,
                        title=action.title,
                        start_at=_dt_from_iso(action.start_at),
                        end_at=_dt_from_iso(action.end_at),
                        location=action.location or "",
                    )
                except Exception:
                    created = None

            # Final response with full context (and created event result)
            try:
                reply = llm.invoke(
                    [
                        (
                            "system",
                            "You are an academic availability assistant. Be concise and practical.\n"
                            "Use the provided calendar events as truth.\n"
                            "- If an event was created, confirm with title + time.\n"
                            "- If scheduling details are missing, ask ONLY the missing details.\n",
                        ),
                        ("user", message),
                        ("system", f"Upcoming events JSON:\n{json.dumps(events_context)}"),
                        ("system", f"Extracted action JSON:\n{action.model_dump_json()}"),
                        ("system", f"Created event JSON (null if not created):\n{json.dumps(created)}"),
                    ]
                ).content.strip()
            except Exception as exc:
                if created:
                    reply = "Done — I created that event in your Google Calendar."
                else:
                    reply = (
                        "AI service error while generating the response. "
                        "This is usually an OpenAI billing/quota or API-key issue.\n\n"
                        f"Details: {exc}"
                    )

            return AvailabilityChatResult(reply=reply, created_event=created)

        # Query/other: answer with context only (no side effects)
        try:
            reply = llm.invoke(
                [
                    (
                        "system",
                        "You are an academic availability assistant. Be concise and practical.\n"
                        "Use the provided upcoming events JSON as context. If data is insufficient, ask a short follow-up.",
                    ),
                    ("user", message),
                    ("system", f"Upcoming events JSON:\n{json.dumps(events_context)}"),
                ]
            ).content.strip()
        except Exception as exc:
            reply = (
                "AI service error while generating the response. "
                "This is usually an OpenAI billing/quota or API-key issue.\n\n"
                f"Details: {exc}"
            )

        return AvailabilityChatResult(reply=reply, created_event=None)

    # Fallback: original non-LangChain prompt (keeps backend working if deps not installed)
    try:
        reply = ask_openai(
            (
                "You are an academic scheduling assistant. Use the user's real calendar context.\n\n"
                f"User message:\n{message}\n\n"
                f"Upcoming events JSON:\n{json.dumps(events_context, ensure_ascii=True)}\n"
            ),
            "Keep responses practical, concise, and specific to the given calendar data.",
        )
        return AvailabilityChatResult(reply=reply, created_event=None)
    except Exception as exc:
        return AvailabilityChatResult(
            reply=(
                "AI service error while generating the response. "
                "This is usually an OpenAI billing/quota or API-key issue.\n\n"
                f"Details: {exc}"
            ),
            created_event=None,
        )
