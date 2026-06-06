import { useState } from 'react'
import { crearResena, contarPalabras, MAX_PALABRAS_RESENA } from '../../api/reviews'
import { fmtLargo } from '../../utils/dates'
import { ZONA_LABELS } from '../../constants/turnos'
import { profesionales } from '../../constants/profesionales'

/** Iniciales a partir de un nombre completo, ej. "Marcela Ríos" → "MR". */
function inicialesDe(nombre) {
  if (!nombre) return '?'
  return nombre
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

/**
 * Modal para dejar una reseña sobre una reserva ya asistida.
 * @param {{ reserva: object, usuarioId: number, onClose: () => void, onSuccess: (reservaId:number) => void }} props
 */
export function ReviewModal({ reserva, usuarioId, onClose, onSuccess }) {
  // Datos descriptivos del profesional (foto/especialidad/nombre con título)
  // desde el constant, cruzando por email; el nombre del backend es el fallback.
  const profMeta = profesionales.find((p) => p.email === reserva.profesional_email)
  const profNombre = profMeta?.name || reserva.profesional_nombre || 'Profesional'
  const profEspecialidad = profMeta?.title
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comentario, setComentario] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const palabras = contarPalabras(comentario)
  const excedido = palabras > MAX_PALABRAS_RESENA
  const canSave = rating >= 1 && rating <= 5 && !excedido && !guardando

  async function handleGuardar() {
    if (!canSave) return
    setGuardando(true)
    setError(null)
    try {
      await crearResena({ usuarioId, reservaId: reserva.id, rating, comentario })
      onSuccess(reserva.id)
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo guardar la reseña.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className='ma-modal-overlay' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='ma-modal'>
        <div className='ma-modal-header'>
          <div>
            <div className='ma-modal-title'>Dejar reseña</div>
            <div className='ma-modal-subtitle'>
              {ZONA_LABELS[reserva.zona] ?? reserva.zona} · {fmtLargo(reserva.fecha)} · {reserva.hora}
            </div>
          </div>
          <button className='ma-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='ma-modal-body'>
          {/* Profesional que se está reseñando */}
          <div className='rv-prof-card'>
            <div className='rv-prof-avatar'>
              {profMeta?.image ? (
                <img src={profMeta.image} alt={profNombre} />
              ) : (
                <span>{inicialesDe(reserva.profesional_nombre || profNombre)}</span>
              )}
            </div>
            <div className='rv-prof-info'>
              <span className='rv-prof-label'>Estás reseñando a</span>
              <span className='rv-prof-name'>{profNombre}</span>
              {profEspecialidad && <span className='rv-prof-spec'>{profEspecialidad}</span>}
            </div>
          </div>

          <div className='ma-modal-section-title'>¿Cómo calificarías la clase?</div>
          <div className='rv-stars' role='radiogroup' aria-label='Puntuación'>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type='button'
                className={`rv-star${(hover || rating) >= n ? ' active' : ''}`}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
                aria-checked={rating === n}
                role='radio'
              >
                ★
              </button>
            ))}
            {rating > 0 && <span className='rv-rating-num'>{rating}/5</span>}
          </div>

          <div className='ma-modal-section-title' style={{ marginTop: '1.25rem' }}>
            Comentario <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>(opcional)</span>
          </div>
          <textarea
            className='rv-textarea'
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder='Contanos cómo fue tu experiencia…'
            rows={4}
          />
          <div className={`rv-counter${excedido ? ' rv-counter--error' : ''}`}>
            {palabras}/{MAX_PALABRAS_RESENA} palabras
          </div>

          {error && <p className='ma-modal-error'>{error}</p>}
        </div>

        <div className='ma-modal-footer'>
          <button className='ma-modal-cancel' onClick={onClose} disabled={guardando}>
            Cancelar
          </button>
          <button className='ma-modal-save' onClick={handleGuardar} disabled={!canSave}>
            {guardando ? 'Guardando…' : 'Publicar reseña'}
          </button>
        </div>
      </div>
    </div>
  )
}
