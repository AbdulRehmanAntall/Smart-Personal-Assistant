from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from sqlalchemy.orm import Session
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type
from pydantic import BaseModel, Field

from app.config.settings import settings
from app.services.google_calendar_service import create_event, list_events
from app.services.openai_service import ask_openai

# Setup basic logging to see retries in your console
logger = logging.getLogger(__name__)

@dataclass
class AvailabilityChatResult:
    reply: str
    created_event: dict[str, Any] | None = None

class CalendarAction(BaseModel):
    intent: Literal["create_event", "query", "other"] = Field(
        description="create_event to book; query to check availability; other for general chat."
    )
    reply: str = Field(
        description="A concise, friendly response to the user. If creating an event, phrase it as a confirmation."
    )
    title: str = Field(default="", description="Event title")
    start_at: str = Field(default="", description="ISO datetime (UTC Z)")
    end_at: str = Field(default="", description="ISO datetime (UTC Z)")
    location: str = ""

def _dt_from_iso(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def _events_context(db: Session, *, user_id: int, from_at: datetime, to_at: datetime) -> list[dict[str, Any]]:
    items = []
    events = list_events(db, user_id=user_id, from_at=from_at, to_at=to_at)
    for e in (events or [])[:50]: # Slightly lower limit to save tokens
        start = (e.get("start") or {}).get("dateTime") or (e.get("start") or {}).get("date") or ""
        end = (e.get("end") or {}).get("dateTime") or (e.get("end") or {}).get("date") or ""
        items.append({
            "title": str(e.get("summary") or "Event"),
            "start": start,
            "end": end,
            "location": str(e.get("location") or ""),
        })
    return items

# Retry logic: Waits 4s, 8s, then 16s if it hits a rate limit
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=20),
    retry=retry_if_exception_type(Exception), 
    reraise=True
)
def _call_llm_with_retry(llm, messages, output_schema=None):
    if output_schema:
        return llm.with_structured_output(output_schema).invoke(messages)
    return llm.invoke(messages)

def availability_chat(
    db: Session,
    *,
    user_id: int,
    message: str,
    now: datetime | None = None,
    horizon_days: int = 14,
) -> AvailabilityChatResult:
    now = now or datetime.now(timezone.utc)
    horizon = now + timedelta(days=horizon_days)

    try:
        events_context = _events_context(db, user_id=user_id, from_at=now, to_at=horizon)
    except Exception:
        events_context = []

    # --- GEMINI PATH ---
    if settings.gemini_api_key:
        from langchain_google_genai import ChatGoogleGenerativeAI
        
        model_name = settings.gemini_model or "gemini-1.5-flash" # 1.5 Flash has higher free limits than 2.0
        llm = ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=settings.gemini_api_key,
            temperature=0.1,
        )

        try:
            # We do ONE call to get both the structured data AND the user reply
            action = _call_llm_with_retry(llm, [
                ("system", (
                    "You are a scheduling assistant. Analyze the user message and calendar context.\n"
                    "1. Extract intent (create_event, query, or other).\n"
                    "2. Generate a concise 'reply' for the user.\n"
                    "3. If scheduling, extract title, start_at, and end_at in ISO format."
                )),
                ("user", f"Context Time (UTC): {now.isoformat()}\nUpcoming Events: {json.dumps(events_context)}\n\nMessage: {message}"),
            ], CalendarAction)

            created = None
            if action.intent == "create_event" and action.start_at and action.end_at:
                try:
                    created = create_event(
                        db, user_id=user_id, title=action.title or "New Event",
                        start_at=_dt_from_iso(action.start_at),
                        end_at=_dt_from_iso(action.end_at),
                        location=action.location
                    )
                except Exception as e:
                    logger.error(f"Calendar creation failed: {e}")
                    action.reply = "I tried to schedule that, but ran into a technical issue with the calendar."

            return AvailabilityChatResult(reply=action.reply, created_event=created)

        except Exception as exc:
            return AvailabilityChatResult(reply=f"Gemini is currently overloaded or unavailable. Details: {exc}")

    # --- OPENAI FALLBACK ---
    if settings.openai_api_key:
        from langchain_openai import ChatOpenAI
        llm = ChatOpenAI(model=settings.openai_model, api_key=settings.openai_api_key)
        
        try:
            action = _call_llm_with_retry(llm, [
                ("system", "Assistant roles..."),
                ("user", message)
            ], CalendarAction)
            # ... (Similar creation logic as above)
            return AvailabilityChatResult(reply=action.reply)
        except Exception as exc:
            return AvailabilityChatResult(reply=f"OpenAI error: {exc}")

    return AvailabilityChatResult(reply="No AI providers are configured.")