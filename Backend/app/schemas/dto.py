from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class SignupIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6)


class LoginIn(BaseModel):
    email: str
    password: str


class RefreshIn(BaseModel):
    refresh_token: str


class TokenOut(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TaskIn(BaseModel):
    title: str
    category: str = "General"
    description: str = ""
    due_date: datetime | None = None
    progress: int = Field(default=0, ge=0, le=100)


class TaskUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    description: str | None = None
    due_date: datetime | None = None
    progress: int | None = Field(default=None, ge=0, le=100)
    completed: bool | None = None


class ScheduleIn(BaseModel):
    title: str
    category: str = "meeting"
    start_at: datetime
    end_at: datetime
    location: str = ""


class AIQuestion(BaseModel):
    question: str


class AssistantMessageIn(BaseModel):
    message: str


class CareerIn(BaseModel):
    interests: str = ""
    skills: str = ""
    goals: str = ""


class LocationIn(BaseModel):
    name: str
    city: str = ""
    productivity_hint: str = ""
