import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from '../components/admin/AdminNav'
import { AdminStatsRow } from '../components/admin/AdminStatsRow'
import { TurnosTab } from '../components/admin/TurnosTab'
import { PacientesTab } from '../components/admin/PacientesTab'
import { CuposTab } from '../components/admin/CuposTab'
import { CancelarTab } from '../components/admin/CancelarTab'
import { CrearTab } from '../components/admin/CrearTab'
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
  { id: 'crear',     label: 'Crear clase' },
  { id: 'cancelar',   label: 'Cancelar clase' },
  { id: 'asistencia', label: 'Asistencia' },
  { id: 'precios', label: 'Modificar precio' },
]

export default function Admin() {
  const navigate = useNavigate()
  const today = fmtDate(new Date())

  useEffect(() => {
    const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
    const user = stored ? JSON.parse(stored) : null
    if (!user || user.rol !== 'admin') {
      navigate('/login')
    }
  }, [])

  const storedUser = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const user = storedUser ? JSON.parse(storedUser) : { nombre: 'Dr. Ramírez' }

  const [activeTab, setActiveTab] = useState('turnos')
  const [filterDate, setFilterDate] = useState(today)
  const [filterCuposDate, setFilterCuposDate] = useState('')
  const [filterCancelarDate, setFilterCancelarDate] = useState('')
  const [filterAsistDate, setFilterAsistDate] = useState(today)
  const [filterAsistHora, setFilterAsistHora] = useState(HORARIOS[0])
  const [cuposMax, setCuposMax] = useState(() => Object.fromEntries(HORARIOS.map(h => [h, 5])))
  const [cuposInput, setCuposInput] = useState({})
  const [ocupados] = useState(() => initOcupados())
  const [cuposClasses, setCuposClasses] = useState([])
  const [clasesParaCancelar, setClasesParaCancelar] = useState([])
  const [asistencia, setAsistencia] = useState({})
  const [cancelados, setCancelados] = useState({})
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [presentes, setPresentes] = useState(0)
  const [precio, setPrecio] = useState(0)
  const [priceInput, setPriceInput] = useState('')
  const [upcomingClasses, setUpcomingClasses] = useState([])

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

  useEffect(() => {
    const cargarCupos = async () => {
      try {
        const res = await fetch(`${API_URL}/api/cupos`)
        if (res.ok) {
          const data = await res.json()
          setCuposClasses(data)
          setCuposInput(Object.fromEntries(data.map(clase => [clase.id, clase.cupo_max])))
        }
      } catch (err) {
        console.log('No se pudieron cargar los cupos desde el backend')
      }
    }
    cargarCupos()
  }, [])

  // Cargar precios actuales del backend
  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        const res = await fetch(`${API_URL}/api/precios`)
        if (res.ok) {
          const data = await res.json()
          setPrecio(data.precio ?? 0)
        }
      } catch (err) {
        console.log('Usando precio de demostración')
      }
    }
    cargarPrecios()
  }, [])

  useEffect(() => {
    const cargarClasesCancelar = async () => {
      try {
        const res = await fetch(`${API_URL}/api/clases-cancelar`)
        if (res.ok) {
          const data = await res.json()
          setClasesParaCancelar(data)
        }
      } catch (err) {
        console.log('No se pudieron cargar las clases para cancelar')
      }
    }
    cargarClasesCancelar()
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

  async function crearClase(datos) {
    const res = await fetch(`${API_URL}/api/clases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      const msg = Array.isArray(body.detail)
        ? body.detail[0].msg.replace('Value error, ', '')
        : body.detail || 'Error al crear la clase.'
      throw new Error(msg)
    }
    showToast('Clase creada exitosamente')
  }

  async function cancelarClase(claseId) {
    const clase = clasesParaCancelar.find(c => c.id === claseId)
    if (!clase) return

    try {
      const res = await fetch(`${API_URL}/api/clases-cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zona: clase.zona,
          fecha: clase.fecha,
          hora: clase.hora,
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(body.detail || 'Error al cancelar clase')
        return
      }

      setClasesParaCancelar(prev => prev.filter(c => c.id !== claseId))
      showToast('La clase ha sido cancelada exitosamente')
    } catch (err) {
      showToast('Error al cancelar clase en backend')
    }
  }

  function guardarAsistencia() {
    const total = Object.values(asistencia).filter(Boolean).length
    setPresentes(total)
    showToast('Asistencia guardada correctamente')
  }

  async function modificarCupo(claseId) {
    const clase = cuposClasses.find(c => c.id === claseId)
    if (!clase) return

    const nuevoCupo = parseInt(cuposInput[claseId], 10)
    if (!nuevoCupo || nuevoCupo <= 0) {
      showToast('Ingresá un cupo válido')
      return
    }

    try {
      const res = await fetch(`${API_URL}/api/cupos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zona: clase.zona,
          fecha: clase.fecha,
          hora: clase.hora,
          nuevo_cupo: nuevoCupo,
        }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(body.detail || 'Error al modificar cupo')
        return
      }

      setCuposClasses(prev => prev.map(c => (
        c.id === claseId ? { ...c, cupo_max: nuevoCupo } : c
      )))
      setCuposInput(prev => ({ ...prev, [claseId]: nuevoCupo }))
      showToast('Modificación exitosa')
    } catch (err) {
      showToast('Error al modificar cupo en backend')
    }
  }

  function modificarPrecio() {
  const nuevoPrecio = parseInt(priceInput, 10)
  if (!nuevoPrecio || nuevoPrecio <= 0) {
    showToast('Ingresá un precio válido')
    return
  }

  setPrecio(nuevoPrecio)
  setPriceInput('')

  fetch(`${API_URL}/api/precios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nuevo_precio: nuevoPrecio }),
  })
    .then(async res => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        showToast(body.detail || 'Error al guardar en backend')
        return
      }
      showToast('Modificación exitosa')
    })
    .catch(() => {
      showToast('Guardado local, backend no disponible')
    })
}

  function logout() {
    localStorage.removeItem('usuario')
    localStorage.removeItem('ks_user')
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
            classes={cuposClasses}
            cuposInput={cuposInput}
            onInputChange={(id, val) => setCuposInput(prev => ({ ...prev, [id]: val }))}
            onModifyCupo={modificarCupo}
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

        {activeTab === 'crear' && (
          <CrearTab onCrear={crearClase} />
        )}

        {activeTab === 'cancelar' && (
          <CancelarTab
            classes={clasesParaCancelar}
            onCancelar={cancelarClase}
            filterDate={filterCancelarDate}
            onFilterChange={setFilterCancelarDate}
          />
        )}

        {activeTab === 'precios' && (
          <PriceTab
            classes={upcomingClasses}
            priceValue={priceInput}
            onPriceChange={setPriceInput}
            onModifyPrice={modificarPrecio}
            currentPrice={precio}
          />
        )}
      </div>

      <div className={`admin-toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
