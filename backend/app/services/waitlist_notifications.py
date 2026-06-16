from datetime import datetime
from app.database import SessionLocal
from app import models
from app.routers.usuarios import enviar_mail, FRONTEND_URL


def _format_fecha_hora(cp: models.ClaseProgramada) -> str:
    try:
        fecha = cp.fecha.isoformat()
        hora = str(cp.hora)[:5]
        return f"{fecha} a las {hora}"
    except Exception:
        return "la fecha y hora indicadas"


def notificar_lista_espera(clase_programada_id: int, db=None) -> int:
    """Notifica por email a todas las entradas activas en lista de espera
    para una clase programada. Retorna la cantidad de notificaciones enviadas.
    """
    cerrar_db = False
    if db is None:
        db = SessionLocal()
        cerrar_db = True
    try:
        filas = (
            db.query(models.ListaEspera, models.Usuario)
            .join(models.Usuario, models.ListaEspera.usuario_id == models.Usuario.id)
            .filter(
                models.ListaEspera.clase_programada_id == clase_programada_id,
                models.ListaEspera.activo == True,
                models.ListaEspera.estado == models.EstadoListaEspera.esperando,
            )
            .all()
        )

        if not filas:
            return 0

        ahora = datetime.now()
        enviados = 0

        # intentar obtener datos de la clase para el cuerpo del mail
        cp = (
            db.query(models.ClaseProgramada)
            .filter(models.ClaseProgramada.id == clase_programada_id)
            .first()
        )
        zona = None
        profesional = None
        descripcion_slot = 'el turno'
        if cp:
            zona = db.query(models.Zona).filter(models.Zona.id == cp.zona_id).first()
            if cp.profesional_email:
                profesional = (
                    db.query(models.Usuario)
                    .filter(models.Usuario.email == cp.profesional_email)
                    .first()
                )
            descripcion_slot = _format_fecha_hora(cp)

        for le, usuario in filas:
            # actualizar estado para no volver a notificar la misma entrada
            le.estado = models.EstadoListaEspera.notificado
            le.notificado_en = ahora

            # Incluir fecha, hora y zona_id para permitir preseleccionar el turno en el frontend
            fecha_q = cp.fecha.isoformat() if cp and getattr(cp, 'fecha', None) else ''
            hora_q = str(cp.hora)[:5] if cp and getattr(cp, 'hora', None) else ''
            zona_q = str(cp.zona_id) if cp and getattr(cp, 'zona_id', None) else ''
            enlace = (
                f"{FRONTEND_URL.rstrip('/')}/turnos?clase_id={clase_programada_id}&usuario_id={usuario.id}"
                f"&fecha={fecha_q}&hora={hora_q}&zona_id={zona_q}"
            )
            asunto = "Se liberó un cupo en Endereza2"

            zona_txt = zona.nombre if zona else 'la zona correspondiente'
            prof_txt = f" del profesional {profesional.nombre} {profesional.apellido}" if profesional else ''

            cuerpo = f"""
                <div style=\"font-family: Arial, sans-serif; color: #111;\">
                  <p>Hola {usuario.nombre},</p>
                  <p>Se ha liberado un cupo para {descripcion_slot} en {zona_txt}{prof_txt}.</p>
                  <p style=\"margin:18px 0;\"><a href=\"{enlace}\" style=\"display:inline-block;padding:10px 14px;background:#0066cc;color:#fff;text-decoration:none;border-radius:4px;\">Inscribirme al turno</a></p>
                  <p>Al ingresar se validará la disponibilidad en tiempo real. Si otra persona ocupó el cupo antes, no podrás inscribirte:</p>
                  <p>Si necesitás ayuda, respondé este email o contactá soporte.</p>
                </div>
            """

            try:
                enviar_mail(usuario.email, asunto, cuerpo)
            except Exception:
                # No interrumpir el proceso por errores de email
                pass
            enviados += 1

        db.commit()
        return enviados
    finally:
        if cerrar_db:
            db.close()

