import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMisTurnos } from '../api/turnos'
import { getMisAbonos } from '../api/abonos'
import { ZONA_LABELS } from '../constants/turnos'
import { fmtLargo, nextHour } from '../utils/dates'
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
  pendiente: { label: 'Pendiente', css: 'pendiente' },
  confirmada: { label: 'Confirmada', css: 'confirmada' },
  cancelada: { label: 'Cancelada', css: 'cancelada' },
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
  pendiente: { label: 'Pendiente', css: 'pendiente' },
  pagado: { label: 'Pagado', css: 'pagado' },
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
      <span className={`ma-pago-badge ma-pago-badge--${cfg.css}`}>{cfg.label}</span>
    </div>
  )
}

function AbonoCard({ abono }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = ESTADO_ABONO_CONFIG[abono.estado] ?? { label: abono.estado, css: 'activo' }
  const pagosVisibles = expanded ? abono.pagos : abono.pagos.slice(0, 3)

  return (
    <div className='ma-card'>
      <div className='ma-card-header'>
        <div className={`ma-card-icon ma-card-icon--${cfg.css}`}>
          <BodyIcon zona={abono.zona} size={22} />
        </div>
        <div className='ma-card-title'>
          <span className='ma-card-zona'>{ZONA_LABELS[abono.zona] ?? abono.zona}</span>
          <span className='ma-card-desde'>Desde {fmtLargo(abono.fecha_inicio)}</span>
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
    </div>
  )
}

export default function MisReservas() {
  const navigate = useNavigate()
  const usuario = getUsuario()

  const [section, setSection] = useState('turnos')

  // Turnos state
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todas')

  // Abonos state
  const [abonos, setAbonos] = useState([])
  const [loadingAbonos, setLoadingAbonos] = useState(false)
  const [abonosLoaded, setAbonosLoaded] = useState(false)

  useEffect(() => {
    if (!usuario) {
      navigate('/login')
      return
    }
    getMisTurnos(usuario.id)
      .then(setReservas)
      .catch(() => setReservas([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (section === 'abonos' && !abonosLoaded && usuario) {
      setLoadingAbonos(true)
      getMisAbonos(usuario.id)
        .then(setAbonos)
        .catch(() => setAbonos([]))
        .finally(() => {
          setLoadingAbonos(false)
          setAbonosLoaded(true)
        })
    }
  }, [section])

  const sorted = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const upcoming = reservas
      .filter((r) => new Date(r.fecha + 'T00:00:00') >= today)
      .sort((a, b) => a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora))
    const past = reservas
      .filter((r) => new Date(r.fecha + 'T00:00:00') < today)
      .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.hora.localeCompare(a.hora))
    return [...upcoming, ...past]
  }, [reservas])

  const proximas = useMemo(() => reservas.filter(isProxima), [reservas])
  const completadas = useMemo(
    () => reservas.filter((r) => !isProxima(r) && r.estado !== 'cancelada'),
    [reservas]
  )
  const filtered = activeTab === 'todas' ? sorted : sorted.filter((r) => r.zona === activeTab)

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
        </div>

        {section === 'turnos' ? (
          <>
            {/* Stats */}
            <div className='mr-stats'>
              <div className='mr-stat-card'>
                <div className='mr-stat-icon mr-stat-icon--total'>
                  <CalendarIcon size={22} />
                </div>
                <div>
                  <div className='mr-stat-number'>{reservas.length}</div>
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
                  const estadoCfg = ESTADO_CONFIG[r.estado] ?? { label: r.estado, css: 'pendiente' }
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
                              <span>{fmt(r.precio_pagado)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <span className={`mr-item-badge mr-item-badge--${estadoCfg.css}`}>
                        {estadoCfg.label}
                      </span>
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
              <div className='mr-empty'>
                <div className='mr-empty-icon'>
                  <StarIcon size={48} />
                </div>
                <h3>No tenés abonos activos</h3>
                <p>Consultá con el centro para suscribirte a una zona.</p>
              </div>
            ) : (
              <div className='ma-list'>
                {abonos.map((a) => (
                  <AbonoCard key={a.id} abono={a} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}
