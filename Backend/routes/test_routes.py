from fastapi import APIRouter

test_router = APIRouter(prefix="/test", tags=["Test"])

@test_router.get("/hello")
def hello():
    return {"response": "Hello from your Smart Assistant"}