import { useState, useEffect } from 'react'
import client from '../../api/client'

export default function SecretariosTab() {
  const [secretarios, setSecretarios] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    fecha_nacimiento: '',
    password: '',
    dni: '', // Nuevo campo DNI
  })
  const [showForm, setShowForm] = useState(false)

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
    setLoading(true)

    try {
      const response = await client.post('/crear-secretario', {
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        fecha_nacimiento: form.fecha_nacimiento,
        password: form.password,
        dni: form.dni, // Enviar DNI
      })

      setSecretarios([...secretarios, response.data])
      setForm({ nombre: '', apellido: '', email: '', fecha_nacimiento: '', password: '', dni: '' })
      setShowForm(false)
      setError('')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear secretario')
    } finally {
      setLoading(false)
    }
  }

  async function handleEliminarSecretario(secretarioId) {
    if (confirm('¿Estás seguro de que deseas eliminar este secretario?')) {
      try {
        await client.delete(`/secretarios/${secretarioId}`)
        setSecretarios(secretarios.filter((s) => s.id !== secretarioId))
      } catch (err) {
        setError('Error al eliminar secretario')
        console.error('Error:', err)
      }
    }
  }

  // Filtrar y ordenar secretarios
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
            <label>Contraseña</label>
            <input
              type='password'
              name='password'
              placeholder='Mínimo 6 caracteres'
              value={form.password}
              onChange={handleChange}
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

        <div className='search-bar'>
          <input
            type='text'
            placeholder='Buscar por nombre, apellido o email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='search-input'
          />
        </div>

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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {secretariosOrdenados.map((secretario) => (
                <tr key={secretario.id}>
                  <td>{secretario.apellido || '-'}</td>
                  <td>{secretario.nombre || '-'}</td>
                  <td>{secretario.email}</td>
                  <td>
                    <button
                      className='btn-nuevo btn-eliminar-form'
                      onClick={() => handleEliminarSecretario(secretario.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
