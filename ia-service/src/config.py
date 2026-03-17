from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Database
    postgres_url: str = "postgresql://condocompare:condocompare123@localhost:5432/condocompare"

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Groq API (OpenAI compatible)
    groq_api_key: str = ""
    groq_model: str = "llama-3.3-70b-versatile"
    groq_base_url: str = "https://api.groq.com/openai/v1"

    # CORS - configurable via CORS_ORIGINS env var (comma-separated string or JSON array)
    cors_origins: List[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:8080"]

    # Storage (S3-compatible: MinIO local, Supabase Storage in prod)
    minio_endpoint: str = "http://localhost:9000"
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "condocompare-docs"
    storage_region: str = "us-east-1"

    # Backend API
    backend_url: str = "http://localhost:8080/api"

    # Environment
    environment: str = "development"

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
