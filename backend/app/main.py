from fastapi import FastAPI
from database import engine, Base
from routers import auth

Base.metadata.create_all(bind=engine)  # Crea tablas si no existen

app = FastAPI(title="Login API")
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "API funcionando 🚀"}