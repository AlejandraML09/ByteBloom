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

router = APIRouter()


# 📦 Schema para recibir datos en JSON
class UsuarioRequest(BaseModel):
    nombre: str
    apellido: str
    email: str
    fecha_nacimiento: date
    password: str
    dni: int | None = None

class LoginRequest(BaseModel):
    email: str
    password: str


# 📦 Dependencia DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 📝 Registro de usuario
@router.post("/registro/")
def registrar(data: UsuarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    existe = (
        db.query(models.Usuario).filter(models.Usuario.email == email_lower).first()
    )

    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo = models.Usuario(
        nombre=data.nombre,
        apellido=data.apellido,
        email=email_lower,
        fecha_nacimiento=data.fecha_nacimiento,
        dni=data.dni,
        rol=models.RolUsuario.usuario.value,
    )
    nuevo.set_password(data.password)  # Hash the password
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {"id": nuevo.id, "email": nuevo.email}


# 🔐 Login
@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    print(f"Intentando login con: {email_lower}")
    user = db.query(models.Usuario).filter(
        models.Usuario.email == email_lower
    ).first()

    if not user:
        print(f"Usuario no encontrado: {email_lower}")
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    print(f"Usuario encontrado: {user.email}, contraseña BD: {user.password[:20]}...")

    if not user.check_password(data.password):
        print(f"Contraseña incorrecta para {email_lower}")
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    print(f"Login exitoso para {user.email}")

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
    existe = db.query(models.Usuario).filter(
        models.Usuario.email == email_lower
    ).first()

    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo_secretario = models.Usuario(
        email=email_lower,
        nombre=data.nombre,
        apellido=data.apellido,
        fecha_nacimiento=data.fecha_nacimiento,
        rol=models.RolUsuario.secretario.value
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
        "message": "Secretario creado exitosamente"
    }

@router.get("/secretarios")
def listar_secretarios(db: Session = Depends(get_db)):
    secretarios = db.query(models.Usuario).filter(
        models.Usuario.rol == models.RolUsuario.secretario.value
    ).all()
    
    return [
        {
            "id": secretario.id,
            "email": secretario.email,
            "nombre": secretario.nombre,
            "apellido": secretario.apellido,
            "rol": secretario.rol
        }
        for secretario in secretarios
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
