import { useState } from 'react'
import { Link } from 'react-router-dom'
import { recuperarPassword } from '../api/auth'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit() {
    if (!email.trim()) return

    setCargando(true)
    try {
      setError('')
      await recuperarPassword(email)
      setEnviado(true)
    } catch (err) {
      const detalle = err.response?.data?.detail
      if (detalle === 'Email no registrado') {
        setError('El mail ingresado no está registrado en el sistema.')
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
            <button className='back-btn' onClick={() => window.history.back()}>
              ← Volver
            </button>

            {!enviado ? (
              <>
                <div className='login-greeting'>
                  <h2>Recuperá tu cuenta</h2>
                  <p>Ingresá tu email y te enviamos un enlace para restablecer tu contraseña.</p>
                </div>

                {error && <div className='error-msg show'>{error}</div>}

                <div className='form-group'>
                  <label>Email</label>
                  <input
                    type='email'
                    placeholder='tu@email.com'
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  />
                </div>

                <button className='btn-login' onClick={handleSubmit} disabled={cargando}>
                  {cargando ? 'Enviando...' : 'Continuar'}
                </button>

                <div className='register-hint'>
                  <Link to='/login'>¿Ya recordaste tu contraseña? Iniciá sesión</Link>
                </div>
              </>
            ) : (
              <div className='recuperar-ok'>
                <div className='recuperar-ok-icon'>✓</div>
                <h2>¡Revisá tu correo!</h2>
                <p>Si el email está registrado, vas a recibir un enlace para restablecer tu contraseña.</p>
                <Link
                  to='/login'
                  className='btn-login'
                  style={{ display: 'block', textAlign: 'center', textDecoration: 'none', marginTop: '1.5rem' }}
                >
                  Volver al inicio de sesión
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