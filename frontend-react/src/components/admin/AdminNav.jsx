import { useState, useRef, useEffect } from 'react'
import logo from '../../assets/fulllogo_slogan_sinfondo.png'
import SecretariosTab from './SecretariosTab'

// Ícono de perfil SVG (mismo que Navbar usuario)
function UserIcon() {
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

export function AdminNav({ user, activeTab, setActiveTab, visibleTabs, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef(null)

  const nombreCompleto =
    [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || 'Administrador'

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  return (
    <>
      <nav className='admin-nav'>
        <div className='admin-nav-logo'>
          <img src={logo} alt='Logo' style={{ height: '100px', width: '200px' }} />
        </div>

        <span className='nav-badge'>
          {user?.rol === 'secretario' ? 'Panel Secretario' : 'Panel Administrador'}
        </span>

        <div className='nav-right'>
          <button
            className='admin-profile-btn'
            onClick={() => setSidebarOpen(true)}
            aria-label='Abrir menú de administrador'
            title='Ver perfil'
          >
            <UserIcon />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {sidebarOpen && (
        <div className='sidebar-overlay' onClick={() => setSidebarOpen(false)} aria-hidden='true' />
      )}

      {/* Panel lateral admin */}
      <aside
        ref={sidebarRef}
        className={`user-sidebar${sidebarOpen ? ' user-sidebar--open' : ''}`}
        aria-label='Menú de administrador'
      >
        <div className='user-sidebar__header'>
          <div className='user-sidebar__avatar admin-sidebar-avatar'>
            <UserIcon />
          </div>
          <div className='user-sidebar__info'>
            <span className='user-sidebar__name'>{nombreCompleto}</span>
            {user?.email && <span className='user-sidebar__email'>{user.email}</span>}
            <span className='admin-sidebar-badge'>
              {user?.rol === 'secretario' ? 'Secretario' : 'Administrador'}
            </span>
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

        <nav className='user-sidebar__nav'>
          <ul>
            <li className='user-sidebar__item'>
              <span className='user-sidebar__item-icon'>👤</span>
              <span>Mis datos</span>
            </li>
          </ul>
        </nav>

        <div className='user-sidebar__divider' />

        <button
          className='user-sidebar__logout'
          onClick={() => {
            setSidebarOpen(false)
            onLogout()
          }}
        >
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </button>
      </aside>

      <div className="admin-content">
        <div className="admin-tabs">
          {visibleTabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="admin-tab-content">
          {/* El contenido se renderiza en Admin.jsx */}
        </div>
      </div>
    </>
  )
}
