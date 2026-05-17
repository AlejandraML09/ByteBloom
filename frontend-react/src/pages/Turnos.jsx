import { useState, useMemo, useEffect, useCallback } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import client from '../api/client'
import { StepIndicator } from '../components/turnos/StepIndicator'
import { ZonaSelector } from '../components/turnos/ZonaSelector'
import { MonthCalendar } from '../components/turnos/MonthCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { PaymentSelector } from '../components/turnos/PaymentSelector'
import { SummaryPanel } from '../components/turnos/SummaryPanel'
import { getDisponibilidad, reservarTurnos } from '../api/turnos'
import { fmtDate, fmtDiaLargo, nextHour } from '../utils/dates'
import DiscountModal from '../components/turnos/Discountmodal'
import '../css/turnos.css'

const MAX_SHIFTS = 3
<<<<<<< HEAD

=======
const PRECIO_TURNO = 20000
>>>>>>> main

function toMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function Turnos() {
  const [zona, setZona] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [shifts, setShifts] = useState([])
  const [medioPago, setMedioPago] = useState(null)
  const [disponibilidad, setDisponibilidad] = useState({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const { msg, visible, showToast } = useToast()
  const [precioTurno, setPrecioTurno] = useState(20000)
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const fetchDisponibilidad = useCallback(async (displayDate) => {
    const mes = toMes(displayDate)
    setLoadingSlots(true)
    try {
      const data = await getDisponibilidad(mes)
      setDisponibilidad((prev) => ({ ...prev, ...data }))
    } catch (err) {
      console.error('Error fetching disponibilidad:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [])
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status === 'approved') {
     const cantidad = parseInt(params.get('cantidad')) || 1
     showToast(`✓ ${cantidad} turno${cantidad > 1 ? 's' : ''} confirmado${cantidad > 1 ? 's' : ''}`)
  }
    if (status === 'failure') showToast('✗ El pago fue rechazado. Intentá de nuevo.')
    if (status === 'pending') showToast('⏳ Tu pago está pendiente de confirmación.')
  }, [])
  useEffect(() => {
    client.get('/api/precios').then(({ data }) => {
      if (data?.precio) setPrecioTurno(data.precio)
    })
  }, [])

  function getOcupados(fecha, hora) {
    return disponibilidad[`${fmtDate(fecha)}_${hora}`] || 0
  }

  const bookedDays = useMemo(() => new Set(shifts.map((s) => fmtDate(s.diaDate))), [shifts])

  function handleZonaSelect(id) {
    setZona(id)
    setDiaDate(null)
    setSlot(null)
    setShifts([])
    setMedioPago(null)
  }

  function handleDaySelect(d) {
    setDiaDate(d)
    setSlot(null)
  }

  function addShift() {
    if (!diaDate || !slot || shifts.length >= MAX_SHIFTS) return
    setShifts((prev) => [...prev, { diaDate, slot }])
    setDiaDate(null)
    setSlot(null)
  }

  function removeShift(i) {
    setShifts((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function confirmarTurno() {
    if (!medioPago) {
      showToast('Por favor seleccioná un medio de pago.')
      return
    }

    setConfirmando(true)
    try {
      if (['mercadopago', 'credito', 'debito'].includes(medioPago)) {
        const { data } = await client.post('/api/crear-preferencia', null, {
          params: {
            servicio_id: 1,
<<<<<<< HEAD
            precio:  precioTurno ,
            titulo: `Clase ${zona}`,
            cantidad: shifts.length 
          }
=======
            precio: PRECIO_TURNO,
            titulo: `Clase ${zona}`,
          },
>>>>>>> main
        })
        if (data?.init_point) {
          window.location.href = data.init_point
          return
        }
        showToast('No se pudo obtener el link de pago.')
        return
      }
      await reservarTurnos({
        zona,
        turnos: shifts.map((s) => ({ fecha: fmtDate(s.diaDate), hora: s.slot })),
        medioPago,
      })

      const affectedMonths = [...new Set(shifts.map((s) => toMes(s.diaDate)))]
      const refreshed = {}
      await Promise.all(
        affectedMonths.map(async (mes) => {
          const data = await getDisponibilidad(mes)
          Object.assign(refreshed, data)
        })
      )
      setDisponibilidad((prev) => ({ ...prev, ...refreshed }))
      showToast(
        `✓ ${shifts.length} turno${shifts.length > 1 ? 's' : ''} confirmado${shifts.length > 1 ? 's' : ''}`
      )
      setTimeout(() => {
        setZona(null)
        setDiaDate(null)
        setSlot(null)
        setShifts([])
        setMedioPago(null)
      }, 2800)
    } catch (err) {
      const detail = err?.response?.data?.detail
      showToast(detail || 'Error al confirmar el turno. Intentá de nuevo.')
    } finally {
      setConfirmando(false)
    }
  }

  const discountPct = shifts.length === 2 ? 10 : shifts.length === 3 ? 20 : 0
  const allFilled = zona && shifts.length > 0 && medioPago
  const canAddMore = diaDate && slot && shifts.length < MAX_SHIFTS
  const [showDiscounts, setShowDiscounts] = useState(() => !sessionStorage.getItem('discountSeen'))

  function handleCloseDiscount() {
    sessionStorage.setItem('discountSeen', '1')
    setShowDiscounts(false)
  }

  return (
    <>
      <Navbar />
      <div className='page-header'>
        <h1>Reservá tu turno</h1>
        <p>Elegí la zona, el día y el horario que mejor se adapte a vos</p>
      </div>

      <div className='main'>
        <div className='left-col'>
          <StepIndicator zona={zona} shifts={shifts} medioPago={medioPago} />
          <ZonaSelector selected={zona} onSelect={handleZonaSelect} />
          <div className={`fade-slide ${zona ? 'fade-slide--visible' : ''}`}>
            <div className='card'>
              <div className='card-title'>
                <span className='step-number'>2</span> Elegí el día
                {loadingSlots && <span className='loading-hint'> · cargando…</span>}
              </div>
              <MonthCalendar
                selectedDay={diaDate}
                onDaySelect={handleDaySelect}
                today={today}
                getOcupados={getOcupados}
                bookedDays={bookedDays}
                onMonthChange={fetchDisponibilidad}
              />
              <div className='card-title' style={{ marginTop: '1.25rem' }}>
                Elegí el horario
              </div>
              <SlotGrid
                selectedDay={diaDate}
                selectedSlot={slot}
                onSlotSelect={setSlot}
                getOcupados={getOcupados}
              />
              {canAddMore && (
                <button className='btn-add-shift' onClick={addShift}>
                  + Agregar turno
                </button>
              )}
              {shifts.length === MAX_SHIFTS && diaDate && slot && (
                <p className='shift-max-msg'>Máximo {MAX_SHIFTS} turnos por reserva</p>
              )}
            </div>
          </div>

          {shifts.length > 0 && (
            <div className='card'>
              <div className='shifts-header'>
                <div className='card-title' style={{ margin: 0 }}>
                  Turnos seleccionados
                </div>
                <span className='shifts-count'>
                  {shifts.length}/{MAX_SHIFTS}
                </span>
              </div>
              <div className='shifts-list'>
                {shifts.map((s, i) => (
                  <div key={i} className='shift-row'>
                    <div className='shift-row-info'>
                      <span className='shift-num'>Turno {i + 1}</span>
                      <span className='shift-detail'>
                        {fmtDiaLargo(s.diaDate)} · {s.slot} – {nextHour(s.slot)}
                      </span>
                    </div>
                    <button className='shift-remove' onClick={() => removeShift(i)}>
                      ×
                    </button>
                  </div>
                ))}
              </div>
              {discountPct > 0 && (
                <div className='discount-banner'>
                  🏷️ ¡Tenés un pack de descuento del {discountPct}%!
                </div>
              )}
            </div>
          )}
          <div className={`fade-slide ${shifts.length > 0 ? 'fade-slide--visible' : ''}`}>
            <PaymentSelector selected={medioPago} onSelect={setMedioPago} />
          </div>
        </div>
      </div>

      <div className={`fade-slide summary-bottom-wrap ${allFilled ? 'fade-slide--visible' : ''}`}>
        <SummaryPanel
          zona={zona}
          shifts={shifts}
          medioPago={medioPago}
          onConfirm={confirmarTurno}
          confirmando={confirmando}
        />
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
      <DiscountModal isOpen={showDiscounts} onClose={() => setShowDiscounts(false)} />
    </>
  )
}
