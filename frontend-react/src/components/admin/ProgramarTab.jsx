import { useState, useEffect, useMemo } from 'react'
import { HORARIOS } from '../../constants/turnos'
import { ZONA_LABELS } from '../../constants/turnos'
import { fmtDate, MESES_ES } from '../../utils/dates'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const DIAS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function toMes(date) {
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

  const [clases, setClases] = useState([])
  const [loadingClases, setLoadingClases] = useState(true)
  const [selectedClase, setSelectedClase] = useState(null)
  const [monthOffset, setMonthOffset] = useState(0)
  const [selectedDay, setSelectedDay] = useState(null)
  // { "YYYY-MM-DD": Set(["09:00", ...]) }
  const [selection, setSelection] = useState({})
  const [creating, setCreating] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/clases/activas`)
      .then((r) => r.json())
      .then((data) => {
        setClases(data)
        setLoadingClases(false)
      })
      .catch(() => setLoadingClases(false))
  }, [])

  const displayDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth() + monthOffset, 1),
    [today, monthOffset]
  )
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

  function toggleSlot(dayKey, hora) {
    setSelection((prev) => {
      const set = new Set(prev[dayKey] ?? [])
      set.has(hora) ? set.delete(hora) : set.add(hora)
      return { ...prev, [dayKey]: set }
    })
  }

  function selectAllForDay(dayKey) {
    setSelection((prev) => ({ ...prev, [dayKey]: new Set(HORARIOS) }))
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
    if (!selectedClase || totalSlots === 0) return
    const slots = sortedDays.flatMap((fecha) =>
      [...selection[fecha]].sort().map((hora) => ({ fecha, hora }))
    )
    setCreating(true)
    setResult(null)
    try {
      const res = await onProgramar({ clase_id: selectedClase.id, slots })
      setResult({ ok: true, ...res })
      setSelection({})
      setSelectedDay(null)
    } catch (err) {
      setResult({ ok: false, msg: err.message || 'Error al crear las clases.' })
    } finally {
      setCreating(false)
    }
  }

  if (loadingClases) {
    return (
      <div className='card'>
        <p style={{ padding: '1.5rem' }}>Cargando clases…</p>
      </div>
    )
  }

  if (clases.length === 0) {
    return (
      <div className='card'>
        <div className='card-header'>
          <div>
            <h3>Programar clases</h3>
            <p>No hay clases activas. Creá una primero en "Crear clase".</p>
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
          <p>Seleccioná una clase, luego marcá los días y horarios en el calendario.</p>
        </div>
      </div>

      {/* ── Step 1: clase selector ── */}
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
          1 · Seleccioná una clase
        </h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          {clases.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedClase(c)
                setSelection({})
                setSelectedDay(null)
                setResult(null)
              }}
              style={{
                padding: '0.6rem 1rem',
                border: `2px solid ${selectedClase?.id === c.id ? 'var(--primary)' : 'var(--border)'}`,
                borderRadius: '10px',
                background: selectedClase?.id === c.id ? 'var(--primary-tint)' : 'var(--white)',
                cursor: 'pointer',
                textAlign: 'left',
                minWidth: '180px',
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
                {ZONA_LABELS[c.zona_nombre] ?? c.zona_nombre}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Cupo: {c.cupo_maximo} ·{' '}
                {c.profesional_nombre ??
                  (c.profesional_email ? c.profesional_email.split('@')[0] : 'Sin profesional')}
              </div>
            </button>
          ))}
        </div>
      </section>

      {selectedClase && (
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
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '0.5rem',
                      }}
                    >
                      {HORARIOS.map((hora) => {
                        const dayKey = fmtDate(selectedDay)
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
                  {result.ok
                    ? `✓ ${result.creadas} clase${result.creadas !== 1 ? 's' : ''} programada${result.creadas !== 1 ? 's' : ''}${result.omitidas > 0 ? ` (${result.omitidas} ya existían)` : ''}.`
                    : result.msg}
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
