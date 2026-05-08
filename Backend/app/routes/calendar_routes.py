from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Schedule, User
from app.services.google_calendar_service import create_event, delete_event, list_events
from app.utils.deps import get_current_user


router = APIRouter(prefix="/calendar", tags=["calendar"])


@router.get("/events")
def calendar_events(
    from_at: datetime = Query(...),
    to_at: datetime = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return {"events": list_events(db, user_id=user.id, from_at=from_at, to_at=to_at)}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class CalendarSyncOut(BaseModel):
    synced: int


@router.post("/sync", response_model=CalendarSyncOut)
def calendar_sync(
    from_at: datetime = Query(...),
    to_at: datetime = Query(...),
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        items = list_events(db, user_id=user.id, from_at=from_at, to_at=to_at)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    count = 0
    for e in items:
        start = (e.get("start") or {}).get("dateTime")
        end = (e.get("end") or {}).get("dateTime")
        if not start or not end:
            continue
        try:
            start_dt = datetime.fromisoformat(start.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end.replace("Z", "+00:00"))
        except Exception:
            continue
        title = str(e.get("summary") or "Google Calendar Event")
        location = str(e.get("location") or "")

        # naive upsert: avoid duplicates by same title + start/end for this user
        existing = (
            db.query(Schedule)
            .filter(
                Schedule.user_id == user.id,
                Schedule.title == title,
                Schedule.start_at == start_dt,
                Schedule.end_at == end_dt,
            )
            .first()
        )
        if existing:
            continue
        db.add(
            Schedule(
                user_id=user.id,
                title=title,
                category="meeting",
                start_at=start_dt,
                end_at=end_dt,
                location=location,
            )
        )
        count += 1
    db.commit()
    return CalendarSyncOut(synced=count)


class CalendarCreateIn(BaseModel):
    title: str
    start_at: datetime
    end_at: datetime
    location: str = ""
    also_create_google: bool = True


@router.post("/events")
def calendar_create_event(
    payload: CalendarCreateIn,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    # Always create in DB schedule
    row = Schedule(
        user_id=user.id,
        title=payload.title,
        category="meeting",
        start_at=payload.start_at,
        end_at=payload.end_at,
        location=payload.location,
    )
    db.add(row)
    db.commit()
    db.refresh(row)

    google_event = None
    if payload.also_create_google:
        try:
            google_event = create_event(
                db,
                user_id=user.id,
                title=payload.title,
                start_at=payload.start_at,
                end_at=payload.end_at,
                location=payload.location,
            )
        except Exception:
            google_event = None

    return {"schedule": row, "google_event": google_event}


@router.delete("/events/{google_event_id}")
def calendar_delete_event(
    google_event_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        deleted = delete_event(db, user_id=user.id, google_event_id=google_event_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"deleted": deleted}

