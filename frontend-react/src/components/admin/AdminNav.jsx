import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'

// Ícono de perfil SVG (mismo que Navbar usuario)
function UserIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function AdminNav({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sidebarRef = useRef(null)

  const nombreCompleto = [user?.nombre, user?.apellido].filter(Boolean).join(' ') || user?.email || 'Administrador'

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target)) {
        setSidebarOpen(false)
      }
    }
    if (sidebarOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [sidebarOpen])

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [sidebarOpen])

  return (
    <>
      <nav className="admin-nav">
        <Link to="/" className="admin-nav-logo">
          <div className="admin-nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
            </svg>
          </div>
          <span className="admin-nav-logo-name">Endereza2</span>
        </Link>

        <span className="nav-badge">Panel Admin</span>

        {/* Ícono de perfil — reemplaza avatar + botón cerrar sesión */}
        <div className="nav-right">
          <button
            className="admin-profile-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú de administrador"
            title="Ver perfil"
          >
            <UserIcon />
          </button>
        </div>
      </nav>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral admin */}
      <aside
        ref={sidebarRef}
        className={`user-sidebar${sidebarOpen ? ' user-sidebar--open' : ''}`}
        aria-label="Menú de administrador"
      >
        {/* Header */}
        <div className="user-sidebar__header">
          <div className="user-sidebar__avatar admin-sidebar-avatar">
            <UserIcon />
          </div>
          <div className="user-sidebar__info">
            <span className="user-sidebar__name">{nombreCompleto}</span>
            {user?.email && (
              <span className="user-sidebar__email">{user.email}</span>
            )}
            <span className="admin-sidebar-badge">Administrador</span>
          </div>
          <button
            className="user-sidebar__close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="user-sidebar__divider" />

        {/* Ítems */}
        <nav className="user-sidebar__nav">
          <ul>
            <li className="user-sidebar__item">
              <span className="user-sidebar__item-icon">👤</span>
              <span>Mis datos</span>
            </li>
          </ul>
        </nav>

        <div className="user-sidebar__divider" />

        {/* Cerrar sesión */}
        <button
          className="user-sidebar__logout"
          onClick={() => { setSidebarOpen(false); onLogout() }}
        >
          <LogoutIcon />
          <span>Cerrar sesión</span>
        </button>
      </aside>
    </>
  )
}
