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
    existe = db.query(models.Usuario).filter(
        models.Usuario.email == data.email
    ).first()

    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo = models.Usuario(email=data.email)
    nuevo.set_password(data.password)  # Hash the password
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
    user = db.query(models.Usuario).filter(
        models.Usuario.email == data.email
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if not user.check_password(data.password):  # Use hash verification
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "id": user.id,
        "email": user.email
    }