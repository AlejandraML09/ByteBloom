import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from "../api/client"
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import "../css/vars.css"
import '../css/login.css'

export default function Login() {
  const navigate = useNavigate()

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)

  const isAdmin = role === 'admin' || role === 'secretario'

  function handleSetRole(r) {
    setRole(r)
    setEmail('')
    setPass('')
    setError(false)
  }

  async function doLogin() {
    try {
      setError(false)

      const res = await fetch(`${API_URL}/login`, {
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

      const rolesPanel = ['admin', 'secretario']
      const esPanel = rolesPanel.includes(role)
      if (esPanel && !rolesPanel.includes(data.rol)) {
        setError(true)
        setPass('')
        return
      }
      if (!esPanel && data.rol !== 'usuario') {
        setError(true)
        setPass('')
        return
      }

      const usuarioActivo = {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol
      }

      localStorage.setItem('usuario', JSON.stringify(usuarioActivo))

      navigate(rolesPanel.includes(data.rol) ? '/admin' : '/turnos')

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

          <div className="login-body">

            <div className="login-greeting">
              <h2>Bienvenido/a</h2>
              <p>Ingresá con tu cuenta</p>
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

            <div style={{ position: "relative", display: "flex", alignItems: "center" }} className="form-group">
              <label>Contraseña</label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Contraseña"
                value={pass}
                onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doLogin()}
                required
                style={{ width: "100%", padding: "8px", paddingRight: "45px", boxSizing: "border-box" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "18px",
                  padding: "0"
                }}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
            {!isAdmin && (
              <div className="forgot-hint">
                <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
              </div>
            )}
            
            <button className="btn-login" onClick={doLogin}>
              Ingresar
            </button>

            <div className="register-hint">
              <Link to="/registro">¿No tenés cuenta? Registrate</Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}