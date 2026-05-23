import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import client from '../api/client'

const passwordValida = (pwd) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /\d/.test(pwd)
export default function RestablecerContrasena() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [listo, setListo] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmar, setShowConfirmar] = useState(false)

  async function handleSubmit() {
    if (!password || !confirmar) return
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.')
      return
    }
    if (!passwordValida(password)) {         
      setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
      return
    }
    setCargando(true)
    try {
      setError('')
      await client.post('/restablecer-password', { token, password })
      setListo(true)
    } catch (err) {
      const detalle = err.response?.data?.detail
      if (detalle === 'Token inválido o expirado') {
        setError('El enlace es inválido o ya expiró. Pedí uno nuevo.')
      } else {
        setError('Ocurrió un error. Intentá de nuevo.')
      }
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
            {!listo ? (
              <>
                <div className='login-greeting'>
                  <h2>Nueva contraseña</h2>
                  <p>Ingresá tu nueva contraseña.</p>
                </div>

                {error && <div className='error-msg show'>{error}</div>}

                <div className='form-group'>
                  <label>Nueva contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }}
                    >
                      {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <div className='form-group'>
                  <label>Confirmar contraseña</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmar ? 'text' : 'password'}
                      placeholder='••••••••'
                      value={confirmar}
                      onChange={(e) => setConfirmar(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                      style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                    />
                    <button
                      type='button'
                      onClick={() => setShowConfirmar(!showConfirmar)}
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }}
                    >
                      {showConfirmar ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                </div>

                <button className='btn-login' onClick={handleSubmit} disabled={cargando}>
                  {cargando ? 'Guardando...' : 'Guardar contraseña'}
                </button>
              </>
            ) : (
              <div className='recuperar-ok'>
                <div className='recuperar-ok-icon'>✓</div>
                <h2>¡Contraseña actualizada!</h2>
                <p>Ya podés iniciar sesión con tu nueva contraseña.</p>
                <Link
                  to='/login'
                  className='btn-login'
                  style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}
                >
                  Ir al inicio de sesión
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}