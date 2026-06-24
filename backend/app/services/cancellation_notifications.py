from datetime import datetime
from typing import Optional, Sequence
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


def notificar_cancelacion_clase(clase_programada_id: int, db=None, user_ids: Optional[Sequence[int]] = None) -> int:
    """Envía notificaciones por email a todos los usuarios que tenían
    una reserva activa (pendiente/confirmada) para la clase indicada.
    Retorna la cantidad de emails enviados.
    """
    cerrar_db = False
    if db is None:
        db = SessionLocal()
        cerrar_db = True
    try:
        enviados = 0
        # intentar obtener datos de la clase para incluir contexto en el email
        cp = (
            db.query(models.ClaseProgramada)
            .filter(models.ClaseProgramada.id == clase_programada_id)
            .first()
        )
        zona = None
        descripcion_slot = 'la clase programada'
        if cp:
            zona = db.query(models.Zona).filter(models.Zona.id == cp.zona_id).first()
            descripcion_slot = _format_fecha_hora(cp)

        # Si se pasó una lista de user_ids, enviamos únicamente a esos usuarios
        usuarios = []
        if user_ids is not None:
            if not user_ids:
                print(f"[notificar_cancelacion_clase] user_ids vacío para clase {clase_programada_id}")
                return 0
            usuarios = (
                db.query(models.Usuario).filter(models.Usuario.id.in_(list(user_ids))).all()
        )
            print(f"[notificar_cancelacion_clase] Enviando notificaciones a {len(usuarios)} usuarios pasados por parámetro para clase {clase_programada_id}")
        else:
            reservas = (
                db.query(models.Reserva)
                .filter(
                    models.Reserva.clase_programada_id == clase_programada_id,
                    models.Reserva.estado.in_(
                        [models.EstadoReserva.pendiente, models.EstadoReserva.confirmada]
                    ),
                )
                .all()
            )
            if not reservas:
                print(f"[notificar_cancelacion_clase] No hay reservas activas para clase {clase_programada_id}")
                return 0
            print(f"[notificar_cancelacion_clase] Encontradas {len(reservas)} reservas para clase {clase_programada_id}")
            usuarios = []
            for reserva in reservas:
                u = db.query(models.Usuario).filter(models.Usuario.id == reserva.usuario_id).first()
                if u:
                    usuarios.append(u)

        # Enviar correo a cada usuario recolectado
        fecha_q = cp.fecha.isoformat() if cp and getattr(cp, 'fecha', None) else ''
        hora_q = str(cp.hora)[:5] if cp and getattr(cp, 'hora', None) else ''
        zona_q = str(cp.zona_id) if cp and getattr(cp, 'zona_id', None) else ''
        enlace = (
            f"{FRONTEND_URL.rstrip('/')}" 
            f"/turnos?clase_id={clase_programada_id}&fecha={fecha_q}&hora={hora_q}&zona_id={zona_q}"
        )
        zona_txt = zona.nombre if zona else 'la zona correspondiente'

        for usuario in usuarios:
            if not usuario or not usuario.email:
                print(f"[notificar_cancelacion_clase] Skipping usuario {getattr(usuario,'id',None)}: sin email")
                continue
            cuerpo = f"""
                <div style=\"font-family: Arial, sans-serif; color: #111;\"> 
                  <p>Hola {usuario.nombre},</p>
                  <p>Tu clase programada para {descripcion_slot} en {zona_txt} fue cancelada por el profesional. Se te ha reembolsado la misma a través de créditos, que podés utilizar para reservar una clase nueva en los días y/o horarios disponibles. Lamentamos las molestias.</p>
                  <p style=\"margin:18px 0;\"><a href=\"{enlace}\" style=\"display:inline-block;padding:10px 14px;background:#0066cc;color:#fff;text-decoration:none;border-radius:4px;\">Ver turnos disponibles</a></p>
                  <p>Si necesitás ayuda, contactá a soporte.</p>
                </div>
            """
            try:
                print(f"[notificar_cancelacion_clase] Enviando email a {usuario.email} (usuario_id={usuario.id})")
                enviar_mail(usuario.email, "Endereza2 - Clase cancelada", cuerpo)
                enviados += 1
            except Exception:
                print(f"[notificar_cancelacion_clase] Error enviando a {usuario.email}")
                pass

        return enviados
    finally:
        if cerrar_db:
            db.close()


def notificar_cancelacion_lista_espera(clase_programada_id: int, db=None, user_ids: Optional[Sequence[int]] = None) -> int:
    """Envía una notificación por email a usuarios en lista de espera afectados por la cancelación."""
    cerrar_db = False
    if db is None:
        db = SessionLocal()
        cerrar_db = True
    try:
        enviados = 0

        cp = (
            db.query(models.ClaseProgramada)
            .filter(models.ClaseProgramada.id == clase_programada_id)
            .first()
        )
        zona = None
        descripcion_slot = 'la clase programada'
        if cp:
            zona = db.query(models.Zona).filter(models.Zona.id == cp.zona_id).first()
            descripcion_slot = _format_fecha_hora(cp)

        usuarios = []
        if user_ids is not None:
            if not user_ids:
                print(f"[notificar_cancelacion_lista_espera] user_ids vacío para clase {clase_programada_id}")
                return 0
            usuarios = (
                db.query(models.Usuario).filter(models.Usuario.id.in_(list(user_ids))).all()
            )
            print(f"[notificar_cancelacion_lista_espera] Enviando notificaciones a {len(usuarios)} usuarios pasados por parámetro para clase {clase_programada_id}")
        else:
            filas = (
                db.query(models.ListaEspera, models.Usuario)
                .join(models.Usuario, models.ListaEspera.usuario_id == models.Usuario.id)
                .filter(
                    models.ListaEspera.clase_programada_id == clase_programada_id,
                    models.ListaEspera.activo == True,
                    models.ListaEspera.estado.in_(
                        [
                            models.EstadoListaEspera.esperando,
                            models.EstadoListaEspera.notificado,
                        ]
                    ),
                )
                .all()
            )
            if not filas:
                print(f"[notificar_cancelacion_lista_espera] No hay entradas activas en lista de espera para clase {clase_programada_id}")
                return 0
            usuarios = [usuario for _, usuario in filas]
            print(f"[notificar_cancelacion_lista_espera] Encontradas {len(usuarios)} usuarios en lista de espera para clase {clase_programada_id}")

        fecha_q = cp.fecha.isoformat() if cp and getattr(cp, 'fecha', None) else ''
        hora_q = str(cp.hora)[:5] if cp and getattr(cp, 'hora', None) else ''
        zona_q = str(cp.zona_id) if cp and getattr(cp, 'zona_id', None) else ''
        enlace = (
            f"{FRONTEND_URL.rstrip('/')}" 
            f"/turnos?clase_id={clase_programada_id}&fecha={fecha_q}&hora={hora_q}&zona_id={zona_q}"
        )
        zona_txt = zona.nombre if zona else 'la zona correspondiente'

        for usuario in usuarios:
            if not usuario or not usuario.email:
                print(f"[notificar_cancelacion_lista_espera] Skipping usuario {getattr(usuario,'id',None)}: sin email")
                continue
            cuerpo = f"""
                <div style=\"font-family: Arial, sans-serif; color: #111;\"> 
                  <p>Hola {usuario.nombre},</p>
                  <p>La clase programada para {descripcion_slot} en {zona_txt} fue cancelada por el profesional. Estabas en lista de espera, por lo que no se generará ningún reembolso asociado a esta clase, pero queríamos informarte para que puedas reservar otra clase si lo deseás.</p>
                  <p style=\"margin:18px 0;\"><a href=\"{enlace}\" style=\"display:inline-block;padding:10px 14px;background:#0066cc;color:#fff;text-decoration:none;border-radius:4px;\">Ver turnos disponibles</a></p>
                  <p>Si necesitás ayuda, contactá a soporte.</p>
                </div>
            """
            try:
                print(f"[notificar_cancelacion_lista_espera] Enviando email a {usuario.email} (usuario_id={usuario.id})")
                enviar_mail(usuario.email, "Endereza2 - Clase cancelada", cuerpo)
                enviados += 1
            except Exception:
                print(f"[notificar_cancelacion_lista_espera] Error enviando a {usuario.email}")
                pass

        return enviados
    finally:
        if cerrar_db:
            db.close()
