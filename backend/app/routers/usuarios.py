from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import date
from app.database import SessionLocal
from app import models
from typing import Optional
import secrets
import resend
import os

router = APIRouter(tags=["usuarios"])


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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
        fecha_nacimiento=data.fecha_nacimiento,
        dni=data.dni,
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


@router.post("/crear-secretario")
def crear_secretario(data: UsuarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    if db.query(models.Usuario).filter(models.Usuario.dni == data.dni).first():
        raise HTTPException(status_code=400, detail="DNI ya registrado")

    nuevo_secretario = models.Usuario(
        email=email_lower,
        nombre=data.nombre,
        apellido=data.apellido,
        fecha_nacimiento=data.fecha_nacimiento,
        dni=data.dni,
        rol=models.RolUsuario.secretario,
    )
    nuevo_secretario.set_password(data.password)
    db.add(nuevo_secretario)
    db.commit()
    db.refresh(nuevo_secretario)

    return {
        "id": nuevo_secretario.id,
        "email": nuevo_secretario.email,
        "nombre": nuevo_secretario.nombre,
        "apellido": nuevo_secretario.apellido,
        "rol": nuevo_secretario.rol,
        "message": "Secretario creado exitosamente",
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

class ActualizarUsuarioRequest(BaseModel):
    usuario_id: int
    nombre: str
    apellido: str
    dni: int
    fecha_nacimiento: date

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
    user.dni = data.dni
    user.fecha_nacimiento = data.fecha_nacimiento
    db.commit()

    return {"mensaje": "Modificación exitosa"}

    #lo nuevo de registrar cliente:

    resend.api_key = os.getenv("RESEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173/")

class RegistrarPacienteRequest(BaseModel):
    nombre: str
    apellido: str
    email: str
    dni: int | None = None

@router.post("/secretario/registrar-paciente")
def registrar_paciente_secretario(data: RegistrarPacienteRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower().strip()

    if db.query(models.Usuario).filter(models.Usuario.email == email_lower).first():
        raise HTTPException(status_code=400, detail="Email ya registrado")

    password_generada = secrets.token_urlsafe(10)

    nuevo = models.Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=email_lower,
        dni=data.dni,
        fecha_nacimiento=date(2000, 1, 1),  # placeholder, puede actualizar en su perfil
        rol=models.RolUsuario.usuario.value,
    )
    nuevo.set_password(password_generada)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": email_lower,
        "subject": "Bienvenido a Endereza2 - Tu contraseña",
        "html": f"""
            <p>Hola {data.nombre},</p>
            <p>Tu cuenta fue creada en Endereza2.</p>
            <p>Tu contraseña temporal es: <strong>{password_generada}</strong></p>
            <p>Te recomendamos cambiarla desde tu perfil una vez que ingreses.</p>
            <p><a href="{FRONTEND_URL}login">Iniciar sesión</a></p>
        """
    })

    return {"id": nuevo.id, "email": nuevo.email}
