import { useState } from 'react'
import client from '../../api/client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function HorarioTab({ classes, onModifyHorario }) {
  const [selectedClassId, setSelectedClassId] = useState(null)
  const [horarioInput, setHorarioInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [classesLocal, setClassesLocal] = useState(classes)

  const selectedClass = classesLocal.find(c => c.id === selectedClassId)

  async function handleModifyHorario() {
    if (!selectedClassId || !horarioInput) {
      setError('Selecciona una clase e ingresa un horario')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const res = await fetch(`${API_URL}/api/clases/horario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clase_programada_id: selectedClassId,
          nueva_hora: horarioInput
        }),
      })

      const body = await res.json().catch(() => ({}))
      
      if (!res.ok) {
        throw new Error(body.detail || 'Error al modificar horario')
      }

      // ✅ Actualizar la lista local de clases
      setClassesLocal(classesLocal.map(c =>
        c.id === selectedClassId
          ? { ...c, hora: horarioInput }
          : c
      ))

      // ✅ Llamar callback para refrescar en Admin.jsx
      if (onModifyHorario) {
        await onModifyHorario({
          clase_programada_id: selectedClassId,
          nueva_hora: horarioInput
        })
      }

      setSelectedClassId(null)
      setHorarioInput('')
      alert('✓ Horario actualizado exitosamente')
    } catch (err) {
      setError(err.message || 'Error al modificar horario')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Modificar horario de clase</h3>
          <p>Seleccioná una clase y ingresá el nuevo horario.</p>
        </div>
      </div>

      <div className='card-body'>
        {error && <div className='form-error' style={{ marginBottom: '1rem' }}>{error}</div>}

        {classesLocal.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay clases disponibles
          </p>
        ) : (
          <>
            {!selectedClassId ? (
              <table className='data-table'>
                <thead>
                  <tr>
                    <th>Zona</th>
                    <th>Fecha</th>
                    <th>Horario</th>
                    <th>Profesional</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {classesLocal.map(clase => (
                    <tr key={clase.id}>
                      <td>{clase.zona || clase.zona_id || '-'}</td>
                      <td>{clase.fecha}</td>
                      <td>{clase.hora}</td>
                      <td>{clase.profesional_email || '-'}</td>
                      <td>
                        <button
                          className='btn-action primary'
                          onClick={() => {
                            setSelectedClassId(clase.id)
                            setHorarioInput(clase.hora)
                            setError('')
                          }}
                        >
                          Modificar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>
                  Modificando: {selectedClass?.zona || selectedClass?.zona_id} - {selectedClass?.fecha}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  Horario actual: <strong>{selectedClass?.hora}</strong>
                </p>

                <div className='price-input-wrap'>
                  <div className='price-input-group'>
                    <label className='price-label'>Nuevo Horario</label>
                    <input
                      type='time'
                      value={horarioInput}
                      onChange={(e) => setHorarioInput(e.target.value)}
                      className='price-input'
                    />
                  </div>

                  <button
                    className='btn-action primary'
                    onClick={handleModifyHorario}
                    disabled={loading}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    {loading ? 'Guardando...' : 'Guardar'}
                  </button>

                  <button
                    className='btn-action'
                    onClick={() => {
                      setSelectedClassId(null)
                      setHorarioInput('')
                      setError('')
                    }}
                    style={{ alignSelf: 'flex-end' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}