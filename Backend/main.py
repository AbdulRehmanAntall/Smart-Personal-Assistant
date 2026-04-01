from fastapi import FastAPI
from Backend.routes import test_routes

app = FastAPI(title="Smart Personal Assistant API")

app.include_router(test_routes.test_router)

@app.get("/")
def home():
    return {"message": "Smart Assistant API running"}