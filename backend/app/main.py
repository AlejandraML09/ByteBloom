from fastapi import FastAPI
from app.routers import usuarios, turnos
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine, Base
from app.models import Usuario

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(usuarios.router)
app.include_router(turnos.router, prefix="/turnos")
