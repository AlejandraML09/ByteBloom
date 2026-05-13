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
 * @param {{ zona: string, turnos: {fecha: string, hora: string}[], medioPago: string }} payload
 */
export async function reservarTurnos({ zona, turnos, medioPago }) {
  const { data } = await client.post('/turnos/reservar', {
    zona,
    turnos,
    medio_pago: medioPago,
  })
  return data
}
