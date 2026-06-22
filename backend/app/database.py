import pymysql
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

# Pre-create database if it doesn't exist on the server
try:
    # Parse URL of the format mysql+pymysql://user:pass@host:port/db_name
    # Example: mysql+pymysql://root:root@localhost:3306/gold_billing
    url_parts = settings.DATABASE_URL.split("@")
    credentials_part = url_parts[0].split("//")[1]
    credentials = credentials_part.split(":")
    user = credentials[0]
    password = credentials[1] if len(credentials) > 1 else ""
    
    server_and_db = url_parts[1].split("/")
    host_port = server_and_db[0].split(":")
    host = host_port[0]
    port = int(host_port[1]) if len(host_port) > 1 else 3306
    db_name = server_and_db[1]

    # Connect to MySQL Server directly to check and create database
    connection = pymysql.connect(
        host=host,
        user=user,
        password=password,
        port=port
    )
    with connection.cursor() as cursor:
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;")
    connection.close()
    print(f"Verified or created database: '{db_name}'")
except Exception as e:
    print(f"Warning: Database pre-creation check skipped or failed: {e}")

# SQLAlchemy initialization
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
