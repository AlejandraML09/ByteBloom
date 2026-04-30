from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.database import SessionLocal
from app import models

router = APIRouter()

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
def registrar(email: str, password: str, db: Session = Depends(get_db)):
    existe = db.query(models.Usuario).filter(models.Usuario.email == email).first()

    if existe:
        raise HTTPException(status_code=400, detail="Email ya registrado")

    nuevo = models.Usuario(email=email, password=password)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    return nuevo

@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(models.Usuario).filter(
        models.Usuario.email == data.email
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if user.password != data.password:
        raise HTTPException(status_code=401, detail="Contraseña incorrecta")

    return {
        "id": user.id,
        "email": user.email
    }