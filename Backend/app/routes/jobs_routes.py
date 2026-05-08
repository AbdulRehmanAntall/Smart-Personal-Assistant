from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import SavedJob, User
from app.utils.deps import get_current_user


router = APIRouter(prefix="/jobs", tags=["jobs"])


class SaveJobIn(BaseModel):
    job_id: str
    title: str = ""
    company: str = ""
    location: str = ""
    url: str = ""
    provider: str = "remote"


@router.get("/saved")
def list_saved(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(SavedJob).filter(SavedJob.user_id == user.id).order_by(SavedJob.id.desc()).all()


@router.post("/{job_id}/save")
def save_job(job_id: str, payload: SaveJobIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    existing = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == user.id, SavedJob.job_id == job_id)
        .first()
    )
    if existing:
        return existing
    row = SavedJob(
        user_id=user.id,
        provider=payload.provider,
        job_id=job_id,
        title=payload.title,
        company=payload.company,
        location=payload.location,
        url=payload.url,
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{job_id}/save")
def unsave_job(job_id: str, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = (
        db.query(SavedJob)
        .filter(SavedJob.user_id == user.id, SavedJob.job_id == job_id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Not saved")
    db.delete(row)
    db.commit()
    return {"ok": True}

