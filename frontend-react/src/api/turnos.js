import client from './client'

/**
 * Returns scheduled classes for a given month.
 * @param {string} mes - "YYYY-MM"
 * @returns {Promise<Array>} array of clase_programada objects
 */
export async function getDisponibilidad(mes) {
  const { data } = await client.get('/turnos/disponibilidad', { params: { mes } })
  return data
}

// Maps frontend payment keys to the names stored in medios_pago table
const MEDIO_PAGO_DB = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cuentadni: 'Efectivo',
  modo: 'Transferencia',
  mercadopago: 'Mercado Pago',
  debito: 'Mercado Pago',
  credito: 'Mercado Pago',
}

/**
 * Books one or more shifts.
 * @param {{ zonaId: number, turnos: {fecha: string, hora: string}[], medioPago: string, usuarioId?: number }} payload
 */
export async function reservarTurnos({ zonaId, turnos, medioPago, usuarioId }) {
  const { data } = await client.post('/turnos/reservar', {
    zona_id: zonaId,
    turnos,
    medio_pago: MEDIO_PAGO_DB[medioPago] ?? medioPago,
    usuario_id: usuarioId ?? null,
  })
  return data
}

/**
 * Returns all reservas for the logged-in user.
 * @param {number} usuarioId
 */
export async function getMisTurnos(usuarioId) {
  const { data } = await client.get('/turnos/mis-turnos', { params: { usuario_id: usuarioId } })
  return data
}

export async function unirseListaEspera({ claseProgramadaId, usuarioId }) {
  const { data } = await client.post('/turnos/lista-espera', {
    clase_programada_id: claseProgramadaId,
    usuario_id: usuarioId,
  })
  return data
}

export async function salirListaEspera({ claseProgramadaId, usuarioId }) {
  const { data } = await client.delete(`/turnos/lista-espera/${claseProgramadaId}`, {
    params: { usuario_id: usuarioId },
  })
  return data
}

export async function getMiListaEspera(usuarioId) {
  const { data } = await client.get('/turnos/mi-lista-espera', {
    params: { usuario_id: usuarioId },
  })
  return data
}
