from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.services.google_oauth import (
    get_valid_google_access_token,
    google_api_get,
)

_CLASSROOM_CACHE: dict[int, tuple[float, list[dict[str, Any]]]] = {}
_CLASSROOM_CACHE_TTL_SECONDS = 60.0


def list_courses(db: Session, *, user_id: int) -> list[dict[str, Any]]:
    access_token = get_valid_google_access_token(db, user_id=user_id)

    data = google_api_get(
        f"https://classroom.googleapis.com/v1/courses?"
        f"{urlencode({'courseStates': 'ACTIVE'})}",
        access_token=access_token,
    )

    return list(data.get("courses") or [])


def list_pending_coursework(
    db: Session,
    *,
    user_id: int,
    max_items: int = 50,
    force_refresh: bool = False,
) -> list[dict[str, Any]]:
    now_ts = time.time()

    # Return cached data if still fresh
    cached = _CLASSROOM_CACHE.get(user_id)
    if cached and not force_refresh:
        cached_at, items = cached
        if now_ts - cached_at < _CLASSROOM_CACHE_TTL_SECONDS:
            return items

    access_token = get_valid_google_access_token(db, user_id=user_id)
    courses = list_courses(db, user_id=user_id)

    if not courses:
        return []

    pending: list[dict[str, Any]] = []
    permission_errors = 0
    now = datetime.now(timezone.utc)

    for course in courses:
        course_id = str(course.get("id") or "")
        course_name = str(course.get("name") or "Course")

        if not course_id:
            continue

        query = urlencode(
            {
                "pageSize": "50",
                "orderBy": "dueDate desc",
            }
        )

        try:
            coursework_data = google_api_get(
                f"https://classroom.googleapis.com/v1/courses/"
                f"{course_id}/courseWork?{query}",
                access_token=access_token,
            )

        except ValueError as exc:
            message = str(exc).lower()

            if (
                "google api 403" in message
                and (
                    "does not have permission" in message
                    or "insufficient" in message
                    or "forbidden" in message
                )
            ):
                permission_errors += 1
                continue

            raise

        coursework_items = coursework_data.get("courseWork") or []

        for coursework in coursework_items:
            due_date = coursework.get("dueDate")
            due_time = coursework.get("dueTime") or {}

            # Skip coursework without a due date
            if not due_date:
                continue

            year = int(due_date.get("year", 0) or 0)
            month = int(due_date.get("month", 0) or 0)
            day = int(due_date.get("day", 0) or 0)

            # Default to end of day if dueTime missing
            hour = int(due_time.get("hours", 23) or 23)
            minute = int(due_time.get("minutes", 59) or 59)

            try:
                due_dt = datetime(
                    year,
                    month,
                    day,
                    hour,
                    minute,
                    tzinfo=timezone.utc,
                )
            except Exception:
                continue

            # Drop expired coursework
            if due_dt < now:
                continue

            # Calculate urgency priority
            delta_days = (due_dt - now).total_seconds() / 86400

            if delta_days <= 2:
                priority = "high"
            elif delta_days <= 7:
                priority = "medium"
            else:
                priority = "low"

            pending.append(
                {
                    "id": str(coursework.get("id") or ""),
                    "course": course_name,
                    "title": str(coursework.get("title") or "Coursework"),
                    "description": str(coursework.get("description") or ""),
                    "due_at": due_dt.isoformat(),
                    "priority": priority,
                    "progress": 0,
                }
            )

            if len(pending) >= max_items:
                break

        if len(pending) >= max_items:
            break

    # Sort by nearest deadline first
    pending.sort(key=lambda x: x["due_at"])

    # Cache result
    _CLASSROOM_CACHE[user_id] = (now_ts, pending)

    if permission_errors > 0 and not pending:
        raise ValueError(
            "Classroom access denied for this account. "
            "Re-login with Google to re-consent Classroom scopes, "
            "and verify your school/admin allows Classroom API access "
            "for third-party apps."
        )

    return pending