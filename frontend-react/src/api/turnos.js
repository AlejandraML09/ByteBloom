import client from './client'

/**
 * Returns occupancy counts for every slot in a given month.
 * @param {string} mes - "YYYY-MM"
 * @returns {Promise<Record<string, number>>} e.g. { "2026-05-13_10:00": 2, ... }
 */
export async function getDisponibilidad(mes) {
  const { data } = await client.get('/turnos/disponibilidad', { params: { mes } })
  return data
}

/**
 * Books one or more shifts.
 * @param {{ zona: string, turnos: {fecha: string, hora: string}[], medioPago: string, usuarioId?: number }} payload
 */
export async function reservarTurnos({ zona, turnos, medioPago, usuarioId }) {
  const { data } = await client.post('/turnos/reservar', {
    zona,
    turnos,
    medio_pago: medioPago,
    usuario_id: usuarioId ?? null,
  })
  return data
}

/**
 * Returns all turnos for the logged-in user.
 * @param {number} usuarioId
 */
export async function getMisTurnos(usuarioId) {
  const { data } = await client.get('/turnos/mis-turnos', { params: { usuario_id: usuarioId } })
  return data
}
