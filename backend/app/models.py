from sqlalchemy import Column, Integer, String
from app.database import engine
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password = Column(String(255))

Base.metadata.create_all(bind=engine)