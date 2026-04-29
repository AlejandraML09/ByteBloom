from pydantic import BaseModel, EmailStr

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    dni: str
    email: EmailStr
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    apellido: str
    dni: str
    email: str

    class Config:
        from_attributes = True  # Pydantic v2 (era orm_mode en v1)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str