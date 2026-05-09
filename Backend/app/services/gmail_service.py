from __future__ import annotations

import base64
import re
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any
from urllib.parse import urlencode
from email.utils import parsedate_to_datetime

from sqlalchemy.orm import Session

from app.services.google_oauth import (
    get_valid_google_access_token,
    google_api_get,
    google_api_post_json,
)


def _header(headers: list[dict[str, Any]], name: str) -> str:
    for h in headers:
        if h.get("name", "").lower() == name.lower():
            return str(h.get("value") or "")
    return ""


_EMAIL_CACHE: dict[int, tuple[float, list[dict[str, Any]]]] = {}
_EMAIL_CACHE_TTL_SECONDS = 60.0


def _clean_text(text: str) -> str:
    """
    Remove garbage MIME metadata and normalize email text.
    """
    if not text:
        return ""

    # remove quoted-printable soft breaks
    text = text.replace("=\r\n", "")
    text = text.replace("=\n", "")

    # remove MIME boundaries
    text = re.sub(r"--[a-zA-Z0-9_\-]+", "", text)

    # remove content headers inside multipart
    text = re.sub(r"Content-Type:.*?\n", "", text, flags=re.IGNORECASE)
    text = re.sub(
        r"Content-Transfer-Encoding:.*?\n",
        "",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"Content-Disposition:.*?\n",
        "",
        text,
        flags=re.IGNORECASE,
    )

    # collapse excessive empty lines
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


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
    subject = _header(headers, "Subject") or "(No Subject)"
    date_raw = _header(headers, "Date")
    snippet = str(detail.get("snippet") or "")

    time_display = date_raw
    try:
        dt = parsedate_to_datetime(date_raw)
        time_display = dt.strftime("%I:%M %p")
    except Exception:
        pass

    return {
        "id": msg_id,
        "from": from_raw or "Unknown",
        "subject": subject,
        "preview": snippet,
        "time": time_display,
        "read": "UNREAD" not in label_ids,
        "starred": "STARRED" in label_ids,
    }


def list_emails(
    db: Session,
    *,
    user_id: int,
    max_results: int = 20,
    force_refresh: bool = False,
) -> list[dict[str, Any]]:
    now_ts = datetime.utcnow().timestamp()
    cached = _EMAIL_CACHE.get(user_id)

    if cached and not force_refresh:
        cached_at, cached_items = cached
        if now_ts - cached_at < _EMAIL_CACHE_TTL_SECONDS:
            return cached_items

    access_token = get_valid_google_access_token(db, user_id=user_id)

    q = urlencode({"maxResults": str(max_results)})

    index = google_api_get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages?{q}",
        access_token=access_token,
    )

    messages = index.get("messages") or []
    ids = [str(m.get("id")) for m in messages if m.get("id")]

    out: list[dict[str, Any]] = []

    if ids:
        workers = min(10, len(ids))

        with ThreadPoolExecutor(max_workers=workers) as ex:
            futures = [
                ex.submit(
                    _fetch_one_metadata,
                    access_token=access_token,
                    msg_id=mid,
                )
                for mid in ids
            ]

            for fut in as_completed(futures):
                try:
                    item = fut.result()
                    if item:
                        out.append(item)
                except Exception:
                    continue

    order = {mid: idx for idx, mid in enumerate(ids)}
    out.sort(key=lambda x: order.get(x["id"], 999999))

    _EMAIL_CACHE[user_id] = (now_ts, out)

    return out


def set_star(
    db: Session,
    *,
    user_id: int,
    message_id: str,
    starred: bool,
) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)

    payload = {
        "addLabelIds": ["STARRED"] if starred else [],
        "removeLabelIds": [] if starred else ["STARRED"],
    }

    google_api_post_json(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}/modify",
        access_token=access_token,
        payload=payload,
    )


def mark_read(
    db: Session,
    *,
    user_id: int,
    message_id: str,
    read: bool,
) -> None:
    access_token = get_valid_google_access_token(db, user_id=user_id)

    payload = {
        "addLabelIds": [] if read else ["UNREAD"],
        "removeLabelIds": ["UNREAD"] if read else [],
    }

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
    access_token = get_valid_google_access_token(db, user_id=user_id)

    msg = (
        f"To: {to}\r\n"
        f"Subject: {subject}\r\n"
        "Content-Type: text/plain; charset=UTF-8\r\n"
        "\r\n"
        f"{body_text}"
    )

    raw = base64.urlsafe_b64encode(
        msg.encode("utf-8")
    ).decode("utf-8")

    return google_api_post_json(
        "https://gmail.googleapis.com/gmail/v1/users/me/messages/send",
        access_token=access_token,
        payload={"raw": raw},
    )


def _b64url_decode(data: str) -> str:
    if not data:
        return ""

    padding = "=" * ((4 - len(data) % 4) % 4)
    decoded = base64.urlsafe_b64decode(data + padding)

    return decoded.decode("utf-8", errors="replace")


def _walk_parts_for_body(payload: dict[str, Any]) -> str:
    """
    Extract only plain text body.
    Prefer text/plain.
    """
    if not payload:
        return ""

    mime = payload.get("mimeType")

    if mime == "text/plain":
        return _clean_text(
            _b64url_decode(
                str((payload.get("body") or {}).get("data") or "")
            )
        )

    for part in payload.get("parts", []):
        result = _walk_parts_for_body(part)
        if result:
            return result

    return ""


def get_email_full(
    db: Session,
    *,
    user_id: int,
    message_id: str,
) -> dict[str, Any]:
    access_token = get_valid_google_access_token(db, user_id=user_id)

    detail = google_api_get(
        f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{message_id}?format=full",
        access_token=access_token,
    )

    payload = detail.get("payload") or {}
    headers = payload.get("headers") or []
    label_ids = set(detail.get("labelIds") or [])

    body = _walk_parts_for_body(payload)

    return {
        "id": str(detail.get("id") or ""),
        "threadId": str(detail.get("threadId") or ""),
        "from": _header(headers, "From"),
        "to": _header(headers, "To"),
        "subject": _header(headers, "Subject"),
        "date": _header(headers, "Date"),
        "snippet": str(detail.get("snippet") or ""),
        "read": "UNREAD" not in label_ids,
        "starred": "STARRED" in label_ids,
        "text": body,
    }