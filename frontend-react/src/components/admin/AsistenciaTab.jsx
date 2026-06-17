import { useCallback, useEffect, useState } from 'react'
import { initials } from '../../utils/strings'
import { HORARIOS, ZONAS } from '../../constants/admin'
import { getAsistencia, setAsistencia } from '../../api/turnos'

const ASIST_OPCIONES = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'asistio', label: 'Asistió' },
  { value: 'ausente', label: 'Ausente' },
]

const ZONA_LABEL = { superior: 'Tren superior', medio: 'Zona media', inferior: 'Tren inferior' }

export function AsistenciaTab({ filterDate, filterHora, onDateChange, onHoraChange, actorId, showToast }) {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState(null)
  const [busqueda, setBusqueda] = useState('')

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAsistencia(filterDate, filterHora)
      setReservas(Array.isArray(data) ? data : [])
    } catch {
      setReservas([])
    } finally {
      setLoading(false)
    }
  }, [filterDate, filterHora])

  useEffect(() => {
    cargar()
  }, [cargar])

  async function handleChange(reservaId, nuevoEstado) {
    const previo = reservas.find((r) => r.reserva_id === reservaId)?.asistencia
    if (nuevoEstado === previo) return

    // Optimista
    setReservas((prev) =>
      prev.map((r) => (r.reserva_id === reservaId ? { ...r, asistencia: nuevoEstado } : r))
    )
    setSavingId(reservaId)
    try {
      await setAsistencia(reservaId, nuevoEstado, actorId)
      showToast?.('Asistencia actualizada')
    } catch (err) {
      // Revertir ante error
      setReservas((prev) =>
        prev.map((r) => (r.reserva_id === reservaId ? { ...r, asistencia: previo } : r))
      )
      showToast?.(err?.response?.data?.detail || 'No se pudo actualizar la asistencia')
    } finally {
      setSavingId(null)
    }
  }

  const reservasFiltradas = reservas.filter((r) => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (r.paciente || '').toLowerCase().includes(q) ||
      (r.zona || '').toLowerCase().includes(q) ||
      filterDate.includes(q)
    )
  })

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Tomar asistencia</h3>
          <p>Definí la asistencia de cada paciente</p>
        </div>
        <div className='date-filter'>
          <input type='date' value={filterDate} onChange={(e) => onDateChange(e.target.value)} />
          <select value={filterHora} onChange={(e) => onHoraChange(e.target.value)}>
            {HORARIOS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--text-muted)' }}>
        <input
          type='text'
          placeholder='Buscar por paciente o zona…'
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--text-muted)',
            fontSize: '14px',
            boxSizing: 'border-box',
          }}
        />
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Zona</th>
              <th>Asistencia</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  Cargando…
                </td>
              </tr>
            ) : reservasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                  {busqueda ? 'Sin resultados para esa búsqueda.' : 'Sin pacientes en este horario'}
                </td>
              </tr>
            ) : (
              reservasFiltradas.map((r) => (
                <tr key={r.reserva_id}>
                  <td>
                    <div className='patient-name'>
                      <div className='patient-avatar'>{initials(r.paciente)}</div>
                      <span>{r.paciente}</span>
                    </div>
                  </td>
                  <td>
                    <span className='badge badge-purple'>{ZONA_LABEL[r.zona] ?? ZONAS[r.zona] ?? r.zona}</span>
                  </td>
                  <td>
                    <select
                      className='asist-select'
                      value={r.asistencia}
                      disabled={savingId === r.reserva_id}
                      onChange={(e) => handleChange(r.reserva_id, e.target.value)}
                    >
                      {ASIST_OPCIONES.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
