import { useState, useEffect, useMemo, useCallback } from 'react'
import { HORARIOS } from '../../constants/turnos'
import { ZONA_LABELS } from '../../constants/turnos'
import { profesionales as PROFESIONALES } from '../../constants/profesionales'
import { fmtDate, MESES_ES } from '../../utils/dates'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DIAS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function toMesParam(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function buildCalendarDays(displayDate) {
  const year = displayDate.getFullYear()
  const month = displayDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const startDow = firstDay.getDay()
  const leading = startDow === 0 ? 6 : startDow - 1
  const cells = Array(leading).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

export function ProgramarTab({ onProgramar }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [zonas, setZonas] = useState([])
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [zonaId, setZonaId] = useState(null)
  const [salaId, setSalaId] = useState(null)
  const [profesionalEmail, setProfesionalEmail] = useState('')
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)
  // { "YYYY-MM-DD": Set(["09:00", ...]) }
  const [selection, setSelection] = useState({})
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)
  // Clases programadas del mes visible — usado para bloquear horarios ocupados.
  const [ocupacion, setOcupacion] = useState([])

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/zonas`).then((r) => (r.ok ? r.json() : [])),
      fetch(`${API_URL}/api/salas`).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([zs, ss]) => {
        setZonas(zs)
        setSalas(ss)
      })
      .finally(() => setLoading(false))
  }, [])

  const displayDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  )

  const fetchOcupacion = useCallback(async () => {
    try {
      const res = await fetch(
        `${API_URL}/turnos/disponibilidad?mes=${toMesParam(displayDate)}`
      )
      if (res.ok) {
        const data = await res.json()
        setOcupacion(Array.isArray(data) ? data : [])
      }
    } catch {
      /* sin red: dejamos lo previo */
    }
  }, [displayDate])

  useEffect(() => {
    fetchOcupacion()
  }, [fetchOcupacion])
  const calendarDays = useMemo(() => buildCalendarDays(displayDate), [displayDate])
  const monthLabel = `${MESES_ES[displayDate.getMonth()]} ${displayDate.getFullYear()}`

  const totalSlots = useMemo(
    () => Object.values(selection).reduce((s, set) => s + set.size, 0),
    [selection]
  )

  const sortedDays = useMemo(
    () =>
      Object.keys(selection)
        .filter((d) => selection[d].size > 0)
        .sort(),
    [selection]
  )

  const seleccionListo = zonaId !== null && profesionalEmail !== '' && salaId !== null

  const isOcupado = useCallback(
    (fecha, hora) =>
      ocupacion.some(
        (s) =>
          s.fecha === fecha &&
          s.hora === hora &&
          (s.sala_id === salaId ||
            (profesionalEmail && s.profesional_email === profesionalEmail))
      ),
    [ocupacion, salaId, profesionalEmail]
  )

  const horariosOcupados = useMemo(() => {
    if (!selectedDay) return new Set()
    const dayKey = fmtDate(selectedDay)
    const set = new Set()
    for (const hora of HORARIOS) {
      if (isOcupado(dayKey, hora)) set.add(hora)
    }
    return set
  }, [selectedDay, isOcupado])

  // Auto-desmarcar slots que pasaron a estar ocupados al cambiar sala/profesional/ocupacion.
  useEffect(() => {
    setSelection((prev) => {
      let touched = false
      const next = {}
      for (const [fecha, set] of Object.entries(prev)) {
        const cleaned = new Set()
        for (const hora of set) {
          if (isOcupado(fecha, hora)) {
            touched = true
          } else {
            cleaned.add(hora)
          }
        }
        next[fecha] = cleaned
      }
      return touched ? next : prev
    })
  }, [isOcupado])

  function toggleSlot(dayKey, hora) {
    setSelection((prev) => {
      const set = new Set(prev[dayKey] ?? [])
      set.has(hora) ? set.delete(hora) : set.add(hora)
      return { ...prev, [dayKey]: set }
    })
  }

  function selectAllForDay(dayKey) {
    const libres = HORARIOS.filter((h) => !isOcupado(dayKey, h))
    setSelection((prev) => ({ ...prev, [dayKey]: new Set(libres) }))
  }

  function clearDay(dayKey) {
    setSelection((prev) => ({ ...prev, [dayKey]: new Set() }))
  }

  function removeSlot(dayKey, hora) {
    setSelection((prev) => {
      const set = new Set(prev[dayKey] ?? [])
      set.delete(hora)
      return { ...prev, [dayKey]: set }
    })
  }

  async function handleCrear() {
    if (!seleccionListo || totalSlots === 0) return
    const slots = sortedDays.flatMap((fecha) =>
      [...selection[fecha]].sort().map((hora) => ({ fecha, hora }))
    )
    setCreating(true)
    setResult(null)
    try {
      const payload = {
        zona_id: zonaId,
        sala_id: salaId,
        profesional_email: profesionalEmail,
        slots,
      }
      const res = await onProgramar(payload)
      setResult({ ok: true, ...res })
      setSelection({})
      setSelectedDay(null)
      // Refrescar ocupación para que los slots recién creados queden ocultos.
      fetchOcupacion()
    } catch (err) {
      // Detectar conflictos estructurados
      const detail = err.detail ?? err.message
      if (typeof detail === 'object' && (detail.conflictos_sala || detail.conflictos_profesional)) {
        setResult({
          ok: false,
          msg: detail.mensaje || 'Conflictos detectados.',
          conflictos_sala: detail.conflictos_sala || [],
          conflictos_profesional: detail.conflictos_profesional || [],
        })
      } else {
        setResult({ ok: false, msg: typeof detail === 'string' ? detail : 'Error al crear las clases.' })
      }
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className='card'>
        <p style={{ padding: '1.5rem' }}>Cargando…</p>
      </div>
    )
  }

  if (salas.length === 0) {
    return (
      <div className='card'>
        <div className='card-header'>
          <div>
            <h3>Programar clases</h3>
            <p>No hay salas activas. Creá una primero en "Salas".</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Programar clases</h3>
          <p>Elegí zona, profesional y sala, luego marcá los días y horarios.</p>
        </div>
      </div>

      {/* ── Step 1: zona / profesional / sala ── */}
      <section style={{ marginBottom: '1.5rem' }}>
        <h4
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          1 · Configuración de la clase
        </h4>

        {/* Zonas */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Zona
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {zonas.map((z) => (
              <button
                key={z.id}
                onClick={() => {
                  if (zonaId !== z.id) {
                    setZonaId(z.id)
                    setProfesionalEmail('')
                    setSalaId(null)
                  }
                }}
                style={{
                  padding: '0.5rem 0.9rem',
                  border: `2px solid ${zonaId === z.id ? 'var(--primary)' : 'var(--border)'}`,
                  borderRadius: '8px',
                  background: zonaId === z.id ? 'var(--primary-tint)' : 'var(--white)',
                  cursor: 'pointer',
                  fontWeight: zonaId === z.id ? 600 : 400,
                  fontSize: '0.88rem',
                }}
              >
                {ZONA_LABELS[z.nombre] ?? z.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Profesional — habilitado tras elegir Zona */}
        {zonaId !== null && (
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Profesional
            </div>
            <select
              value={profesionalEmail}
              onChange={(e) => {
                setProfesionalEmail(e.target.value)
                setSalaId(null)
              }}
              style={{
                padding: '0.5rem 0.7rem',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                fontSize: '0.9rem',
                minWidth: '320px',
              }}
            >
              <option value='' disabled>Elegí un profesional</option>
              {PROFESIONALES.map((p) => (
                <option key={p.email} value={p.email}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sala — habilitada tras elegir Profesional */}
        {zonaId !== null && profesionalEmail !== '' && (
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Sala
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {salas.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSalaId(s.id)}
                  style={{
                    padding: '0.5rem 0.9rem',
                    border: `2px solid ${salaId === s.id ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '8px',
                    background: salaId === s.id ? 'var(--primary-tint)' : 'var(--white)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    minWidth: '160px',
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{s.nombre}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Cupo: {s.cupo}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {seleccionListo && (
        <>
          {/* ── Step 2: calendar ── */}
          <section style={{ marginBottom: '1.5rem' }}>
            <h4
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
              }}
            >
              2 · Elegí los días y horarios
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Calendar column */}
              <div>
                <div className='month-nav'>
                  <button
                    className='week-arrow'
                    disabled={monthOffset <= 0}
                    onClick={() => setMonthOffset((o) => o - 1)}
                  >
                    &#8249;
                  </button>
                  <span className='week-label'>{monthLabel}</span>
                  <button className='week-arrow' onClick={() => setMonthOffset((o) => o + 1)}>
                    &#8250;
                  </button>
                </div>
                <div className='month-header'>
                  {DIAS_HEADER.map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </div>
                <div className='month-grid'>
                  {calendarDays.map((d, i) => {
                    if (!d) return <div key={`e-${i}`} className='month-empty' />
                    const isPast = d < today
                    const dayKey = fmtDate(d)
                    const isSelected = selectedDay && fmtDate(d) === fmtDate(selectedDay)
                    const slotCount = selection[dayKey]?.size ?? 0
                    return (
                      <button
                        key={dayKey}
                        className={[
                          'month-day',
                          isPast ? 'disabled' : '',
                          isSelected ? 'selected' : '',
                          slotCount > 0 ? 'booked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        disabled={isPast}
                        onClick={() => setSelectedDay(d)}
                        title={
                          slotCount > 0
                            ? `${slotCount} horario${slotCount > 1 ? 's' : ''} seleccionado${slotCount > 1 ? 's' : ''}`
                            : ''
                        }
                      >
                        <span className='month-day-num'>{d.getDate()}</span>
                        {slotCount > 0 && (
                          <div className='month-day-bar'>
                            <div
                              className='month-day-fill'
                              style={{
                                width: `${Math.min(100, (slotCount / HORARIOS.length) * 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Slot picker column */}
              <div>
                {selectedDay ? (
                  <>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                        {selectedDay.toLocaleDateString('es-AR', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </span>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className='btn-action'
                          style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }}
                          onClick={() => selectAllForDay(fmtDate(selectedDay))}
                        >
                          Seleccionar todos
                        </button>
                        <button
                          className='btn-action'
                          style={{
                            padding: '0.3rem 0.7rem',
                            fontSize: '0.78rem',
                            background: 'var(--bg-alt)',
                          }}
                          onClick={() => clearDay(fmtDate(selectedDay))}
                        >
                          Limpiar
                        </button>
                      </div>
                    </div>
                    {(() => {
                      const dayKey = fmtDate(selectedDay)
                      const horariosLibres = HORARIOS.filter(
                        (h) => !horariosOcupados.has(h)
                      )
                      if (horariosLibres.length === 0) {
                        return (
                          <div
                            style={{
                              padding: '1rem',
                              textAlign: 'center',
                              color: 'var(--text-muted)',
                              fontSize: '0.88rem',
                              background: 'var(--bg-alt)',
                              borderRadius: '8px',
                            }}
                          >
                            No hay horarios disponibles para esta sala/profesional en este día.
                          </div>
                        )
                      }
                      return (
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.5rem',
                          }}
                        >
                          {horariosLibres.map((hora) => {
                            const checked = selection[dayKey]?.has(hora) ?? false
                            return (
                              <label
                                key={hora}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  padding: '0.45rem 0.6rem',
                                  border: `1.5px solid ${checked ? 'var(--primary)' : 'var(--border)'}`,
                                  borderRadius: '8px',
                                  background: checked ? 'var(--primary-tint)' : 'var(--white)',
                                  cursor: 'pointer',
                                  fontSize: '0.88rem',
                                  fontWeight: checked ? 600 : 400,
                                  color: checked ? 'var(--primary-dark)' : 'var(--text-main)',
                                }}
                              >
                                <input
                                  type='checkbox'
                                  checked={checked}
                                  onChange={() => toggleSlot(dayKey, hora)}
                                  style={{ accentColor: 'var(--primary)' }}
                                />
                                {hora}
                              </label>
                            )
                          })}
                        </div>
                      )
                    })()}
                  </>
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                      color: 'var(--text-muted)',
                      fontSize: '0.9rem',
                    }}
                  >
                    ← Seleccioná un día en el calendario
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── Step 3: summary + create ── */}
          {totalSlots > 0 && (
            <section>
              <h4
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '0.75rem',
                }}
              >
                3 · Revisá y confirmá · {totalSlots} horario{totalSlots > 1 ? 's' : ''} seleccionado
                {totalSlots > 1 ? 's' : ''}
              </h4>

              <div
                style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}
              >
                {sortedDays.map((fecha) =>
                  [...selection[fecha]].sort().map((hora) => (
                    <span
                      key={`${fecha}-${hora}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        padding: '0.3rem 0.6rem',
                        background: 'var(--primary-tint)',
                        border: '1px solid var(--primary)',
                        borderRadius: '20px',
                        fontSize: '0.8rem',
                        color: 'var(--primary-dark)',
                      }}
                    >
                      {fecha} {hora}
                      <button
                        onClick={() => removeSlot(fecha, hora)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          lineHeight: 1,
                          color: 'var(--primary)',
                          fontWeight: 700,
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>

              {result && (
                <div
                  className={result.ok ? 'form-success' : 'form-error'}
                  style={{ marginBottom: '0.75rem' }}
                >
                  {result.ok ? (
                    <>
                      ✓ {result.creadas} clase{result.creadas !== 1 ? 's' : ''} programada
                      {result.creadas !== 1 ? 's' : ''}.
                    </>
                  ) : (
                    <>
                      {result.msg}
                      {result.conflictos_sala?.length > 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                          <strong>Sala ocupada:</strong>{' '}
                          {result.conflictos_sala
                            .map((c) => `${c.fecha} ${c.hora}`)
                            .join(', ')}
                        </div>
                      )}
                      {result.conflictos_profesional?.length > 0 && (
                        <div style={{ marginTop: '0.4rem', fontSize: '0.85rem' }}>
                          <strong>Profesional ocupado:</strong>{' '}
                          {result.conflictos_profesional
                            .map((c) => `${c.fecha} ${c.hora}`)
                            .join(', ')}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <button
                className='btn-action'
                onClick={handleCrear}
                disabled={creating}
                style={{ minWidth: '200px' }}
              >
                {creating
                  ? 'Creando…'
                  : `Crear ${totalSlots} clase${totalSlots > 1 ? 's' : ''} programada${totalSlots > 1 ? 's' : ''}`}
              </button>
            </section>
          )}
        </>
      )}
    </div>
  )
}
