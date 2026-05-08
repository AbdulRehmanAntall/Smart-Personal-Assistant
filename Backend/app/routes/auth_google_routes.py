from __future__ import annotations

from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.models.entities import ExternalAccount, User
from app.services.google_oauth import (
    build_google_auth_url_with_redirect,
    exchange_code_for_tokens_with_redirect,
    get_google_user_profile,
)
from app.utils.security import create_token, hash_password, decode_token


router = APIRouter(prefix="/auth", tags=["auth"])

GOOGLE_AUTH_SCOPES = [
    "openid",
    "email",
    "profile",
    # include these so Gmail/Calendar works immediately after Google sign-in
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events",
    # classroom
    "https://www.googleapis.com/auth/classroom.courses.readonly",
    "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
]


@router.get("/google/connect")
def google_auth_connect():
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=500, detail="Google OAuth not configured on server")
    state = create_token({"type": "google_auth_state"}, 10)
    url = build_google_auth_url_with_redirect(
        state=state,
        scopes=GOOGLE_AUTH_SCOPES,
        redirect_uri=settings.google_auth_redirect_url,
    )
    return {"auth_url": url}


@router.get("/google/callback")
def google_auth_callback(
    code: str = Query(...),
    state: str = Query(...),
    db: Session = Depends(get_db),
):
    try:
        payload = decode_token(state)
        if payload.get("type") != "google_auth_state":
            raise ValueError("Invalid state")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid OAuth state") from exc

    tokens = exchange_code_for_tokens_with_redirect(code=code, redirect_uri=settings.google_auth_redirect_url)
    profile = get_google_user_profile(access_token=tokens.access_token)
    email = str(profile.get("email") or "").strip().lower()
    name = str(profile.get("name") or "").strip() or (email.split("@")[0] if email else "User")

    if not email:
        raise HTTPException(status_code=400, detail="Google did not return an email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        # random password (user uses Google sign-in)
        user = User(name=name, email=email, hashed_password=hash_password(uuid4().hex))
        db.add(user)
        db.commit()
        db.refresh(user)

    # upsert external account so Gmail/Calendar is connected automatically
    ext = (
        db.query(ExternalAccount)
        .filter(ExternalAccount.user_id == user.id, ExternalAccount.provider == "google")
        .first()
    )
    if not ext:
        ext = ExternalAccount(user_id=user.id, provider="google")
        db.add(ext)
    ext.provider_user_email = email
    ext.access_token = tokens.access_token
    if tokens.refresh_token:
        ext.refresh_token = tokens.refresh_token
    ext.expires_at = tokens.expires_at
    ext.scope = tokens.scope
    ext.updated_at = datetime.now(timezone.utc)
    db.commit()

    access = create_token({"sub": str(user.id)}, settings.access_token_expire_minutes)
    refresh = create_token({"sub": str(user.id), "type": "refresh"}, settings.refresh_token_expire_minutes)

    # Send tokens back in URL hash so the browser doesn't send them to the server again.
    return RedirectResponse(
        url=f"{settings.frontend_origin}/oauth/google#access_token={access}&refresh_token={refresh}"
    )

