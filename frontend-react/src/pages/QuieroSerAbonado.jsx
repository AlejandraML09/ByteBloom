import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { ZonaSelector } from '../components/turnos/ZonaSelector'
import { MonthCalendar } from '../components/turnos/MonthCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { PaymentSelector } from '../components/turnos/PaymentSelector'
import { getDisponibilidad } from '../api/turnos'
import { getMisAbonos } from '../api/abonos'
import client from '../api/client'
import { fmtDate, fmtDiaLargo, nextHour, getISOWeekKey, MESES_ES } from '../utils/dates'
import { ZONA_LABELS } from '../constants/turnos'
import '../css/turnos.css'
import '../css/abonado.css'

// Nota: el número de sesiones requeridas ya no es fijo.
// Se calcula dinámicamente según semanas calendario del mes objetivo.

const MEDIO_PAGO_DB = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cuentadni: 'Efectivo',
  modo: 'Transferencia',
  mercadopago: 'Mercado Pago',
  debito: 'Mercado Pago',
  credito: 'Mercado Pago',
}

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

function computeEnrollment() {
  const now = new Date()
  const day = now.getDate()
  const isOpen = day <= 10
  const targetDate = isOpen
    ? new Date(now.getFullYear(), now.getMonth(), 1)
    : new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const monthOffset = isOpen ? 0 : 1
  const monthName = `${MESES_ES[targetDate.getMonth()].toLowerCase()} ${targetDate.getFullYear()}`
  return { isOpen, targetDate, monthOffset, monthName }
}

function computeMaxShiftsForEnrollment(enrollment, today) {
  if (!enrollment || !enrollment.targetDate) return 0
  const targetStart = new Date(enrollment.targetDate.getFullYear(), enrollment.targetDate.getMonth(), 1)
  // Si la inscripción está cerrada (estás reservando antes de que inicie el mes),
  // se cuenta desde el 1 del mes objetivo. Si está abierta (1-10), se cuenta
  // desde la fecha actual (día de la reserva) dentro de ese mes.
  const start = enrollment.isOpen ? (today > targetStart ? today : targetStart) : targetStart
  const end = new Date(targetStart.getFullYear(), targetStart.getMonth() + 1, 0)

  const weeks = new Set()
  const d = new Date(start)
  // Asegurarnos que iteramos sólo dentro del mes objetivo
  while (d <= end) {
    if (d.getFullYear() === targetStart.getFullYear() && d.getMonth() === targetStart.getMonth()) {
      weeks.add(getISOWeekKey(d))
    }
    d.setDate(d.getDate() + 1)
  }
  return weeks.size
}

function StarIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox='0 0 24 24' fill='currentColor' stroke='none'>
      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
  )
}

function InfoIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='12' cy='12' r='10' />
      <line x1='12' y1='8' x2='12' y2='12' />
      <line x1='12' y1='16' x2='12.01' y2='16' />
    </svg>
  )
}

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

function SuccessScreen({ zona, shifts, onVolver }) {
  return (
    <div className='sa-success'>
      <div className='sa-success-icon'>
        <CheckIcon size={40} />
      </div>
      <h2 className='sa-success-title'>¡Bienvenido/a al plan de abono!</h2>
      <p className='sa-success-sub'>
        Tu suscripción a <strong>{ZONA_LABELS[zona?.nombre] ?? zona?.nombre}</strong>{' '} fue creada.
        Tenés {shifts.length} sesione{shifts.length !== 1 ? 's' : ''} reservada
        {shifts.length !== 1 ? 's' : ''}.
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
        El equipo del centro se comunicará con vos para coordinar los detalles de tu plan.
      </p>
      <button className='sa-success-btn' onClick={onVolver}>
        Volver al inicio
      </button>
    </div>
  )
}

export default function QuieroSerAbonado() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const enrollment = useMemo(computeEnrollment, [])

  const [zona, setZona] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [shifts, setShifts] = useState([])
  const [medioPago, setMedioPago] = useState(null)
  const [clasesDelMes, setClasesDelMes] = useState({})
  const [activeAbonoZonaIds, setActiveAbonoZonaIds] = useState(new Set())
  const [blockedZonaName, setBlockedZonaName] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirmando, setConfirmando] = useState(false)
  const [success, setSuccess] = useState(false)
  const [successData, setSuccessData] = useState(null)
  const { msg, visible, showToast } = useToast()

  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const requiredShifts = useMemo(() => computeMaxShiftsForEnrollment(enrollment, today), [
    enrollment,
    today,
  ])

  const monthlyPrice = useMemo(() => {
    if (!zona || !zona.precio) return 0
    return zona.precio * requiredShifts
  }, [zona, requiredShifts])

  const [isFinalizingPayment, setIsFinalizingPayment] = useState(false)

  useEffect(() => {
    if (!usuario?.id) return
    getMisAbonos(usuario.id)
      .then((data) => {
        const activeZones = new Set(
          Array.isArray(data)
            ? data.filter((abono) => abono.activo).map((abono) => abono.zona_id)
            : []
        )
        setActiveAbonoZonaIds(activeZones)
      })
      .catch(() => {
        setActiveAbonoZonaIds(new Set())
      })
  }, [usuario?.id])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const status = params.get('status')
    if (!status) return

    const pendingRaw = sessionStorage.getItem('pending_abono')
    const pendingAbono = pendingRaw ? JSON.parse(pendingRaw) : null

    const clearSearch = () => {
      const url = window.location.pathname
      window.history.replaceState({}, '', url)
    }

    if (status === 'approved') {
      const uiRaw = sessionStorage.getItem('pending_abono_ui')

      if (uiRaw) {
        const parsed = JSON.parse(uiRaw)

        setSuccessData({
          ...parsed,
            shifts: parsed.shifts.map((s) => ({
              ...s,
              diaDate: new Date(s.diaDate),
          })),
        })
      }
      if (pendingAbono) {
        setIsFinalizingPayment(true)
        client
          .post('/abonos/solicitar', pendingAbono)
          .then(() => {
            sessionStorage.removeItem('pending_abono')
            setSuccess(true)
          })
          .catch((err) => {
            showToast(err?.response?.data?.detail || 'No se pudo completar el abono luego del pago.')
          })
          .finally(() => {
            setIsFinalizingPayment(false)
            clearSearch()
          })
      } else {
        showToast('No se encontró el abono pendiente. Intentá nuevamente.')
        clearSearch()
      }
      return
    }

    if (status === 'failure') {
      sessionStorage.removeItem('pending_abono')
      showToast('El pago fue rechazado. Intentá de nuevo.')
      clearSearch()
      return
    }

    if (status === 'pending') {
      showToast('Tu pago está pendiente de confirmación.')
      clearSearch()
    }
  }, [])

  const fetchDisponibilidad = useCallback(async (displayDate) => {
    const mes = toMes(displayDate)
    setLoadingSlots(true)
    try {
      const data = await getDisponibilidad(mes)
      setClasesDelMes((prev) => ({ ...prev, [mes]: data }))
    } catch {
      /* ignore */
    } finally {
      setLoadingSlots(false)
    }
  }, [])

  function getClasesForDay(date) {
    if (!zona) return []
    if (
      date.getMonth() !== enrollment.targetDate.getMonth() ||
      date.getFullYear() !== enrollment.targetDate.getFullYear()
    )
      return []
    const mes = toMes(date)
    const all = clasesDelMes[mes] ?? []
    return all.filter((c) => c.fecha === fmtDate(date) && c.zona_id === zona.id)
  }

  const clasesDelDia = useMemo(() => {
    if (!diaDate) return []
    return getClasesForDay(diaDate)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaDate, zona, clasesDelMes])

  const blockedWeekKeys = useMemo(
    () => new Set(shifts.map((s) => getISOWeekKey(s.diaDate))),
    [shifts]
  )
  const bookedDays = useMemo(() => new Set(shifts.map((s) => fmtDate(s.diaDate))), [shifts])

  function handleZonaSelect(zonaObj) {
    if (activeAbonoZonaIds.has(zonaObj.id)) {
      setBlockedZonaName(ZONA_LABELS[zonaObj.nombre] ?? zonaObj.nombre)
      showToast('Ya tenés un abono activo en esta zona. Modificálo en Mis Reservas.')
      return
    }
    setBlockedZonaName(null)
    setZona(zonaObj)
    setDiaDate(null)
    setSlot(null)
    setShifts([])
    setMedioPago(null)
  }

  useEffect(() => {
    if (zona && activeAbonoZonaIds.has(zona.id)) {
      setBlockedZonaName(ZONA_LABELS[zona.nombre] ?? zona.nombre)
      showToast('Ya tenés un abono activo en esta zona. Modificálo en Mis Reservas.')
      setZona(null)
      setDiaDate(null)
      setSlot(null)
      setShifts([])
      setMedioPago(null)
    }
  }, [zona, activeAbonoZonaIds])

  function addShift() {
    if (!diaDate || !slot || shifts.length >= requiredShifts) return
    if (blockedWeekKeys.has(getISOWeekKey(diaDate))) {
      showToast('Ya elegiste una sesión en esa semana. Elegí otra semana.')
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

    if (shifts.length < requiredShifts) {
      showToast(`Necesitás seleccionar exactamente ${requiredShifts} sesiones.`)
      return
    }

    if (!medioPago) {
      showToast('Por favor seleccioná un medio de pago.')
      return
    }

    setConfirmando(true)

    try {
      // ✅ PAGOS CON MERCADOPAGO
      if (['mercadopago', 'credito', 'debito'].includes(medioPago)) {
        const payload = {
          usuario_id: usuario.id,
          zona_id: zona.id,
          turnos: shifts.map((s) => ({
            fecha: fmtDate(s.diaDate),
            hora: s.slot,
          })),
          medio_pago: MEDIO_PAGO_DB[medioPago] ?? medioPago,
        }

        sessionStorage.setItem('pending_abono', JSON.stringify(payload))

        sessionStorage.setItem(
          'pending_abono_ui',
          JSON.stringify({
            zona,
            shifts,
          })
        )

        const { data } = await client.post('/api/crear-preferencia', null, {
          params: {
            servicio_id: zona?.id ?? 1,
            precio: monthlyPrice ?? 0,
            titulo: `Abono ${zona?.nombre ?? ''}`,
            cantidad: 1,
            success_path: '/quiero-ser-abonado?status=approved',
            failure_path: '/quiero-ser-abonado?status=failure',
            pending_path: '/quiero-ser-abonado?status=pending',
          },
        })

        if (data?.init_point) {
          window.location.href = data.init_point
          return
        }

        showToast('No se pudo obtener el link de pago.')
        return
      }

      if (activeAbonoZonaIds.has(zona.id)) {
        showToast(
          'No podés crear otro abono en la misma zona. Modificá tu abono desde Mis Reservas.'
        )
        return
      }

      await client.post('/abonos/solicitar', {
        usuario_id: usuario.id,
        zona_id: zona.id,
        turnos: shifts.map((s) => ({
          fecha: fmtDate(s.diaDate),
          hora: s.slot,
        })),
        medio_pago: MEDIO_PAGO_DB[medioPago] ?? medioPago,
      })

      setSuccess(true)
    } catch (err) {
      showToast(
        err?.response?.data?.detail ||
        'No se pudo crear el abono. Intentá de nuevo.'
      )
    } finally {
      setConfirmando(false)
    }
  }

  const canAddMore =
    diaDate &&
    slot &&
    shifts.length < requiredShifts &&
    !blockedWeekKeys.has(getISOWeekKey(diaDate))
  const allComplete = shifts.length === requiredShifts && !!medioPago

  if (success) {
    return (
      <>
        <Navbar />
        <SuccessScreen
          zona={successData?.zona || zona}
          shifts={successData?.shifts || shifts}
          onVolver={() => navigate('/')}
        />
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
        <h1>Quiero ser abonado</h1>
        <p>Elegí tu zona y las {requiredShifts} fechas del mes — una por semana</p>
      </div>

      <div className='main'>
        <div className='left-col'>
          <div
            className={`sa-enrollment-banner${enrollment.isOpen ? ' sa-enrollment-banner--open' : ' sa-enrollment-banner--closed'}`}
          >
            <InfoIcon size={16} />
            {enrollment.isOpen ? (
              <span>
                <strong>Inscripción abierta</strong> — podés suscribirte hasta el{' '}
                <strong>10 de {enrollment.monthName}</strong>. Las fechas que elegís son para{' '}
                <strong>{enrollment.monthName}</strong>.
              </span>
            ) : (
              <span>
                La inscripción de este mes cerró el día 10.{' '}
                <strong>Estás eligiendo fechas para {enrollment.monthName}</strong>. La próxima
                ventana de pago abre el <strong>1 de {enrollment.monthName}</strong>.
              </span>
            )}
          </div>

          <ZonaSelector selected={zona} onSelect={handleZonaSelect} />

          <div className={`fade-slide sa-rules-card ${zona ? 'fade-slide--visible' : ''}`}>
            <div className='sa-rules-title'>¿Cómo funciona?</div>
            <ul className='sa-rules-list'>
              <li>
                <span className='sa-rules-dot' />
                Máximo <strong>1 sesión por semana</strong> del calendario
              </li>
              <li>
                <span className='sa-rules-dot' />
                Cuota mensual: <strong>{zona ? fmt(monthlyPrice) : '—'}/mes</strong>
              </li>
              <li>
                <span className='sa-rules-dot' />
                La inscripción está abierta del <strong>1 al 10 de cada mes</strong>
              </li>
            </ul>
          </div>

          {blockedZonaName ? (
            <div className='card sa-blocked-zone-card'>
              <div className='sa-blocked-zone-title'>Zona ya abonada</div>
              <p>
                Ya tenés un abono activo en <strong>{blockedZonaName}</strong>. Para cambiar tus fechas,
                entrá en <strong>Mis Reservas</strong> y modificá el abono correspondiente.
              </p>
            </div>
          ) : (
            <div className={`fade-slide ${zona ? 'fade-slide--visible' : ''}`}>
              <div className='card'>
                <div className='card-title'>
                  <span className='step-number'>2</span> Elegí el día en {enrollment.monthName}
                  {loadingSlots && <span className='loading-hint'> · cargando…</span>}
                </div>
                <MonthCalendar
                  selectedDay={diaDate}
                  onDaySelect={(d) => {
                    setDiaDate(d)
                    setSlot(null)
                  }}
                  today={today}
                  getClasesForDay={getClasesForDay}
                  bookedDays={bookedDays}
                  onMonthChange={fetchDisponibilidad}
                  blockedWeekKeys={blockedWeekKeys}
                  defaultMonthOffset={enrollment.monthOffset}
                  minMonthOffset={enrollment.monthOffset}
                  maxMonthOffset={enrollment.monthOffset}
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
                  + Agregar sesión ({shifts.length}/{requiredShifts})
                </button>
              )}
              {diaDate && slot && !canAddMore && shifts.length < requiredShifts && (
                <p className='shift-max-msg sa-week-warn'>Ya elegiste una sesión esta semana</p>
              )}
              {shifts.length >= requiredShifts && (
                <p className='shift-max-msg'>
                  Completaste las {requiredShifts} sesiones requeridas
                </p>
              )}
            </div>
          </div>
        )}

          {shifts.length > 0 && (
            <div className='card'>
              <div className='shifts-header'>
                <div className='card-title' style={{ margin: 0 }}>
                  Sesiones seleccionadas
                </div>
                <span
                  className={`shifts-count${shifts.length === requiredShifts ? ' shifts-count--complete' : ''}`}
                >
                  {shifts.length}/{requiredShifts}
                </span>
              </div>
              {shifts.length < requiredShifts && (
                <p className='sa-missing-hint'>
                  Falta{requiredShifts - shifts.length > 1 ? 'n' : ''}{' '}
                  {requiredShifts - shifts.length} sesión
                  {requiredShifts - shifts.length > 1 ? 'es' : ''} para completar el abono
                </p>
              )}
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

          {/* Paso 3: Medio de pago */}
          <div
            className={`fade-slide ${shifts.length === requiredShifts ? 'fade-slide--visible' : ''}`}
          >
            <PaymentSelector
              selected={medioPago}
              onSelect={setMedioPago}
              allowCreditos={false}
              showCreditsNotice={false}
            />
          </div>

          {shifts.length === requiredShifts && (
            <div className='sa-confirm-card'>
              <div className='sa-confirm-header'>
                <span className='step-number'>4</span>
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
                  <span>Mes de inicio</span>
                  <strong style={{ textTransform: 'capitalize' }}>{enrollment.monthName}</strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Sesiones por mes</span>
                  <strong>{shifts.length} clases</strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Cuota mensual</span>
                  <strong>{zona ? fmt(monthlyPrice) : '—'}/mes</strong>
                </div>
                <div className='sa-confirm-row'>
                  <span>Medio de pago</span>
                  <strong>
                    {medioPago
                      ? medioPago === 'mercadopago'
                        ? 'MercadoPago'
                        : medioPago === 'efectivo'
                          ? 'Efectivo / Transferencia'
                          : medioPago
                      : '—'}
                  </strong>
                </div>
              </div>
              <button
                className='sa-confirm-btn'
                onClick={confirmar}
                disabled={confirmando || !allComplete}
              >
                {confirmando
                  ? 'Procesando…'
                  : ['mercadopago', 'credito', 'debito'].includes(medioPago)
                    ? 'Pagar con MercadoPago'
                    : 'Confirmar suscripción'}
              </button>
              {!['mercadopago', 'credito', 'debito'].includes(medioPago) && (
                <p className='sa-confirm-note'>
                  El equipo del centro se comunicará con vos para coordinar el primer pago.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}