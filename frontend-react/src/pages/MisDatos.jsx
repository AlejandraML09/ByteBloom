import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import client from '../api/client'
import '../css/login.css'

export default function MisDatos() {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const [editando, setEditando] = useState(false)

  const [nombre, setNombre] = useState(usuario.nombre || '')
  const [apellido, setApellido] = useState(usuario.apellido || '')
  const [dni, setDni] = useState(usuario.dni || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(usuario.fecha_nacimiento || '')

  const [cambiarPassword, setCambiarPassword] = useState(false)
  const [passwordActual, setPasswordActual] = useState('')
  const [passwordNueva, setPasswordNueva] = useState('')
  const [passwordConfirmar, setPasswordConfirmar] = useState('')

  const [exito, setExito] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const [showPasswordActual, setShowPasswordActual] = useState(false)
  const [showPasswordNueva, setShowPasswordNueva] = useState(false)
  const [showPasswordConfirmar, setShowPasswordConfirmar] = useState(false)

  const formularioCompleto = nombre.trim() && apellido.trim() && fechaNacimiento
  //funcion para validar que la contraseña cumpla con el formato
  const passwordValida = (pwd) =>
  pwd.length >= 8 &&
  /[A-Z]/.test(pwd) &&
  /[a-z]/.test(pwd) &&
  /\d/.test(pwd)
  function handleCancelar() {
    const u = JSON.parse(localStorage.getItem('usuario') || '{}')
    setNombre(u.nombre || '')
    setApellido(u.apellido || '')
    setDni(u.dni || '')
    setFechaNacimiento(u.fecha_nacimiento || '')
    setError('')
    setExito('')
    setEditando(false)
    setCambiarPassword(false)
    setPasswordActual('')
    setPasswordNueva('')
    setPasswordConfirmar('')
  }

  async function handleGuardar() {
    setExito('')
    setError('')

    if (!nombre.trim()) {
      setError('El nombre es un campo obligatorio.')
      return
    }
    if (!apellido.trim()) {
      setError('El apellido es un campo obligatorio.')
      return
    }
    if (dni && String(dni).length < 7) {
      setError('El DNI debe tener al menos 7 dígitos.')
      return
    }
    if (fechaNacimiento) {
      const hoy = new Date()
      const nacimiento = new Date(fechaNacimiento)
      const edad = hoy.getFullYear() - nacimiento.getFullYear()
      const cumplioEsteAnio = hoy >= new Date(nacimiento.setFullYear(hoy.getFullYear()))
      const edadReal = cumplioEsteAnio ? edad : edad - 1
      if (edadReal < 14) {
        setError('El usuario debe tener al menos 14 años.')
        return
      }
    }
    if (cambiarPassword) {
      if (!passwordActual || !passwordNueva || !passwordConfirmar) {
        setError('Completá todos los campos de contraseña.')
        return
      }
      if (!passwordValida(passwordNueva)) {
        setError('La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número.')
        return
      }
      if (passwordNueva !== passwordConfirmar) {
        setError('Las contraseñas nuevas no coinciden.')
        return
      }
    }

    setCargando(true)
    try {
      await client.put('/usuarios/me', {
        usuario_id: usuario.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: parseInt(dni),
        fecha_nacimiento: fechaNacimiento,
        password_actual: cambiarPassword ? passwordActual : undefined,
        password_nueva: cambiarPassword ? passwordNueva : undefined,
      })

      const actualizado = {
        ...usuario,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: parseInt(dni),
        fecha_nacimiento: fechaNacimiento,
      }
      localStorage.setItem('usuario', JSON.stringify(actualizado))

      setExito('¡Modificación exitosa!')
      setCambiarPassword(false)
      setPasswordActual('')
      setPasswordNueva('')
      setPasswordConfirmar('')
      setEditando(false)
    } catch (err) {
      const detalle = err.response?.data?.detail
      setError(detalle || 'Ocurrió un error. Intentá de nuevo.')
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

            <div className='login-greeting'>
              <h2>Mis datos</h2>
              <p>{editando ? 'Editá tu información personal.' : 'Tu información personal.'}</p>
            </div>

            {error && <div className='error-msg show'>{error}</div>}
            {exito && (
              <div
                className='error-msg show'
                style={{
                  backgroundColor: 'var(--success-tint)',
                  color: 'var(--success-text)',
                  borderColor: 'var(--success-tint)',
                }}
              >
                {exito}
              </div>
            )}

            {/* MODO VER */}
            {!editando && (
              <>
                <div className='form-group'>
                  <label>Nombre</label>
                  <p className='dato-valor'>{nombre || <span className='dato-vacio'>—</span>}</p>
                </div>
                <div className='form-group'>
                  <label>Apellido</label>
                  <p className='dato-valor'>{apellido || <span className='dato-vacio'>—</span>}</p>
                </div>
                <div className='form-group'>
                  <label>DNI</label>
                  <p className='dato-valor'>{dni || <span className='dato-vacio'>—</span>}</p>
                </div>
                <div className='form-group'>
                  <label>Fecha de nacimiento</label>
                  <p className='dato-valor'>
                    {fechaNacimiento
                      ? new Date(fechaNacimiento + 'T00:00:00').toLocaleDateString('es-AR')
                      : <span className='dato-vacio'>—</span>}
                  </p>
                </div>
                <div className='form-group'>
                  <label>Email</label>
                  <p className='dato-valor'>{usuario.email || <span className='dato-vacio'>—</span>}</p>
                </div>
                <button className='btn-login' onClick={() => { setExito(''); setError(''); setEditando(true) }}>
                  Editar datos
                </button>
              </>
            )}

            {/* MODO EDITAR */}
            {editando && (
              <>
                <div className='form-group'>
                  <label>Nombre</label>
                  <input type='text' value={nombre} onChange={(e) => setNombre(e.target.value)} />
                </div>
                <div className='form-group'>
                  <label>Apellido</label>
                  <input type='text' value={apellido} onChange={(e) => setApellido(e.target.value)} />
                </div>
                <div className='form-group'>
                  <label>DNI</label>
                  <input type='number' value={dni} onChange={(e) => setDni(e.target.value)} />
                </div>
                <div className='form-group'>
                  <label>Fecha de nacimiento</label>
                  <input
                    type='date'
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                  />
                </div>
                <div className='form-group'>
                  <label>Email</label>
                  <input
                    type='email'
                    value={usuario.email || ''}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                </div>

                {/* CAMBIAR CONTRASEÑA */}
                <div className='form-group'>
                  <label
                    onClick={() => {
                      setCambiarPassword(!cambiarPassword)
                      setPasswordActual('')
                      setPasswordNueva('')
                      setPasswordConfirmar('')
                    }}
                    style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }}
                  >
                    {cambiarPassword ? '✕ Cancelar cambio de contraseña' : '+ Cambiar contraseña'}
                  </label>
                </div>

                {cambiarPassword && (
                  <>
                    <div className='form-group'>
                      <label>Contraseña actual</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswordActual ? 'text' : 'password'}
                          value={passwordActual}
                          onChange={(e) => setPasswordActual(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                        />
                        <button type='button' onClick={() => setShowPasswordActual(!showPasswordActual)}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }}>
                          {showPasswordActual ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className='form-group'>
                      <label>Nueva contraseña</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswordNueva ? 'text' : 'password'}
                          value={passwordNueva}
                          onChange={(e) => setPasswordNueva(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                        />
                        <button type='button' onClick={() => setShowPasswordNueva(!showPasswordNueva)}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }}>
                          {showPasswordNueva ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>

                    <div className='form-group'>
                      <label>Confirmar nueva contraseña</label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type={showPasswordConfirmar ? 'text' : 'password'}
                          value={passwordConfirmar}
                          onChange={(e) => setPasswordConfirmar(e.target.value)}
                          style={{ width: '100%', boxSizing: 'border-box', paddingRight: '36px' }}
                        />
                        <button type='button' onClick={() => setShowPasswordConfirmar(!showPasswordConfirmar)}
                          style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', padding: '0' }}>
                          {showPasswordConfirmar ? '👁️' : '👁️‍🗨️'}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <button
                  className='btn-login'
                  onClick={handleGuardar}
                  disabled={cargando || !formularioCompleto}
                  style={{
                    opacity: formularioCompleto ? 1 : 0.5,
                    cursor: formularioCompleto ? 'pointer' : 'not-allowed',
                  }}
                >
                  {cargando ? 'Guardando...' : 'Guardar cambios'}
                </button>

                <button
                  className='back-btn'
                  style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}
                  onClick={handleCancelar}
                >
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}