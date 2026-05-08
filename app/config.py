from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database settings
    DATABASE_URL: str = "postgresql+asyncpg://eimar:eimar@localhost:5432/eimar"
    
    # Redis settings
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Map provider API keys
    MAPTILER_API_KEY: Optional[str] = None
    MAPBOX_ACCESS_TOKEN: Optional[str] = None
    CESIUM_ION_TOKEN: Optional[str] = None
    HERE_API_KEY: Optional[str] = None
    
    # JWT settings
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # External service URLs
    TKGM_PARSEL_SORGU_URL: str = "https://parselsorgu.tkgm.gov.tr/"
    EPLAN_BASE_URL: str = "https://eplan.csb.gov.tr/"
    
    class Config:
        env_file = ".env"

settings = Settings()