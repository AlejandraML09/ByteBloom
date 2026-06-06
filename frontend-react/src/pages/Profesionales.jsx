import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { StatsStrip } from '../components/profesionales/StatsStrip'
import { RatingStars } from '../components/reviews/RatingStars'
import { ReviewsCarousel } from '../components/reviews/ReviewsCarousel'
import { profesionales } from '../constants/profesionales'
import { getResumenResenas } from '../api/reviews'
import '../css/profesionales.css'

export default function Profesionales() {
  // Resumen dinámico de puntuación por email: { [email]: { promedio, cantidad } }
  const [resumen, setResumen] = useState({})

  useEffect(() => {
    getResumenResenas()
      .then((data) => {
        const map = {}
        for (const item of data) {
          map[item.profesional_email] = {
            promedio: item.promedio,
            cantidad: item.cantidad,
          }
        }
        setResumen(map)
      })
      .catch(() => setResumen({}))
  }, [])

  return (
    <>
      <Navbar />

      <div className='page-hero'>
        <div className='page-hero-badge'>Nuestro equipo</div>
        <h1>
          Profesionales <span>especializados</span>
          <br />a tu servicio
        </h1>
        <p>
          Cada kinesiólogo de nuestro equipo cuenta con formación universitaria, especialización
          clínica y años de experiencia acompañando la recuperación de nuestros pacientes.
        </p>
      </div>

      <StatsStrip />

      {/* Grilla de profesionales */}
      <div className='section-wrap'>
        <div className='section-label'>Conocé al equipo</div>
        <h2 className='section-title'>Quiénes nos cuidan</h2>

        <div className="prof-grid">
          {profesionales.map(({ initials, name, title, tags, bio, image, email }) => {
            const r = resumen[email]
            const cantidad = r?.cantidad ?? 0
            const promedio = r?.promedio ?? 0
            return (
              <div className="prof-card" key={initials}>
                <div className="prof-photo-placeholder">
                  {image ? (
                    <img src={image} alt={name} className="prof-photo" />
                  ) : (
                    <div className="prof-initials">{initials}</div>
                  )}
                </div>
                <div className="prof-body">
                  <div className="prof-name">{name}</div>
                  <div className="prof-title">{title}</div>
                  <div className="prof-email">{email}</div>
                  <div className="prof-tags">
                    {tags.map((t) => (
                      <span className="prof-tag" key={t}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <p className="prof-bio">{bio}</p>

                  {/* Calificación dinámica */}
                  <div className="prof-rating">
                    {cantidad > 0 ? (
                      <>
                        <RatingStars value={promedio} size={18} />
                        <span className="prof-rating-num">{promedio.toFixed(1)}</span>
                        <span className="prof-rating-count">
                          ({cantidad} {cantidad === 1 ? 'reseña' : 'reseñas'})
                        </span>
                      </>
                    ) : (
                      <span className="prof-rating-empty">Sin reseñas todavía</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Carrusel de reseñas dinámico */}
      <ReviewsCarousel />

      <div className='cta-section'>
        <h2>¿Querés conocer a nuestro equipo en persona?</h2>
        <p>
          Reservá tu primera consulta sin cargo y encontrá al profesional ideal para tu recuperación
        </p>
        <Link to='/turnos' className='btn-cta'>
          Reservar turno →
        </Link>
      </div>

      <Footer />
    </>
  )
}
