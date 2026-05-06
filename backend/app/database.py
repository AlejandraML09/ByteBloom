from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
import logging

load_dotenv()

logging.basicConfig()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL")

# Try to connect to DATABASE_URL; if it fails, use SQLite fallback
try:
    if DATABASE_URL and not DATABASE_URL.startswith("sqlite"):
        # Try postgres connection
        engine = create_engine(DATABASE_URL, connect_args={"sslmode": "require"})
        with engine.connect() as conn:
            pass
        logger.info("Connected to remote database successfully")
    else:
        # Use sqlite
        engine = create_engine(
            "sqlite:///./bytebloom.db",
            connect_args={"check_same_thread": False}
        )
except Exception as e:
    logger.warning(f"Failed to connect to DATABASE_URL: {e}. Falling back to SQLite")
    engine = create_engine(
        "sqlite:///./bytebloom.db",
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()