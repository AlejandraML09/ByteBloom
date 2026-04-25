import { useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { StepIndicator } from '../components/turnos/StepIndicator'
import { ZonaSelector } from '../components/turnos/ZonaSelector'
import { WeekCalendar } from '../components/turnos/WeekCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { BookingForm } from '../components/turnos/BookingForm'
import { SummaryPanel } from '../components/turnos/SummaryPanel'
import { HORARIOS } from '../constants/turnos'
import { fmtDate, fmtDiaLargo } from '../utils/dates'
import '../css/turnos.css'

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

  function getOcupados(fecha, hora) {
    return ocupados[`${fmtDate(fecha)}_${hora}`] || 0
  }

  function handleZonaSelect(id) {
    setZona(id)
    setDiaDate(null)
    setSlot(null)
  }

  function handleDaySelect(d) {
    setDiaDate(d)
    setSlot(null)
  }

  function handleFormChange(field, value) {
    if (field === 'nombre') setNombre(value)
    else if (field === 'apellido') setApellido(value)
    else if (field === 'tel') setTel(value)
    else if (field === 'email') setEmail(value)
    else if (field === 'os') setOs(value)
  }

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

  return (
    <>
      <Navbar />

      <div className="page-header">
        <h1>Reservá tu turno</h1>
        <p>Elegí la zona, el día y el horario que mejor se adapte a vos</p>
      </div>

      <div className="main">
        <div className="left-col">
          <StepIndicator zona={zona} slot={slot} />

          <ZonaSelector selected={zona} onSelect={handleZonaSelect} />

          <div className="card">
            <div className="card-title">Elegí el día</div>
            <WeekCalendar
              weekOffset={weekOffset}
              onWeekChange={setWeekOffset}
              selectedDay={diaDate}
              onDaySelect={handleDaySelect}
              today={today}
            />
            <div className="card-title" style={{ marginTop: '1.25rem' }}>Elegí el horario</div>
            <SlotGrid
              selectedDay={diaDate}
              selectedSlot={slot}
              onSlotSelect={setSlot}
              getOcupados={getOcupados}
            />
          </div>

          <BookingForm
            values={{ nombre, apellido, tel, email, os }}
            onChange={handleFormChange}
          />
        </div>

        <SummaryPanel
          zona={zona}
          diaDate={diaDate}
          slot={slot}
          nombre={nombre}
          apellido={apellido}
          os={os}
          onConfirm={confirmarTurno}
        />
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
