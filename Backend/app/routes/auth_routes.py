from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.config.settings import settings
from app.database.session import get_db
from app.models.entities import User
from app.schemas.dto import LoginIn, RefreshIn, SignupIn, TokenOut
from app.utils.deps import get_current_user, oauth2_scheme, revoked_tokens
from app.utils.security import create_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


def _tokens(user_id: int) -> TokenOut:
    return TokenOut(
        access_token=create_token({"sub": str(user_id)}, settings.access_token_expire_minutes),
        refresh_token=create_token({"sub": str(user_id), "type": "refresh"}, settings.refresh_token_expire_minutes),
    )


@router.post("/signup", response_model=TokenOut)
def signup(payload: SignupIn, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(name=payload.name, email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return _tokens(user.id)


@router.post("/login", response_model=TokenOut)
def login(payload: LoginIn, db: Session = Depends(get_db)):
    identifier = payload.email.strip()
    user = db.query(User).filter(or_(User.email == identifier, User.name == identifier)).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return _tokens(user.id)


@router.post("/refresh", response_model=TokenOut)
def refresh(payload: RefreshIn):
    decoded = decode_token(payload.refresh_token)
    if decoded.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Invalid refresh token")
    return _tokens(int(decoded["sub"]))


@router.post("/logout")
def logout(token: str = Depends(oauth2_scheme)):
    revoked_tokens.add(token)
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"id": user.id, "name": user.name, "email": user.email}
