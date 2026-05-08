from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Schedule, User
from app.schemas.dto import ScheduleIn
from app.utils.deps import get_current_user

router = APIRouter(prefix="/schedules", tags=["schedules"])


@router.post("")
def create_schedule(payload: ScheduleIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    conflict = db.query(Schedule).filter(Schedule.user_id == user.id, and_(Schedule.start_at < payload.end_at, Schedule.end_at > payload.start_at)).first()
    if conflict:
        raise HTTPException(status_code=409, detail="Schedule conflict detected")
    row = Schedule(user_id=user.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("")
def list_schedules(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Schedule).filter(Schedule.user_id == user.id).all()


@router.get("/available-slots")
def available_slots(from_at: datetime = Query(...), to_at: datetime = Query(...), duration_minutes: int = 60, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    events = db.query(Schedule).filter(Schedule.user_id == user.id, Schedule.start_at >= from_at, Schedule.end_at <= to_at).all()
    pointer = from_at
    gap = timedelta(minutes=duration_minutes)
    slots = []
    for event in sorted(events, key=lambda e: e.start_at):
        if event.start_at - pointer >= gap:
            slots.append({"start_at": pointer, "end_at": pointer + gap})
        pointer = max(pointer, event.end_at)
    if to_at - pointer >= gap:
        slots.append({"start_at": pointer, "end_at": pointer + gap})
    return {"slots": slots}
