from sqlalchemy import Column, Integer, String, DateTime, Enum as SQLEnum, Date
from sqlalchemy.sql import func
from app.database import Base
import enum
import bcrypt


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=True)
    apellido = Column(String(100), nullable=True)
    email = Column(String(100), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    rol = Column(String(20), nullable=False, default="usuario")

    def set_password(self, plain_password: str):
        """Hash and store the password using bcrypt."""
        self.password = bcrypt.hashpw(
            plain_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, plain_password: str) -> bool:
        """Verify the given password against the stored hash."""
        if not self.password:
            return False
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), self.password.encode("utf-8")
            )
        except ValueError:
            return False


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
    cupo_max = Column(Integer, nullable=False, default=5)
    inscritos = Column(Integer, default=0)
    cancelada = Column(Integer, default=0)


class Configuracion(Base):
    __tablename__ = "configuracion"

    id = Column(Integer, primary_key=True, default=1)
    precio = Column(Integer, nullable=False, default=0)


class Turno(Base):
    __tablename__ = "turnos"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    hora = Column(String(5), nullable=False)  # "HH:MM"
    zona = Column(String(20), nullable=False)  # "superior"|"medio"|"inferior"
    medio_pago = Column(String(30), nullable=True)
    usuario_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
