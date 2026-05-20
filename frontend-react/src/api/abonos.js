import client from './client'

/**
 * Returns all abonos (subscriptions) for the logged-in user.
 * @param {number} usuarioId
 */
export async function getMisAbonos(usuarioId) {
  const { data } = await client.get('/abonos/mis-abonos', { params: { usuario_id: usuarioId } })
  return data
}
