import client from './client'

/**
 * Obtiene el qr_token de un abono activo del usuario.
 * @param {number} abonoId
 * @param {number} usuarioId
 */
export async function getQrAbono(abonoId, usuarioId) {
  const { data } = await client.get(`/qr/abono/${abonoId}`, {
    params: { usuario_id: usuarioId },
  })
  return data // { qr_token: string }
}

/**
 * Obtiene el qr_token de una reserva suelta del usuario.
 * @param {number} reservaId
 * @param {number} usuarioId
 */
export async function getQrReserva(reservaId, usuarioId) {
  const { data } = await client.get(`/qr/reserva/${reservaId}`, {
    params: { usuario_id: usuarioId },
  })
  return data // { qr_token: string }
}

/**
 * Registra asistencia escaneando el QR de un abono.
 * @param {string} qrToken
 * @param {number} secretarioId
 */
export async function escanearQrAbono(qrToken, secretarioId) {
  const { data } = await client.post('/qr/escanear', {
    qr_token: qrToken,
    secretario_id: secretarioId,
  })
  return data // { ok, mensaje, clase }
}

/**
 * Registra asistencia escaneando el QR de una reserva suelta.
 * @param {string} qrToken
 * @param {number} secretarioId
 */
export async function escanearQrReserva(qrToken, secretarioId) {
  const { data } = await client.post('/qr/escanear-reserva', {
    qr_token: qrToken,
    secretario_id: secretarioId,
  })
  return data // { ok, mensaje, clase }
}