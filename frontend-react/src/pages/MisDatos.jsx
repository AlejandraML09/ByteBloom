import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import client from '../api/client'
import '../css/login.css'

export default function MisDatos() {
  const navigate = useNavigate()
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const [nombre, setNombre] = useState(usuario.nombre || '')
  const [apellido, setApellido] = useState(usuario.apellido || '')
  const [dni, setDni] = useState(usuario.dni || '')
  const [fechaNacimiento, setFechaNacimiento] = useState(usuario.fecha_nacimiento || '')
  const [exito, setExito] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

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

    setCargando(true)
    try {
      await client.put('/usuarios/me', {
        usuario_id: usuario.id,
        nombre: nombre.trim(),
        apellido: apellido.trim(),
        dni: parseInt(dni),
        fecha_nacimiento: fechaNacimiento,
      })

      // actualizar localStorage
      const actualizado = { ...usuario, nombre: nombre.trim(), apellido: apellido.trim(), dni: parseInt(dni), fecha_nacimiento: fechaNacimiento }
      localStorage.setItem('usuario', JSON.stringify(actualizado))

      setExito('¡Modificación exitosa!')
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
              <p>Editá tu información personal.</p>
            </div>

            {error && <div className='error-msg show'>{error}</div>}
            {exito && <div className='error-msg show' style={{ backgroundColor: 'var(--success-tint)', color: 'var(--success-text)', borderColor: 'var(--success-tint)' }}>{exito}</div>}

            <div className='form-group'>
              <label>Nombre</label>
              <input
                type='text'
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
            </div>

            <div className='form-group'>
              <label>Apellido</label>
              <input
                type='text'
                value={apellido}
                onChange={(e) => setApellido(e.target.value)}
              />
            </div>

            <div className='form-group'>
              <label>DNI</label>
              <input
                type='number'
                value={dni}
                onChange={(e) => setDni(e.target.value)}
              />
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

            <button className='btn-login' onClick={handleGuardar} disabled={cargando}>
              {cargando ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}