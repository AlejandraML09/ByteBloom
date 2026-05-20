from fastapi import FastAPI
from app.routers import usuarios, turnos, pagos, servicios, clases, zonas, auth
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

#app.add_middleware(
 #   CORSMiddleware,
  #  allow_origins=["*"],
   # allow_credentials=True,
    #allow_methods=["*"],
    #allow_headers=["*"],
#)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:5173",
        "https://overcrowd-clump-disregard.ngrok-free.dev",
        "https://endereza2.vercel.app"
    ],
    allow_credentials=True,
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
