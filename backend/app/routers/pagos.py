from fastapi import APIRouter
import mercadopago
import os

router = APIRouter(prefix="/api", tags=["pagos"])

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))


@router.post("/crear-preferencia")
def crear_preferencia(servicio_id: int, precio: float, titulo: str):
    preference_data = {
        "items": [{"title": titulo, "quantity": 1, "unit_price": precio}]
    }
    result = sdk.preference().create(preference_data)
    return {"init_point": result["response"]["init_point"]}
