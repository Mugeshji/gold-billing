from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = "postgresql://gold_billing_app_db_user:pvN28IsTXmhOymBXZ4asITOVmW99W0Sr@dpg-d8slglu8bjmc738hjg0g-a:5432/gold_billing_app_db"
    
    # Security Settings
    SECRET_KEY: str = "luxury_gold_showroom_secret_key_2026_safe_and_long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
