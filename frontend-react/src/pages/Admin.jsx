import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from '../components/admin/AdminNav'
import { AdminStatsRow } from '../components/admin/AdminStatsRow'
import { TurnosTab } from '../components/admin/TurnosTab'
import { PacientesTab } from '../components/admin/PacientesTab'
import { CuposTab } from '../components/admin/CuposTab'
import { AsistenciaTab } from '../components/admin/AsistenciaTab'
import { PriceTab } from '../components/admin/PriceTab'
import { HORARIOS, PACIENTES, DIST } from '../constants/admin'
import { fmtDate, fmtLargo } from '../utils/dates'
import '../css/admin.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function buildTurnos() {
  return DIST.map((t, i) => ({ ...t, paciente: PACIENTES[t.pac], id: i }))
}

function initOcupados() {
  const occ = {}
  HORARIOS.forEach(h => { occ[h] = Math.floor(Math.random() * 4) })
  return occ
}

const TABS = [
  { id: 'turnos',    label: 'Turnos del día' },
  { id: 'pacientes', label: 'Pacientes' },
  { id: 'cupos',     label: 'Gestionar cupos' },
  { id: 'asistencia', label: 'Asistencia' },
  { id: 'precios', label: 'Modificar precio' },
]

export default function Admin() {
  const navigate = useNavigate()
  const today = fmtDate(new Date())

  const sess = sessionStorage.getItem('ks_user')
  const user = sess ? JSON.parse(sess) : { nombre: 'Dr. Ramírez' }

  const [activeTab, setActiveTab] = useState('turnos')
  const [filterDate, setFilterDate] = useState(today)
  const [filterCuposDate, setFilterCuposDate] = useState(today)
  const [filterAsistDate, setFilterAsistDate] = useState(today)
  const [filterAsistHora, setFilterAsistHora] = useState(HORARIOS[0])
  const [cuposMax, setCuposMax] = useState(() => Object.fromEntries(HORARIOS.map(h => [h, 5])))
  const [cuposInput, setCuposInput] = useState(() => Object.fromEntries(HORARIOS.map(h => [h, 5])))
  const [ocupados] = useState(() => initOcupados())
  const [asistencia, setAsistencia] = useState({})
  const [cancelados, setCancelados] = useState({})
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [presentes, setPresentes] = useState(0)
  const [prices, setPrices] = useState({ superior: 1800, medio: 1600, inferior: 1400 })
  const [selectedZona, setSelectedZona] = useState('superior')
  const [priceInput, setPriceInput] = useState('')
  const [upcomingClasses, setUpcomingClasses] = useState([
    { id: 1, zona: 'superior', fecha: '2026-05-09', hora: '09:00', precio: 1800, inscritos: 0 },
    { id: 2, zona: 'medio', fecha: '2026-05-10', hora: '10:00', precio: 1600, inscritos: 0 },
    { id: 3, zona: 'inferior', fecha: '2026-05-11', hora: '11:00', precio: 1400, inscritos: 0 },
  ])

  function showToast(msg) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  // Cargar clases del backend
  useEffect(() => {
    const cargarClases = async () => {
      try {
        const res = await fetch(`${API_URL}/api/clases`)
        if (res.ok) {
          const data = await res.json()
          setUpcomingClasses(data.length > 0 ? data : upcomingClasses)
        }
      } catch (err) {
        console.log('Backend no disponible, usando datos de demostración')
      }
    }
    cargarClases()
  }, [])

  // Cargar precios actuales del backend
  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        const res = await fetch(`${API_URL}/api/precios`)
        if (res.ok) {
          const data = await res.json()
          setPrices(data)
        }
      } catch (err) {
        console.log('Usando precios de demostración')
      }
    }
    cargarPrecios()
  }, [])

  const turnos = useMemo(() => buildTurnos(), [])

  const turnosFiltrados = turnos.map(t => ({
    ...t,
    estado: cancelados[t.id] ? 'cancelado' : t.estado,
  }))

  const turnosActivos = turnosFiltrados.filter(t => t.estado !== 'cancelado')
  const statTurnos = turnosActivos.length

  const totalLibres = HORARIOS.reduce((acc, h) => {
    const occ = ocupados[h] || 0
    return acc + Math.max(0, cuposMax[h] - occ)
  }, 0)

  function cancelarTurno(id, nombre) {
    setCancelados(prev => ({ ...prev, [id]: true }))
    showToast(`Turno de ${nombre} cancelado`)
  }

  function guardarCupo(hora) {
    const val = parseInt(cuposInput[hora]) || 5
    setCuposMax(prev => ({ ...prev, [hora]: val }))
    showToast(`Cupo de ${hora} actualizado a ${val} personas`)
  }

  function guardarAsistencia() {
    const total = Object.values(asistencia).filter(Boolean).length
    setPresentes(total)
    showToast('Asistencia guardada correctamente')
  }

  function modificarPrecio() {
    const precio = parseInt(priceInput, 10)
    if (!precio || precio <= 0) {
      showToast('Ingresá un precio válido')
      return
    }

    // Actualizamos localmente primero para que el UI responda inmediatamente.
    setPrices(prev => ({ ...prev, [selectedZona]: precio }))
    setUpcomingClasses(prev => prev.map(clase => (
      clase.zona === selectedZona && clase.inscriptos === 0
        ? { ...clase, precio }
        : clase
    )))
    setPriceInput('')

    fetch(`${API_URL}/api/precios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zona: selectedZona, nuevo_precio: precio })
    })
      .then(async res => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          const detail = body.detail || 'Error al guardar en backend'
          showToast(`Guardado local, pero fallo backend: ${detail}`)
          return
        }
        showToast('Modificación exitosa')
      })
      .catch(() => {
        showToast('Guardado local, backend no disponible')
      })
  }

  function logout() {
    sessionStorage.removeItem('ks_user')
    navigate('/login')
  }

  return (
    <div className="admin-page">
      <AdminNav user={user} onLogout={logout} />

      <div className="page-header">
        <h1>Panel de administración</h1>
        <p>Bienvenido/a, {user.nombre} · Hoy es {fmtLargo(today)}</p>
      </div>

      <div className="section-tabs">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            className={`sec-tab${activeTab === id ? ' active' : ''}`}
            onClick={() => setActiveTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="admin-main">
        <AdminStatsRow statTurnos={statTurnos} presentes={presentes} totalLibres={totalLibres} />

        {activeTab === 'turnos' && (
          <TurnosTab
            turnos={turnosFiltrados}
            cancelados={cancelados}
            onCancel={cancelarTurno}
            filterDate={filterDate}
            onFilterChange={setFilterDate}
          />
        )}

        {activeTab === 'pacientes' && (
          <PacientesTab pacientes={PACIENTES} />
        )}

        {activeTab === 'cupos' && (
          <CuposTab
            ocupados={ocupados}
            cuposMax={cuposMax}
            cuposInput={cuposInput}
            onInputChange={(hora, val) => setCuposInput(prev => ({ ...prev, [hora]: val }))}
            onSave={guardarCupo}
            filterDate={filterCuposDate}
            onFilterChange={setFilterCuposDate}
          />
        )}

        {activeTab === 'asistencia' && (
          <AsistenciaTab
            turnos={turnos}
            filterDate={filterAsistDate}
            filterHora={filterAsistHora}
            onDateChange={setFilterAsistDate}
            onHoraChange={setFilterAsistHora}
            asistencia={asistencia}
            onAsistChange={(key, val) => setAsistencia(prev => ({ ...prev, [key]: val }))}
            onSave={guardarAsistencia}
          />
        )}

        {activeTab === 'precios' && (
          <PriceTab
            classes={upcomingClasses}
            selectedZona={selectedZona}
            priceValue={priceInput}
            onSelectZona={setSelectedZona}
            onPriceChange={setPriceInput}
            onModifyPrice={modificarPrecio}
            currentPrices={prices}
          />
        )}
      </div>

      <div className={`admin-toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
