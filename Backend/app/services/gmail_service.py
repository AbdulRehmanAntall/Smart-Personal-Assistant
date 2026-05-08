from __future__ import annotations

import base64
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any
from urllib.parse import urlencode

from sqlalchemy.orm import Session

from app.services.google_oauth import get_valid_google_access_token, google_api_get, google_api_post_json


def _header(headers: list[dict[str, Any]], name: str) -> str:
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return str(h.get("value") or "")
    return ""


_EMAIL_CACHE: dict[int, tuple[float, list[dict[str, Any]]]] = {}
_EMAIL_CACHE_TTL_SECONDS = 60.0


def _fetch_one_metadata(*, access_token: str, msg_id: str) -> dict[str, Any] | None:
    if not msg_id:
        return None
    meta_q = urlencode(
        {
            "format": "metadata",
            "metadataHeaders": ["From", "Subject", "Date"],
        },
        doseq=True,
    )
    detail = google_api_get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?{meta_q}",
        access_token=access_token,
    )
    payload = detail.get("payload") or {}
    headers = payload.get("headers") or []
    label_ids = set(detail.get("labelIds") or [])

    from_raw = _header(headers, "From")
    subject = _header(headers, "Subject") or "(no subject)"
    date_raw = _header(headers, "Date")
    snippet = str(detail.get("snippet") or "")

    time_display = date_raw
    try:
        dt = datetime.strptime(date_raw[:25], "%a, %d %b %Y %H:%M:%S")
        time_display = dt.strftime("%I:%M %p")
    except Exception:
        pass

    return {
        "id": msg_id,
        "from": from_raw or "Unknown",
        "subject": subject,
        "preview": snippet,
        "time": time_display or "",
        "read": "UNREAD" not in label_ids,
        "starred": "STARRED" in label_ids,
        "aiSummary": snippet[:180] + ("..." if len(snippet) > 180 else ""),
    }


def list_emails(db: Session, *, user_id: int, max_results: int = 20, force_refresh: bool = False) -> list[dict[str, Any]]:
    # Cache to keep UI snappy on repeated loads / polling
    now_ts = datetime.utcnow().timestamp()
    cached = _EMAIL_CACHE.get(user_id)
    if cached and not force_refresh:
        cached_at, cached_items = cached
        if now_ts - cached_at < _EMAIL_CACHE_TTL_SECONDS:
            return cached_items

    access_token = get_valid_google_access_token(db, user_id=user_id)
    q = urlencode({"maxResults": str(max_results)})
    index = google_api_get(f"https://gmail.googleapis.com/gmail/v1/users/me/messages?{q}", access_token=access_token)
    messages = index.get("messages") or []

    out: list[dict[str, Any]] = []

    # Fetch message metadata in parallel (big speedup vs sequential requests)
    ids = [str(m.get("id") or "") for m in messages if m.get("id")]
    if ids:
        workers = min(10, max(1, len(ids)))
        with ThreadPoolExecutor(max_workers=workers) as ex:
            futs = [ex.submit(_fetch_one_metadata, access_token=access_token, msg_id=mid) for mid in ids]
            for fut in as_completed(futs):
                try:
                    item = fut.result()
                except Exception:
                    item = None
                if item:
                    out.append(item)

    # Preserve inbox order as much as possible (the parallel results can reorder)
    order = {mid: idx for idx, mid in enumerate(ids)}
    out.sort(key=lambda x: order.get(str(x.get("id") or ""), 10**9))

    _EMAIL_CACHE[user_id] = (now_ts, out)
    return out


def set_star(db: Session, *, user_id: int, message_id: str, starred: bool) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    payload: dict[str, Any] = {"addLabelIds": [], "removeLabelIds": []}
    if starred:
        payload["addLabelIds"].append("STARRED")
    else:
        payload["removeLabelIds"].append("STARRED")
    google_api_post_json(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        access_token=access_token,
        payload=payload,
    )


def mark_read(db: Session, *, user_id: int, message_id: str, read: bool) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    payload: dict[str, Any] = {"addLabelIds": [], "removeLabelIds": []}
    if read:
        payload["removeLabelIds"].append("UNREAD")
    else:
        payload["addLabelIds"].append("UNREAD")
    google_api_post_json(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        access_token=access_token,
        payload=payload,
    )


def send_email(
    db: Session,
    *,
    user_id: int,
    to: str,
    subject: str,
    body_text: str,
) -> dict[str, Any]:
    """
    Sends an email via Gmail API.
    Requires Gmail scope allowing send (gmail.send or gmail.modify in some cases).
    """
    access_token = get_valid_google_access_token(db, user_id=user_id)

    # Minimal RFC822 message
    msg = (
        f"To: {to}\r\n"
        f"Subject: {subject}\r\n"
        "Content-Type: text/plain; charset=\"UTF-8\"\r\n"
        "\r\n"
        f"{body_text}\r\n"
    )
    raw = base64.urlsafe_b64encode(msg.encode("utf-8")).decode("ascii").rstrip("=")
    return google_api_post_json(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        access_token=access_token,
        payload={"raw": raw},
    )


def _b64url_decode(data: str) -> str:
    if not data:
        return ""
    pad = "=" * ((4 - (len(data) % 4)) % 4)
    raw = base64.urlsafe_b64decode((data + pad).encode("ascii"))
    try:
        return raw.decode("utf-8", errors="replace")
    except Exception:
        return raw.decode("latin-1", errors="replace")


def _walk_parts_for_body(payload: dict[str, Any]) -> tuple[str, str]:
    """
    Returns (text_plain, text_html). Prefers deeper parts if multipart.
    """
    text_plain = ""
    text_html = ""

    def visit(p: dict[str, Any]) -> None:
        nonlocal text_plain, text_html
        mime = str(p.get("mimeType") or "")
        body = p.get("body") or {}
        data = str(body.get("data") or "")

        if mime == "text/plain" and data and not text_plain:
            text_plain = _b64url_decode(data)
        if mime == "text/html" and data and not text_html:
            text_html = _b64url_decode(data)

        for child in (p.get("parts") or []):
            if isinstance(child, dict):
                visit(child)

    visit(payload or {})
    return text_plain, text_html


def get_email_full(db: Session, *, user_id: int, message_id: str) -> dict[str, Any]:
    access_token = get_valid_google_access_token(db, user_id=user_id)
    detail = google_api_get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}?format=full",
        access_token=access_token,
    )
    payload = detail.get("payload") or {}
    headers = payload.get("headers") or []
    label_ids = set(detail.get("labelIds") or [])

    from_raw = _header(headers, "From")
    to_raw = _header(headers, "To")
    subject = _header(headers, "Subject") or "(no subject)"
    date_raw = _header(headers, "Date")

    text_plain, text_html = _walk_parts_for_body(payload)
    if not text_plain and not text_html:
        # Some messages put the body at the top-level payload
        body = payload.get("body") or {}
        data = str(body.get("data") or "")
        if data:
            text_plain = _b64url_decode(data)

    return {
        "id": str(detail.get("id") or message_id),
        "threadId": str(detail.get("threadId") or ""),
        "from": from_raw or "Unknown",
        "to": to_raw or "",
        "subject": subject,
        "date": date_raw or "",
        "snippet": str(detail.get("snippet") or ""),
        "read": "UNREAD" not in label_ids,
        "starred": "STARRED" in label_ids,
        "text": text_plain,
        "html": text_html,
    }

