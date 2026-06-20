import { useCallback, useEffect, useState } from 'react'
import { initials } from '../../utils/strings'
import { ZONAS } from '../../constants/admin'
import { getAsistencia, setAsistencia, getDisponibilidad, getListaEspera } from '../../api/turnos'

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
  const [horariosDisponibles, setHorariosDisponibles] = useState([])
  const [waitlist, setWaitlist] = useState([])

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

  // Cargar horarios disponibles (solo horarios con al menos 1 inscripción)
  useEffect(() => {
    if (!filterDate) return
    const mes = filterDate.slice(0, 7)
    let mounted = true
    ;(async () => {
      try {
        const data = await getDisponibilidad(mes)
        const filas = Array.isArray(data) ? data : []
        const filasFecha = filas.filter((f) => f.fecha === filterDate)
        const horas = Array.from(
          new Set(
            filasFecha
              .filter((f) => {
                const reservados = (f.cupo_maximo ?? 0) - (f.cupo_disponible ?? 0)
                return reservados > 0
              })
              .map((f) => f.hora)
          )
        ).sort()
        if (mounted) {
          setHorariosDisponibles(horas)
          // Si la hora seleccionada ya no está entre las disponibles, seleccionar la primera
          if (horas.length > 0 && !horas.includes(filterHora)) {
            onHoraChange(horas[0])
          }
        }
      } catch {
        if (mounted) setHorariosDisponibles([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [filterDate, filterHora, onHoraChange])

  // Cargar lista de espera para el turno (fecha + hora)
  useEffect(() => {
    if (!filterDate || !filterHora) {
      setWaitlist([])
      return
    }
    let mounted = true
    ;(async () => {
      try {
        const data = await getListaEspera({ fecha: filterDate, hora: filterHora })
        if (mounted) setWaitlist(Array.isArray(data) ? data : [])
      } catch {
        if (mounted) setWaitlist([])
      }
    })()
    return () => {
      mounted = false
    }
  }, [filterDate, filterHora])

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

  function PatientCell({ name, zona, showZona = true }) {
    return (
      <div className='patient-name'>
        <div className='patient-avatar'>{initials(name)}</div>
        <span>{name}</span>
      </div>
    )
  }

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
            {horariosDisponibles && horariosDisponibles.length > 0 ? (
              horariosDisponibles.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))
            ) : (
              <option value="" disabled>
                No hay horarios con inscriptos
              </option>
            )}
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
                <td colSpan={3}>
                  <div className='empty-state'>
                    <svg
                      width='32'
                      height='32'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      strokeWidth='1.5'
                    >
                      <circle cx='12' cy='12' r='10' />
                      <path d='M12 8v4M12 16h.01' />
                    </svg>
                    <p>No hay inscriptos en este horario.</p>
                  </div>
                </td>
              </tr>
            ) : (
              reservasFiltradas.map((r) => (
                <tr key={r.reserva_id}>
                  <td>
                    <PatientCell name={r.paciente} zona={r.zona} showZona={true} />
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
      <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--text-muted)' }}>
        <h4 style={{ margin: '0 0 0.5rem 0' }}>Lista de espera</h4>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Paciente</th>
                {/* <th>Zona</th>
                <th>Asistencia</th> */}
              </tr>
            </thead>
            <tbody>
              {waitlist.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                    No hay inscriptos en la lista de espera.
                  </td>
                </tr>
              ) : (
                waitlist.map((w) => (
                  <tr key={w.id}>
                    <td>
                      <PatientCell name={w.nombre} showZona={false} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
