import { useState } from 'react'
import '../../css/login.css'

const API_URL = import.meta.env.VITE_API_URL 

export function RegistrarClienteTab({ onToast }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
    fechaNacimiento: '', 
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)

  const fechaMaxima = (() => {   // ← acá
    const d = new Date()
    d.setFullYear(d.getFullYear() - 14)
    return d.toISOString().split('T')[0]
  })()
   const formularioCompleto =   // ← acá
    form.nombre.trim() &&
    form.apellido.trim() &&
    form.email.trim() &&
    form.dni &&
    form.fechaNacimiento
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setExito(false)
  }

  function validar() {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.'
    if (!form.apellido.trim()) return 'El apellido es obligatorio.'
    if (!form.email.trim()) return 'El email es obligatorio.'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) return 'El formato del email no es válido.'
    if (!/^\d{7,8}$/.test(form.dni)) return 'El DNI debe tener 7 u 8 dígitos.'
    if (!form.fechaNacimiento) return 'La fecha de nacimiento es obligatoria.'
    if (form.fechaNacimiento) {
      const hoy = new Date()
      const nacimiento = new Date(form.fechaNacimiento + 'T00:00:00')
      let edad = hoy.getFullYear() - nacimiento.getFullYear()
      const m = hoy.getMonth() - nacimiento.getMonth()
      if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--
      if (edad < 14) return 'El usuario debe tener al menos 14 años.'
    }
    return ''
  }

  async function handleSubmit() {
    const msg = validar()
    if (msg) { setError(msg); return }

    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/secretario/registrar-cliente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni ? parseInt(form.dni) : null,
          email: form.email.trim(),
          fecha_nacimiento: form.fechaNacimiento,
        }),
      })
      console.log(res)
      const data = await res.json().catch(() => ({}))
      console.log('status:', res.status)
      console.log('data:', data)
      if (!res.ok) {
        if (data.detail === 'Email ya registrado') {
          setError('Este email ya tiene una cuenta registrada.')
        } else if (data.detail === 'DNI ya registrado') {
          setError('Este DNI ya tiene una cuenta registrada.')
        } else {
          setError(data.detail || 'Ocurrió un error. Intentá de nuevo.')
        }
        return
      }

      setForm({ nombre: '', apellido: '', dni: '', email: '', fechaNacimiento: '' })
      setExito(true)
      onToast('Usuario registrado. Se envió la contraseña por mail.')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className='card' style={{ maxWidth: '560px', margin: '0 auto' }}>
      <div className='card-header'>
        <div>
          <h3>Registrar usuario</h3>
          <p>Se generará una contraseña automática y se enviará por mail</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '480px', margin: '0 auto' }}>
        {error && (
          <div className='error-msg show' style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {exito && (
          <div style={{ color: 'var(--p)', marginBottom: '1rem', fontWeight: 500 }}>
            ✓ Usuario registrado correctamente
          </div>
        )}

        <div className='form-group'>
          <label>Nombre</label>
          <input type='text' name='nombre' value={form.nombre} onChange={handleChange} placeholder='Juan' />
        </div>

        <div className='form-group'>
          <label>Apellido</label>
          <input type='text' name='apellido' value={form.apellido} onChange={handleChange} placeholder='Pérez' />
        </div>

        <div className='form-group'>
          <label>DNI</label>
          <input type='number' name='dni' value={form.dni} onChange={handleChange} placeholder='12345678' />
        </div>

        <div className='form-group'>
          <label>Email</label>
          <input type='email' name='email' value={form.email} onChange={handleChange} placeholder='juan@email.com' />
        </div>
        <div className='form-group'>
          <label>Fecha de nacimiento</label>
          <input
            type='date'
            name='fechaNacimiento'
            value={form.fechaNacimiento}
            onChange={handleChange}
            max={fechaMaxima}
          />
        </div>
        <button
          className='btn-nuevo'
          style={{
            marginTop: '0.5rem',
            opacity: formularioCompleto ? 1 : 0.5,
            cursor: formularioCompleto ? 'pointer' : 'not-allowed',
          }}
          onClick={handleSubmit}
          disabled={cargando || !formularioCompleto}
        >
          {cargando ? 'Registrando...' : 'Registrar usuario'}
        </button>
      </div>
    </div>
  )
}