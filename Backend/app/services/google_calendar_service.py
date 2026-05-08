from __future__ import annotations

from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.services.google_oauth import get_valid_google_access_token, google_api_delete, google_api_get, google_api_post_json


def list_events(db: Session, *, user_id: int, from_at: datetime, to_at: datetime) -> list[dict[str, Any]]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    q = urlencode(
        {
            "timeMin": from_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "timeMax": to_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
            "singleEvents": "true",
            "orderBy": "startTime",
            "maxResults": "250",
        }
    )
    data = google_api_get(
        f"https://www.googleapis.com/calendar/v3/calendars/primary/events?{q}",
        access_token=access_token,
    )
    return list(data.get("items") or [])


def create_event(
    db: Session,
    *,
    user_id: int,
    title: str,
    start_at: datetime,
    end_at: datetime,
    location: str = "",
) -> dict[str, Any]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    payload: dict[str, Any] = {
        "summary": title,
        "location": location,
        "start": {"dateTime": start_at.astimezone(timezone.utc).isoformat(), "timeZone": "UTC"},
        "end": {"dateTime": end_at.astimezone(timezone.utc).isoformat(), "timeZone": "UTC"},
    }
    return google_api_post_json(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        access_token=access_token,
        payload=payload,
    )


def delete_event(db: Session, *, user_id: int, google_event_id: str) -> dict[str, Any]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    return google_api_delete(
        f"https://www.googleapis.com/calendar/v3/calendars/primary/events/{google_event_id}",
        access_token=access_token,
    )

