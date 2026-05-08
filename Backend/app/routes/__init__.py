from fastapi import APIRouter

from app.routes.auth_routes import router as auth_router
from app.routes.auth_google_routes import router as auth_google_router
from app.routes.career_routes import router as career_router
from app.routes.dashboard_routes import router as dashboard_router
from app.routes.calendar_routes import router as calendar_router
from app.routes.classroom_routes import router as classroom_router
from app.routes.jobs_routes import router as jobs_router
from app.routes.location_routes import router as location_router
from app.routes.misc_routes import router as misc_router
from app.routes.schedule_routes import router as schedule_router
from app.routes.study_routes import router as study_router
from app.routes.task_routes import router as task_router
from app.routes.integrations_google_routes import router as integrations_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(auth_google_router)
api_router.include_router(task_router)
api_router.include_router(schedule_router)
api_router.include_router(study_router)
api_router.include_router(career_router)
api_router.include_router(location_router)
api_router.include_router(dashboard_router)
api_router.include_router(misc_router)
api_router.include_router(integrations_router)
api_router.include_router(calendar_router)
api_router.include_router(classroom_router)
api_router.include_router(jobs_router)
