from fastapi import APIRouter, HTTPException
import mercadopago
import os

router = APIRouter(prefix="/api", tags=["pagos"])

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))


@router.post("/crear-preferencia")
def crear_preferencia(servicio_id: int, precio: float, titulo: str,cantidad: int = 1):
    FRONTEND_URL = os.getenv("FRONTEND_URL")  
    preference_data = {
        "items": [
            {
                "id": f"servicio-{servicio_id}",
                "title": titulo,
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(precio)
            }
        ],

        "back_urls": {
            "success": f"{FRONTEND_URL}/turnos?status=approved&cantidad={cantidad}", 
            "failure":  f"{FRONTEND_URL}/turnos?status=failure",
            "pending": f"{FRONTEND_URL}/turnos?status=pending"
        },

        "auto_return": "approved"
    }

    result = sdk.preference().create(preference_data)

    print(result)

    if result["status"] != 201:
        raise HTTPException(
            status_code=500,
            detail=result["response"]
        )

    return {
        "init_point": result["response"]["init_point"]
    }