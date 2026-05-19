import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { NAV_LINKS } from '../constants/nav'
import '../css/navbar.css'
import logo from '../assets/fulllogo_slogan_sinfondo.png'

// Ícono de perfil SVG
export function UserIcon() {
  return (
    <svg
      width='22'
      height='22'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='8' r='4' />
      <path d='M4 20c0-4 3.6-7 8-7s8 3 8 7' />
    </svg>
  )
}

// Ícono X para cerrar
function CloseIcon() {
  return (
    <svg
      width='20'
      height='20'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
    >
      <line x1='18' y1='6' x2='6' y2='18' />
      <line x1='6' y1='6' x2='18' y2='18' />
    </svg>
  )
}

// Ícono logout
function LogoutIcon() {
  return (
    <svg
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4' />
      <polyline points='16 17 21 12 16 7' />
      <line x1='21' y1='12' x2='9' y2='12' />
    </svg>
  )
}

export default function Navbar() {
  const [open, setOpen] = useState(false) // menú hamburguesa mobile
  const [sidebarOpen, setSidebarOpen] = useState(false) // panel lateral de usuario
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const sidebarRef = useRef(null)

  const getUsuario = () => {
    const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  const usuario = getUsuario()

  const logout = () => {
    localStorage.removeItem('usuario')
    localStorage.removeItem('ks_user')
    setSidebarOpen(false)
    navigate('/login')
  }

  const isActive = (to) => {
    if (to === '/') return pathname === '/'
    return pathname.startsWith(to)
  }

  // Cerrar sidebar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  // Bloquear scroll del body cuando el sidebar está abierto
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const nombreCompleto = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email
    : ''

  return (
    <>
      <nav className='main-nav'>
        <Link to='/' className='nav-logo'>
          <div className='nav-logo-icon'>
            <img src={logo} alt='Logo' className='w-[18px] h-[18px] object-contain' />
          </div>
        </Link>

        <ul className='nav-links'>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to} className={isActive(to) ? 'active' : ''}>
              <Link to={to}>{label}</Link>
            </li>
          ))}
        </ul>

        {usuario ? (
          <div className='nav-user-container'>
            <button
              className='user-avatar user-avatar--icon'
              title='Ver perfil'
              onClick={() => setSidebarOpen(true)}
              aria-label='Abrir menú de usuario'
            >
              <UserIcon />
            </button>
          </div>
        ) : (
            <div className='nav-auth-buttons'>
              <Link to='/registro' className='btn-registro-nav'>
                Registrarse
              </Link>
              <Link to='/login' className='btn-login-nav'>
                Iniciar sesión
              </Link>
            </div>
          )}

        <button
          className={`nav-hamburger${open ? ' open' : ''}`}
          aria-label='Menú'
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </nav>

      {/* Menú mobile */}
      <nav className={`mobile-menu${open ? ' open' : ''}`}>
        <ul>
          {NAV_LINKS.map(({ to, label }) => (
            <li key={to} className={isActive(to) ? 'active' : ''}>
              <Link to={to} onClick={() => setOpen(false)}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
        {usuario ? (
          <div className='mobile-user-menu'>
            <button
              className='user-avatar mobile-avatar user-avatar--icon'
              title='Ver perfil'
              onClick={() => {
                setOpen(false)
                setSidebarOpen(true)
              }}
              aria-label='Abrir menú de usuario'
            >
              <UserIcon />
            </button>
          </div>
        ) : (
          <div className='nav-auth-buttons' style={{ alignSelf: 'flex-start' }}>
            <Link
              to='/registro'
              className='btn-registro-nav'
              onClick={() => setOpen(false)}
            >
              Registrarse
            </Link>
            <Link
              to='/login'
              className='btn-login-nav'
              onClick={() => setOpen(false)}
            >
              Iniciar sesión
            </Link>
          </div>
        )}
      </nav>

      {/* Overlay oscuro */}
      {sidebarOpen && (
        <div className='sidebar-overlay' onClick={() => setSidebarOpen(false)} aria-hidden='true' />
      )}

      {/* Panel lateral de usuario */}
      <aside
        ref={sidebarRef}
        className={`user-sidebar${sidebarOpen ? ' user-sidebar--open' : ''}`}
        aria-label='Menú de usuario'
      >
        {/* Header del panel */}
        <div className='user-sidebar__header'>
          <div className='user-sidebar__avatar'>
            <UserIcon />
          </div>
          <div className='user-sidebar__info'>
            <span className='user-sidebar__name'>{nombreCompleto}</span>
            {usuario?.email && <span className='user-sidebar__email'>{usuario.email}</span>}
          </div>
          <button
            className='user-sidebar__close'
            onClick={() => setSidebarOpen(false)}
            aria-label='Cerrar menú'
          >
            <CloseIcon />
          </button>
        </div>

        <div className='user-sidebar__divider' />

        {/* Ítems del menú */}
        <nav className='user-sidebar__nav'>
          <ul>
            <li className='user-sidebar__item'>
              <Link
                to='/mis-reservas'
                className='user-sidebar__item-link'
                onClick={() => setSidebarOpen(false)}
              >
                <span className='user-sidebar__item-icon'>📅</span>
                <span>Mis reservas</span>
              </Link>
            </li>
            <li className='user-sidebar__item'>
              <span className='user-sidebar__item-icon'>💳</span>
              <span>Mis créditos</span>
            </li>
            <li className='user-sidebar__item'>
            <Link
              to='/mis-datos'
              className='user-sidebar__item-link'
              onClick={() => setSidebarOpen(false)}
            >
              <span className='user-sidebar__item-icon'>👤</span>
              <span>Mis datos</span>
            </Link>
          </li>
          </ul>
        </nav>

        <div className='user-sidebar__divider' />

        {/* Botón cerrar sesión */}
        <button className='user-sidebar__logout' onClick={logout}>
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </button>
      </aside>
    </>
  )
}
