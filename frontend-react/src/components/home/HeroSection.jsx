import { Link } from 'react-router-dom'

export function HeroSection() {
  return (
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
  )
}
