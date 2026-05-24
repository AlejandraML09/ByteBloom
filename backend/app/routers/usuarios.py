import secrets
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from app.database import SessionLocal
from app import models
from typing import Optional
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import re

load_dotenv()

router = APIRouter(tags=["usuarios"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174/")
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")


class UsuarioRequest(BaseModel):
    nombre: str
    apellido: str
    email: str
    fecha_nacimiento: date
    password: str
    dni: int


class LoginRequest(BaseModel):
    email: str
    password: str


class ActualizarUsuarioRequest(BaseModel):
    usuario_id: int
    nombre: str
    apellido: str
    dni: int
    fecha_nacimiento: date
    password_actual: Optional[str] = None
    password_nueva: Optional[str] = None


class CrearSecretarioRequest(BaseModel):
    nombre: str
    apellido: str
    email: str
    fecha_nacimiento: date
    dni: str


class RegistrarClienteRequest(BaseModel):
    nombre: str
    apellido: str
    email: str
    dni: int | None = None
    fecha_nacimiento: date

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def enviar_mail(destinatario: str, asunto: str, cuerpo_html: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"] = GMAIL_USER
    msg["To"] = destinatario
    msg.attach(MIMEText(cuerpo_html, "html"))
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, destinatario, msg.as_string())


@router.post("/registro/")
def registrar(data: UsuarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    if db.query(models.Usuario).filter(models.Usuario.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="DNI ya registrado")

    nuevo = models.Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=email_lower,
        dni=data.dni,
        fecha_nacimiento=data.fecha_nacimiento,
        rol=models.RolUsuario.usuario,
    )
    nuevo.set_password(data.password)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {"id": nuevo.id, "email": nuevo.email}


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    user = db.query(models.Usuario).filter(models.Usuario.email == email_lower).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.check_password(data.password):
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "id": user.id,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "email": user.email,
        "rol": user.rol,
        "dni": user.dni,
        "fecha_nacimiento": str(user.fecha_nacimiento) if user.fecha_nacimiento else "",
    }


@router.post("/api/usuarios/crear-secretario")
def crear_secretario(data: CrearSecretarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()

    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    if db.query(models.Usuario).filter(models.Usuario.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="DNI ya registrado")

    nuevo_secretario = models.Usuario(
        email=email_lower,
        nombre=data.nombre,
        apellido=data.apellido,
        dni=data.dni,
        fecha_nacimiento=data.fecha_nacimiento,
        rol=models.RolUsuario.secretario,
    )

    token = secrets.token_urlsafe(32)
    nuevo_secretario.reset_token = token
    nuevo_secretario.reset_token_expira = datetime.now(timezone.utc) + timedelta(hours=24)

    temp_password = secrets.token_urlsafe(12)
    nuevo_secretario.set_password(temp_password)

    db.add(nuevo_secretario)
    db.commit()
    db.refresh(nuevo_secretario)

    enlace = f"{FRONTEND_URL}restablecer-password?token={token}"

    try:
        enviar_mail(
            destinatario=email_lower,
            asunto="Endereza2 - Completa tu registro como secretario",
            cuerpo_html=f"""
                <p>Hola {nuevo_secretario.nombre},</p>
                <p>Tu cuenta como secretario en Endereza2 ha sido creada.</p>
                <p><strong>Contraseña temporal: {temp_password}</strong></p>
                <p><a href="{enlace}">Hacé clic acá para establecer tu contraseña definitiva</a></p>
                <p>El enlace expira en 24 horas.</p>
                <p>Si tienes dudas, contactá a soporte.</p>
            """
        )
    except Exception as e:
        print(f"Error enviando email: {e}")

    return {
        "id": nuevo_secretario.id,
        "email": nuevo_secretario.email,
        "nombre": nuevo_secretario.nombre,
        "apellido": nuevo_secretario.apellido,
        "rol": str(nuevo_secretario.rol),
        "message": "Secretario creado. Email de restablecimiento enviado.",
    }


@router.get("/secretarios")
def listar_secretarios(db: Session = Depends(get_db)):
    secretarios = (
        db.query(models.Usuario)
        .filter(models.Usuario.rol == models.RolUsuario.secretario)
        .all()
    )
    return [
        {
            "id": s.id,
            "email": s.email,
            "nombre": s.nombre,
            "apellido": s.apellido,
            "rol": s.rol,
        }
        for s in secretarios
    ]


@router.post("/crear-profesional")
def crear_profesional(data: UsuarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    if db.query(models.Usuario).filter(models.Usuario.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="DNI ya registrado")

    nuevo_profesional = models.Usuario(
        email=email_lower,
        nombre=data.nombre,
        apellido=data.apellido,
        fecha_nacimiento=data.fecha_nacimiento,
        dni=data.dni,
        rol=models.RolUsuario.profesional,
    )
    nuevo_profesional.set_password(data.password)
    db.add(nuevo_profesional)
    db.commit()
    db.refresh(nuevo_profesional)

    return {
        "id": nuevo_profesional.id,
        "email": nuevo_profesional.email,
        "nombre": nuevo_profesional.nombre,
        "apellido": nuevo_profesional.apellido,
        "rol": nuevo_profesional.rol,
        "message": "Profesional creado exitosamente",
    }


@router.get("/profesionales")
def listar_profesionales(db: Session = Depends(get_db)):
    profesionales = (
        db.query(models.Usuario)
        .filter(models.Usuario.rol == models.RolUsuario.profesional)
        .all()
    )
    return [
        {
            "id": p.id,
            "email": p.email,
            "nombre": p.nombre,
            "apellido": p.apellido,
            "rol": p.rol,
        }
        for p in profesionales
    ]


@router.put("/usuarios/me")
def actualizar_usuario(data: ActualizarUsuarioRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.id == data.usuario_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not data.nombre.strip():
        raise HTTPException(status_code=400, detail="El nombre es un campo obligatorio")
    if not data.apellido.strip():
        raise HTTPException(status_code=400, detail="El apellido es un campo obligatorio")

    user.nombre = data.nombre.strip()
    user.apellido = data.apellido.strip()
    user.fecha_nacimiento = data.fecha_nacimiento

    if data.dni and data.dni != user.dni:
        existe = (
            db.query(models.Usuario)
            .filter(models.Usuario.dni == data.dni, models.Usuario.id != data.usuario_id)
            .first()
        )
        if existe:
            raise HTTPException(status_code=400, detail="El DNI ya está registrado por otro usuario")
        user.dni = data.dni

    if data.password_actual or data.password_nueva:
        if not data.password_actual or not data.password_nueva:
            raise HTTPException(status_code=400, detail="Debés completar la contraseña actual y la nueva")
        if not user.check_password(data.password_actual):
            raise HTTPException(status_code=401, detail="La contraseña actual es incorrecta")
        if not re.match(r'^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$', data.password_nueva):
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número")
        user.set_password(data.password_nueva)

    db.commit()

    return {"mensaje": "Modificación exitosa"}


@router.delete("/secretarios/{secretario_id}")
def eliminar_secretario(secretario_id: int, db: Session = Depends(get_db)):
    secretario = (
        db.query(models.Usuario)
        .filter(
            models.Usuario.id == secretario_id,
            models.Usuario.rol == models.RolUsuario.secretario,
        )
        .first()
    )

    if not secretario:
        raise HTTPException(status_code=404, detail="Secretario no encontrado")

    db.delete(secretario)
    db.commit()

    return {"message": "Secretario eliminado exitosamente"}


@router.post("/secretario/registrar-cliente")
def registrar_cliente_secretario(data: RegistrarClienteRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower().strip()

    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    password_generada = secrets.token_urlsafe(10)

    nuevo = models.Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=email_lower,
        dni=data.dni,
        fecha_nacimiento=date(2000, 1, 1),
        rol=models.RolUsuario.usuario,
    )
    nuevo.set_password(password_generada)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    token = secrets.token_urlsafe(32)
    nuevo.reset_token = token
    nuevo.reset_token_expira = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    enlace = f"{FRONTEND_URL}restablecer-password?token={token}"
    print(f"Enviando mail a: {email_lower}")
    enviar_mail(
        destinatario=email_lower,
        asunto="Bienvenido a Endereza2 - Activá tu cuenta",
        cuerpo_html=f"""
            <p>Hola {data.nombre},</p>
            <p>Tu cuenta fue creada en Endereza2.</p>
            <p>Tu contraseña temporal es: <strong>{password_generada}</strong></p>
            <p>Te recomendamos establecer tu propia contraseña haciendo clic acá:</p>
            <p><a href="{enlace}">Establecer mi contraseña</a></p>
            <p>El enlace expira en 24 horas.</p>
        """
    )

    return {"id": nuevo.id, "email": nuevo.email}