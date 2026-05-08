from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any
from urllib.parse import urlencode
from urllib.error import HTTPError
from urllib.request import Request, urlopen

from sqlalchemy.orm import Session

from app.config.settings import settings
from app.models.entities import ExternalAccount


GOOGLE_AUTH_BASE = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"


@dataclass(frozen=True)
class GoogleTokens:
    access_token: str
    refresh_token: str | None
    scope: str
    expires_at: datetime | None


def _as_utc(dt: datetime | None) -> datetime | None:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def build_google_auth_url(*, state: str, scopes: list[str]) -> str:
    query = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_url,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_BASE}?{urlencode(query)}"


def build_google_auth_url_with_redirect(*, state: str, scopes: list[str], redirect_uri: str) -> str:
    query = {
        "client_id": settings.google_client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": " ".join(scopes),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
    }
    return f"{GOOGLE_AUTH_BASE}?{urlencode(query)}"


def _post_form(url: str, data: dict[str, str]) -> dict[str, Any]:
    body = urlencode(data).encode("utf-8")
    req = Request(url, data=body, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urlopen(req, timeout=20) as resp:  # nosec - user controlled URL not allowed here
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        detail = _google_http_error(exc)
        raise ValueError(detail) from exc
    return json.loads(raw)


def exchange_code_for_tokens(*, code: str) -> GoogleTokens:
    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": settings.google_redirect_url,
        "grant_type": "authorization_code",
    }
    data = _post_form(GOOGLE_TOKEN_URL, payload)
    expires_in = int(data.get("expires_in", 0)) if data.get("expires_in") else 0
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        if expires_in
        else None
    )
    return GoogleTokens(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token"),
        scope=data.get("scope", ""),
        expires_at=expires_at,
    )


def exchange_code_for_tokens_with_redirect(*, code: str, redirect_uri: str) -> GoogleTokens:
    payload = {
        "code": code,
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "redirect_uri": redirect_uri,
        "grant_type": "authorization_code",
    }
    data = _post_form(GOOGLE_TOKEN_URL, payload)
    expires_in = int(data.get("expires_in", 0)) if data.get("expires_in") else 0
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        if expires_in
        else None
    )
    return GoogleTokens(
        access_token=data["access_token"],
        refresh_token=data.get("refresh_token"),
        scope=data.get("scope", ""),
        expires_at=expires_at,
    )


def refresh_access_token(*, refresh_token: str) -> GoogleTokens:
    payload = {
        "client_id": settings.google_client_id,
        "client_secret": settings.google_client_secret,
        "refresh_token": refresh_token,
        "grant_type": "refresh_token",
    }
    data = _post_form(GOOGLE_TOKEN_URL, payload)
    expires_in = int(data.get("expires_in", 0)) if data.get("expires_in") else 0
    expires_at = (
        datetime.now(timezone.utc) + timedelta(seconds=expires_in)
        if expires_in
        else None
    )
    return GoogleTokens(
        access_token=data["access_token"],
        refresh_token=None,
        scope=data.get("scope", ""),
        expires_at=expires_at,
    )


def google_api_get(url: str, *, access_token: str) -> dict[str, Any]:
    req = Request(url, headers={"Authorization": f"Bearer {access_token}"})
    try:
        with urlopen(req, timeout=20) as resp:  # nosec - URL is Google API
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        detail = _google_http_error(exc)
        raise ValueError(detail) from exc
    return json.loads(raw)


def google_api_post_json(url: str, *, access_token: str, payload: dict[str, Any]) -> dict[str, Any]:
    body = json.dumps(payload).encode("utf-8")
    req = Request(
        url,
        data=body,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(req, timeout=20) as resp:  # nosec - URL is Google API
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        detail = _google_http_error(exc)
        raise ValueError(detail) from exc
    return json.loads(raw) if raw else {}


def google_api_delete(url: str, *, access_token: str) -> dict[str, Any]:
    req = Request(
        url,
        headers={"Authorization": f"Bearer {access_token}"},
        method="DELETE",
    )
    try:
        with urlopen(req, timeout=20) as resp:  # nosec - URL is Google API
            raw = resp.read().decode("utf-8")
    except HTTPError as exc:
        detail = _google_http_error(exc)
        raise ValueError(detail) from exc
    return json.loads(raw) if raw else {}


def _google_http_error(exc: HTTPError) -> str:
    status = exc.code
    try:
        body = exc.read().decode("utf-8")
        data = json.loads(body)
        err = data.get("error") if isinstance(data, dict) else None
        if isinstance(err, dict):
            message = str(err.get("message") or "").strip()
            details = err.get("errors") or []
            reason = ""
            if isinstance(details, list) and details:
                first = details[0]
                if isinstance(first, dict):
                    reason = str(first.get("reason") or "").strip()
            if message and reason:
                return f"Google API {status}: {message} ({reason})"
            if message:
                return f"Google API {status}: {message}"
        if body:
            return f"Google API {status}: {body}"
    except Exception:
        pass
    return f"Google API {status}: {exc.reason}"


def get_google_user_email(*, access_token: str) -> str:
    data = google_api_get("https://www.googleapis.com/oauth2/v2/userinfo", access_token=access_token)
    return str(data.get("email") or "")


def get_google_user_profile(*, access_token: str) -> dict[str, Any]:
    return google_api_get("https://www.googleapis.com/oauth2/v2/userinfo", access_token=access_token)


def get_valid_google_access_token(db: Session, *, user_id: int) -> str:
    acct = (
        db.query(ExternalAccount)
        .filter(ExternalAccount.user_id == user_id, ExternalAccount.provider == "google")
        .first()
    )
    if not acct or not acct.access_token:
        raise ValueError("Google account not connected")

    expires_at = _as_utc(acct.expires_at)
    if expires_at and expires_at <= datetime.now(timezone.utc) + timedelta(seconds=30):
        if not acct.refresh_token:
            raise ValueError("Google session expired")
        refreshed = refresh_access_token(refresh_token=acct.refresh_token)
        acct.access_token = refreshed.access_token
        acct.expires_at = refreshed.expires_at
        acct.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(acct)

    return acct.access_token

