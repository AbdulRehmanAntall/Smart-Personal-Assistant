from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import AIChat, Note, StudyMaterial, User
from app.schemas.dto import AIQuestion
from app.services.openai_service import ask_openai
from app.utils.deps import get_current_user

router = APIRouter(prefix="/study", tags=["study"])
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


@router.post("/materials/upload")
def upload_material(file: UploadFile = File(...), db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    file_name = f"{uuid4().hex}_{file.filename}"
    file_path = UPLOAD_DIR / file_name
    file_path.write_bytes(file.file.read())
    row = StudyMaterial(user_id=user.id, title=file.filename or "file", file_path=str(file_path))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.post("/notes")
def create_note(payload: dict, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    row = Note(user_id=user.id, title=payload.get("title", "Untitled"), content=payload.get("content", ""))
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/notes")
def list_notes(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Note).filter(Note.user_id == user.id).all()


@router.post("/ask")
def ask_ai(payload: AIQuestion, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    try:
        answer = ask_openai(
            payload.question,
            "You are AllignAI study assistant. Give concise, practical explanations for students.",
        )
    except Exception:
        answer = f"AI assistant insight: {payload.question}"
    db.add(AIChat(user_id=user.id, module="study", prompt=payload.question, response=answer))
    db.commit()
    return {"answer": answer}


@router.post("/summarize")
def summarize(payload: AIQuestion):
    try:
        answer = ask_openai(
            payload.question,
            "Summarize the provided content into key bullet points for quick revision.",
        )
    except Exception:
        answer = f"Summary: {payload.question[:180]}"
    return {"answer": answer}


@router.post("/quiz")
def quiz(payload: AIQuestion):
    try:
        answer = ask_openai(
            payload.question,
            "Create a short quiz with 3-5 questions and include an answer key at the end.",
        )
    except Exception:
        answer = f"Quiz based on: {payload.question}"
    return {"answer": answer}
