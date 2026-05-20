from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from app.database import SessionLocal
from app import models

router = APIRouter()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5174/")
GMAIL_USER = os.getenv("GMAIL_USER")
GMAIL_PASSWORD = os.getenv("GMAIL_PASSWORD")

class RecuperarRequest(BaseModel):
    email: str

class RestablecerRequest(BaseModel):
    token: str
    password: str

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

    with smtplib.SMTP("smtp.gmail.com", 587) as server:
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASSWORD)
        server.sendmail(GMAIL_USER, destinatario, msg.as_string())

@router.post("/recuperar-password")
def recuperar_password(data: RecuperarRequest, db: Session = Depends(get_db)):
    email_lower = data.email.lower().strip()
    user = db.query(models.Usuario).filter(models.Usuario.email == email_lower).first()

    if not user:
        raise HTTPException(status_code=404, detail="Email no registrado")

    token = secrets.token_urlsafe(32)
    user.reset_token = token
    user.reset_token_expira = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    enlace = f"{FRONTEND_URL}restablecer-password?token={token}"

    enviar_mail(
        destinatario=email_lower,
        asunto="Restablecer contraseña",
        cuerpo_html=f"""
            <p>Hola {user.nombre or ''},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña.</p>
            <p><a href="{enlace}">Hacé clic acá para restablecer tu contraseña</a></p>
            <p>El enlace expira en 1 hora.</p>
            <p>Si no solicitaste esto, ignorá este mail.</p>
        """
    )

    return {"mensaje": "Se ha enviado un mail a su casilla para restablecer la contraseña"}

@router.post("/restablecer-password")
def restablecer_password(data: RestablecerRequest, db: Session = Depends(get_db)):
    user = db.query(models.Usuario).filter(models.Usuario.reset_token == data.token).first()

    if not user or user.reset_token_expira < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Token inválido o expirado")

    user.set_password(data.password)
    user.reset_token = None
    user.reset_token_expira = None
    db.commit()

    return {"mensaje": "Contraseña actualizada correctamente"}