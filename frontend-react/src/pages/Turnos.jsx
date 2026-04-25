import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import '../css/turnos.css'

const HORARIOS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const DIAS_ES  = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const MESES_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const ZONA_LABELS = { superior: 'Tren superior', medio: 'Tren medio', inferior: 'Tren inferior' }

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtDiaLargo(d) {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`
}

function getMonday(d) {
  const day = d.getDay()
  const diff = (day === 0) ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon
}

function nextHour(hora) {
  const [h, m] = hora.split(':').map(Number)
  return `${String(h + 1).padStart(2,'0')}:${String(m).padStart(2,'0')}`
}

function seedOcupados() {
  const ocupados = {}
  const hoy = new Date()
  const dias = [-1, 0, 1, 2, 3]
  dias.forEach(d => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + d)
    if (fecha.getDay() === 0 || fecha.getDay() === 6) return
    HORARIOS.forEach(h => {
      const key = `${fmtDate(fecha)}_${h}`
      ocupados[key] = Math.floor(Math.random() * 5)
    })
  })
  return ocupados
}

export default function Turnos() {
  const [zona, setZona] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [tel, setTel] = useState('')
  const [email, setEmail] = useState('')
  const [os, setOs] = useState('')
  const [ocupados, setOcupados] = useState(() => seedOcupados())
  const { msg, visible, showToast } = useToast()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const base = useMemo(() => {
    const d = new Date(today)
    d.setDate(today.getDate() + weekOffset * 7)
    return d
  }, [today, weekOffset])

  const monday = useMemo(() => getMonday(base), [base])

  const friday = useMemo(() => {
    const f = new Date(monday)
    f.setDate(monday.getDate() + 4)
    return f
  }, [monday])

  const weekLabel = `${monday.getDate()} al ${friday.getDate()} de ${MESES_ES[friday.getMonth()]}`

  const prevMonday = useMemo(() => {
    const pm = new Date(monday)
    pm.setDate(monday.getDate() - 7)
    return pm
  }, [monday])

  const prevDisabled = prevMonday < today

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [monday])

  function getOcupados(fecha, hora) {
    return ocupados[`${fmtDate(fecha)}_${hora}`] || 0
  }

  function step1Class() {
    return 'step' + (zona ? ' done' : ' active')
  }

  function step2Class() {
    return 'step' + (!zona ? '' : slot ? ' done' : ' active')
  }

  function step3Class() {
    return 'step' + (slot ? ' active' : '')
  }

  const allFilled = zona && diaDate && slot && nombre && apellido && email && tel && os

  function confirmarTurno() {
    const key = `${fmtDate(diaDate)}_${slot}`
    setOcupados(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }))
    showToast(`✓ Turno confirmado para ${nombre} el ${fmtDiaLargo(diaDate)} a las ${slot}`)
    setTimeout(() => {
      setZona(null)
      setDiaDate(null)
      setSlot(null)
      setNombre('')
      setApellido('')
      setTel('')
      setEmail('')
      setOs('')
    }, 2800)
  }

  const sumZona   = zona    ? ZONA_LABELS[zona] : null
  const sumDia    = diaDate ? fmtDiaLargo(diaDate) : null
  const sumHora   = slot    ? `${slot} – ${nextHour(slot)}` : null
  const sumNombre = (nombre || apellido) ? `${nombre} ${apellido}`.trim() : null

  return (
    <>
      <Navbar />

      <div className="page-header">
        <h1>Reservá tu turno</h1>
        <p>Elegí la zona, el día y el horario que mejor se adapte a vos</p>
      </div>

      <div className="main">
        <div className="left-col">
          {/* Steps */}
          <div className="steps">
            <div className={step1Class()}>
              <div className="step-num">1</div>
              <span>Zona</span>
            </div>
            <div className="step-sep" />
            <div className={step2Class()}>
              <div className="step-num">2</div>
              <span>Día y horario</span>
            </div>
            <div className="step-sep" />
            <div className={step3Class()}>
              <div className="step-num">3</div>
              <span>Tus datos</span>
            </div>
          </div>

          {/* PASO 1: Zona */}
          <div className="card">
            <div className="card-title">¿Qué zona querés trabajar?</div>
            <div className="zona-grid">
              {[
                { id: 'superior', name: 'Tren superior', sub: 'Hombros, brazos, cuello y espalda alta',
                  icon: <><circle cx="12" cy="5" r="2"/><path d="M12 7v5"/><path d="M7 10c1.5-.5 3-1 5-1s3.5.5 5 1"/><path d="M7 10l-2 5"/><path d="M17 10l2 5"/></> },
                { id: 'medio', name: 'Tren medio', sub: 'Core, lumbar y zona abdominal',
                  icon: <><path d="M7 10h10"/><path d="M7 14h10"/><path d="M9 7v10"/><path d="M15 7v10"/></> },
                { id: 'inferior', name: 'Tren inferior', sub: 'Caderas, rodillas, tobillos y pies',
                  icon: <><path d="M12 4v8"/><path d="M9 12l-3 8"/><path d="M15 12l3 8"/><path d="M8 16h8"/></> },
              ].map(({ id, name, sub, icon }) => (
                <button
                  key={id}
                  className={`zona-btn${zona === id ? ' selected' : ''}`}
                  onClick={() => { setZona(id); setDiaDate(null); setSlot(null) }}
                >
                  <div className="zona-icon">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">{icon}</svg>
                  </div>
                  <div>
                    <div className="zona-name">{name}</div>
                    <div className="zona-sub">{sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* PASO 2: Día y horario */}
          <div className="card">
            <div className="card-title">Elegí el día</div>
            <div className="week-nav">
              <button className="week-arrow" disabled={prevDisabled} onClick={() => setWeekOffset(o => o - 1)}>&#8249;</button>
              <span className="week-label">{weekLabel}</span>
              <button className="week-arrow" onClick={() => setWeekOffset(o => o + 1)}>&#8250;</button>
            </div>
            <div className="days-row">
              {weekDays.map((d) => {
                const isPast = d < today
                const isToday = fmtDate(d) === fmtDate(today)
                const isSelected = diaDate && fmtDate(d) === fmtDate(diaDate)
                return (
                  <button
                    key={fmtDate(d)}
                    className={`day-btn${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isPast ? ' past' : ''}`}
                    disabled={isPast}
                    style={{ opacity: isPast ? 0.35 : 1, cursor: isPast ? 'not-allowed' : 'pointer' }}
                    onClick={() => { setDiaDate(d); setSlot(null) }}
                  >
                    <div className="day-name">{DIAS_ES[d.getDay()]}</div>
                    <div className="day-num">{d.getDate()}</div>
                  </button>
                )
              })}
            </div>

            <div className="card-title" style={{ marginTop: '1.25rem' }}>Elegí el horario</div>
            {!diaDate ? (
              <div className="empty-state">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <p>Seleccioná un día para ver los turnos disponibles</p>
              </div>
            ) : (
              <div className="slots-grid">
                {HORARIOS.map(hora => {
                  const taken = getOcupados(diaDate, hora)
                  const isFull = taken >= 5
                  const isSelected = slot === hora
                  return (
                    <button
                      key={hora}
                      className={`slot-btn${isFull ? ' full' : ''}${isSelected ? ' selected' : ''}`}
                      disabled={isFull}
                      onClick={() => setSlot(hora)}
                    >
                      <span className="slot-time">{hora}</span>
                      <div className="slot-dots">
                        {Array.from({ length: 5 }, (_, i) => (
                          <div key={i} className={`slot-dot${i < taken ? ' taken' : ''}`} />
                        ))}
                      </div>
                      <div className="slot-cupos" style={{ color: isFull ? 'var(--gray-text)' : taken >= 4 ? 'var(--red)' : 'var(--green-dark)' }}>
                        {isFull ? 'Sin cupos' : `${5 - taken} lugar${5 - taken === 1 ? '' : 'es'}`}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* PASO 3: Datos */}
          <div className="card">
            <div className="card-title">Tus datos</div>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre</label>
                <input type="text" placeholder="Ej: María" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input type="text" placeholder="Ej: González" value={apellido} onChange={e => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Teléfono</label>
                <input type="tel" placeholder="Ej: 221-4567890" value={tel} onChange={e => setTel(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Obra social</label>
                <select value={os} onChange={e => setOs(e.target.value)}>
                  <option value="">— Seleccioná —</option>
                  <option>OSDE</option>
                  <option>Swiss Medical</option>
                  <option>IOMA</option>
                  <option>PAMI</option>
                  <option>Galeno</option>
                  <option>Particular</option>
                </select>
              </div>
            </div>
            <div className="form-row full">
              <div className="form-group">
                <label>Email</label>
                <input type="email" placeholder="Ej: maria@email.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="sidebar">
          <div className="summary-card">
            <div className="summary-header">
              <h3>Resumen del turno</h3>
              <p>Revisá los datos antes de confirmar</p>
            </div>
            <div className="summary-body">
              {[
                { key: 'Zona',      val: sumZona,   fallback: 'Sin seleccionar' },
                { key: 'Día',       val: sumDia,    fallback: 'Sin seleccionar' },
                { key: 'Horario',   val: sumHora,   fallback: 'Sin seleccionar' },
                { key: 'Duración',  val: <span className="summary-badge">1 hora</span>, fallback: null },
                { key: 'Paciente',  val: sumNombre, fallback: 'Sin completar' },
                { key: 'Obra social', val: os || null, fallback: 'Sin completar' },
              ].map(({ key, val, fallback }) => (
                <div className="summary-row" key={key}>
                  <span className="summary-key">{key}</span>
                  <span className={`summary-val${val ? '' : ' empty'}`}>{val || fallback}</span>
                </div>
              ))}
              <button className="btn-confirm" disabled={!allFilled} onClick={confirmarTurno}>
                Confirmar turno
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
