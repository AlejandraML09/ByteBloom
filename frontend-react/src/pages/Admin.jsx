import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { AdminNav } from '../components/admin/AdminNav'
import { AdminStatsRow } from '../components/admin/AdminStatsRow'
import { TurnosTab } from '../components/admin/TurnosTab'
import { PacientesTab } from '../components/admin/PacientesTab'
import { CuposTab } from '../components/admin/CuposTab'
import { CancelarTab } from '../components/admin/CancelarTab'
import { CrearTab } from '../components/admin/CrearTab'
import { ProgramarTab } from '../components/admin/ProgramarTab'
import { AsistenciaTab } from '../components/admin/AsistenciaTab'
import { PriceTab } from '../components/admin/PriceTab'
import { EliminarTab } from '../components/admin/EliminarTab'
import { HORARIOS, PACIENTES, DIST } from '../constants/admin'
import { fmtDate, fmtLargo } from '../utils/dates'
import '../css/admin.css'
import SecretariosTab from '../components/admin/SecretariosTab'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function buildTurnos() {
  return DIST.map((t, i) => ({ ...t, paciente: PACIENTES[t.pac], id: i }))
}

function initOcupados() {
  const occ = {}
  HORARIOS.forEach((h) => {
    occ[h] = Math.floor(Math.random() * 4)
  })
  return occ
}

const TABS = [
  { id: 'turnos', label: 'Turnos del día', roles: ['admin'] },
  { id: 'pacientes', label: 'Pacientes', roles: ['admin'] },
  { id: 'cupos', label: 'Gestionar cupos', roles: ['admin'] },
  { id: 'asistencia', label: 'Asistencia', roles: ['secretario'] },
  { id: 'crear', label: 'Crear clase', roles: ['admin', 'secretario'] },
  { id: 'programar', label: 'Programar clases', roles: ['admin', 'secretario'] },
  { id: 'cancelar', label: 'Cancelar clase', roles: ['admin', 'secretario'] },
  { id: 'eliminar', label: 'Eliminar por profesional', roles: ['admin'] },
  { id: 'precios', label: 'Modificar precio', roles: ['admin'] },
  { id: 'secretarios', label: 'Secretarios', roles: ['admin'] },
]

// Leer usuario UNA sola vez, fuera del componente no es posible con hooks,
// así que lo hacemos antes de los hooks pero dentro del componente.
export default function Admin() {
  const navigate = useNavigate()
  const today = fmtDate(new Date())

  // ── Lectura unificada del usuario ──────────────────────────────────────────
  const storedUser = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const user = storedUser ? JSON.parse(storedUser) : null

  const visibleTabs = TABS.filter((t) => t.roles.includes(user?.rol))

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(visibleTabs[0]?.id ?? 'crear')
  const [filterDate, setFilterDate] = useState(today)
  const [filterCuposDate, setFilterCuposDate] = useState('')
  const [filterCancelarDate, setFilterCancelarDate] = useState('')
  const [filterAsistDate, setFilterAsistDate] = useState(today)
  const [filterAsistHora, setFilterAsistHora] = useState(HORARIOS[0])
  const [cuposMax, setCuposMax] = useState(() => Object.fromEntries(HORARIOS.map((h) => [h, 5])))
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

  // ── Guarda de rol ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user || !['admin', 'secretario'].includes(user.rol)) {
      navigate('/login')
    }
  }, [])

  // ── Carga de datos desde backend ───────────────────────────────────────────
  useEffect(() => {
    const cargarClases = async () => {
      try {
        const res = await fetch(`${API_URL}/api/clases`)
        if (res.ok) {
          const data = await res.json()
          if (data.length > 0) setUpcomingClasses(data)
        }
      } catch {
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
          setCuposInput(Object.fromEntries(data.map((clase) => [clase.id, clase.cupo_maximo])))
        }
      } catch {
        console.log('No se pudieron cargar los cupos desde el backend')
      }
    }
    cargarCupos()
  }, [])

  useEffect(() => {
    const cargarPrecios = async () => {
      try {
        const res = await fetch(`${API_URL}/api/precios`)
        if (res.ok) {
          const data = await res.json()
          setPrecio(data.precio ?? 0)
        }
      } catch {
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
      } catch {
        console.log('No se pudieron cargar las clases para cancelar')
      }
    }
    cargarClasesCancelar()
  }, [])

  // ── Datos derivados ────────────────────────────────────────────────────────
  const turnos = useMemo(() => buildTurnos(), [])

  const turnosFiltrados = turnos.map((t) => ({
    ...t,
    estado: cancelados[t.id] ? 'cancelado' : t.estado,
  }))

  const turnosActivos = turnosFiltrados.filter((t) => t.estado !== 'cancelado')
  const statTurnos = turnosActivos.length

  const totalLibres = HORARIOS.reduce((acc, h) => {
    const occ = ocupados[h] || 0
    return acc + Math.max(0, cuposMax[h] - occ)
  }, 0)

  // ── Funciones ──────────────────────────────────────────────────────────────
  function showToast(msg) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  function cancelarTurno(id, nombre) {
    setCancelados((prev) => ({ ...prev, [id]: true }))
    showToast(`Turno de ${nombre} cancelado`)
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
    const clase = clasesParaCancelar.find((c) => c.id === claseId)
    if (!clase) return

    try {
      const res = await fetch(`${API_URL}/api/clases-cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clase_programada_id: claseId }),
      })

      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast(body.detail || 'Error al cancelar clase')
        return
      }

      setClasesParaCancelar((prev) => prev.filter((c) => c.id !== claseId))
      showToast('La clase ha sido cancelada exitosamente')
    } catch {
      showToast('Error al cancelar clase en backend')
    }
  }

  async function crearClasesProgramadas(datos) {
    const res = await fetch(`${API_URL}/api/clases/programadas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(body.detail || 'Error al programar las clases.')
    showToast(
      `${body.creadas} clase${body.creadas !== 1 ? 's' : ''} programada${body.creadas !== 1 ? 's' : ''} creada${body.creadas !== 1 ? 's' : ''} correctamente`
    )
    return body
  }

  async function eliminarClasesPorProfesional(email) {
    const res = await fetch(`${API_URL}/api/clases/por-profesional/${encodeURIComponent(email)}`, {
      method: 'DELETE',
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      throw new Error(body.detail || 'Error al eliminar las clases.')
    }
    showToast(`Clases de ${email} canceladas correctamente`)
    return body
  }

  function guardarAsistencia() {
    const total = Object.values(asistencia).filter(Boolean).length
    setPresentes(total)
    showToast('Asistencia guardada correctamente')
  }

  async function modificarCupo(claseId) {
    const clase = cuposClasses.find((c) => c.id === claseId)
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
          zona_id: clase.zona_id,
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

      setCuposClasses((prev) =>
        prev.map((c) => (c.id === claseId ? { ...c, cupo_max: nuevoCupo } : c))
      )
      setCuposInput((prev) => ({ ...prev, [claseId]: nuevoCupo }))
      showToast('Modificación exitosa')
    } catch {
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
      .then(async (res) => {
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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <AdminNav
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        visibleTabs={visibleTabs}
        onLogout={logout}
      />

      <div className='admin-container'>
        {activeTab === 'turnos' && (
          <TurnosTab
            turnos={turnosFiltrados}
            cancelados={cancelados}
            onCancel={cancelarTurno}
            filterDate={filterDate}
            onFilterChange={setFilterDate}
          />
        )}

        {activeTab === 'pacientes' && <PacientesTab pacientes={PACIENTES} />}

        {activeTab === 'cupos' && (
          <CuposTab
            classes={cuposClasses}
            cuposInput={cuposInput}
            onInputChange={(id, val) => setCuposInput((prev) => ({ ...prev, [id]: val }))}
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
            onAsistChange={(key, val) => setAsistencia((prev) => ({ ...prev, [key]: val }))}
            onSave={guardarAsistencia}
          />
        )}

        {activeTab === 'crear' && <CrearTab onCrear={crearClase} />}

        {activeTab === 'programar' && <ProgramarTab onProgramar={crearClasesProgramadas} />}

        {activeTab === 'cancelar' && (
          <CancelarTab
            classes={clasesParaCancelar}
            onCancelar={cancelarClase}
            filterDate={filterCancelarDate}
            onFilterChange={setFilterCancelarDate}
          />
        )}

        {activeTab === 'eliminar' && <EliminarTab onEliminar={eliminarClasesPorProfesional} />}

        {activeTab === 'precios' && (
          <PriceTab
            classes={upcomingClasses}
            priceValue={priceInput}
            onPriceChange={setPriceInput}
            onModifyPrice={modificarPrecio}
            currentPrice={precio}
          />
        )}

        {activeTab === 'secretarios' && <SecretariosTab />}
      </div>

      <div className={`admin-toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </>
  )
}
