import { useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { StepIndicator } from '../components/turnos/StepIndicator'
import { ZonaSelector } from '../components/turnos/ZonaSelector'
import { MonthCalendar } from '../components/turnos/MonthCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { PaymentSelector } from '../components/turnos/PaymentSelector'
import { SummaryPanel } from '../components/turnos/SummaryPanel'
import { HORARIOS } from '../constants/turnos'
import { fmtDate, fmtDiaLargo, nextHour } from '../utils/dates'
import '../css/turnos.css'

const MAX_SHIFTS = 3

function seedOcupados() {
  const ocupados = {}
  const hoy = new Date()
  ;[-1, 0, 1, 2, 3].forEach(d => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() + d)
    if (fecha.getDay() === 0 || fecha.getDay() === 6) return
    HORARIOS.forEach(h => {
      ocupados[`${fmtDate(fecha)}_${h}`] = Math.floor(Math.random() * 5)
    })
  })
  return ocupados
}

export default function Turnos() {
  const [zona,      setZona]      = useState(null)
  const [diaDate,   setDiaDate]   = useState(null)
  const [slot,      setSlot]      = useState(null)
  const [shifts,    setShifts]    = useState([])
  const [medioPago, setMedioPago] = useState(null)
  const [ocupados,  setOcupados]  = useState(() => seedOcupados())
  const { msg, visible, showToast } = useToast()

  const today = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  }, [])

  function getOcupados(fecha, hora) {
    return ocupados[`${fmtDate(fecha)}_${hora}`] || 0
  }

  // days that already have a confirmed shift
  const bookedDays = useMemo(() => new Set(shifts.map(s => fmtDate(s.diaDate))), [shifts])

  function handleZonaSelect(id) {
    setZona(id); setDiaDate(null); setSlot(null); setShifts([]); setMedioPago(null)
  }

  function handleDaySelect(d) {
    setDiaDate(d); setSlot(null)
  }

  function handleSlotSelect(s) {
    setSlot(s)
  }

  function addShift() {
    if (!diaDate || !slot || shifts.length >= MAX_SHIFTS) return
    setShifts(prev => [...prev, { diaDate, slot }])
    setDiaDate(null)
    setSlot(null)
    setMedioPago(null)
  }

  function removeShift(i) {
    setShifts(prev => prev.filter((_, idx) => idx !== i))
    setMedioPago(null)
  }

  function confirmarTurno() {
    setOcupados(prev => {
      const next = { ...prev }
      shifts.forEach(({ diaDate: d, slot: h }) => {
        const key = `${fmtDate(d)}_${h}`
        next[key] = (next[key] || 0) + 1
      })
      return next
    })
    showToast(`✓ ${shifts.length} turno${shifts.length > 1 ? 's' : ''} confirmado${shifts.length > 1 ? 's' : ''}`)
    setTimeout(() => {
      setZona(null); setDiaDate(null); setSlot(null); setShifts([]); setMedioPago(null)
    }, 2800)
  }

  const discountPct = shifts.length === 2 ? 10 : shifts.length === 3 ? 20 : 0
  const canAddMore  = diaDate && slot && shifts.length < MAX_SHIFTS

  return (
    <>
      <Navbar />
      <div className="page-header">
        <h1>Reservá tu turno</h1>
        <p>Elegí la zona, el día y el horario que mejor se adapte a vos</p>
      </div>

      <div className="main">
        <div className="left-col">
          <StepIndicator zona={zona} shifts={shifts} medioPago={medioPago} />

          <ZonaSelector selected={zona} onSelect={handleZonaSelect} />

          <div className="card">
            <div className="card-title">Elegí el día</div>
            <MonthCalendar
              selectedDay={diaDate}
              onDaySelect={handleDaySelect}
              today={today}
              getOcupados={getOcupados}
              bookedDays={bookedDays}
            />
            <div className="card-title" style={{ marginTop: '1.25rem' }}>Elegí el horario</div>
            <SlotGrid
              selectedDay={diaDate}
              selectedSlot={slot}
              onSlotSelect={handleSlotSelect}
              getOcupados={getOcupados}
            />
            {canAddMore && (
              <button className="btn-add-shift" onClick={addShift}>
                + Agregar turno
              </button>
            )}
            {shifts.length === MAX_SHIFTS && diaDate && slot && (
              <p className="shift-max-msg">Máximo {MAX_SHIFTS} turnos por reserva</p>
            )}
          </div>

          {shifts.length > 0 && (
            <div className="card">
              <div className="shifts-header">
                <div className="card-title" style={{ margin: 0 }}>
                  Turnos seleccionados
                </div>
                <span className="shifts-count">{shifts.length}/{MAX_SHIFTS}</span>
              </div>
              <div className="shifts-list">
                {shifts.map((s, i) => (
                  <div key={i} className="shift-row">
                    <div className="shift-row-info">
                      <span className="shift-num">Turno {i + 1}</span>
                      <span className="shift-detail">
                        {fmtDiaLargo(s.diaDate)} · {s.slot} – {nextHour(s.slot)}
                      </span>
                    </div>
                    <button className="shift-remove" onClick={() => removeShift(i)} aria-label="Quitar turno">
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {discountPct > 0 && (
                <div className="discount-banner">
                  🏷️ ¡Tenés un pack de descuento del {discountPct}%!
                </div>
              )}
            </div>
          )}

          {shifts.length > 0 && (
            <PaymentSelector selected={medioPago} onSelect={setMedioPago} />
          )}
        </div>

        <SummaryPanel
          zona={zona}
          shifts={shifts}
          medioPago={medioPago}
          onConfirm={confirmarTurno}
        />
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
