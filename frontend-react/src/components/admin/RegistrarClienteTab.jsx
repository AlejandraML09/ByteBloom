import { useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function RegistrarClienteTab({ onToast }) {
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    email: '',
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [exito, setExito] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
    setExito(false)
  }

  function validar() {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.'
    if (!form.apellido.trim()) return 'El apellido es obligatorio.'
    if (!form.email.trim()) return 'El email es obligatorio.'
    return ''
  }

  async function handleSubmit() {
    const msg = validar()
    if (msg) { setError(msg); return }

    setCargando(true)
    try {
      const res = await fetch(`${API_URL}/secretario/registrar-paciente`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          apellido: form.apellido.trim(),
          dni: form.dni ? parseInt(form.dni) : null,
          email: form.email.trim(),
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (data.detail === 'Email ya registrado') {
          setError('Este email ya tiene una cuenta registrada.')
        } else {
          setError(data.detail || 'Ocurrió un error. Intentá de nuevo.')
        }
        return
      }

      setForm({ nombre: '', apellido: '', dni: '', email: '' })
      setExito(true)
      onToast('Paciente registrado. Se envió la contraseña por mail.')
    } catch {
      setError('No se pudo conectar con el servidor.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Registrar paciente</h3>
          <p>Se generará una contraseña automática y se enviará por mail</p>
        </div>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: '480px' }}>
        {error && (
          <div className='error-msg show' style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}
        {exito && (
          <div style={{ color: 'var(--p)', marginBottom: '1rem', fontWeight: 500 }}>
            ✓ Paciente registrado correctamente
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
          <label>DNI <span style={{ color: 'var(--gray-t)', fontWeight: 400 }}>(opcional)</span></label>
          <input type='number' name='dni' value={form.dni} onChange={handleChange} placeholder='12345678' />
        </div>

        <div className='form-group'>
          <label>Email</label>
          <input type='email' name='email' value={form.email} onChange={handleChange} placeholder='juan@email.com' />
        </div>

        <button
          className='btn-action'
          style={{ background: 'var(--p)', color: '#fff', borderColor: 'var(--p)', padding: '9px 22px', fontSize: '13px', marginTop: '0.5rem' }}
          onClick={handleSubmit}
          disabled={cargando}
        >
          {cargando ? 'Registrando...' : 'Registrar paciente'}
        </button>
      </div>
    </div>
  )
}