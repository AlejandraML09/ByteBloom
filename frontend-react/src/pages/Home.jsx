import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ServicesGrid } from '../components/home/ServicesGrid'
import '../css/home.css'

export default function Home() {
  return (
    <div className="home-page">
      <Navbar />

      {/* HeroSection */}
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
    {/* Grilla de servicios que se ofrecen en el centro, con íconos y breve descripción. */}
      <ServicesGrid />

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
            {/* <div>
              <div className="cta-phone-label">Llamanos</div>
              <div className="cta-phone">SACÁ TU TURNO</div>
            </div> */}
            <Link to="/turnos" className="btn-cta">Turno online →</Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}