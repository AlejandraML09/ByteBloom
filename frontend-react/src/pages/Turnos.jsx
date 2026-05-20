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
import { getDisponibilidad, reservarTurnos, getMisTurnos } from '../api/turnos'
import { fmtDate, fmtDiaLargo, nextHour } from '../utils/dates'
import DiscountModal from '../components/turnos/Discountmodal'
import '../css/turnos.css'

const MAX_SHIFTS = 3

function toMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function Turnos() {
  // zona is the full zona object { id, nombre, precio, descripcion, activo }
  const [zona, setZona] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [shifts, setShifts] = useState([])
  const [medioPago, setMedioPago] = useState(null)
  // clasesDelMes: { "YYYY-MM": [claseProgramada, ...] }
  const [clasesDelMes, setClasesDelMes] = useState({})
  // Set of clase_programada_id values the logged-in user has already booked (non-cancelled)
  const [bookedClaseIds, setBookedClaseIds] = useState(new Set())
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const { msg, visible, showToast } = useToast()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const refreshBookedIds = useCallback(async () => {
    const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
    const usuario = stored ? JSON.parse(stored) : null
    if (!usuario?.id) return
    try {
      const reservas = await getMisTurnos(usuario.id)
      setBookedClaseIds(
        new Set(reservas.filter((r) => r.estado !== 'cancelada').map((r) => r.clase_programada_id))
      )
    } catch {
      // silently ignore — booking checks will still protect server-side
    }
  }, [])

  useEffect(() => {
    refreshBookedIds()
  }, [])

  const fetchDisponibilidad = useCallback(async (displayDate) => {
    const mes = toMes(displayDate)
    setLoadingSlots(true)
    try {
      const data = await getDisponibilidad(mes)
      setClasesDelMes((prev) => ({ ...prev, [mes]: data }))
    } catch (err) {
      console.error('Error fetching disponibilidad:', err)
    } finally {
      setLoadingSlots(false)
    }
  }, [])

 useEffect(() => {
  const run = async () => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (status === 'approved') {
      const cantidad = parseInt(params.get('cantidad')) || 1
      const pending = localStorage.getItem('pending_shifts')
      if (pending) {
        try {
          const { zonaId, turnos, medioPago, usuarioId } = JSON.parse(pending)
          await reservarTurnos({ zonaId, turnos, medioPago, usuarioId })
          localStorage.removeItem('pending_shifts')
          refreshBookedIds()
        } catch (err) {
          console.error('Error al reservar tras pago:', err)
        }
      }
      showToast(`✓ ${cantidad} turno${cantidad > 1 ? 's' : ''} confirmado${cantidad > 1 ? 's' : ''}`)
    }
    if (status === 'failure') showToast('✗ El pago fue rechazado. Intentá de nuevo.')
    if (status === 'pending') showToast('⏳ Tu pago está pendiente de confirmación.')
  }
  run()
}, [])

  // Returns all classes for a given day filtered by the selected zona
  function getClasesForDay(date) {
    if (!zona) return []
    const mes = toMes(date)
    const all = clasesDelMes[mes] ?? []
    const fechaStr = fmtDate(date)
    return all.filter((c) => c.fecha === fechaStr && c.zona_id === zona.id)
  }

  // Classes for the currently selected day (used by SlotGrid)
  const clasesDelDia = useMemo(() => {
    if (!diaDate) return []
    return getClasesForDay(diaDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaDate, zona, clasesDelMes])

  const bookedDays = useMemo(() => new Set(shifts.map((s) => fmtDate(s.diaDate))), [shifts])

  function handleZonaSelect(zonaObj) {
    setZona(zonaObj)
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
            servicio_id: zona?.id ?? 1,
            precio: zona?.precio ?? 0,
            titulo: `Clase ${zona?.nombre ?? ''}`,
            cantidad: shifts.length,
          },
        })
        if (data?.init_point) {
  const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const usuarioId = stored ? JSON.parse(stored)?.id : null
  localStorage.setItem('pending_shifts', JSON.stringify({
    zonaId: zona.id,
    turnos: shifts.map((s) => ({ fecha: fmtDate(s.diaDate), hora: s.slot })),
    medioPago,
    usuarioId,
  }))
  window.location.href = data.init_point
  return
}
        showToast('No se pudo obtener el link de pago.')
        return
      }

      const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
      const usuarioId = stored ? JSON.parse(stored)?.id : null

      await reservarTurnos({
        zonaId: zona.id,
        turnos: shifts.map((s) => ({ fecha: fmtDate(s.diaDate), hora: s.slot })),
        medioPago,
        usuarioId,
      })

      // Refresh availability for all affected months
      const affectedMonths = [...new Set(shifts.map((s) => toMes(s.diaDate)))]
      await Promise.all(
        affectedMonths.map((mes) =>
          getDisponibilidad(mes).then((data) =>
            setClasesDelMes((prev) => ({ ...prev, [mes]: data }))
          )
        )
      )

      refreshBookedIds()
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
                getClasesForDay={getClasesForDay}
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
                clases={clasesDelDia}
                bookedClaseIds={bookedClaseIds}
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
