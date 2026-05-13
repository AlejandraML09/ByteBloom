import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/vars.css'
import '../css/registro.css'

export default function Registro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    email: '',
    fechaNacimiento: '',
    password: '',
    confirmarPassword: ''
  })

  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  function validar() {
    if (!form.nombre.trim()) return 'El nombre es obligatorio.'
    if (!form.apellido.trim()) return 'El apellido es obligatorio.'
    if (!form.email.trim()) return 'El email es obligatorio.'
    if (!form.fechaNacimiento) return 'La fecha de nacimiento es obligatoria.'
    if (form.password.length < 6) return 'La contraseña debe tener al menos 6 caracteres.'
    if (form.password !== form.confirmarPassword) return 'Las contraseñas no coinciden.'
    return ''
  }

  function handleSubmit() {
    const msg = validar()
    if (msg) {
      setError(msg)
      return
    }
    setExito(true)
  }

  if (exito) {
    return (
      <>
        <Navbar />
        <div className="registro-page">
          <div className="registro-card">
            <div className="registro-exito">
              <span className="exito-icono">✓</span>
              <h2>¡Registro exitoso!</h2>
              <p>Tu cuenta fue creada correctamente.</p>
              <button className="btn-registro" onClick={() => navigate('/login')}>
                Ir al inicio de sesión
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />

      <div className="registro-page">
        <div className="registro-card">

          <div className="registro-header">
            <h2>Crear cuenta</h2>
            <p>Completá tus datos para registrarte</p>
          </div>

          {error && (
            <div className="error-msg show">{error}</div>
          )}

          <div className="registro-grid">
            <div className="form-group">
              <label>Nombre</label>
              <input
                type="text"
                name="nombre"
                placeholder="María"
                value={form.nombre}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Apellido</label>
              <input
                type="text"
                name="apellido"
                placeholder="González"
                value={form.apellido}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              placeholder="maria@email.com"
              value={form.email}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Fecha de nacimiento</label>
            <input
              type="date"
              name="fechaNacimiento"
              value={form.fechaNacimiento}
              onChange={handleChange}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="registro-grid">
            <div className="form-group">
              <label>Contraseña</label>
              <input
                type="password"
                name="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                name="confirmarPassword"
                placeholder="Repetí tu contraseña"
                value={form.confirmarPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button className="btn-registro" onClick={handleSubmit}>
            Registrarse
          </button>

          <div className="login-hint">
            <Link to="/login">¿Ya tenés cuenta? Iniciá sesión</Link>
          </div>

        </div>
      </div>

      <Footer />
    </>
  )
}