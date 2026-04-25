import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/login.css'

const USUARIOS = {
  'paciente@endereza2.com': { pass: 'paciente123', role: 'usuario', nombre: 'Maria Gonzalez' },
  'admin@endereza2.com':    { pass: 'admin123',    role: 'admin',   nombre: 'Dr. Ramirez'   },
}

export default function Login() {
  const navigate = useNavigate()
  const [role, setRole] = useState('usuario')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const isAdmin = role === 'admin'

  function handleSetRole(r) {
    setRole(r)
    setEmail('')
    setPass('')
    setError(false)
  }

  function doLogin() {
    const user = USUARIOS[email.trim().toLowerCase()]
    if (!user || user.pass !== pass || user.role !== role) {
      setError(true)
      setPass('')
      return
    }
    setError(false)
    sessionStorage.setItem('ks_user', JSON.stringify({ email, role: user.role, nombre: user.nombre }))
    navigate(user.role === 'admin' ? '/admin' : '/turnos')
  }

  return (
    <>
      <Navbar />

      <div className="login-page">
        <div className="login-card" id="login-card">
          <div className="role-tabs">
            <button
              className={`role-tab${role === 'usuario' ? ' active-tab' : ''}`}
              onClick={() => handleSetRole('usuario')}
            >
              <div className="role-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              Paciente
            </button>
            <button
              className={`role-tab admin-tab${role === 'admin' ? ' active-tab' : ''}`}
              onClick={() => handleSetRole('admin')}
            >
              <div className="role-icon">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7C3DBF" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 2l3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z"/>
                </svg>
              </div>
              Administrador
            </button>
          </div>

          <div className={`login-body${isAdmin ? ' admin-mode' : ''}`}>
            <div className="login-greeting">
              <h2>{isAdmin ? 'Panel de administracion' : 'Bienvenido/a'}</h2>
              <p>{isAdmin ? 'Acceso restringido al equipo de Endereza2' : 'Ingresá con tu cuenta de paciente'}</p>
            </div>

            {error && <div className="error-msg show">Usuario o contraseña incorrectos.</div>}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
              />
            </div>

            <a className="forgot" href="#">¿Olvidaste tu contraseña?</a>
            <button className="btn-login" onClick={doLogin}>Ingresar</button>

            <div className="demo-hint">
              {isAdmin ? (
                <><strong>Demo Admin:</strong><br />Email: <strong>admin@endereza2.com</strong><br />Contraseña: <strong>admin123</strong></>
              ) : (
                <><strong>Demo — Paciente:</strong><br />Email: <strong>paciente@endereza2.com</strong><br />Contraseña: <strong>paciente123</strong></>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
