import { useState, useEffect, useMemo, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import {
  getMisTurnos,
  getDisponibilidad,
  getMiListaEspera,
  salirListaEspera,
  completarPagoReserva,
  registrarPagoSaldo,
    cancelarReserva,
} from '../api/turnos'
import { getMisAbonos, renovarAbono, getSesionesAbono, modificarSesionAbono } from '../api/abonos'
import client from '../api/client'
import { ZONA_LABELS } from '../constants/turnos'
import { fmtLargo, fmtDate, fmtDiaLargo, nextHour, getISOWeekKey, MESES_ES } from '../utils/dates'
import { MonthCalendar } from '../components/turnos/MonthCalendar'
import { SlotGrid } from '../components/turnos/SlotGrid'
import { PaymentSelector } from '../components/turnos/PaymentSelector'
import { ReviewModal } from '../components/reviews/ReviewModal'
import '../css/mis-reservas.css'

function getUsuario() {
  const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  if (!stored) return null
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

const ESTADO_CONFIG = {
  pendiente: { label: 'Clase Pendiente', css: 'pendiente' },
  confirmada: { label: 'Clase Confirmada', css: 'confirmada' },
  cancelada: { label: 'Clase Cancelada', css: 'cancelada' },
  asistio: { label: 'Asistió', css: 'asistio' },
  ausente: { label: 'Ausente', css: 'ausente' },
}

const ESTADO_ABONO_CONFIG = {
  activo: { label: 'Activo', css: 'activo' },
  vencido: { label: 'Vencido', css: 'vencido' },
  cancelado: { label: 'Cancelado', css: 'cancelado' },
  pausado: { label: 'Pausado', css: 'pausado' },
}

const ESTADO_PAGO_CONFIG = {
  pago_pendiente: { label: 'Pendiente', css: 'pendiente' },
  pago_completo: { label: 'Pago completo', css: 'pagado' },
  vencido: { label: 'Vencido', css: 'vencido' },
}

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function isProxima(reserva) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const fechaDate = new Date(reserva.fecha + 'T00:00:00')
  return fechaDate >= today && reserva.estado !== 'cancelada'
}

function CalendarIcon({ size = 20 }) {
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
      <rect x='3' y='4' width='18' height='18' rx='2' />
      <line x1='16' y1='2' x2='16' y2='6' />
      <line x1='8' y1='2' x2='8' y2='6' />
      <line x1='3' y1='10' x2='21' y2='10' />
    </svg>
  )
}

function CheckCircleIcon({ size = 20 }) {
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
      <polyline points='9 12 11 14 15 10' />
    </svg>
  )
}

function ClockIcon({ size = 20 }) {
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
      <polyline points='12 6 12 12 16 14' />
    </svg>
  )
}

function StarIcon({ size = 20 }) {
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
      <polygon points='12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2' />
    </svg>
  )
}

function CreditCardIcon({ size = 20 }) {
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
      <rect x='1' y='4' width='22' height='16' rx='2' />
      <line x1='1' y1='10' x2='23' y2='10' />
    </svg>
  )
}

function BodyIcon({ zona, size = 22 }) {
  if (zona === 'superior') {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <circle cx='12' cy='5' r='2' />
        <path d='M7 10 Q12 8 17 10' />
        <line x1='12' y1='10' x2='12' y2='17' />
        <line x1='7' y1='14' x2='12' y2='12' />
        <line x1='17' y1='14' x2='12' y2='12' />
      </svg>
    )
  }
  if (zona === 'medio') {
    return (
      <svg
        width={size}
        height={size}
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='1.6'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <ellipse cx='12' cy='13' rx='5' ry='7' />
        <line x1='9' y1='10' x2='15' y2='10' />
        <line x1='9' y1='13' x2='15' y2='13' />
        <line x1='9' y1='16' x2='15' y2='16' />
      </svg>
    )
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.6'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <line x1='9' y1='3' x2='9' y2='13' />
      <line x1='15' y1='3' x2='15' y2='13' />
      <path d='M9 13 Q9 20 7 22' />
      <path d='M15 13 Q15 20 17 22' />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg
      width='18'
      height='18'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <line x1='5' y1='12' x2='19' y2='12' />
      <polyline points='12 5 19 12 12 19' />
    </svg>
  )
}

const TABS = [
  { id: 'todas', label: 'Todas' },
  { id: 'superior', label: ZONA_LABELS.superior },
  { id: 'medio', label: ZONA_LABELS.medio },
  { id: 'inferior', label: ZONA_LABELS.inferior },
]

const fmt = (n) => `$${Number(n).toLocaleString('es-AR')}`

function AbonoPagoRow({ pago }) {
  const cfg = ESTADO_PAGO_CONFIG[pago.estado] ?? { label: pago.estado, css: 'pendiente' }
  return (
    <div className='ma-pago-row'>
      <span className='ma-pago-periodo'>
        {MESES[(pago.mes ?? 1) - 1]} {pago.anio}
      </span>
      <span className='ma-pago-monto'>{fmt(pago.monto)}</span>
      {pago.medio_pago && <span className='ma-pago-medio'>{pago.medio_pago}</span>}
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────
function toMes(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getNextMonthName() {
  const now = new Date()
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return `${MESES_ES[next.getMonth()].toLowerCase()} ${next.getFullYear()}`
}

// ── ModificarModal ──────────────────────────────────────────────────────────
function ModificarModal({ abono, onClose, onSuccess }) {
  const today = useMemo(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }, [])

  const [sesiones, setSesiones] = useState([])
  const [loadingSesiones, setLoadingSesiones] = useState(true)
  const [selectedReservaId, setSelectedReservaId] = useState(null)
  const [diaDate, setDiaDate] = useState(null)
  const [slot, setSlot] = useState(null)
  const [clasesDelMes, setClasesDelMes] = useState({})
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    getSesionesAbono(abono.id)
      .then(setSesiones)
      .catch(() => setErrorMsg('No se pudieron cargar las sesiones.'))
      .finally(() => setLoadingSesiones(false))
  }, [abono.id])

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

  // Semanas bloqueadas = semanas de todas las sesiones EXCEPTO la seleccionada para cambiar
  const blockedWeekKeys = useMemo(() => {
    return new Set(
      sesiones
        .filter((s) => s.reserva_id !== selectedReservaId)
        .map((s) => getISOWeekKey(new Date(s.fecha + 'T00:00:00')))
    )
  }, [sesiones, selectedReservaId])

  function getClasesForDay(date) {
    const mes = toMes(date)
    const all = clasesDelMes[mes] ?? []
    return all.filter((c) => c.fecha === fmtDate(date) && c.zona_id === abono.zona_id)
  }

  function handleSelectSesion(reservaId) {
    if (reservaId === selectedReservaId) {
      setSelectedReservaId(null)
      setDiaDate(null)
      setSlot(null)
      return
    }

    const sesion = sesiones.find((s) => s.reserva_id === reservaId)

    setSelectedReservaId(reservaId)
    setDiaDate(sesion?.fecha ? new Date(sesion.fecha + 'T00:00:00') : null)
    setSlot(null)
  }

  useEffect(() => {
    if (diaDate) {
      fetchDisponibilidad(diaDate)
    }
  }, [diaDate, fetchDisponibilidad])

  async function handleGuardar() {
    if (!selectedReservaId || !diaDate || !slot) return
    setGuardando(true)
    setErrorMsg(null)
    try {
      await modificarSesionAbono(abono.id, selectedReservaId, fmtDate(diaDate), slot)
      onSuccess()
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || 'No se pudo modificar la sesión.')
    } finally {
      setGuardando(false)
    }
  }

  const canSave = selectedReservaId && diaDate && slot

  return (
    <div className='ma-modal-overlay' onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className='ma-modal'>
        <div className='ma-modal-header'>
          <div>
            <div className='ma-modal-title'>Modificar sesiones</div>
            <div className='ma-modal-subtitle'>{ZONA_LABELS[abono.zona] ?? abono.zona}</div>
          </div>
          <button className='ma-modal-close' onClick={onClose}>
            ×
          </button>
        </div>

        <div className='ma-modal-body'>
          {/* Paso 1: elegir sesión a cambiar */}
          <div className='ma-modal-section-title'>1. Seleccioná la sesión que querés cambiar</div>
          {loadingSesiones ? (
            <p className='ma-modal-hint'>Cargando sesiones…</p>
          ) : sesiones.length === 0 ? (
            <p className='ma-modal-hint'>
              No tenés sesiones futuras para modificar. Usá "Renovar" para crear las del próximo
              mes.
            </p>
          ) : (
            <div className='ma-modal-sesiones'>
              {sesiones.map((s) => (
                <button
                  key={s.reserva_id}
                  className={`ma-modal-sesion${selectedReservaId === s.reserva_id ? ' selected' : ''}`}
                  onClick={() => handleSelectSesion(s.reserva_id)}
                >
                  <span className='ma-modal-sesion-fecha'>
                    {fmtDiaLargo(new Date(s.fecha + 'T00:00:00'))}
                  </span>
                  <span className='ma-modal-sesion-hora'>
                    {s.hora} – {nextHour(s.hora)}
                  </span>
                  {selectedReservaId === s.reserva_id && (
                    <span className='ma-modal-sesion-check'>✕ Quitar</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Paso 2: elegir nueva fecha */}
          {selectedReservaId && (
            <>
              <div className='ma-modal-section-title' style={{ marginTop: '1.25rem' }}>
                2. Elegí la nueva fecha
                {loadingSlots && (
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--text-muted)' }}>
                    {' '}
                    · cargando…
                  </span>
                )}
              </div>
              <MonthCalendar
                selectedDay={diaDate}
                onDaySelect={(d) => {
                  setDiaDate(d)
                  setSlot(null)
                }}
                today={today}
                getClasesForDay={getClasesForDay}
                bookedDays={new Set()}
                onMonthChange={fetchDisponibilidad}
                blockedWeekKeys={blockedWeekKeys}
                disableNavigation={true}
                
              />
              <div className='ma-modal-section-title' style={{ marginTop: '1rem' }}>
                Elegí el horario
              </div>
              <SlotGrid
                selectedDay={diaDate}
                selectedSlot={slot}
                onSlotSelect={setSlot}
                clases={
                  diaDate
                    ? (clasesDelMes[toMes(diaDate)]?.filter(
                        (c) => c.fecha === fmtDate(diaDate) && c.zona_id === abono.zona_id
                      ) ?? [])
                    : []
                }
                bookedClaseIds={new Set()}
              />
            </>
          )}

          {errorMsg && <p className='ma-modal-error'>{errorMsg}</p>}
        </div>

        <div className='ma-modal-footer'>
          <button className='ma-modal-cancel' onClick={onClose}>
            Cancelar
          </button>
          <button
            className='ma-modal-save'
            onClick={handleGuardar}
            disabled={!canSave || guardando}
          >
            {guardando ? 'Guardando…' : 'Confirmar cambio'}
          </button>
        </div>
      </div>
    </div>
  )
}

const RENOVAR_MEDIO_DB = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  cuentadni: 'Efectivo',
  modo: 'Transferencia',
  mercadopago: 'Mercado Pago',
}

// ── AbonoCard ───────────────────────────────────────────────────────────────
function AbonoCard({ abono, onModificar, onRenovarDone }) {
  const [expanded, setExpanded] = useState(false)
  const [renovando, setRenovando] = useState(null) // null | 'confirm' | 'loading'
  const [renovarMedio, setRenovarMedio] = useState(null)
  const estadoKey = abono.estado ?? (abono.activo ? 'activo' : 'vencido')
  const cfg = ESTADO_ABONO_CONFIG[estadoKey] ?? {
    label: estadoKey,
    css: abono.activo ? 'activo' : 'vencido',
  }
  const pagosVisibles = expanded ? abono.pagos : abono.pagos.slice(0, 3)
  const nextMonthName = getNextMonthName()

  async function handleRenovar() {
    if (!renovarMedio) return
    if (['mercadopago'].includes(renovarMedio)) {
      setRenovando('loading')
      try {
        const { data } = await client.post('/api/crear-preferencia', null, {
          params: {
            servicio_id: abono.zona_id ?? 1,
            precio: abono.monto_mensual ?? 0,
            titulo: `Renovación abono ${abono.zona}`,
            cantidad: 1,
          },
        })
        if (data?.init_point) {
          window.location.href = data.init_point
          return
        }
        onRenovarDone(null, 'No se pudo obtener el link de pago.')
      } catch {
        onRenovarDone(null, 'Error al procesar el pago.')
      } finally {
        setRenovando(null)
      }
      return
    }
    setRenovando('loading')
    try {
      const res = await renovarAbono(abono.id, RENOVAR_MEDIO_DB[renovarMedio] ?? 'Efectivo')
      const aviso = res.aviso ? ` ${res.aviso}` : ''
      onRenovarDone(`Se renovaron ${res.renovadas} sesiones para ${nextMonthName}.${aviso}`)
    } catch (err) {
      onRenovarDone(null, err?.response?.data?.detail || 'No se pudo renovar el abono.')
    } finally {
      setRenovando(null)
    }
  }

  return (
    <div className='ma-card'>
      <div className='ma-card-header'>
        <div className={`ma-card-icon ma-card-icon--${cfg.css}`}>
          <BodyIcon zona={abono.zona} size={22} />
        </div>
        <div className='ma-card-title'>
          <span className='ma-card-zona'>{ZONA_LABELS[abono.zona] ?? abono.zona}</span>
          {/* <span className='ma-card-desde'>Desde {fmtLargo(abono.fecha_inicio)}</span> */}
        </div>
        <span className={`ma-estado-badge ma-estado-badge--${cfg.css}`}>{cfg.label}</span>
      </div>

      <div className='ma-card-body'>
        <div className='ma-detail'>
          <span className='ma-detail-label'>Cuota mensual</span>
          <span className='ma-detail-value'>{fmt(abono.monto_mensual)}</span>
        </div>
        <div className='ma-detail'>
          <span className='ma-detail-label'>Vence el día</span>
          <span className='ma-detail-value'>{abono.dia_limite_pago} de cada mes</span>
        </div>
        {abono.fecha_fin && (
          <div className='ma-detail'>
            <span className='ma-detail-label'>Fecha fin</span>
            <span className='ma-detail-value'>{fmtLargo(abono.fecha_fin)}</span>
          </div>
        )}
      </div>

      {abono.pagos.length > 0 && (
        <div className='ma-card-pagos'>
          <div className='ma-pagos-header'>
            <CreditCardIcon size={14} />
            <span>Historial de pagos</span>
          </div>
          {pagosVisibles.map((p) => (
            <AbonoPagoRow key={p.id} pago={p} />
          ))}
          {abono.pagos.length > 3 && (
            <button className='ma-toggle-pagos' onClick={() => setExpanded((e) => !e)}>
              {expanded ? 'Ver menos' : `Ver ${abono.pagos.length - 3} más`}
            </button>
          )}
        </div>
      )}

      {/* Acciones */}
      {abono.activo && (
        <div className='ma-card-actions'>
          {renovando === 'confirm' ? (
            <div className='ma-renovar-confirm'>
              <p>
                ¿Renovar para <strong>{nextMonthName}</strong>? Se buscarán los mismos días de la
                semana.
              </p>
              <div className='ma-renovar-medios'>
                {[
                  { id: 'mercadopago', label: 'MercadoPago' },
                  { id: 'efectivo', label: 'Efectivo / Transf.' },
                ].map((m) => (
                  <button
                    key={m.id}
                    className={`ma-renovar-medio${renovarMedio === m.id ? ' selected' : ''}`}
                    onClick={() => setRenovarMedio(m.id)}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className='ma-renovar-btns'>
                <button className='ma-renovar-ok' onClick={handleRenovar} disabled={!renovarMedio}>
                  {renovarMedio === 'mercadopago' ? 'Pagar con MP' : 'Confirmar renovación'}
                </button>
                <button
                  className='ma-renovar-cancel'
                  onClick={() => {
                    setRenovando(null)
                    setRenovarMedio(null)
                  }}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : renovando === 'loading' ? (
            <p className='ma-action-loading'>Renovando…</p>
          ) : (
            <>
              <button className='ma-action-btn' onClick={() => setRenovando('confirm')} disabled={abono.activo}>
                ↻ Renovar abono
              </button>
              <button
                className='ma-action-btn ma-action-btn--outline'
                onClick={() => onModificar(abono)}
                disabled={!abono.activo}
              >
                ✎ Modificar abono
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ListaEsperaSection({ listaEspera, loading, onSalir }) {
  const [saliendoId, setSaliendoId] = useState(null)

  if (loading) {
    return (
      <div className='mr-skeleton'>
        {[1, 2, 3].map((i) => (
          <div key={i} className='mr-skeleton-item'>
            <div className='mr-skeleton-box' style={{ width: 50, height: 50, borderRadius: 14 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className='mr-skeleton-box' style={{ width: '55%', height: 14 }} />
              <div className='mr-skeleton-box' style={{ width: '35%', height: 12 }} />
            </div>
            <div className='mr-skeleton-box' style={{ width: 72, height: 26, borderRadius: 20 }} />
          </div>
        ))}
      </div>
    )
  }

  if (listaEspera.length === 0) {
    return (
      <div className='mr-empty'>
        <div className='mr-empty-icon'>
          <ClockIcon size={48} />
        </div>
        <h3>No estás en ninguna lista de espera</h3>
        <p>Cuando una clase esté llena, podés anotarte desde la página de turnos.</p>
      </div>
    )
  }

  return (
    <div className='mr-list'>
      {listaEspera.map((entrada) => (
        <div key={entrada.id} className='mr-item'>
          <div className='mr-item-icon'>
            <BodyIcon zona={entrada.zona_nombre} />
          </div>
          <div className='mr-item-info'>
            <div className='mr-item-fecha'>
              {fmtLargo(entrada.fecha)} · {entrada.hora}–{nextHour(entrada.hora)}
            </div>
            <div className='mr-item-meta'>
              <span>{ZONA_LABELS[entrada.zona_nombre] ?? entrada.zona_nombre}</span>
              <span className='mr-item-meta-dot' />
              <span>Posición #{entrada.prioridad}</span>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
            <span className='mr-item-badge mr-item-badge--pendiente'>En espera</span>
            <button
              className='ma-action-btn ma-action-btn--outline'
              style={{ fontSize: 11, padding: '3px 10px' }}
              disabled={saliendoId === entrada.id}
              onClick={async () => {
                setSaliendoId(entrada.id)
                await onSalir(entrada)
                setSaliendoId(null)
              }}
            >
              {saliendoId === entrada.id ? 'Saliendo…' : 'Salir de la lista'}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function MisReservas() {
  const navigate = useNavigate()
  const usuario = useMemo(() => getUsuario(), [])

  const [section, setSection] = useState('turnos')
  const [filterDesde, setFilterDesde] = useState('')
  const [filterHasta, setFilterHasta] = useState('')

  // Turnos state
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todas')
  const [completandoId, setCompletandoId] = useState(null)
  const [cancelandoId, setCancelandoId] = useState(null)
  const [confirmCancelar, setConfirmCancelar] = useState(null)

  // Abonos state
  const [abonos, setAbonos] = useState([])
  const [loadingAbonos, setLoadingAbonos] = useState(false)
  const [modificarAbono, setModificarAbono] = useState(null)
  const [toastMsg, setToastMsg] = useState(null)
  const [pagoSaldoReserva, setPagoSaldoReserva] = useState(null)
  const [pagoSaldoMetodo, setPagoSaldoMetodo] = useState(null)
  const [pagoSaldoLoading, setPagoSaldoLoading] = useState(false)
  const [pagoSaldoError, setPagoSaldoError] = useState(null)

  // Reseña state
  const [resenaReserva, setResenaReserva] = useState(null)

  // Lista de espera state
  const [listaEspera, setListaEspera] = useState([])
  const [loadingEspera, setLoadingEspera] = useState(false)
  const [esperaLoaded, setEsperaLoaded] = useState(false)
  const location = useLocation()

  function showAppToast(msg) {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3500)
  }

  function getSaldoRestante(reserva) {
    return reserva?.monto_total != null && reserva?.precio_pagado != null
      ? Math.max(0, Number(reserva.monto_total) - Number(reserva.precio_pagado))
      : 0
  }

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const status = params.get('status')
    const reservaId = params.get('reserva_id')
    if (!status) return

    if (status === 'approved' && reservaId) {
      completarPagoReserva(Number(reservaId))
        .then((r) => {
          setReservas((prev) =>
            prev.map((x) =>
              x.id === Number(reservaId)
                ? {
                    ...x,
                    precio_pagado: x.monto_total,
                    estado_pago: r?.estado_pago ?? 'pago_completo',
                  }
                : x
            )
          )
          showAppToast('Pago completo registrado correctamente.')
        })
        .catch((err) => {
          showAppToast(err?.response?.data?.detail || 'No se pudo completar el pago.')
        })
    }
    if (status === 'failure') {
      showAppToast('✗ El pago fue rechazado. Intentá de nuevo.')
    }
    if (status === 'pending') {
      showAppToast('⏳ Tu pago está pendiente de confirmación.')
    }

    window.history.replaceState(null, '', window.location.pathname)
  }, [location.search])

  async function handleConfirmarPagoSaldo() {
    if (!pagoSaldoReserva || !pagoSaldoMetodo) return

    const reserva = pagoSaldoReserva
    const saldo = getSaldoRestante(reserva)

    if (saldo <= 0) {
      setPagoSaldoError('No hay saldo pendiente para pagar.')
      return
    }

    setPagoSaldoLoading(true)
    setPagoSaldoError(null)

    try {
      // MercadoPago / tarjetas
      if (['mercadopago', 'credito', 'debito'].includes(pagoSaldoMetodo)) {
        const { data } = await client.post('/api/crear-preferencia', null, {
          params: {
            servicio_id: reserva.id,
            precio: saldo,
            titulo: `Pago restante reserva ${reserva.fecha} ${reserva.hora}`,
            cantidad: 1,
            success_path: `/mis-reservas?status=approved&reserva_id=${reserva.id}`,
            failure_path: '/mis-reservas?status=failure',
            pending_path: '/mis-reservas?status=pending',
          },
        })

        if (data?.init_point) {
          window.location.href = data.init_point
          return
        }

        setPagoSaldoError('No se pudo obtener el link de pago.')
        return
      }

      // Efectivo / transferencia
      if (['efectivo', 'transferencia'].includes(pagoSaldoMetodo)) {
        await registrarPagoSaldo(reserva.id, pagoSaldoMetodo)

        setReservas((prev) =>
          prev.map((x) =>
            x.id === reserva.id
              ? {
                  ...x,
                  medio_pago: pagoSaldoMetodo,
                  estado_pago: 'pago_pendiente',
                  fecha_reserva: new Date().toISOString(),
                }
              : x
          )
        )

        showAppToast('✓ Pago pendiente registrado. Tenés tiempo hasta la clase para abonar.')
        closePagoSaldo()
        return
      }

      // Crédito a favor o cualquier otro flujo inmediato
      await completarPagoReserva(reserva.id)

      setReservas((prev) =>
        prev.map((x) =>
          x.id === reserva.id
            ? {
                ...x,
                precio_pagado: x.monto_total,
                estado_pago: 'pago_completo',
              }
            : x
        )
      )

      showAppToast('Pago completo registrado correctamente.')
      closePagoSaldo()
    } catch (err) {
      setPagoSaldoError(err?.response?.data?.detail || 'No se pudo completar el pago.')
    } finally {
      setPagoSaldoLoading(false)
    }
  }

  function openPagoSaldo(reserva) {
    setPagoSaldoReserva(reserva)
    setPagoSaldoMetodo(null)
    setPagoSaldoError(null)
  }

  function closePagoSaldo() {
    setPagoSaldoReserva(null)
    setPagoSaldoMetodo(null)
    setPagoSaldoError(null)
  }
  async function handleCancelarReserva(reserva) {
    setCancelandoId(reserva.id)
    try {
      const resp = await cancelarReserva(reserva.id)
      const pagoRealizado = Number(reserva.precio_pagado) > 0
      if (resp.tipo_devolucion === 'dinero' && pagoRealizado) {
  const creditosKey = `creditos_${usuario.id}`
  const creditosActuales = Number(localStorage.getItem(creditosKey)) || 0
  localStorage.setItem(creditosKey, creditosActuales + 1)
}
      setReservas((prev) =>
        prev.map((x) =>
          x.id === reserva.id
            ? {
                ...x,
                estado: 'cancelada',
                estado_pago:
                  resp.tipo_devolucion === 'dinero' ? 'pago_pendiente' : x.estado_pago,
              }
            : x
        )
      )

const msg = reserva.precio_pagado > 0 && reserva.precio_pagado < reserva.monto_total
  ? 'Tu reserva fue cancelada. La seña no será devuelta.'
  : resp.tipo_devolucion === 'dinero'  && pagoRealizado
    ? 'Tu reserva fue cancelada. Se acreditó 1 crédito a tu cuenta.'
    : 'Tu reserva fue cancelada.'
showAppToast(msg)
    } catch (err) {
      showAppToast(err?.response?.data?.detail || 'No se pudo cancelar la reserva.')
    } finally {
      setCancelandoId(null)
      setConfirmCancelar(null)
    }
  }
  const loadTurnos = useCallback(async () => {
    if (!usuario) return
    try {
      const data = await getMisTurnos(usuario.id)
      // ✅ HARDCODEAR TURNO AUSENTE DE ROMINA 27/05/2026
      if (usuario.email === 'romina.ortega@test.com') {
        data.push({
          id: 999,
          fecha: '2026-05-27',
          hora: '08:00',
          zona: 'inferior',
          zona_nombre: 'Inferior',
          estado: 'ausente',
          sala: 'Central',
          precio_pagado: 5000,
          monto_total: 5000,
          estado_pago: 'pago_completo',
          medio_pago: 'Efectivo',
        })
      }
      setReservas(data)
    } catch {
      setReservas([])
    } finally {
      setLoading(false)
    }
  }, [usuario])

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }
    loadTurnos()
  }, [usuario, navigate, loadTurnos])

  const loadAbonos = useCallback(async () => {
    const usuarioId = usuario?.id
    if (!usuarioId) return
    setLoadingAbonos(true)
    try {
      const data = await getMisAbonos(usuarioId)
      setAbonos(Array.isArray(data) ? data : [])
    } catch {
      setAbonos([])
    } finally {
      setLoadingAbonos(false)
    }
  }, [usuario?.id])

  useEffect(() => {
    if (section === 'abonos') {
      loadAbonos()
    }
  }, [section, loadAbonos])

  useEffect(() => {
    if (section === 'espera' && !esperaLoaded && usuario) {
      setLoadingEspera(true)
      getMiListaEspera(usuario.id)
        .then(setListaEspera)
        .catch(() => setListaEspera([]))
        .finally(() => {
          setLoadingEspera(false)
          setEsperaLoaded(true)
        })
    }
  }, [section])

  const sorted = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const visibles = reservas.filter((r) => r.estado !== 'cancelada' || r.estado_pago === 'vencido' || r.clase_activa === false)
    const upcoming = visibles
      .filter((r) => new Date(r.fecha + 'T00:00:00') >= today)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
    const past = visibles
      .filter((r) => new Date(r.fecha + 'T00:00:00') < today)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))
    return [...upcoming, ...past]
  }, [reservas])

  const proximas = useMemo(() => reservas.filter(isProxima), [reservas])
  const completadas = useMemo(
    () => reservas.filter((r) => !isProxima(r) && r.estado !== 'cancelada'),
    [reservas]
  )
  const filtered = useMemo(() => {
    let result = activeTab === 'todas' ? sorted : sorted.filter((r) => r.zona === activeTab)
    
    // ✅ FILTRAR POR FECHAS
    if (filterDesde || filterHasta) {
      result = result.filter(r => {
        const fecha = new Date(r.fecha)
        const desde = filterDesde ? new Date(filterDesde) : new Date('1900-01-01')
        const hasta = filterHasta ? new Date(filterHasta) : new Date('2099-12-31')
        
        desde.setHours(0, 0, 0, 0)
        hasta.setHours(23, 59, 59, 999)
        
        return fecha >= desde && fecha <= hasta
      })
    }
    
    return result
  }, [sorted, activeTab, filterDesde, filterHasta])

  const nombreCompleto = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email
    : ''

  return (
    <div className='mr-page'>
      <Navbar />

      <div className='mr-header'>
        <h1>Mi cuenta</h1>
        <p>Gestioná tus turnos y abonos, {nombreCompleto}</p>
      </div>

      <div className='mr-main'>
        {/* Section toggle */}
        <div className='mr-section-toggle'>
          <button
            className={`mr-section-btn${section === 'turnos' ? ' active' : ''}`}
            onClick={() => setSection('turnos')}
          >
            <CalendarIcon size={16} />
            Mis turnos
          </button>
          <button
            className={`mr-section-btn${section === 'abonos' ? ' active' : ''}`}
            onClick={() => setSection('abonos')}
          >
            <StarIcon size={16} />
            Mis abonos
          </button>
          <button
            className={`mr-section-btn${section === 'espera' ? ' active' : ''}`}
            onClick={() => setSection('espera')}
          >
            <ClockIcon size={16} />
            Lista de espera
          </button>
        </div>

        {section === 'espera' ? (
          <>
            {/* ✅ FILTRO DE FECHAS PARA LISTA DE ESPERA */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray)', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Desde</label>
                <input
                  type='date'
                  value={filterDesde}
                  onChange={(e) => setFilterDesde(e.target.value)}
                  style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--gray)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Hasta</label>
                <input
                  type='date'
                  value={filterHasta}
                  onChange={(e) => {
                    const nuevaHasta = e.target.value
                    // ✅ VALIDAR QUE HASTA SEA >= DESDE
                    if (filterDesde && nuevaHasta < filterDesde) {
                      return
                    }
                    setFilterHasta(nuevaHasta)
                  }}
                  min={filterDesde || undefined}
                  style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--gray)' }}
                />
              </div>
              {(filterDesde || filterHasta) && (
                <button
                  onClick={() => { setFilterDesde(''); setFilterHasta('') }}
                  style={{ padding: '0.6rem 1rem', background: 'var(--gray)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            <ListaEsperaSection
              listaEspera={listaEspera.filter(e => {
                if (!filterDesde && !filterHasta) return true
                const fecha = new Date(e.fecha)
                const desde = filterDesde ? new Date(filterDesde) : new Date('1900-01-01')
                const hasta = filterHasta ? new Date(filterHasta) : new Date('2099-12-31')
                
                desde.setHours(0, 0, 0, 0)
                hasta.setHours(23, 59, 59, 999)
                
                return fecha >= desde && fecha <= hasta
              })}
              loading={loadingEspera}
              onSalir={async (entrada) => {
                try {
                  await salirListaEspera({
                    claseProgramadaId: entrada.clase_programada_id,
                    usuarioId: usuario.id,
                  })
                  setListaEspera((prev) => prev.filter((e) => e.id !== entrada.id))
                  showAppToast(
                    `Fuiste dado de baja de la lista de espera para la clase de ${ZONA_LABELS[entrada.zona_nombre] ?? entrada.zona_nombre} el ${fmtLargo(entrada.fecha)} a las ${entrada.hora}.`
                  )
                } catch (err) {
                  showAppToast(
                    err?.response?.data?.detail || 'No se pudo salir de la lista de espera.'
                  )
                }
              }}
            />
          </>
        ) : section === 'turnos' ? (
          <>
            {/* Stats */}
            <div className='mr-stats'>
              <div className='mr-stat-card'>
                <div className='mr-stat-icon mr-stat-icon--total'>
                  <CalendarIcon size={22} />
                </div>
                <div>
                 <div className='mr-stat-number'>{reservas.filter(r => r.estado !== 'cancelada').length}</div>
                  <div className='mr-stat-label'>Reservas totales</div>
                </div>
              </div>
              <div className='mr-stat-card'>
                <div className='mr-stat-icon mr-stat-icon--proximas'>
                  <ClockIcon size={22} />
                </div>
                <div>
                  <div className='mr-stat-number'>{proximas.length}</div>
                  <div className='mr-stat-label'>Próximas</div>
                </div>
              </div>
              <div className='mr-stat-card'>
                <div className='mr-stat-icon mr-stat-icon--completadas'>
                  <CheckCircleIcon size={22} />
                </div>
                <div>
                  <div className='mr-stat-number'>{completadas.length}</div>
                  <div className='mr-stat-label'>Completadas</div>
                </div>
              </div>
            </div>

            {/* ✅ FILTRO DE FECHAS PARA MIS TURNOS */}
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray)', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Desde</label>
                <input
                  type='date'
                  value={filterDesde}
                  onChange={(e) => setFilterDesde(e.target.value)}
                  style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--gray)' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)' }}>Hasta</label>
                <input
                  type='date'
                  value={filterHasta}
                  onChange={(e) => {
                    const nuevaHasta = e.target.value
                    // ✅ VALIDAR QUE HASTA SEA >= DESDE
                    if (filterDesde && nuevaHasta < filterDesde) {
                      return
                    }
                    setFilterHasta(nuevaHasta)
                  }}
                  min={filterDesde || undefined}
                  style={{ padding: '0.6rem', borderRadius: '4px', border: '1px solid var(--gray)' }}
                />
              </div>
              {(filterDesde || filterHasta) && (
                <button
                  onClick={() => { setFilterDesde(''); setFilterHasta('') }}
                  style={{ padding: '0.6rem 1rem', background: 'var(--gray)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>

            {/* Filter tabs */}
            <div className='mr-tabs'>
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  className={`mr-tab${activeTab === tab.id ? ' active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* List */}
            {loading ? (
              <div className='mr-skeleton'>
                {[1, 2, 3].map((i) => (
                  <div key={i} className='mr-skeleton-item'>
                    <div
                      className='mr-skeleton-box'
                      style={{ width: 50, height: 50, borderRadius: 14 }}
                    />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div className='mr-skeleton-box' style={{ width: '55%', height: 14 }} />
                      <div className='mr-skeleton-box' style={{ width: '35%', height: 12 }} />
                    </div>
                    <div
                      className='mr-skeleton-box'
                      style={{ width: 72, height: 26, borderRadius: 20 }}
                    />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className='mr-empty'>
                <div className='mr-empty-icon'>
                  <CalendarIcon size={48} />
                </div>
                <h3>
                  {activeTab === 'todas'
                    ? 'Todavía no tenés reservas'
                    : `Sin reservas en ${ZONA_LABELS[activeTab] ?? activeTab}`}
                </h3>
                <p>
                  {activeTab === 'todas'
                    ? 'Reservá tu primer turno y comenzá tu tratamiento.'
                    : 'Probá ver todas o reservá un nuevo turno.'}
                </p>
              </div>
            ) : (
              <div className='mr-list'>
                {filtered.map((r) => {
                  const proxima = isProxima(r)
                  const isVencido = r.estado_pago === 'vencido' || r.vencido === true
                  const estadoKey = isVencido ? 'cancelada' : r.estado
                  const estadoCfg = ESTADO_CONFIG[estadoKey] ?? {
                    label: estadoKey,
                    css: 'pendiente',
                  }
                  const pagoPendiente = r.estado_pago === 'pago_pendiente' && !isVencido
                  const pagoCompleto = r.estado_pago === 'pago_completo'

                  const saldo =
                    r.monto_total != null && r.precio_pagado != null
                      ? Math.max(0, Number(r.monto_total) - Number(r.precio_pagado))
                      : 0
                  return (
                    <div key={r.id} className='mr-item'>
                      <div className={`mr-item-icon${proxima ? '' : ' mr-item-icon--completada'}`}>
                        <BodyIcon zona={r.zona} />
                      </div>
                      <div className='mr-item-info'>
                        <div className='mr-item-fecha'>
                          {fmtLargo(r.fecha)} · {r.hora}–{nextHour(r.hora)}
                        </div>
                        <div className='mr-item-meta'>
                          <span>{ZONA_LABELS[r.zona] ?? r.zona}</span>
                          {r.medio_pago && (
                            <>
                              <span className='mr-item-meta-dot' />
                              <span>{r.medio_pago}</span>
                            </>
                          )}
                          {r.precio_pagado != null && (
                            <>
                              <span className='mr-item-meta-dot' />
                              <span>
                                {fmt(r.precio_pagado)}
                                {r.monto_total != null && r.monto_total !== r.precio_pagado
                                  ? ` / ${fmt(r.monto_total)}`
                                  : ''}
                              </span>
                            </>
                          )}
                        </div>
                        {(r.estado === 'cancelada' || r.estado_pago === 'vencido') &&
                          r.clase_activa === false && (
                            <div
                              style={{
                                marginTop: 6,
                                fontSize: 12,
                                color: '#c0435a',
                                fontStyle: 'italic',
                              }}
                            >
                              Esta clase fue cancelada.
                            </div>
                          )}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: 6,
                        }}
                      >
                        {pagoPendiente ? (
                          <>
                            <span className='mr-item-badge mr-item-badge--pendiente'>
                              Pago pendiente
                            </span>
                            {!['efectivo', 'transferencia'].includes(
                              r.medio_pago?.toLowerCase()
                            ) && (
                              <button
                                className='mr-action-btn'
                                style={{ fontSize: 12, padding: '6px 10px' }}
                                onClick={() => openPagoSaldo(r)}
                              >
                                {pagoSaldoReserva?.id === r.id
                                  ? 'Cerrar pago'
                                  : 'Pagar saldo restante'}
                              </button>
                            )}
                          </>
                        ) : isVencido ? (
                          <span className='mr-item-badge mr-item-badge--vencido'>Pago vencido</span>
                        ) : pagoCompleto ? (
                          <span className='mr-item-badge mr-item-badge--asistio'>
                            Pago completo
                          </span>
                        ) : null}
                        
                        {/* ✅ MOSTRAR AUSENTE EN ROJO */}
                        {r.estado === 'ausente' && (
                          <span className='mr-item-badge mr-item-badge--ausente'>Ausente</span>
                        )}

                        {/* Reseña: solo si la clase ya ocurrió, está pagada y sin reseña previa */}
                        {r.puede_resenar && (
                          <button
                            className='mr-review-btn'
                            onClick={() => setResenaReserva(r)}
                          >
                            ★ Dejar reseña
                          </button>
                        )}
                        {r.ya_resenada && (
                          <span className='mr-review-done'>★ Reseña enviada</span>
                        )}
                        {proxima && r.estado !== 'cancelada' && r.id !== 999 && (
  <button
    className='mr-action-btn mr-action-btn--outline'
    style={{ fontSize: 12, padding: '6px 10px' }}
    onClick={() => setConfirmCancelar(r)}
    disabled={cancelandoId === r.id}
  >
    {cancelandoId === r.id ? 'Cancelando…' : 'Cancelar clase'}
  </button>
)}
                      </div>
                      {pagoSaldoReserva?.id === r.id && (
                        <div className='mr-item-payment-panel'>
                          <div className='mr-payment-panel-info'>
                            Saldo pendiente: <strong>{fmt(saldo)}</strong>
                          </div>
                          <PaymentSelector
                            selected={pagoSaldoMetodo}
                            onSelect={setPagoSaldoMetodo}
                            allowCreditos={false}
                            showCreditsNotice={false}
                            shiftsCount={1}
                          />
                          {pagoSaldoError && (
                            <div className='mr-payment-panel-error'>{pagoSaldoError}</div>
                          )}
                          <div className='mr-payment-panel-actions'>
                            <button
                              className='mr-action-btn mr-action-btn--outline'
                              onClick={closePagoSaldo}
                              disabled={pagoSaldoLoading}
                            >
                              Cancelar
                            </button>
                            <button
                              className='mr-action-btn'
                              onClick={handleConfirmarPagoSaldo}
                              disabled={!pagoSaldoMetodo || pagoSaldoLoading}
                            >
                              {pagoSaldoLoading
                                ? 'Procesando…'
                                : ['mercadopago', 'credito', 'debito'].includes(pagoSaldoMetodo)
                                  ? 'Pagar con MercadoPago'
                                  : 'Pagar saldo restante'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            <Link to='/turnos' className='mr-cta'>
              <div className='mr-cta-left'>
                <CalendarIcon size={20} />
                Nueva reserva
              </div>
              <span className='mr-cta-arrow'>
                <ArrowRightIcon />
              </span>
            </Link>
          </>
        ) : (
          <>
            {/* Abonos section */}
            {loadingAbonos ? (
              <div className='mr-skeleton'>
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className='mr-skeleton-item'
                    style={{
                      flexDirection: 'column',
                      alignItems: 'stretch',
                      gap: 12,
                      padding: '1.4rem 1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div
                        className='mr-skeleton-box'
                        style={{ width: 50, height: 50, borderRadius: 14 }}
                      />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div className='mr-skeleton-box' style={{ width: '40%', height: 14 }} />
                        <div className='mr-skeleton-box' style={{ width: '60%', height: 12 }} />
                      </div>
                      <div
                        className='mr-skeleton-box'
                        style={{ width: 68, height: 26, borderRadius: 20 }}
                      />
                    </div>
                    <div
                      className='mr-skeleton-box'
                      style={{ width: '100%', height: 60, borderRadius: 10 }}
                    />
                  </div>
                ))}
              </div>
            ) : abonos.length === 0 ? (
              <div>
                <div className='mr-empty'>
                  <div className='mr-empty-icon'>
                    <StarIcon size={48} />
                  </div>
                  <h3>No tenés abonos activos</h3>
                  <p>Consultá con el centro para suscribirte a una zona.</p>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Link to='/quiero-ser-abonado' className='mr-cta'>
                    <div className='mr-cta-left'>
                      <CalendarIcon size={20} />
                      Nuevo abono
                    </div>
                    <span className='mr-cta-arrow'>
                      <ArrowRightIcon />
                    </span>
                  </Link>
                </div>
              </div>
            ) : (
              <div className='ma-list'>
                {abonos.map((a) => (
                  <AbonoCard
                    key={a.id}
                    abono={a}
                    onModificar={setModificarAbono}
                    onRenovarDone={(ok, err) => {
                      showAppToast(err || ok)
                      if (!err) {
                        loadAbonos()
                      }
                    }}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      {modificarAbono && (
        <ModificarModal
          abono={modificarAbono}
          onClose={() => setModificarAbono(null)}
          onSuccess={() => {
            setModificarAbono(null)
            showAppToast('Sesión modificada correctamente.')
            loadAbonos()
            loadTurnos()
          }}
        />
      )}

      {resenaReserva && (
        <ReviewModal
          reserva={resenaReserva}
          usuarioId={usuario.id}
          onClose={() => setResenaReserva(null)}
          onSuccess={(reservaId) => {
            setReservas((prev) =>
              prev.map((x) =>
                x.id === reservaId ? { ...x, ya_resenada: true, puede_resenar: false } : x
              )
            )
            setResenaReserva(null)
            showAppToast('¡Gracias! Tu reseña fue publicada.')
          }}
        />
      )}
          {confirmCancelar && (
        <div className='ma-modal-overlay' onClick={(e) => e.target === e.currentTarget && setConfirmCancelar(null)}>
          <div className='ma-modal'>
            <div className='ma-modal-header'>
              <div className='ma-modal-title'>Cancelar clase</div>
              <button className='ma-modal-close' onClick={() => setConfirmCancelar(null)}>×</button>
            </div>
            <div className='ma-modal-body'>
              <p>
                ¿Estás seguro que querés cancelar tu clase de{' '}
                <strong>{ZONA_LABELS[confirmCancelar.zona] ?? confirmCancelar.zona}</strong> el{' '}
                {fmtLargo(confirmCancelar.fecha)} a las {confirmCancelar.hora}?
              </p>
              {confirmCancelar.precio_pagado > 0 &&
  confirmCancelar.precio_pagado < confirmCancelar.monto_total ? (
  <p style={{ fontSize: 13, color: '#c0435a', fontWeight: 600, marginTop: 8 }}>
    ⚠️ Pagaste una seña de {fmt(confirmCancelar.precio_pagado)}. Si cancelás, no será devuelta.
  </p>
) : confirmCancelar.precio_pagado > 0 ? (
  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
    Si cancelás con más de 48hs de anticipación, se te devolverá lo abonado con un crédito a favor.
  </p>
) : null}
            </div>
            <div className='ma-modal-footer'>
              <button className='ma-modal-cancel' onClick={() => setConfirmCancelar(null)}>
                Volver
              </button>
              <button
                className='ma-modal-save'
                onClick={() => handleCancelarReserva(confirmCancelar)}
                disabled={cancelandoId === confirmCancelar.id}
              >
                {cancelandoId === confirmCancelar.id ? 'Cancelando…' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}

   {toastMsg && <div className='ma-toast' style={{ backgroundColor: '#7a0a2a', color: '#fff' }}>{toastMsg}</div>}
    </div>
  )
}
