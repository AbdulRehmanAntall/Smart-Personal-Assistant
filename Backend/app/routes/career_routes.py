from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import CareerProfile, User
from app.schemas.dto import CareerIn
from app.utils.deps import get_current_user

router = APIRouter(prefix="/career", tags=["career"])


@router.post("/profile")
def save_profile(payload: CareerIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    profile = db.query(CareerProfile).filter(CareerProfile.user_id == user.id).first()
    if profile:
        for k, v in payload.model_dump().items():
            setattr(profile, k, v)
    else:
        profile = CareerProfile(user_id=user.id, **payload.model_dump())
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.get("/recommendations")
def recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(CareerProfile).filter(CareerProfile.user_id == user.id).first()
    skill = profile.skills if profile else "your strengths"
    return {"recommendations": [f"Build projects around {skill}", "Apply to 3 internships weekly"]}
