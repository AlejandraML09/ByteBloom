import { useState, useEffect } from 'react'
import { ZONAS } from '../../constants/admin'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const INITIAL_FORM = {
  zona_id: '',
  cupo_maximo: '',
  profesional_email: '',
}

export function CrearTab({ onCrear }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [profesionales, setProfesionales] = useState([])

  useEffect(() => {
    fetch(`${API_URL}/profesionales`)
      .then((r) => r.json())
      .then(setProfesionales)
      .catch(() => {})
  }, [])

  const validate = () => {
    const e = {}
    if (!form.zona_id) e.zona_id = 'Seleccioná una zona.'
    if (!form.cupo_maximo || isNaN(form.cupo_maximo) || Number(form.cupo_maximo) < 1)
      e.cupo_maximo = 'Ingresá un cupo máximo válido (mín. 1).'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }))
  }

  const handleSubmit = async () => {
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    setSuccessMsg('')
    try {
      await onCrear({
        zona_id: Number(form.zona_id),
        cupo_maximo: Number(form.cupo_maximo),
        profesional_email: form.profesional_email || null,
      })
      setSuccessMsg(
        'Clase creada. Ahora podés programar sus fechas en la pestaña "Programar clases".'
      )
      setForm(INITIAL_FORM)
      setErrors({})
    } catch (err) {
      setErrors({ general: err.message || 'Error al crear la clase.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Crear clase</h3>
          <p>
            Definí la zona, el cupo y el profesional. Las fechas se agregan luego en "Programar
            clases".
          </p>
        </div>
      </div>

      <div className='create-form'>
        {successMsg && <div className='form-success'>{successMsg}</div>}
        {errors.general && <div className='form-error'>{errors.general}</div>}

        <div className='form-grid'>
          <div className='form-group'>
            <label htmlFor='zona_id'>Zona</label>
            <select
              id='zona_id'
              name='zona_id'
              value={form.zona_id}
              onChange={handleChange}
              className={errors.zona_id ? 'input-error' : ''}
            >
              <option value=''>Seleccioná una zona</option>
              {Object.entries(ZONAS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            {errors.zona_id && <span className='field-error'>{errors.zona_id}</span>}
          </div>

          <div className='form-group'>
            <label htmlFor='profesional_email'>Profesional</label>
            <select
              id='profesional_email'
              name='profesional_email'
              value={form.profesional_email}
              onChange={handleChange}
            >
              <option value=''>Sin asignar</option>
              {profesionales.map((p) => (
                <option key={p.email} value={p.email}>
                  {p.nombre} {p.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className='form-group'>
            <label htmlFor='cupo_maximo'>Cupo máximo</label>
            <input
              id='cupo_maximo'
              type='number'
              name='cupo_maximo'
              min='1'
              placeholder='Ej: 10'
              value={form.cupo_maximo}
              onChange={handleChange}
              className={errors.cupo_maximo ? 'input-error' : ''}
            />
            {errors.cupo_maximo && <span className='field-error'>{errors.cupo_maximo}</span>}
          </div>
        </div>

        <div className='form-actions'>
          <button className='btn-action' onClick={handleSubmit} disabled={loading}>
            {loading ? 'Creando...' : 'Crear clase'}
          </button>
        </div>
      </div>
    </div>
  )
}
