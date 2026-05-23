from sqlalchemy import (
    Boolean,
    Column,
    Integer,
    BigInteger,
    String,
    Text,
    DateTime,
    Date,
    Time,
    Numeric,
    Enum as SQLEnum,
)
from sqlalchemy.sql import func
from app.database import Base
import enum
import bcrypt


# ══════════════════════════════════════════════════════════════════════════════
# ENUMS
# ══════════════════════════════════════════════════════════════════════════════


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


class EstadoAbono(str, enum.Enum):
    activo = "activo"
    vencido = "vencido"
    cancelado = "cancelado"
    pausado = "pausado"


class EstadoPagoAbono(str, enum.Enum):
    pendiente = "pendiente"
    pagado = "pagado"
    vencido = "vencido"


class EstadoListaEspera(str, enum.Enum):
    esperando = "esperando"
    notificado = "notificado"
    confirmado = "confirmado"
    expirado = "expirado"
    cancelado = "cancelado"


# ══════════════════════════════════════════════════════════════════════════════
# MODELOS
# ══════════════════════════════════════════════════════════════════════════════


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(BigInteger, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False)
    apellido = Column(String(50), nullable=False)
    dni = Column(Integer, nullable=False, unique=True)
    email = Column(String(100), unique=True, nullable=False)
    password = Column(Text, nullable=False)
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

    id = Column(BigInteger, primary_key=True, index=True)
    nombre = Column(String(50), unique=True, nullable=False)
    descripcion = Column(Text, nullable=True)
    precio = Column(Numeric(10, 2), nullable=False, default=0)
    activo = Column(Boolean, nullable=False, default=True)


class Sala(Base):
    __tablename__ = "salas"

    id = Column(BigInteger, primary_key=True, index=True)
    nombre = Column(String(80), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    cupo = Column(Integer, nullable=False)
    activo = Column(Boolean, nullable=False, default=True)
    fecha_creacion = Column(
        DateTime(timezone=False), nullable=False, server_default=func.now()
    )


class ClaseProgramada(Base):
    __tablename__ = "clases_programadas"

    id = Column(BigInteger, primary_key=True, index=True)
    zona_id = Column(BigInteger, nullable=False, index=True)
    sala_id = Column(BigInteger, nullable=False, index=True)
    profesional_email = Column(String(100), nullable=True, index=True)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    cupo_inicial = Column(Integer, nullable=False)
    cupo_disponible = Column(Integer, nullable=False, default=0)
    fecha_creacion = Column(
        DateTime(timezone=False), nullable=False, server_default=func.now()
    )
    activo = Column(Boolean, nullable=False, default=True)


class MedioPago(Base):
    __tablename__ = "medios_pago"

    id = Column(BigInteger, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    activo = Column(Boolean, nullable=False, default=True)


class Reserva(Base):
    __tablename__ = "reservas"

    id = Column(BigInteger, primary_key=True, index=True)
    usuario_id = Column(BigInteger, nullable=False, index=True)
    clase_programada_id = Column(BigInteger, nullable=False, index=True)
    medio_pago_id = Column(BigInteger, nullable=False)
    precio_pagado = Column(Numeric(10, 2), nullable=False)
    monto_total = Column(Numeric(10, 2), nullable=False)
    pack_id = Column(String(36), nullable=True, index=True)
    fecha_reserva = Column(
        DateTime(timezone=False), nullable=False, server_default=func.now()
    )
    estado = Column(
        SQLEnum(EstadoReserva, name="estado_reserva"),
        nullable=False,
        default=EstadoReserva.pendiente,
    )

    @property
    def estado_pago(self) -> str:
        if self.precio_pagado is None or self.monto_total is None:
            return "pago_completo"
        return "pago_pendiente" if self.precio_pagado < self.monto_total else "pago_completo"


class Abono(Base):
    __tablename__ = "abonos"

    id = Column(BigInteger, primary_key=True, index=True)
    usuario_id = Column(BigInteger, nullable=False, index=True)
    zona_id = Column(BigInteger, nullable=False, index=True)
    fecha_inicio = Column(Date, nullable=False, server_default=func.current_date())
    fecha_fin = Column(Date, nullable=True)
    monto_mensual = Column(Numeric(10, 2), nullable=False)
    dia_limite_pago = Column(Integer, nullable=False, default=10)
    estado = Column(
        SQLEnum(EstadoAbono, name="estado_abono"),
        nullable=False,
        default=EstadoAbono.activo,
    )
    activo = Column(Boolean, nullable=False, default=True)


class PagoAbono(Base):
    __tablename__ = "pagos_abono"

    id = Column(BigInteger, primary_key=True, index=True)
    abono_id = Column(BigInteger, nullable=False, index=True)
    medio_pago_id = Column(BigInteger, nullable=True)
    anio = Column(Integer, nullable=False)
    mes = Column(Integer, nullable=False)
    fecha_vencimiento = Column(Date, nullable=False)
    fecha_pago = Column(DateTime(timezone=False), nullable=True)
    monto = Column(Numeric(10, 2), nullable=False)
    estado = Column(
        SQLEnum(EstadoPagoAbono, name="estado_pago_abono"),
        nullable=False,
        default=EstadoPagoAbono.pendiente,
    )


class AbonoReserva(Base):
    __tablename__ = "abono_reservas"

    id = Column(BigInteger, primary_key=True, index=True)
    abono_id = Column(BigInteger, nullable=False, index=True)
    reserva_id = Column(BigInteger, nullable=False, index=True)


class ListaEspera(Base):
    __tablename__ = "lista_espera"

    id = Column(BigInteger, primary_key=True, index=True)
    usuario_id = Column(BigInteger, nullable=False, index=True)
    clase_programada_id = Column(BigInteger, nullable=False, index=True)
    prioridad = Column(Integer, nullable=False)
    fecha_inscripcion = Column(
        DateTime(timezone=False), nullable=False, server_default=func.now()
    )
    estado = Column(
        SQLEnum(EstadoListaEspera, name="estado_lista_espera"),
        nullable=False,
        default=EstadoListaEspera.esperando,
    )
    notificado_en = Column(DateTime(timezone=False), nullable=True)
    expira_en = Column(DateTime(timezone=False), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)