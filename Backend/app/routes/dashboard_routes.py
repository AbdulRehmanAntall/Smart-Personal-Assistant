from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.entities import Deadline, Task, User
from app.utils.deps import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/overview")
def dashboard(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    tasks = db.query(Task).filter(Task.user_id == user.id).all()
    deadlines = db.query(Deadline).filter(Deadline.user_id == user.id).all()
    return {
        "metrics": [
            {"label": "Emails Today", "value": "12"},
            {"label": "Pending Assignments", "value": str(len([t for t in tasks if not t.completed]))},
            {"label": "Scheduled Meetings", "value": "3"},
            {"label": "Productivity Score", "value": "87%"},
        ],
        "todayTasks": [{"title": t.title, "time": (t.due_date.isoformat() if t.due_date else "No due time"), "priority": t.priority} for t in tasks[:3]],
        "upcomingDeadlines": [{"title": d.title, "due": d.due_date.strftime("%b %d"), "subject": d.subject, "progress": d.progress} for d in deadlines[:3]],
        "aiSuggestions": ["Plan deep work for high-priority tasks", "Use free slots for revision"],
    }
