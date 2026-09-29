from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "CYCLONEX API"
    VERSION: str = "0.1.0"
    DESCRIPTION: str = (
        "AI-assisted geospatial decision-support platform for pre-landfall "
        "cyclone risk and critical-infrastructure assessment."
    )
    API_V1_STR: str = "/api/v1"
    
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # CORS Configuration
    CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:8000",
        ]

    # Data Source Mode: 'simulated' vs 'live'
    DATA_SOURCE_MODE: str = "simulated"
    DEFAULT_BENCHMARK_SCENARIO: str = "cyclone_michaung_2023"

    # Cloud & External Services (Milestone 3 & 4)
    GOOGLE_CLOUD_PROJECT: str = ""
    VERTEX_AI_LOCATION: str = "us-central1"
    GEMINI_MODEL: str = "gemini-3.7-flash"
    GEE_PROJECT_ID: str = ""
    GEE_SERVICE_ACCOUNT_KEY_PATH: str = ""
    OPEN_METEO_API_URL: str = "https://api.open-meteo.com/v1/forecast"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
