import { useEffect, useState } from 'react'
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

  useEffect(() => {
    getResenasCarrusel(12)
      .then((data) => setResenas(Array.isArray(data) ? data : []))
      .catch(() => setResenas([]))
      .finally(() => setLoading(false))
  }, [])

  if (loading || resenas.length === 0) return null

  // Duplicamos la lista para que el track pueda animar -50% en loop perfecto.
  const items = [...resenas, ...resenas]
  // Velocidad proporcional a la cantidad → ritmo constante con pocas o muchas.
  const duracion = `${resenas.length * 4.5}s`

  return (
    <div className='rc-section'>
      <div className='section-label'>Lo que dicen los pacientes</div>
      <h2 className='section-title'>Reseñas reales</h2>

      <div className='rc-marquee'>
        <div className='rc-track' style={{ animationDuration: duracion }}>
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
