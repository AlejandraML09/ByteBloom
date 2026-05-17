import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RecuperarContrasena() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)
  const [error, setError] = useState(false)

  async function handleSubmit() {
    if (!email.trim()) return

    try {
      setError(false)
      // TODO: conectar con el backend
      setEnviado(true)
    } catch {
      setError(true)
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

                {error && <div className='error-msg show'>Ocurrió un error. Intentá de nuevo.</div>}

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

                <button className='btn-login' onClick={handleSubmit}>
                  Continuar
                </button>

                <div className='register-hint'>
                  <Link to='/login'>¿Ya recordaste tu contraseña? Iniciá sesión</Link>
                </div>
              </>
            ) : (
              <div className='recuperar-ok'>
                <div className='recuperar-ok-icon'>✓</div>
                <h2>¡Revisá tu correo!</h2>
                <p>
                  Si el email está registrado, vas a recibir un enlace para restablecer tu
                  contraseña.
                </p>
                <Link
                  to='/login'
                  className='btn-login'
                  style={{
                    display: 'block',
                    textAlign: 'center',
                    textDecoration: 'none',
                    marginTop: '1.5rem',
                  }}
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
