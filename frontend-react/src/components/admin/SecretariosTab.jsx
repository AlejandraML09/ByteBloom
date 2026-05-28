import { useState, useEffect } from 'react'
import client from '../../api/client'

export default function SecretariosTab() {
  const [secretarios, setSecretarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [exito, setExito] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    fecha_nacimiento: '',
    password: '',
    dni: '',
  })
  const [showForm, setShowForm] = useState(false)
  const [emailBusqueda, setEmailBusqueda] = useState('')
  const [secretarioEncontrado, setSecretarioEncontrado] = useState(null)
  const [loadingBusqueda, setLoadingBusqueda] = useState(false)

  useEffect(() => {
    cargarSecretarios()
  }, [])

  async function cargarSecretarios() {
    try {
      const response = await client.get('/secretarios')
      setSecretarios(response.data)
    } catch (err) {
      setError('Error al cargar secretarios')
    }
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  async function handleCrearSecretario(e) {
    e.preventDefault()

    // ✅ VALIDAR EMAIL CON REGEX
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email.trim())) {
      setError('El formato del email no es válido.')
      return
    }

    // ✅ VALIDAR DNI (7 u 8 dígitos)
    const dniSinPuntos = form.dni.replace(/\./g, '')
    if (!/^\d{7,8}$/.test(dniSinPuntos)) {
      setError('El DNI debe tener 7 u 8 dígitos.')
      return
    }

    // ✅ VALIDAR EDAD (mayor de 18)
    const hoy = new Date()
    const nacimiento = new Date(form.fecha_nacimiento)
    let edad = hoy.getFullYear() - nacimiento.getFullYear()
    const mesActual = hoy.getMonth()
    const mesNacimiento = nacimiento.getMonth()
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && hoy.getDate() < nacimiento.getDate())) {
      edad--
    }
    
    if (edad < 18) {
      setError('El secretario debe ser mayor de 18 años.')
      return
    }

    setLoading(true)

    try {
      const response = await client.post('/api/usuarios/crear-secretario', {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        fecha_nacimiento: form.fecha_nacimiento,
        password: form.password,
        dni: form.dni,
      })

      setSecretarios([...secretarios, response.data])
      setForm({ nombre: '', apellido: '', email: '', fecha_nacimiento: '', password: '', dni: '' })
      setShowForm(false)
      setError('')
      setExito('✓ Secretario creado con éxito. Se le envió un email para reestablecer la contraseña')
      setTimeout(() => setExito(''), 5000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear secretario')
    } finally {
      setLoading(false)
    }
  }

  async function handleBuscarPorEmail(e) {
    e.preventDefault()
    setLoadingBusqueda(true)
    setSecretarioEncontrado(null)

    try {
      const secretario = secretarios.find((s) => s.email === emailBusqueda.toLowerCase())
      if (secretario) {
        setSecretarioEncontrado(secretario)
      } else {
        setError('Secretario no encontrado')
      }
    } catch (err) {
      setError('Error al buscar secretario')
    } finally {
      setLoadingBusqueda(false)
    }
  }

  async function handleEliminarSecretario() {
    if (!secretarioEncontrado) return
    
    if (confirm(`¿Estás seguro de que deseas eliminar a ${secretarioEncontrado.nombre} ${secretarioEncontrado.apellido}?`)) {
      try {
        await client.delete(`/secretarios/${secretarioEncontrado.id}`)
        setSecretarios(secretarios.filter((s) => s.id !== secretarioEncontrado.id))
        setSecretarioEncontrado(null)
        setEmailBusqueda('')
        setError('')
      } catch (err) {
        setError('Error al eliminar secretario')
        console.error('Error:', err)
      }
    }
  }

  const secretariosOrdenados = secretarios
    .filter(
      (s) =>
        s.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.apellido.localeCompare(b.apellido))

  return (
    <div className='tab-content'>
      <div className='tab-header'>
        <h2>Gestión de Secretarios</h2>
        <button
          className={`btn-nuevo ${showForm ? 'active' : ''}`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancelar' : '+ Nuevo Secretario'}
        </button>
      </div>

      {error && <div className='error-msg show'>{error}</div>}
      {exito && <div className='error-msg show' style={{ color: 'green' }}>{exito}</div>}

      {showForm && (
        <form onSubmit={handleCrearSecretario} className='form-nuevo'>
          <div className='form-row'>
            <div className='form-group'>
              <label>Nombre</label>
              <input
                type='text'
                name='nombre'
                placeholder='Juan'
                value={form.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className='form-group'>
              <label>Apellido</label>
              <input
                type='text'
                name='apellido'
                placeholder='Pérez'
                value={form.apellido}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className='form-group'>
            <label>Email</label>
            <input
              type='email'
              name='email'
              placeholder='secretario@email.com'
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className='form-group'>
            <label>Fecha de nacimiento</label>
            <input
              type='date'
              name='fecha_nacimiento'
              value={form.fecha_nacimiento}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className='form-group'>
            <label>DNI</label>
            <input
              type='text'
              name='dni'
              placeholder='12345678'
              value={form.dni}
              onChange={handleChange}
              required
            />
          </div>

          <button type='submit' disabled={loading} className='btn-nuevo btn-crear-form'>
            {loading ? 'Creando...' : 'Crear Secretario'}
          </button>
        </form>
      )}

      <div className='secretarios-list'>
        <h3>Secretarios Actuales</h3>

        {/* <div className='search-bar'>
          <input
            type='text'
            placeholder='Buscar por nombre, apellido o email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='search-input'
          />
        </div> */}

        {secretariosOrdenados.length === 0 ? (
          <p>
            {secretarios.length === 0
              ? 'No hay secretarios registrados.'
              : 'No se encontraron resultados.'}
          </p>
        ) : (
          <table className='data-table'>
            <thead>
              <tr>
                <th>Apellido</th>
                <th>Nombre</th>
                <th>Email</th>
              </tr>
            </thead>
            <tbody>
              {secretariosOrdenados.map((secretario) => (
                <tr key={secretario.id}>
                  <td>{secretario.apellido || '-'}</td>
                  <td>{secretario.nombre || '-'}</td>
                  <td>{secretario.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className='card' style={{ marginTop: '2rem' }}>
        <div className='card-header'>
          <h3>Eliminar Secretario</h3>
          <p>Ingresa el email del secretario que deseas eliminar.</p>
        </div>

        <form onSubmit={handleBuscarPorEmail} style={{ padding: '1.5rem' }}>
          <div className='form-group' style={{ marginBottom: '1rem' }}>
            <label>Email del Secretario</label>
            <input
              type='email'
              placeholder='secretario@email.com'
              value={emailBusqueda}
              onChange={(e) => {
                setEmailBusqueda(e.target.value)
                setSecretarioEncontrado(null)
                setError('')
              }}
              required
            />
          </div>

          <button type='submit' disabled={loadingBusqueda} className='btn-nuevo'>
            {loadingBusqueda ? 'Buscando...' : 'Buscar'}
          </button>
        </form>

        {secretarioEncontrado && (
          <div style={{ padding: '1.5rem', borderTop: '1px solid #ddd' }}>
            <div style={{ marginBottom: '1rem' }}>
              <p>
                <strong>Nombre:</strong> {secretarioEncontrado.nombre} {secretarioEncontrado.apellido}
              </p>
              <p>
                <strong>Email:</strong> {secretarioEncontrado.email}
              </p>
            </div>
            <button
              onClick={handleEliminarSecretario}
              className='btn-nuevo btn-eliminar-form'
              style={{ width: '100%' }}
            >
              Eliminar Secretario
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
