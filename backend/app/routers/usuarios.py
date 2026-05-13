from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app import models

router = APIRouter()

# 📦 Schema para recibir datos en JSON
class UsuarioRequest(BaseModel):
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
    existe = db.query(models.Usuario).filter(
        models.Usuario.email == email_lower
    ).first()

    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo = models.Usuario(
        email=email_lower,
        password=data.password
    )

    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return {
        "id": nuevo.id,
        "email": nuevo.email
    }

# 🔐 Login
@router.post("/login")
def login(data: UsuarioRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower()
    user = db.query(models.Usuario).filter(
        models.Usuario.email == email_lower
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.password != data.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    role = 'admin' if user.email == 'admin@test.com' else 'usuario'

    return {
        "id": user.id,
        "email": user.email,
        "role": role
    }