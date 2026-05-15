import { useState } from 'react'
import { ZONAS } from '../../constants/admin'

const INITIAL_FORM = {
  zona: '',
  fecha: '',
  hora: '',
  cupo_max: '',
}

export function CrearTab({ onCrear }) {
  const [form, setForm] = useState(INITIAL_FORM)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const validate = () => {
    const newErrors = {}
    if (!form.zona) newErrors.zona = 'Seleccioná una zona.'
    if (!form.fecha) newErrors.fecha = 'Ingresá una fecha.'
    if (!form.hora) newErrors.hora = 'Ingresá un horario.'
    if (!form.cupo_max || isNaN(form.cupo_max) || Number(form.cupo_max) < 1)
      newErrors.cupo_max = 'Ingresá un cupo máximo válido.'
    return newErrors
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: undefined }))
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
        zona: form.zona,
        fecha: form.fecha,
        hora: form.hora,
        cupo_max: Number(form.cupo_max),
      })
      setSuccessMsg('Clase creada exitosamente.')
      setForm(INITIAL_FORM)
      setErrors({})
    } catch (err) {
      setErrors({ general: err.message || 'Error al crear la clase.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Crear clase</h3>
          <p>Completá los datos para agregar una nueva clase.</p>
        </div>
      </div>

      <div className="create-form">
        {successMsg && (
          <div className="form-success">{successMsg}</div>
        )}
        {errors.general && (
          <div className="form-error">{errors.general}</div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="zona">Zona</label>
            <select
              id="zona"
              name="zona"
              value={form.zona}
              onChange={handleChange}
              className={errors.zona ? 'input-error' : ''}
            >
              <option value="">Seleccioná una zona</option>
              {ZONAS.map(z => (
                <option key={z} value={z}>{z}</option>
              ))}
            </select>
            {errors.zona && <span className="field-error">{errors.zona}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="fecha">Fecha</label>
            <input
              id="fecha"
              type="date"
              name="fecha"
              value={form.fecha}
              onChange={handleChange}
              className={errors.fecha ? 'input-error' : ''}
            />
            {errors.fecha && <span className="field-error">{errors.fecha}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="hora">Horario</label>
            <input
              id="hora"
              type="time"
              name="hora"
              value={form.hora}
              onChange={handleChange}
              className={errors.hora ? 'input-error' : ''}
            />
            {errors.hora && <span className="field-error">{errors.hora}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="cupo_max">Cupo máximo</label>
            <input
              id="cupo_max"
              type="number"
              name="cupo_max"
              min="1"
              placeholder="Ej: 10"
              value={form.cupo_max}
              onChange={handleChange}
              className={errors.cupo_max ? 'input-error' : ''}
            />
            {errors.cupo_max && <span className="field-error">{errors.cupo_max}</span>}
          </div>
        </div>

        <div className="form-actions">
          <button
            className="btn-action"
            onClick={handleSubmit}
            disabled={loading}
            style={{ backgroundColor: '#2e7d32', color: 'white' }}
          >
            {loading ? 'Creando...' : 'Crear clase'}
          </button>
        </div>
      </div>
    </div>
  )
}
