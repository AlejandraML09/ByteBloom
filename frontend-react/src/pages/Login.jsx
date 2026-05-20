import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import client from '../api/client'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/vars.css'
import '../css/login.css'

export default function Login() {
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [error, setError] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [cargando, setCargando] = useState(false)

  async function doLogin() {
    try {
      setError(false)
      setCargando(true)

      const response = await client.post('/login', {
        email: email.trim().toLowerCase(),
        password: pass,
      })

      const data = response.data

      console.log('Response completo:', data)

      const usuarioActivo = {
        id: data.id,
        email: data.email,
        nombre: data.nombre,
        apellido: data.apellido,
        rol: data.rol,
        dni: data.dni,
        fecha_nacimiento: data.fecha_nacimiento,
      }
      localStorage.setItem('usuario', JSON.stringify(usuarioActivo))

      navigate(data.rol === 'admin' || data.rol === 'secretario' ? '/admin' : '/')
    } catch (err) {
      console.error('Error completo:', err)
      setError(true)
      setPass('')
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <Navbar />

      <div className='login-page'>
        <div className='login-card' id='login-card'>
          <div className='login-body'>
            <div className='login-greeting'>
              <h2>Bienvenido/a</h2>
              <p>Ingresá con tu cuenta</p>
            </div>
            {error && <div className='error-msg show'>Usuario o contraseña incorrectos.</div>}
            <div className='form-group'>
              <label>Email</label>
              <input
                type='email'
                placeholder='tu@email.com'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              className='form-group'
            >
              <label>Contraseña</label>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder='Contraseña'
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                required
                style={{
                  width: '100%',
                  padding: '8px',
                  paddingRight: '45px',
                  boxSizing: 'border-box',
                }}
              />
              <button
                type='button'
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            <div className='forgot-hint'>
              <Link to='/recuperar-contrasena'>¿Olvidaste tu contraseña?</Link>
            </div>
            <button className='btn-login' onClick={doLogin}>
              Ingresar
            </button>

            <div className='register-hint'>
              <Link to='/registro'>¿No tenés cuenta? Registrate</Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
