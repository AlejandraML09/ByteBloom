import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/home.css'

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <span className="hero-badge">Centro de kinesiología</span>
          <h1 className="hero-title">
            Movimiento,<br />
            <span>bienestar</span> y recuperación
          </h1>
          <p className="hero-desc">
            Tratamientos personalizados para recuperar tu calidad de vida.
            Nuestro equipo profesional te acompaña en cada etapa de tu rehabilitación.
          </p>
          <div className="hero-actions">
            <Link to="/turnos" className="btn-hero">Pedir turno online</Link>
            <Link to="/servicios" className="btn-outline">Ver servicios</Link>
          </div>
        </div>
        <div className="hero-stats">
          <div className="stat-card">
            <div className="stat-number">12+</div>
            <div className="stat-label">Años de experiencia</div>
          </div>
          <div className="stat-col">
            <div className="stat-card accent">
              <div className="stat-number">3000+</div>
              <div className="stat-label">Pacientes tratados</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      <section className="services" id="servicios">
        <h2 className="section-title">Nuestros servicios</h2>
        <p className="section-sub">Tratamientos especializados para cada necesidad</p>
        <div className="services-grid">
          <div className="service-card">
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/>
              </svg>
            </div>
            <div className="service-name">Rehabilitación</div>
            <div className="service-desc">Recuperación post-quirúrgica y lesiones deportivas</div>
          </div>
          <div className="service-card highlighted">
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
            <div className="service-name">Kinesiología deportiva</div>
            <div className="service-desc">Prevención y tratamiento de lesiones en atletas</div>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
              </svg>
            </div>
            <div className="service-name">Terapia manual</div>
            <div className="service-desc">Masoterapia, osteopatía y técnicas manuales</div>
          </div>
          <div className="service-card">
            <div className="service-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </div>
            <div className="service-name">Pilates terapéutico</div>
            <div className="service-desc">Fortalecimiento postural y control del movimiento</div>
          </div>
        </div>
      </section>

      <div className="cta-banner-wrap" id="contacto">
        <div className="cta-banner">
          <div>
            <h3 className="cta-title">Reservá tu turno hoy</h3>
            <p className="cta-info">
              Atención de lunes a sábado · 8:00 a 20:00 hs<br />
              Cobertura con las principales obras sociales
            </p>
          </div>
          <div className="cta-right">
            <div>
              <div className="cta-phone-label">Llamanos</div>
              <div className="cta-phone">0800-555-KINE</div>
            </div>
            <Link to="/turnos" className="btn-cta">Turno online →</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
