import asyncio

from fastapi import FastAPI
from app.routers import (
    usuarios,
    turnos,
    pagos,
    servicios,
    clases,
    zonas,
    auth,
    abonos,
    lista_espera,
    salas,
)
from app.jobs.marcar_ausencias import loop_marcar_ausencias
from fastapi.middleware.cors import CORSMiddleware
from app.jobs.liberar_reservas_vencidas import loop_liberar_vencidas
app = FastAPI()


@app.on_event("startup")
async def _start_background_jobs() -> None:
    asyncio.create_task(loop_marcar_ausencias())
    asyncio.create_task(loop_liberar_vencidas())

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "https://endereza2.vercel.app"
    ],
    allow_credentials=True,
    allow_origin_regex=r"^https://[a-zA-Z0-9-]+\.ngrok-free\.dev$",
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(usuarios.router)
app.include_router(turnos.router, prefix="/turnos")
app.include_router(servicios.router)
app.include_router(pagos.router)
app.include_router(clases.router)
app.include_router(zonas.router)
app.include_router(auth.router)
app.include_router(abonos.router)
app.include_router(lista_espera.router, prefix="/turnos")
app.include_router(salas.router)
