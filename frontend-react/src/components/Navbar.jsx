import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import '../css/navbar.css'

const LINKS = [
  { to: '/', label: 'Inicio' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/profesionales', label: 'Profesionales' },
  { to: '/turnos', label: 'Turnos' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  return (
    <>
      <nav className="main-nav">
        <Link to="/" className="nav-logo">
          <div className="nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
            </svg>
          </div>
          <span className="nav-logo-name">Empresa</span>
        </Link>

        <ul className="nav-links">
          {LINKS.map(({ to, label }) => (
            <li key={to} className={isActive(to) ? 'active' : ''}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>

        <Link to="/login" className="btn-login-nav">Iniciar sesión</Link>

        <button
          className={`nav-hamburger${open ? ' open' : ''}`}
          aria-label="Menú"
          onClick={() => setOpen(o => !o)}
        >
          <span/><span/><span/>
        </button>
      </nav>

      <nav className={`mobile-menu${open ? ' open' : ''}`}>
        <ul>
          {LINKS.map(({ to, label }) => (
            <li key={to} className={isActive(to) ? 'active' : ''}>
              <Link to={to} onClick={() => setOpen(false)}>{label}</Link>
            </li>
          ))}
        </ul>
        <Link to="/login" className="btn-login-nav" style={{ alignSelf: 'flex-start' }} onClick={() => setOpen(false)}>
          Iniciar sesión
        </Link>
      </nav>
    </>
  )
}
