from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database.session import get_db
from app.models.entities import User
from app.schemas.dto import AssistantMessageIn
from app.services.gmail_service import get_email_full, list_emails, mark_read, send_email, set_star
from app.services.jobs_service import fetch_jobs
from app.services.news_service import fetch_news
from app.services.availability_assistant import availability_chat as availability_chat_service
from app.services.openai_service import ask_openai
from app.utils.deps import get_current_user

router = APIRouter(tags=["misc"])


@router.get("/jobs")
def jobs(q: str = "", location: str = "", type: str = "", _user: User = Depends(get_current_user)):
    return fetch_jobs(q=q, location=location, job_type=type)


@router.post("/assistant/availability/chat")
def availability_chat(payload: AssistantMessageIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        res = availability_chat_service(
            db,
            user_id=user.id,
            message=payload.message,
            now=datetime.now(timezone.utc),
        )
        reply = res.reply
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"reply": reply}


@router.get("/news")
def news(category: str = "All", _user: User = Depends(get_current_user)):
    return fetch_news(category=category)


@router.get("/emails")
def emails(force_refresh: bool = False, db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return list_emails(db, user_id=user.id, max_results=25, force_refresh=force_refresh)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class EmailStarIn(BaseModel):
    starred: bool


@router.post("/emails/{message_id}/star")
def email_star(message_id: str, payload: EmailStarIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    set_star(db, user_id=user.id, message_id=message_id, starred=payload.starred)
    return {"ok": True}


class EmailReadIn(BaseModel):
    read: bool


@router.post("/emails/{message_id}/mark-read")
def email_mark_read(message_id: str, payload: EmailReadIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    mark_read(db, user_id=user.id, message_id=message_id, read=payload.read)
    return {"ok": True}


@router.get("/emails/{message_id}")
def email_get_full(message_id: str, db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        return get_email_full(db, user_id=user.id, message_id=message_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


class EmailDraftIn(BaseModel):
    prompt: str = ""


@router.post("/emails/{message_id}/draft-reply")
def email_draft_reply(message_id: str, payload: EmailDraftIn, _user: User = Depends(get_current_user)):
    try:
        reply = ask_openai(
            payload.prompt or f"Draft a polite reply to email {message_id}.",
            "You are an email assistant. Draft concise, professional replies.",
        )
    except Exception:
        reply = "Draft: Thanks for the update. I will follow up shortly."
    return {"draft": reply}


class EmailSendIn(BaseModel):
    to: str
    subject: str = ""
    body: str = ""


@router.post("/emails/send")
def email_send(payload: EmailSendIn, db=Depends(get_db), user: User = Depends(get_current_user)):
    try:
        sent = send_email(
            db,
            user_id=user.id,
            to=payload.to,
            subject=payload.subject,
            body_text=payload.body,
        )
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"sent": sent}


@router.get("/settings")
def settings_data(user: User = Depends(get_current_user)):
    return {
        "username": user.name,
        "email": user.email,
        "notifications": {"emailNotifications": True, "pushNotifications": True, "taskReminders": True, "meetingReminders": True, "newsDigest": False},
    }


@router.put("/settings")
def save_settings(payload: dict, _user: User = Depends(get_current_user)):
    return {"message": "Settings saved", "data": payload}
