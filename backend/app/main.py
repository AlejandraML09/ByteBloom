from datetime import date, timedelta

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base, SessionLocal
from app.models import Usuario, Clase, ZonaEnum
from app.routers import usuarios, servicios

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def seed_initial_data():
    db = SessionLocal()
    try:
        if not db.query(Usuario).filter(Usuario.email == 'admin@test.com').first():
            db.add(Usuario(email='admin@test.com', password='admin123'))

        if db.query(Clase).count() == 0:
            today = date.today()
            sample_clases = [
                Clase(zona=ZonaEnum.superior, fecha=today + timedelta(days=1), hora='09:00', precio=1800, inscritos=0),
                Clase(zona=ZonaEnum.medio, fecha=today + timedelta(days=2), hora='10:00', precio=1600, inscritos=0),
                Clase(zona=ZonaEnum.inferior, fecha=today + timedelta(days=3), hora='11:00', precio=1400, inscritos=0),
                Clase(zona=ZonaEnum.superior, fecha=today + timedelta(days=4), hora='12:00', precio=1800, inscritos=2),
            ]
            db.add_all(sample_clases)

        db.commit()
    finally:
        db.close()


@app.on_event('startup')
def on_startup():
    seed_initial_data()

app.include_router(usuarios.router)
app.include_router(servicios.router)