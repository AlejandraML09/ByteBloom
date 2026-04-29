from sqlalchemy import Column, Integer, String, DateTime, func
from database import Base

class Usuario(Base):
    __tablename__ = "usuarios"

    id         = Column(Integer, primary_key=True, index=True)
    nombre     = Column(String(50), nullable=False)
    apellido   = Column(String(50), nullable=False)
    dni        = Column(String(8), unique=True, nullable=False)
    email      = Column(String(100), unique=True, nullable=False)
    password   = Column(String(255), nullable=False)
    created_at = Column(DateTime, server_default=func.now())