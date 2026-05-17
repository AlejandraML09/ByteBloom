import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ServicesGrid } from '../components/home/ServicesGrid'
import '../css/home.css'

export default function Home() {
  return (
    <div className='home-page'>
      <Navbar />

      {/* HeroSection */}
      <section className='hero'>
        <img
          className='hero-bg'
          src='/969f4e13-cd07-47ae-b5d7-1dfc2160af0f.png'
          alt=''
          aria-hidden='true'
        />
        <div className='hero-content'>
          <span className='hero-badge'>Centro de kinesiología</span>
          <h1 className='hero-title'>
            Movimiento,
            <br />
            <span>bienestar y recuperación </span>
          </h1>
          <p className='hero-desc'>
            Tratamientos personalizados para recuperar tu calidad de vida. Nuestro equipo
            profesional te acompaña en cada etapa de tu rehabilitación.
          </p>
          <div className='hero-actions'>
            <Link to='/turnos' className='btn-hero'>
              Pedir turno online
            </Link>
            <Link to='/servicios' className='btn-outline'>
              Ver servicios
            </Link>
          </div>
        </div>
        <div className='hero-stats'>
          <div className='stat-card'>
            <div className='stat-number'>12+</div>
            <div className='stat-label'>Años de experiencia</div>
          </div>
          <div className='stat-col'>
            <div className='stat-card accent'>
              <div className='stat-number'>3000+</div>
              <div className='stat-label'>Pacientes tratados</div>
            </div>
            <div className='stat-card'>
              <div className='stat-number'>98%</div>
              <div className='stat-label'>Satisfacción</div>
            </div>
          </div>
        </div>
      </section>
      {/* Grilla de servicios que se ofrecen en el centro, con íconos y breve descripción. */}
      <ServicesGrid />

      <div className='cta-banner-wrap' id='contacto'>
        <div className='cta-banner'>
          <div className='cta-left'>
            <div className='cta-icon'>
              <svg
                width='26'
                height='26'
                viewBox='0 0 24 24'
                fill='none'
                stroke='white'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              >
                <rect x='3' y='4' width='18' height='18' rx='2' />
                <line x1='16' y1='2' x2='16' y2='6' />
                <line x1='8' y1='2' x2='8' y2='6' />
                <line x1='3' y1='10' x2='21' y2='10' />
              </svg>
            </div>
            <div>
              <h3 className='cta-title'>Reservá tu turno hoy</h3>
              <p className='cta-info'>
                Atención de lunes a sábado · 8:00 a 20:00 hs
                <br />
                Cobertura con las principales obras sociales
              </p>
            </div>
          </div>
          <div className='cta-right'>
            <Link to='/turnos' className='btn-cta'>
              Turno online →
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
