from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum as SQLEnum, Date
from sqlalchemy.sql import func
from app.database import Base
import enum
import bcrypt



class RolUsuario(str, enum.Enum):
    usuario = "usuario"
    admin = "admin"
    secretario = "secretario"
    profesional = "profesional"


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)

    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)

    dni = Column(Integer, nullable=False, unique=True)

    email = Column(String(100), unique=True, nullable=False)

    password = Column(String(255), nullable=False)

    fecha_nacimiento = Column(Date, nullable=False)

    rol = Column(
        SQLEnum(RolUsuario, name="rol_usuario"),
        nullable=False,
        default=RolUsuario.usuario
    )
    reset_token = Column(String(255), nullable=True)
    reset_token_expira = Column(DateTime(timezone=True), nullable=True)
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

class Zona(Base):
    __tablename__ = "zonas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(SQLEnum(ZonaEnum), unique=True, nullable=False)
    descripcion = Column(String(255), nullable=True)    
    precio = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=1)  # 1 para activo, 0 para inactivo

class Clase(Base):
    __tablename__ = "clases"

    id = Column(Integer, primary_key=True, index=True)
    zona_id = Column(Integer, nullable=False, index=True)
    cupo_maximo = Column(Integer, nullable=False, default=5)
    activo = Column(Boolean, nullable=False, default=1)  # 1 para activo, 0 para inactivo
    profesional_email = Column(String(100), nullable=True)

class ClaseProgramada(Base):
    __tablename__ = "clases_programadas"
    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, nullable=False, index=True)
    fecha = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    hora = Column(String(5), nullable=False)  # "HH:MM"
    cupo_disponible = Column(Integer, nullable=False, default=0)


class Configuracion(Base):
    __tablename__ = "configuracion"

    id = Column(Integer, primary_key=True, default=1)
    precio = Column(Integer, nullable=False, default=0)


class Turno(Base):
    __tablename__ = "turnos"
    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(String(10), index=True, nullable=False)  # "YYYY-MM-DD"
    hora = Column(String(5), nullable=False)  # "HH:MM"
    zona = Column(SQLEnum(ZonaEnum), nullable=False)
    medio_pago = Column(String(30), nullable=True)
    usuario_id = Column(Integer, nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
