from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    String,
    DateTime,
    Numeric,
    Enum as SQLEnum,
    Date,
)
from sqlalchemy.sql import func
from app.database import Base
import enum
import bcrypt


class RolUsuario(str, enum.Enum):
    usuario = "usuario"
    admin = "admin"
    secretario = "secretario"
    profesional = "profesional"


class ZonaEnum(str, enum.Enum):
    superior = "superior"
    medio = "medio"
    inferior = "inferior"


class EstadoReserva(str, enum.Enum):
    pendiente = "pendiente"
    confirmada = "confirmada"
    cancelada = "cancelada"
    asistio = "asistio"
    ausente = "ausente"


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
        default=RolUsuario.usuario,
    )
    reset_token = Column(String(255), nullable=True)
    reset_token_expira = Column(DateTime(timezone=True), nullable=True)
    def set_password(self, plain_password: str):
        self.password = bcrypt.hashpw(
            plain_password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, plain_password: str) -> bool:
        if not self.password:
            return False
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"), self.password.encode("utf-8")
            )
        except ValueError:
            return False


class Zona(Base):
    __tablename__ = "zonas"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(SQLEnum(ZonaEnum), unique=True, nullable=False)
    descripcion = Column(String(255), nullable=True)
    precio = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)


class Clase(Base):
    __tablename__ = "clases"

    id = Column(Integer, primary_key=True, index=True)
    zona_id = Column(Integer, nullable=False, index=True)
    cupo_maximo = Column(Integer, nullable=False, default=5)
    activo = Column(Boolean, nullable=False, default=True)
    profesional_email = Column(String(100), nullable=True)


class ClaseProgramada(Base):
    __tablename__ = "clases_programadas"

    id = Column(Integer, primary_key=True, index=True)
    clase_id = Column(Integer, nullable=False, index=True)
    fecha = Column(String(10), nullable=False)  # "YYYY-MM-DD"
    hora = Column(String(5), nullable=False)  # "HH:MM"
    cupo_disponible = Column(Integer, nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)


class MedioPago(Base):
    __tablename__ = "medios_pago"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    activo = Column(Boolean, nullable=False, default=True)


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, nullable=False, index=True)
    clase_programada_id = Column(Integer, nullable=False, index=True)
    medio_pago_id = Column(Integer, nullable=False)
    precio_pagado = Column(Numeric(10, 2), nullable=False)
    fecha_reserva = Column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    estado = Column(
        SQLEnum(EstadoReserva, name="estado_reserva"),
        nullable=False,
        default=EstadoReserva.pendiente,
    )
