from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import User
from app.services.classroom_service import list_pending_coursework
from app.utils.deps import get_current_user


router = APIRouter(prefix="/classroom", tags=["classroom"])


@router.get("/pending-work")
def pending_work(
    force_refresh: bool = False,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    try:
        return {"items": list_pending_coursework(db, user_id=user.id, force_refresh=force_refresh)}
    except ValueError as exc:
        detail = str(exc)
        msg = detail.lower()
        status = 403 if ("denied" in msg or "forbidden" in msg or "permission" in msg) else 400
        raise HTTPException(status_code=status, detail=detail) from exc
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

