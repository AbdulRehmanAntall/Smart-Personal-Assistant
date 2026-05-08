from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.models.entities import ExternalAccount, User
from app.services.google_oauth import (
    build_google_auth_url,
    exchange_code_for_tokens,
    get_google_user_email,
)
from app.utils.deps import get_current_user
from app.utils.security import create_token, decode_token


router = APIRouter(prefix="/integrations", tags=["integrations"])

GOOGLE_SCOPES = [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
]


@router.get("/status")
def integration_status(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    google = (
        db.query(ExternalAccount)
        .filter(ExternalAccount.user_id == user.id, ExternalAccount.provider == "google")
        .first()
    )
    return {
        "google": {
            "connected": bool(google and google.refresh_token),
            "email": google.provider_user_email if google else "",
            "updated_at": google.updated_at.isoformat() if google and google.updated_at else None,
        }
    }


@router.get("/google/connect")
def google_connect(user: User = Depends(get_current_user)):
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured on server")
    state = create_token({"sub": str(user.id), "type": "google_oauth_state"}, 10)
    return {"auth_url": build_google_auth_url(state=state, scopes=GOOGLE_SCOPES)}


@router.get("/google/callback")
def google_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(state)
        if payload.get("type") != "google_oauth_state":
            raise ValueError("Invalid state")
        user_id = int(payload["sub"])
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc

    tokens = exchange_code_for_tokens(code=code)
    email = get_google_user_email(access_token=tokens.access_token)

    row = (
        db.query(ExternalAccount)
        .filter(ExternalAccount.user_id == user_id, ExternalAccount.provider == "google")
        .first()
    )
    if not row:
        row = ExternalAccount(user_id=user_id, provider="google")
        db.add(row)

    row.provider_user_email = email
    row.access_token = tokens.access_token
    if tokens.refresh_token:
        row.refresh_token = tokens.refresh_token
    row.expires_at = tokens.expires_at
    row.scope = tokens.scope
    row.updated_at = datetime.now(timezone.utc)
    db.commit()

    return RedirectResponse(url=f"{settings.frontend_origin}/settings?google=connected")


@router.post("/google/disconnect")
def google_disconnect(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = (
        db.query(ExternalAccount)
        .filter(ExternalAccount.user_id == user.id, ExternalAccount.provider == "google")
        .first()
    )
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}

