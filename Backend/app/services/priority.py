from datetime import datetime


def calculate_priority(due_date: datetime | None, progress: int) -> str:
    if due_date is None:
        return "medium"
    days_left = (due_date - datetime.utcnow()).days
    if days_left <= 2 or progress < 30:
        return "high"
    if days_left <= 7:
        return "medium"
    return "low"
