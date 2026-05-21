import { useState, useMemo, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
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
import { useWaitlist } from '../components/turnos/WaitList'
import { fmtDate, fmtDiaLargo, nextHour } from '../utils/dates'
import { ZONA_LABELS } from '../constants/turnos'
import DiscountModal from '../components/turnos/Discountmodal'
import '../css/turnos.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const fmtPrecio = (n) => `$${Number(n).toLocaleString('es-AR')}`

const PROMO_BENEFITS = [
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' />
        <circle cx='9' cy='7' r='4' />
        <path d='M23 21v-2a4 4 0 0 0-3-3.87' />
        <path d='M16 3.13a4 4 0 0 1 0 7.75' />
      </svg>
    ),
    title: 'Más clases por mes',
    desc: 'Organizá tus días y asistí cuando lo necesites.',
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <polygon points='13 2 3 14 12 14 11 22 21 10 12 10 13 2' />
      </svg>
    ),
    title: 'Mejor precio',
    desc: 'Ahorrá en comparación a reservas sueltas.',
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <circle cx='12' cy='12' r='10' />
        <polyline points='12 6 12 12 16 14' />
      </svg>
    ),
    title: 'Flexibilidad total',
    desc: 'Elegí tus horarios cada mes según tu disponibilidad.',
  },
  {
    icon: (
      <svg
        width='20'
        height='20'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.8'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
      </svg>
    ),
    title: 'Acompañamiento continuo',
    desc: 'Un plan pensado para tu recuperación y bienestar.',
  },
]

function AbonoPromo({ zonaSeleccionada }) {
  const [minPrecio, setMinPrecio] = useState(null)

  useEffect(() => {
    if (zonaSeleccionada) return
    fetch(`${API_URL}/api/zonas`)
      .then((r) => r.json())
      .then((zonas) => setMinPrecio(Math.min(...zonas.map((z) => z.precio))))
      .catch(() => {})
  }, [zonaSeleccionada])

  const precio = zonaSeleccionada?.precio ?? minPrecio

  return (
    <div className='abono-promo'>
      <div className='abono-promo-top'>
        <div className='abono-promo-badge'>¡Más conveniente!</div>
        <h3 className='abono-promo-title'>¿Querés aprovechar más tu tratamiento?</h3>
        <p className='abono-promo-sub'>
          Convertite en abonado y disfrutá de todos estos beneficios.
        </p>
        <ul className='abono-promo-benefits'>
          {PROMO_BENEFITS.map((b) => (
            <li key={b.title} className='abono-promo-benefit'>
              <span className='abono-promo-benefit-icon'>{b.icon}</span>
              <div>
                <span className='abono-promo-benefit-title'>{b.title}</span>
                <span className='abono-promo-benefit-desc'>{b.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className='abono-promo-footer'>
        {precio != null && (
          <div className='abono-promo-price'>
            Desde <strong>{fmtPrecio(precio)}</strong>
            <span className='abono-promo-price-mes'>/mes</span>
          </div>
        )}
        <Link to='/quiero-ser-abonado' className='abono-promo-cta'>
          Quiero ser abonado
          <svg
            width='14'
            height='14'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2.5'
            strokeLinecap='round'
            strokeLinejoin='round'
          >
            <line x1='5' y1='12' x2='19' y2='12' />
            <polyline points='12 5 19 12 12 19' />
          </svg>
        </Link>
        <p className='abono-promo-more'>Conocé más sobre nuestros planes</p>
      </div>
    </div>
  )
}

const MAX_SHIFTS = 3

function toMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export default function Turnos() {
  const navigate = useNavigate()

  const storedUser = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const user = storedUser ? JSON.parse(storedUser) : null

  // ✅ SI NO HAY SESIÓN, MOSTRAR PANTALLA DE BIENVENIDA CON NAVBAR Y FOOTER
  if (!user) {
    return (
      <div style={{ background: 'linear-gradient(135deg, var(--danger) 0%, var(--danger-dark) 100%)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <div className='welcome-container' style={{ background: 'none', flex: 1 }}>
          <div className='welcome-content'>
            <div className='welcome-header'>
              <h1 style={{ color: 'var(--danger-muted)' }}>Bienvenido a ByteBloom</h1>
              <p style={{ color: 'var(--danger-muted)' }}>Accedé a tu cuenta o crea una nueva para comenzar</p>
            </div>

            <div className='welcome-buttons'>
              <button
                onClick={() => navigate('/login')}
                className='welcome-btn login'
              >
                <span className='welcome-btn-icon'>🔐</span>
                <h3 style={{ color: 'var(--danger-muted)' }}>Iniciar Sesión</h3>
                <p style={{ color: 'var(--danger-muted)' }}>¿Ya tenés cuenta?</p>
              </button>

              <button
                onClick={() => navigate('/registro')}
                className='welcome-btn register'
              >
                <span className='welcome-btn-icon'>✨</span>
                <h3 style={{ color: 'var(--danger-muted)' }}>Crear Cuenta</h3>
                <p style={{ color: 'var(--danger-muted)' }}>Nuevos en ByteBloom?</p>
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

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
  const { waitlistClaseIds, handleWaitlistToggle } = useWaitlist(showToast)

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
  }, [refreshBookedIds])

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
  localStorage.removeItem('pending_shifts')  // ← borrar ANTES
  try {
    const { zonaId, turnos, medioPago, usuarioId } = JSON.parse(pending)
    await reservarTurnos({ zonaId, turnos, medioPago, usuarioId })
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
          params:
            {
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

      <div className='main turnos-main'>
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
                waitlistClaseIds={waitlistClaseIds}
                onWaitlistToggle={handleWaitlistToggle}
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

        <aside className='booking-sidebar'>
          <AbonoPromo zonaSeleccionada={zona} />
        </aside>
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
