import { useEffect, useRef, useState } from 'react'
import { getResenasCarrusel } from '../../api/reviews'
import { RatingStars } from './RatingStars'

/**
 * Carrusel "marquee" infinito de reseñas para el footer de profesionales.
 * Se desplaza continuamente de derecha a izquierda (CSS puro, sin JS por frame)
 * duplicando la lista para lograr un loop sin cortes.
 */
export function ReviewsCarousel() {
  const [resenas, setResenas] = useState([])
  const [loading, setLoading] = useState(true)
  const [shiftIndex, setShiftIndex] = useState(0)
  const [cardStep, setCardStep] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const trackRef = useRef(null)
  const resumeTimeoutRef = useRef(null)

  useEffect(() => {
    getResenasCarrusel(12)
      .then((data) => setResenas(Array.isArray(data) ? data : []))
      .catch(() => setResenas([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!trackRef.current || resenas.length === 0) return

    const card = trackRef.current.querySelector('.rc-card')
    if (!card) return

    const gap = 20
    setCardStep(card.getBoundingClientRect().width + gap)
  }, [resenas.length])

  useEffect(() => {
    setShiftIndex(0)
    setIsPaused(false)

    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current)
    }
  }, [resenas.length])

  useEffect(() => {
    return () => {
      if (resumeTimeoutRef.current) {
        window.clearTimeout(resumeTimeoutRef.current)
      }
    }
  }, [])

  if (loading || resenas.length === 0) return null

  // Duplicamos la lista para que el track pueda animar -50% en loop perfecto.
  const items = [...resenas, ...resenas]
  // Velocidad proporcional a la cantidad → ritmo constante con pocas o muchas.
  const duracion = `${resenas.length * 4.5}s`

  const handleNavigate = (direction) => {
    if (resenas.length <= 1) return

    setIsPaused(true)
    setShiftIndex((prev) => (prev + direction + resenas.length) % resenas.length)

    if (resumeTimeoutRef.current) {
      window.clearTimeout(resumeTimeoutRef.current)
    }

    resumeTimeoutRef.current = window.setTimeout(() => {
      setIsPaused(false)
    }, 1600)
  }

  const trackStyle = {
    animationDuration: duracion,
    animationPlayState: isPaused ? 'paused' : 'running',
    ['--rc-offset']: `${-shiftIndex * cardStep}px`,
  }

  return (
    <div className='rc-section'>
      <div className='section-label'>Lo que dicen los pacientes</div>
      <h2 className='section-title'>Reseñas reales</h2>

      <div className='rc-marquee'>
        <div className='rc-nav' aria-label='Navegación del carrusel'>
          <button
            type='button'
            className='rc-nav-btn'
            onClick={() => handleNavigate(-1)}
            aria-label='Mostrar reseña anterior'
          >
            ‹
          </button>
          <button
            type='button'
            className='rc-nav-btn'
            onClick={() => handleNavigate(1)}
            aria-label='Mostrar reseña siguiente'
          >
            ›
          </button>
        </div>

        <div className='rc-track' ref={trackRef} style={trackStyle}>
          {items.map((r, i) => (
            <article className='rc-card' key={`${r.id}-${i}`} aria-hidden={i >= resenas.length}>
              <RatingStars value={r.rating} size={18} />
              <p className='rc-comment'>“{r.comentario}”</p>
              <div className='rc-meta'>
                <span className='rc-user'>{r.usuario_nombre}</span>
                <span className='rc-prof'>sobre {r.profesional_nombre}</span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  )
}
