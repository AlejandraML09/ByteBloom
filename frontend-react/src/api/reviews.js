import client from './client'

export const MAX_PALABRAS_RESENA = 160

/** Cuenta palabras de un texto (igual criterio que el backend). */
export function contarPalabras(texto) {
  if (!texto) return 0
  return texto.trim().split(/\s+/).filter(Boolean).length
}

/**
 * Crea una reseña para una reserva ya asistida.
 * @param {{ usuarioId: number, reservaId: number, rating: number, comentario?: string }} payload
 */
export async function crearResena({ usuarioId, reservaId, rating, comentario }) {
  const { data } = await client.post('/reviews', {
    usuario_id: usuarioId,
    reserva_id: reservaId,
    rating,
    comentario: comentario?.trim() || null,
  })
  return data
}

/** Resumen (promedio + cantidad) de TODOS los profesionales. */
export async function getResumenResenas() {
  const { data } = await client.get('/reviews/resumen')
  return data
}

/** Últimas reseñas + resumen de un profesional, por email. */
export async function getResenasProfesional(email, limit = 10) {
  const { data } = await client.get(`/reviews/profesional/${encodeURIComponent(email)}`, {
    params: { limit },
  })
  return data
}

/** Reseñas recientes (con comentario) para el carrusel. */
export async function getResenasCarrusel(limit = 12) {
  const { data } = await client.get('/reviews/carrusel', { params: { limit } })
  return data
}

/** ¿La reserva ya fue reseñada? */
export async function checkResenada(reservaId) {
  const { data } = await client.get('/reviews/check', { params: { reserva_id: reservaId } })
  return data
}
