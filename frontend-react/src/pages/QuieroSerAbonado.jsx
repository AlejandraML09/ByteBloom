import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { ZonaSelector } from '../components/turnos/ZonaSelector'
import { MonthCalendar } from '../components/turnos/MonthCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { getDisponibilidad } from '../api/turnos'
import client from '../api/client'
import { fmtDate, fmtDiaLargo, nextHour, getISOWeekKey } from '../utils/dates'
import { ZONA_LABELS } from '../constants/turnos'
import '../css/turnos.css'
import '../css/abonado.css'

const MAX_SHIFTS = 4

function toMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getUsuario() {
  const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const fmt = (n) => `$${Number(n).toLocaleString('es-AR')}`

function CheckIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <polyline points='9 12 11 14 15 10' />
    </svg>
  )
}

function StarIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' stroke='none'>
      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
  )
}

function SuccessScreen({ zona, shifts, onNuevo }) {
  return (
    <div className='sa-success'>
      <div className='sa-success-icon'>
        <CheckIcon size={40} />
      </div>
      <h2 className='sa-success-title'>¡Bienvenida al plan de abono!</h2>
      <p className='sa-success-sub'>
        Tu suscripción a <strong>{ZONA_LABELS[zona?.nombre] ?? zona?.nombre}</strong> fue creada
        correctamente. Ya tenés {shifts.length} sesión{shifts.length > 1 ? 'es' : ''} reservada
        {shifts.length > 1 ? 's' : ''}.
      </p>
      <div className='sa-success-sessions'>
        {shifts.map((s, i) => (
          <div key={i} className='sa-success-session'>
            <span className='sa-success-num'>{i + 1}</span>
            <span>
              {fmtDiaLargo(s.diaDate)} · {s.slot} – {nextHour(s.slot)}
            </span>
          </div>
        ))}
      </div>
      <p className='sa-success-note'>
        El equipo del centro se comunicará con vos para coordinar el primer pago y los detalles de
        tu plan.
      </p>
      <button className='sa-success-btn' onClick={onNuevo}>
        Volver al inicio
      </button>
    </div>
  )
}

export default function QuieroSerAbonado() {
  const navigate = useNavigate()
  const usuario = getUsuario()

  const [zona, setZona] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [shifts, setShifts] = useState([])
  const [clasesDelMes, setClasesDelMes] = useState({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [success, setSuccess] = useState(false)
  const { msg, visible, showToast } = useToast()

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
      setClasesDelMes((prev) => ({ ...prev, [mes]: data }))
    } catch {
      // ignore
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  function getClasesForDay(date) {
    if (!zona) return []
    const mes = toMes(date)
    const all = clasesDelMes[mes] ?? []
    const fechaStr = fmtDate(date)
    return all.filter((c) => c.fecha === fechaStr && c.zona_id === zona.id)
  }

  const clasesDelDia = useMemo(() => {
    if (!diaDate) return []
    return getClasesForDay(diaDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaDate, zona, clasesDelMes])

  // Weeks already occupied by selected shifts
  const blockedWeekKeys = useMemo(
    () => new Set(shifts.map((s) => getISOWeekKey(s.diaDate))),
    [shifts]
  )

  const bookedDays = useMemo(() => new Set(shifts.map((s) => fmtDate(s.diaDate))), [shifts])

  function handleZonaSelect(zonaObj) {
    setZona(zonaObj)
    setDiaDate(null)
    setSlot(null)
    setShifts([])
    setClasesDelMes({})
  }

  function handleDaySelect(d) {
    setDiaDate(d)
    setSlot(null)
  }

  function addShift() {
    if (!diaDate || !slot || shifts.length >= MAX_SHIFTS) return
    const weekKey = getISOWeekKey(diaDate)
    if (blockedWeekKeys.has(weekKey)) {
      showToast('Ya elegiste una sesión en esa semana. Elegí una fecha de otra semana.')
      return
    }
    setShifts((prev) => [...prev, { diaDate, slot }])
    setDiaDate(null)
    setSlot(null)
  }

  function removeShift(i) {
    setShifts((prev) => prev.filter((_, idx) => idx !== i))
  }

  async function confirmar() {
    if (!usuario) {
      navigate('/login')
      return
    }
    if (!zona || shifts.length === 0) {
      showToast('Elegí al menos una sesión antes de confirmar.')
      return
    }

    setConfirmando(true)
    try {
      await client.post('/abonos/solicitar', {
        usuario_id: usuario.id,
        zona_id: zona.id,
        turnos: shifts.map((s) => ({ fecha: fmtDate(s.diaDate), hora: s.slot })),
        medio_pago: 'efectivo',
      })
      setSuccess(true)
    } catch (err) {
      const detail = err?.response?.data?.detail
      showToast(detail || 'No se pudo crear el abono. Intentá de nuevo.')
    } finally {
      setConfirmando(false)
    }
  }

  const canAddMore =
    diaDate &&
    slot &&
    shifts.length < MAX_SHIFTS &&
    !blockedWeekKeys.has(diaDate ? getISOWeekKey(diaDate) : '')

  if (success) {
    return (
      <>
        <Navbar />
        <SuccessScreen zona={zona} shifts={shifts} onNuevo={() => navigate('/')} />
        <Footer />
      </>
    )
  }

  return (
    <>
      <Navbar />
      <div className='page-header'>
        <div className='sa-header-badge'>
          <StarIcon size={14} /> Plan abono
        </div>
        <h1>Quiero ser abonada</h1>
        <p>Elegí tu zona y hasta {MAX_SHIFTS} fechas de sesión — una por semana</p>
      </div>

      <div className='main'>
        <div className='left-col'>
          {/* Zona */}
          <ZonaSelector selected={zona} onSelect={handleZonaSelect} />

          {/* Reglas del abono */}
          <div className={`fade-slide sa-rules-card ${zona ? 'fade-slide--visible' : ''}`}>
            <div className='sa-rules-title'>¿Cómo funciona?</div>
            <ul className='sa-rules-list'>
              <li>
                <span className='sa-rules-dot' />
                Elegí hasta <strong>{MAX_SHIFTS} fechas</strong> en las próximas semanas
              </li>
              <li>
                <span className='sa-rules-dot' />
                Máximo <strong>1 sesión por semana</strong> del calendario
              </li>
              <li>
                <span className='sa-rules-dot' />
                Cuota mensual: <strong>{zona ? fmt(zona.precio) : '—'}/mes</strong>
              </li>
              <li>
                <span className='sa-rules-dot' />
                El primer pago se coordina con el centro
              </li>
            </ul>
          </div>

          {/* Calendario */}
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
                blockedWeekKeys={blockedWeekKeys}
              />
              <div className='card-title' style={{ marginTop: '1.25rem' }}>
                Elegí el horario
              </div>
              <SlotGrid
                selectedDay={diaDate}
                selectedSlot={slot}
                onSlotSelect={setSlot}
                clases={clasesDelDia}
                bookedClaseIds={new Set()}
              />
              {canAddMore && (
                <button className='btn-add-shift' onClick={addShift}>
                  + Agregar sesión ({shifts.length}/{MAX_SHIFTS})
                </button>
              )}
              {diaDate && slot && !canAddMore && shifts.length < MAX_SHIFTS && (
                <p className='shift-max-msg sa-week-warn'>Ya elegiste una sesión en esta semana</p>
              )}
              {shifts.length >= MAX_SHIFTS && (
                <p className='shift-max-msg'>Máximo {MAX_SHIFTS} sesiones por abono</p>
              )}
            </div>
          </div>

          {/* Sesiones seleccionadas */}
          {shifts.length > 0 && (
            <div className='card'>
              <div className='shifts-header'>
                <div className='card-title' style={{ margin: 0 }}>
                  Sesiones seleccionadas
                </div>
                <span className='shifts-count'>
                  {shifts.length}/{MAX_SHIFTS}
                </span>
              </div>
              <div className='shifts-list'>
                {shifts.map((s, i) => (
                  <div key={i} className='shift-row'>
                    <div className='shift-row-info'>
                      <span className='shift-num'>Sesión {i + 1}</span>
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
            </div>
          )}

          {/* Confirmación */}
          {shifts.length > 0 && (
            <div className='sa-confirm-card'>
              <div className='sa-confirm-header'>
                <span className='step-number'>3</span>
                <div>
                  <div className='sa-confirm-title'>Resumen del abono</div>
                  <div className='sa-confirm-sub'>Revisá antes de confirmar</div>
                </div>
              </div>
              <div className='sa-confirm-rows'>
                <div className='sa-confirm-row'>
                  <span>Zona</span>
                  <strong>{ZONA_LABELS[zona?.nombre] ?? zona?.nombre}</strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Sesiones reservadas</span>
                  <strong>
                    {shifts.length} clase{shifts.length > 1 ? 's' : ''}
                  </strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Cuota mensual</span>
                  <strong>{zona ? fmt(zona.precio) : '—'}/mes</strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Pago</span>
                  <strong>A coordinar en el centro</strong>
                </div>
              </div>
              <button className='sa-confirm-btn' onClick={confirmar} disabled={confirmando}>
                {confirmando ? 'Confirmando…' : 'Confirmar suscripción'}
              </button>
              <p className='sa-confirm-note'>
                Nos comunicaremos con vos para completar el proceso de pago.
              </p>
            </div>
          )}
        </div>
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
