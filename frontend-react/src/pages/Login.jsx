import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/login.css'

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

  async function doLogin() {
    try {
      setError(false)

      const res = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: pass
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(true)
        setPass('')
        return
      }

      sessionStorage.setItem(
        'ks_user',
        JSON.stringify({
          id: data.id,
          email: data.email,
          role: data.role || 'usuario'
        })
      )

      navigate(data.role === 'admin' ? '/admin' : '/turnos')

    } catch (err) {
      setError(true)
      setPass('')
    }
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
              Paciente
            </button>

            <button
              className={`role-tab admin-tab${role === 'admin' ? ' active-tab' : ''}`}
              onClick={() => handleSetRole('admin')}
            >
              Administrador
            </button>
          </div>

          <div className={`login-body${isAdmin ? ' admin-mode' : ''}`}>

            <div className="login-greeting">
              <h2>{isAdmin ? 'Panel de administracion' : 'Bienvenido/a'}</h2>
              <p>{isAdmin ? 'Acceso admin' : 'Ingresá con tu cuenta'}</p>
            </div>

            {error && (
              <div className="error-msg show">
                Usuario o contraseña incorrectos.
              </div>
            )}

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                placeholder="••••••••"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
              />
            </div>

            <button className="btn-login" onClick={doLogin}>
              Ingresar
            </button>

          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}