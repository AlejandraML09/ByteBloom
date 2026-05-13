from sqlalchemy import Column, Integer, String, Date, Time, Enum as SQLEnum
from app.database import Base
import enum

class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)


class ZonaEnum(str, enum.Enum):
    superior = "superior"
    medio = "medio"
    inferior = "inferior"


class Clase(Base):
    __tablename__ = "clases"

    id = Column(Integer, primary_key=True, index=True)
    zona = Column(SQLEnum(ZonaEnum), nullable=False, index=True)
    fecha = Column(Date, nullable=False, index=True)
    hora = Column(String(5), nullable=False)
    precio = Column(Integer, nullable=False)
    cupo_max = Column(Integer, nullable=False, default=5)
    inscritos = Column(Integer, default=0)
    cancelada = Column(Integer, default=0)