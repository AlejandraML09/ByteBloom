import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { StatsStrip } from '../components/profesionales/StatsStrip'
import { profesionales } from '../constants/profesionales'
import '../css/profesionales.css'

export default function Profesionales() {
  return (
    <>
      <Navbar />

      <div className="page-hero">
        <div className="page-hero-badge">Nuestro equipo</div>
        <h1>Profesionales <span>especializados</span><br />a tu servicio</h1>
        <p>Cada kinesiólogo de nuestro equipo cuenta con formación universitaria, especialización clínica y años de experiencia acompañando la recuperación de nuestros pacientes.</p>
      </div>

      <StatsStrip />

      {/* Grilla de profesionales */}
      <div className="section-wrap">
        <div className="section-label">Conocé al equipo</div>
        <h2 className="section-title">Quiénes nos cuidan</h2>

        <div className="prof-grid">
          {profesionales.map(({ initials, name, title, tags, bio, stars, reviews }) => (
            <div className="prof-card" key={initials}>
              <div className="prof-photo-placeholder">
                <div className="prof-initials">{initials}</div>
              </div>
              <div className="prof-body">
                <div className="prof-name">{name}</div>
                <div className="prof-title">{title}</div>
                <div className="prof-tags">
                  {tags.map(t => <span className="prof-tag" key={t}>{t}</span>)}
                </div>
                <p className="prof-bio">{bio}</p>
                <div className="reviews-title">
                  <span className="stars">{stars}</span> Reseñas de pacientes
                </div>
                {reviews.map((r, i) => (
                  <div className="review-item" key={i}>
                    <div className="review-text">{r.text}</div>
                    <div className="review-author">{r.author}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h2>¿Querés conocer a nuestro equipo en persona?</h2>
        <p>Reservá tu primera consulta sin cargo y encontrá al profesional ideal para tu recuperación</p>
        <Link to="/turnos" className="btn-cta">Reservar turno →</Link>
      </div>

      <Footer />
    </>
  )
}