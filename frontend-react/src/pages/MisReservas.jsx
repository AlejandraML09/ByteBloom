import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getMisTurnos } from '../api/turnos'
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

export default function MisReservas() {
  const navigate = useNavigate()
  const usuario = getUsuario()
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('todas')

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

  // Sort: upcoming first (asc by fecha), then past (desc by fecha)
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
        <h1>Mis reservas</h1>
        <p>Consultá y gestioná tus turnos, {nombreCompleto}</p>
      </div>

      <div className='mr-main'>
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
      </div>

      <Footer />
    </div>
  )
}
