from fastapi import APIRouter, HTTPException
import mercadopago
import os

router = APIRouter(prefix="/api", tags=["pagos"])

sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))


@router.post("/crear-preferencia")
def crear_preferencia(
    servicio_id: int,
    precio: float,
    titulo: str,
    cantidad: int = 1,
    success_path: str = None,
    failure_path: str = None,
    pending_path: str = None,
):
    FRONTEND_URL = os.getenv("FRONTEND_URL")

    def build_url(path: str):
        if not path:
            return None
        if path.startswith("http://") or path.startswith("https://"):
            return path
        return f"{FRONTEND_URL.rstrip('/')}{path}"

    preference_data = {
        "items": [
            {
                "id": f"servicio-{servicio_id}",
                "title": titulo,
                "quantity": 1,
                "currency_id": "ARS",
                "unit_price": float(precio),
            }
        ],

        "back_urls": {
            "success": build_url(
                success_path or f"/turnos?status=approved&cantidad={cantidad}"
            ),
            "failure": build_url(failure_path or "/turnos?status=failure"),
            "pending": build_url(pending_path or "/turnos?status=pending"),
        },

        "auto_return": "approved",
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