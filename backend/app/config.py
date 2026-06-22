from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database Settings
    DATABASE_URL: str = "mysql+pymysql://root:root@localhost:3306/gold_billing"
    
    # Security Settings
    SECRET_KEY: str = "luxury_gold_showroom_secret_key_2026_safe_and_long"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
