from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from database import get_db
from models import Usuario
from schemas import UsuarioCreate, UsuarioResponse, LoginRequest, Token
import os

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"

def crear_token(data: dict):
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=8)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

@router.post("/register", response_model=UsuarioResponse, status_code=201)
def registrar(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    if db.query(Usuario).filter(Usuario.email == usuario.email).first():
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    if db.query(Usuario).filter(Usuario.dni == usuario.dni).first():
        raise HTTPException(status_code=400, detail="El DNI ya está registrado")

    nuevo = Usuario(
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        dni=usuario.dni,
        email=usuario.email,
        password=pwd_context.hash(usuario.password)
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo

@router.post("/login", response_model=Token)
def login(datos: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == datos.email).first()
    if not usuario or not pwd_context.verify(datos.password, usuario.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    token = crear_token({"sub": usuario.email, "id": usuario.id})
    return {"access_token": token, "token_type": "bearer"}