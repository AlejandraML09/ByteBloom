import { useEffect, useRef, useState } from 'react'
import { getResenasCarrusel } from '../../api/reviews'
import { RatingStars } from './RatingStars'
import { fmtLargo } from '../../utils/dates'

/** Carrusel dinámico de reseñas para el footer de la página de profesionales. */
export function ReviewsCarousel() {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    getResenasCarrusel(12)
      .then((data) => setResenas(Array.isArray(data) ? data : []))
      .catch(() => setResenas([]))
      .finally(() => setLoading(false))
  }, [])

  const total = resenas.length

  // Auto-avance cada 5s (se reinicia al interactuar)
  useEffect(() => {
    if (total <= 1) return undefined
    timer.current = setInterval(() => setIndex((i) => (i + 1) % total), 5000)
    return () => clearInterval(timer.current)
  }, [total, index])

  if (loading) return null
  if (total === 0) return null

  const go = (next) => setIndex(((next % total) + total) % total)

  return (
    <div className='rc-section'>
      <div className='section-label'>Lo que dicen los pacientes</div>
      <h2 className='section-title'>Reseñas reales</h2>

      <div className='rc-viewport'>
        <button
          className='rc-arrow rc-arrow--prev'
          onClick={() => go(index - 1)}
          aria-label='Anterior'
        >
          ‹
        </button>

        <div className='rc-track' style={{ transform: `translateX(-${index * 100}%)` }}>
          {resenas.map((r) => (
            <div className='rc-slide' key={r.id}>
              <div className='rc-card'>
                <RatingStars value={r.rating} size={20} />
                <p className='rc-comment'>“{r.comentario}”</p>
                <div className='rc-meta'>
                  <span className='rc-user'>{r.usuario_nombre}</span>
                  <span className='rc-prof'>sobre {r.profesional_nombre}</span>
                  {r.created_at && (
                    <span className='rc-date'>{fmtLargo(r.created_at.slice(0, 10))}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className='rc-arrow rc-arrow--next'
          onClick={() => go(index + 1)}
          aria-label='Siguiente'
        >
          ›
        </button>
      </div>

      <div className='rc-dots'>
        {resenas.map((r, i) => (
          <button
            key={r.id}
            className={`rc-dot${i === index ? ' active' : ''}`}
            onClick={() => go(i)}
            aria-label={`Ir a la reseña ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
