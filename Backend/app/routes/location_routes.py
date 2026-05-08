from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Location, User
from app.schemas.dto import LocationIn
from app.utils.deps import get_current_user

router = APIRouter(prefix="/locations", tags=["locations"])


@router.post("")
def save_location(payload: LocationIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = Location(user_id=user.id, **payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/suggestions")
def location_suggestions(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = db.query(Location).filter(Location.user_id == user.id).all()
    return {"suggestions": [f"{r.name}: {r.productivity_hint or 'Good focus zone'}" for r in rows]}
