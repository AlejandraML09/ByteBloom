from datetime import date, timedelta
from fastapi import FastAPI
from app.routers import usuarios, turnos, pagos, servicios
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.database import engine, Base, SessionLocal
from app.models import Usuario, Clase, ZonaEnum

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)


def ensure_cupo_max_column():
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "ALTER TABLE clases ADD COLUMN IF NOT EXISTS cupo_max INTEGER DEFAULT 5 NOT NULL"
        )


def ensure_cancelada_column():
    with engine.begin() as conn:
        conn.exec_driver_sql(
            "ALTER TABLE clases ADD COLUMN IF NOT EXISTS cancelada INTEGER DEFAULT 0 NOT NULL"
        )


ensure_cupo_max_column()
ensure_cancelada_column()


def seed_initial_data():
    db = SessionLocal()
    try:
        if db.query(Usuario).count() == 0:
            admin = Usuario(email='admin@test.com', rol='admin')
            admin.set_password('admin123')
            db.add(admin)

        if db.query(Clase).count() == 0:
            today = date.today()
            sample_clases = [
                Clase(zona=ZonaEnum.superior, fecha=today + timedelta(days=1), hora='09:00', precio=1800, cupo_max=30, inscritos=0),
                Clase(zona=ZonaEnum.medio, fecha=today + timedelta(days=2), hora='10:00', precio=1600, cupo_max=25, inscritos=0),
                Clase(zona=ZonaEnum.inferior, fecha=today + timedelta(days=3), hora='11:00', precio=1400, cupo_max=20, inscritos=0),
                Clase(zona=ZonaEnum.inferior, fecha=date(2026, 5, 10), hora='09:00', precio=1400, cupo_max=40, inscritos=0),
                Clase(zona=ZonaEnum.superior, fecha=today + timedelta(days=4), hora='12:00', precio=1800, cupo_max=30, inscritos=2),
            ]
            db.add_all(sample_clases)

        db.commit()
    finally:
        db.close()


@app.on_event('startup')
def on_startup():
    seed_initial_data()

app.include_router(usuarios.router)
app.include_router(turnos.router, prefix="/turnos")

app.include_router(servicios.router)

app.include_router(pagos.router)