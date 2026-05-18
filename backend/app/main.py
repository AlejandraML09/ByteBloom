from datetime import date, timedelta
from fastapi import FastAPI
from app.routers import usuarios, turnos, pagos, servicios, clases
from fastapi.middleware.cors import CORSMiddleware
from app.database import SessionLocal
from app.models import Usuario, Clase, Configuracion, ZonaEnum
from app import models
from enum import Enum

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RolUsuario(str, Enum):
    usuario = "usuario"
    admin = "admin"
    secretario = "secretario"

def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Usuario).count() == 0:
            admin = Usuario(email="admin@test.com", rol="admin")
            admin.set_password("admin123")
            db.add(admin)

        if db.query(Configuracion).count() == 0:
            db.add(Configuracion(id=1, precio=0))

        if db.query(Clase).count() == 0:
            today = date.today()
            sample_clases = [
                Clase(
                    zona=ZonaEnum.superior,
                    fecha=today + timedelta(days=1),
                    hora="09:00",
                    cupo_max=30,
                    inscritos=0,
                ),
                Clase(
                    zona=ZonaEnum.medio,
                    fecha=today + timedelta(days=2),
                    hora="10:00",
                    cupo_max=25,
                    inscritos=0,
                ),
                Clase(
                    zona=ZonaEnum.inferior,
                    fecha=today + timedelta(days=3),
                    hora="11:00",
                    cupo_max=20,
                    inscritos=0,
                ),
                Clase(
                    zona=ZonaEnum.superior,
                    fecha=today + timedelta(days=4),
                    hora="12:00",
                    cupo_max=30,
                    inscritos=2,
                ),
            ]
            db.add_all(sample_clases)

        db.commit()
    finally:
        db.close()


@app.on_event('startup')
def crear_admins_por_defecto():
    """Crea dos cuentas de admin por defecto si no existen"""
    db = SessionLocal()
    
    admins_por_defecto = [
        {
            "email": "jose@endereza2.com",
            "password": "josepepe",
            "nombre": "Jose",
            "apellido": "Pepe",
            "fecha_nacimiento": date(1990, 1, 15)
        },
        {
            "email": "laura@endereza2.com",
            "password": "lauragonzalez",
            "nombre": "Laura",
            "apellido": "Gonzalez",
            "fecha_nacimiento": date(1992, 3, 20)
        }
    ]
    
    for admin_data in admins_por_defecto:
        existe = db.query(models.Usuario).filter(
            models.Usuario.email == admin_data["email"]
        ).first()
        
        if not existe:
            nuevo_admin = models.Usuario(
                email=admin_data["email"],
                nombre=admin_data["nombre"],
                apellido=admin_data["apellido"],
                fecha_nacimiento=admin_data["fecha_nacimiento"],
                rol="admin"
            )
            nuevo_admin.set_password(admin_data["password"])
            db.add(nuevo_admin)
    
    db.commit()
    db.close()
def on_startup():
    seed_initial_data()


app.include_router(usuarios.router)
app.include_router(turnos.router, prefix="/turnos")
app.include_router(servicios.router)
app.include_router(pagos.router)
app.include_router(clases.router)
