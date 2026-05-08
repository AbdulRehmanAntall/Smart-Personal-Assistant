from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AllignAI API"
    api_prefix: str = "/api"
    secret_key: str = "change-me-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_minutes: int = 10080
    database_url: str = "sqlite:///./app.db"
    frontend_origin: str = "http://localhost:5173"
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"
    gemini_api_key: str = ""
    # For google-genai v1beta, model names are typically prefixed with "models/".
    gemini_model: str = "models/gemini-2.0-flash"
    google_client_id: str = ""
    google_client_secret: str = ""
    google_redirect_url: str = "http://127.0.0.1:8000/api/integrations/google/callback"
    google_auth_redirect_url: str = "http://127.0.0.1:8000/api/auth/google/callback"
    news_api_key: str = ""
    jobs_api_id: str = ""
    jobs_api_key: str = ""
    adzuna_app_id: str = ""
    adzuna_app_key: str = ""
    adzuna_country: str = "us"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
