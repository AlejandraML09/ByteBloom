from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import cast, String as SAStr
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime, date as date_type, time as time_type
from app.database import SessionLocal
from app.models import Clase, ClaseProgramada, Zona, Usuario

router = APIRouter(prefix="/api/clases", tags=["clases"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ── Schemas ───────────────────────────────────────────────────────────────────


class CrearClaseRequest(BaseModel):
    zona_id: int
    cupo_maximo: int
    profesional_email: Optional[str] = None

    @field_validator("zona_id")
    @classmethod
    def zona_valida(cls, v):
        if v < 1:
            raise ValueError("La zona no puede ser menor a 1.")
        return v

    @field_validator("cupo_maximo")
    @classmethod
    def cupo_positivo(cls, v):
        if v < 1:
            raise ValueError("El cupo máximo debe ser al menos 1.")
        return v

    @field_validator("profesional_email")
    @classmethod
    def email_valido(cls, v):
        if v is None:
            return v
        if "@" not in v:
            raise ValueError("El email del profesional no es válido.")
        return v.strip().lower()


class ClaseResponse(BaseModel):
    id: int
    zona_id: int
    cupo_maximo: int
    profesional_email: Optional[str] = None

    class Config:
        from_attributes = True


class SlotItem(BaseModel):
    fecha: str  # "YYYY-MM-DD"
    hora: str  # "HH:MM"

    @field_validator("fecha")
    @classmethod
    def fecha_valida(cls, v):
        try:
            datetime.strptime(v, "%Y-%m-%d")
        except ValueError:
            raise ValueError("La fecha debe tener formato YYYY-MM-DD.")
        return v

    @field_validator("hora")
    @classmethod
    def hora_valida(cls, v):
        try:
            datetime.strptime(v, "%H:%M")
        except ValueError:
            raise ValueError("El horario debe tener formato HH:MM.")
        return v


class BulkProgramarRequest(BaseModel):
    clase_id: int
    slots: list[SlotItem]


class ActualizarHorarioRequest(BaseModel):
    nueva_hora: str


# ── Endpoints ─────────────────────────────────────────────────────────────────


@router.post("", response_model=ClaseResponse, status_code=201)
def crear_clase(body: CrearClaseRequest, db: Session = Depends(get_db)):
    """Creates a clase template (zone + capacity + profesional). No schedule."""
    if not db.query(Zona).filter(Zona.id == body.zona_id, Zona.activo == True).first():
        raise HTTPException(status_code=404, detail="Zona no encontrada.")

    nueva_clase = Clase(
        zona_id=body.zona_id,
        cupo_maximo=body.cupo_maximo,
        profesional_email=body.profesional_email,
    )
    db.add(nueva_clase)
    db.commit()
    db.refresh(nueva_clase)
    return nueva_clase


@router.get("/activas")
def listar_clases_activas(db: Session = Depends(get_db)):
    """All active clase templates with zone and profesional info."""
    rows = (
        db.query(Clase, Zona)
        .join(Zona, Clase.zona_id == Zona.id)
        .filter(Clase.activo == True)
        .order_by(Zona.nombre, Clase.id)
        .all()
    )
    result = []
    for clase, zona in rows:
        prof_nombre = None
        if clase.profesional_email:
            u = (
                db.query(Usuario)
                .filter(Usuario.email == clase.profesional_email)
                .first()
            )
            if u:
                prof_nombre = f"{u.nombre} {u.apellido}"
        result.append(
            {
                "id": clase.id,
                "zona_id": clase.zona_id,
                "zona_nombre": zona.nombre,
                "cupo_maximo": clase.cupo_maximo,
                "profesional_email": clase.profesional_email,
                "profesional_nombre": prof_nombre,
            }
        )
    return result


@router.post("/programadas", status_code=201)
def crear_clases_programadas_bulk(
    body: BulkProgramarRequest, db: Session = Depends(get_db)
):
    """Bulk-creates clases_programadas for an existing clase, skipping duplicates."""
    clase = (
        db.query(Clase).filter(Clase.id == body.clase_id, Clase.activo == True).first()
    )
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada.")

    if not body.slots:
        raise HTTPException(
            status_code=400, detail="Debés seleccionar al menos un horario."
        )

    creadas, omitidas = 0, 0
    for slot in body.slots:
        fecha_obj = datetime.strptime(slot.fecha, "%Y-%m-%d").date()
        hora_obj = datetime.strptime(slot.hora, "%H:%M").time()

        already = (
            db.query(ClaseProgramada)
            .filter(
                ClaseProgramada.clase_id == body.clase_id,
                ClaseProgramada.fecha == fecha_obj,
                ClaseProgramada.hora == hora_obj,
                ClaseProgramada.activo == True,
            )
            .first()
        )
        if already:
            omitidas += 1
            continue
        db.add(
            ClaseProgramada(
                clase_id=body.clase_id,
                fecha=fecha_obj,
                hora=hora_obj,
                cupo_disponible=clase.cupo_maximo,
            )
        )
        db.flush()  # write one at a time — avoids SQLAlchemy batch-insert typing the cols as VARCHAR
        creadas += 1

    db.commit()
    return {"creadas": creadas, "omitidas": omitidas}


@router.delete("/por-profesional/{email}", status_code=200)
def eliminar_clases_de_profesional(email: str, db: Session = Depends(get_db)):
    clases = (
        db.query(Clase)
        .filter(
            Clase.profesional_email == email.strip().lower(),
            Clase.activo == True,
        )
        .all()
    )
    if not clases:
        raise HTTPException(
            status_code=404, detail="No se encontraron clases para ese profesional."
        )
    for clase in clases:
        clase.activo = False
    db.commit()
    return {"eliminadas": len(clases), "profesional_email": email}


@router.put("/{clase_id}/horario")
def actualizar_horario_clase(
    clase_id: int, data: ActualizarHorarioRequest, db: Session = Depends(get_db)
):
    # Buscar la clase programada (no la template)
    clase_programada = db.query(ClaseProgramada).filter(
        ClaseProgramada.id == clase_id,
        ClaseProgramada.activo == True
    ).first()

    if not clase_programada:
        raise HTTPException(status_code=404, detail="Clase programada no encontrada")

    # Convertir la nueva hora a objeto time
    try:
        nueva_hora_obj = datetime.strptime(data.nueva_hora, "%H:%M").time()
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de hora inválido (HH:MM)")

    clase_programada.hora = nueva_hora_obj
    db.commit()
    db.refresh(clase_programada)

    return {"mensaje": "Horario actualizado correctamente", "id": clase_programada.id}
