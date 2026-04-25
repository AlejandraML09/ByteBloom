import { Link } from 'react-router-dom'
import { initials } from '../../utils/strings'

export function AdminNav({ user, onLogout }) {
  return (
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
      <div className="nav-right">
        <div className="nav-user">
          <div className="nav-avatar">{initials(user.nombre)}</div>
          <span>{user.nombre}</span>
        </div>
        <button className="btn-logout" onClick={onLogout}>Cerrar sesión</button>
      </div>
    </nav>
  )
}
