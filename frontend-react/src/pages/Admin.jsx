import { useState, useMemo, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import '../css/admin.css'

const HORARIOS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00']
const ZONAS    = { superior: 'Tren superior', medio: 'Tren medio', inferior: 'Tren inferior' }
const DIAS     = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
const MESES    = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

const PACIENTES = [
  { id:1, nombre:'María González',   email:'paciente@Empresa.com', tel:'221-4561234', os:'IOMA',           zona:'superior', asistencias: 12 },
  { id:2, nombre:'Carlos Pérez',     email:'cperez@mail.com',      tel:'221-7893456', os:'OSDE',           zona:'inferior', asistencias: 8  },
  { id:3, nombre:'Ana Rodríguez',    email:'ana.r@mail.com',       tel:'221-5554321', os:'Swiss Medical',  zona:'medio',    asistencias: 15 },
  { id:4, nombre:'Luis Martínez',    email:'luism@mail.com',       tel:'221-3217654', os:'PAMI',           zona:'inferior', asistencias: 5  },
  { id:5, nombre:'Sofía Torres',     email:'sofiat@mail.com',      tel:'221-6549870', os:'Galeno',         zona:'superior', asistencias: 20 },
  { id:6, nombre:'Diego Fernández',  email:'diegof@mail.com',      tel:'221-1236540', os:'Particular',     zona:'medio',    asistencias: 3  },
  { id:7, nombre:'Laura Sánchez',    email:'lauras@mail.com',      tel:'221-9874561', os:'IOMA',           zona:'superior', asistencias: 9  },
  { id:8, nombre:'Roberto Díaz',     email:'rdíaz@mail.com',       tel:'221-7412580', os:'OSDE',           zona:'inferior', asistencias: 11 },
]

const DIST = [
  { pac:0, hora:'09:00', zona:'superior', estado:'confirmado' },
  { pac:4, hora:'09:00', zona:'superior', estado:'confirmado' },
  { pac:1, hora:'10:00', zona:'inferior', estado:'confirmado' },
  { pac:2, hora:'10:00', zona:'medio',    estado:'confirmado' },
  { pac:6, hora:'11:00', zona:'superior', estado:'pendiente'  },
  { pac:3, hora:'12:00', zona:'inferior', estado:'confirmado' },
  { pac:5, hora:'13:00', zona:'medio',    estado:'cancelado'  },
  { pac:7, hora:'14:00', zona:'inferior', estado:'confirmado' },
  { pac:2, hora:'15:00', zona:'medio',    estado:'pendiente'  },
]

function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

function fmtLargo(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00')
  return `${DIAS[dt.getDay()]} ${dt.getDate()} de ${MESES[dt.getMonth()]}`
}

function initials(nombre) {
  return nombre.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()
}

function nextHour(h) {
  const [hr] = h.split(':').map(Number)
  return `${String(hr + 1).padStart(2,'0')}:00`
}

function buildTurnos() {
  return DIST.map((t, i) => ({ ...t, paciente: PACIENTES[t.pac], id: i }))
}

function initOcupados() {
  const occ = {}
  HORARIOS.forEach(h => { occ[h] = Math.floor(Math.random() * 4) })
  return occ
}

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

  function showToast(msg) {
    setToastMsg(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const turnos = useMemo(() => buildTurnos(), [])
  const turnosFiltrados = turnos.map(t => ({
    ...t,
    estado: cancelados[t.id] ? 'cancelado' : t.estado,
  })).filter(t => t.estado !== 'cancelado' || t.estado === 'cancelado')

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

  function logout() {
    sessionStorage.removeItem('ks_user')
    navigate('/login')
  }

  const asistTurnos = turnos.filter(t => t.hora === filterAsistHora && t.estado !== 'cancelado')

  return (
    <div className="admin-page">

      {/* Navbar admin */}
      <nav className="admin-nav">
        <Link to="/" className="admin-nav-logo">
          <div className="admin-nav-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
              <circle cx="12" cy="9" r="2.5" fill="#fff" stroke="none"/>
            </svg>
          </div>
          <span className="admin-nav-logo-name">Empresa</span>
        </Link>
        <span className="nav-badge">Panel Admin</span>
        <div className="nav-right">
          <div className="nav-user">
            <div className="nav-avatar">{initials(user.nombre)}</div>
            <span>{user.nombre}</span>
          </div>
          <button className="btn-logout" onClick={logout}>Cerrar sesión</button>
        </div>
      </nav>

      {/* Page header */}
      <div className="page-header">
        <h1>Panel de administración</h1>
        <p>Bienvenido/a, {user.nombre} · Hoy es {fmtLargo(today)}</p>
      </div>

      {/* Tabs */}
      <div className="section-tabs">
        {[
          { id: 'turnos', label: 'Turnos del día' },
          { id: 'pacientes', label: 'Pacientes' },
          { id: 'cupos', label: 'Gestionar cupos' },
          { id: 'asistencia', label: 'Asistencia' },
        ].map(({ id, label }) => (
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
        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">Turnos hoy</div>
            <div className="stat-val">{statTurnos}</div>
            <div className="stat-sub">de lunes a viernes</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Presentes hoy</div>
            <div className="stat-val">{presentes}</div>
            <div className="stat-sub">confirmados</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Cupos libres</div>
            <div className="stat-val">{totalLibres}</div>
            <div className="stat-sub">en todos los horarios</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pacientes activos</div>
            <div className="stat-val">8</div>
            <div className="stat-sub">en el sistema</div>
          </div>
        </div>

        {/* Turnos */}
        {activeTab === 'turnos' && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3>Turnos del día</h3>
                <p>{fmtLargo(filterDate)}</p>
              </div>
              <div className="date-filter">
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th><th>Horario</th><th>Zona</th><th>Obra social</th><th>Estado</th><th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {turnosFiltrados.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-t)', padding: '2rem' }}>Sin turnos para esta fecha</td></tr>
                  ) : turnosFiltrados.map(t => (
                    <tr key={t.id}>
                      <td>
                        <div className="patient-name">
                          <div className="patient-avatar">{initials(t.paciente.nombre)}</div>
                          <span>{t.paciente.nombre}</span>
                        </div>
                      </td>
                      <td><strong>{t.hora}</strong> – {nextHour(t.hora)}</td>
                      <td><span className="badge badge-purple">{ZONAS[t.zona]}</span></td>
                      <td>{t.paciente.os}</td>
                      <td>
                        {cancelados[t.id]
                          ? <span className="badge badge-red">Cancelado</span>
                          : t.estado === 'confirmado'
                            ? <span className="badge badge-green">Confirmado</span>
                            : t.estado === 'pendiente'
                              ? <span className="badge badge-amber">Pendiente</span>
                              : <span className="badge badge-red">Cancelado</span>
                        }
                      </td>
                      <td>
                        <button
                          className="btn-action danger"
                          disabled={!!cancelados[t.id]}
                          style={cancelados[t.id] ? { opacity: 0.4 } : {}}
                          onClick={() => cancelarTurno(t.id, t.paciente.nombre)}
                        >
                          Cancelar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pacientes */}
        {activeTab === 'pacientes' && (
          <div className="card">
            <div className="card-header">
              <div><h3>Datos de pacientes</h3><p>Historial completo del sistema</p></div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th><th>Email</th><th>Teléfono</th><th>Obra social</th><th>Zona habitual</th><th>Asistencias</th>
                  </tr>
                </thead>
                <tbody>
                  {PACIENTES.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div className="patient-name">
                          <div className="patient-avatar">{initials(p.nombre)}</div>
                          <span>{p.nombre}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--p-dark)' }}>{p.email}</td>
                      <td>{p.tel}</td>
                      <td>{p.os}</td>
                      <td><span className="badge badge-purple">{ZONAS[p.zona]}</span></td>
                      <td><span className="badge badge-green">{p.asistencias} sesiones</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cupos */}
        {activeTab === 'cupos' && (
          <div className="card">
            <div className="card-header">
              <div><h3>Gestionar cupos por horario</h3><p>Cupo máximo: 5 personas por turno</p></div>
              <div className="date-filter">
                <input type="date" value={filterCuposDate} onChange={e => setFilterCuposDate(e.target.value)} />
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Horario</th><th>Reservados</th><th>Cupo máx.</th><th>Disponibles</th><th>Estado</th><th>Guardar</th>
                  </tr>
                </thead>
                <tbody>
                  {HORARIOS.map(hora => {
                    const occ = ocupados[hora] || 0
                    const max = cuposMax[hora]
                    const libres = Math.max(0, max - occ)
                    const estadoBadge = libres === 0
                      ? <span className="badge badge-red">Sin cupos</span>
                      : libres <= 1
                        ? <span className="badge badge-amber">Casi lleno</span>
                        : <span className="badge badge-green">Disponible</span>
                    return (
                      <tr key={hora}>
                        <td><strong>{hora}</strong></td>
                        <td>
                          <div className="cupo-bar">
                            {Array.from({ length: 5 }, (_, i) => (
                              <div key={i} className={`cupo-dot${i < occ ? (occ >= max ? ' full' : ' taken') : ''}`} />
                            ))}
                          </div>
                        </td>
                        <td>
                          <input
                            className="cupo-input"
                            type="number"
                            min="1"
                            max="10"
                            value={cuposInput[hora]}
                            onChange={e => setCuposInput(prev => ({ ...prev, [hora]: e.target.value }))}
                          />
                        </td>
                        <td>{libres} lugar{libres !== 1 ? 'es' : ''}</td>
                        <td>{estadoBadge}</td>
                        <td>
                          <button className="btn-action" onClick={() => guardarCupo(hora)}>Guardar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Asistencia */}
        {activeTab === 'asistencia' && (
          <div className="card">
            <div className="card-header">
              <div><h3>Tomar asistencia</h3><p>Marcá la presencia de cada paciente</p></div>
              <div className="date-filter">
                <input type="date" value={filterAsistDate} onChange={e => setFilterAsistDate(e.target.value)} />
                <select value={filterAsistHora} onChange={e => setFilterAsistHora(e.target.value)}>
                  {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Paciente</th><th>Zona</th><th>Presente</th>
                  </tr>
                </thead>
                <tbody>
                  {asistTurnos.length === 0 ? (
                    <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--gray-t)', padding: '2rem' }}>Sin pacientes en este horario</td></tr>
                  ) : asistTurnos.map(t => {
                    const key = `${filterAsistDate}_${filterAsistHora}_${t.paciente.id}`
                    return (
                      <tr key={t.id}>
                        <td>
                          <div className="patient-name">
                            <div className="patient-avatar">{initials(t.paciente.nombre)}</div>
                            <span>{t.paciente.nombre}</span>
                          </div>
                        </td>
                        <td><span className="badge badge-purple">{ZONAS[t.zona]}</span></td>
                        <td>
                          <input
                            type="checkbox"
                            className="asist-check"
                            checked={!!asistencia[key]}
                            onChange={e => setAsistencia(prev => ({ ...prev, [key]: e.target.checked }))}
                          />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--gray)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                className="btn-action"
                style={{ background: 'var(--p)', color: '#fff', borderColor: 'var(--p)', padding: '9px 22px', fontSize: '13px' }}
                onClick={guardarAsistencia}
              >
                Guardar asistencia
              </button>
            </div>
          </div>
        )}
      </div>

      <div className={`admin-toast${toastVisible ? ' show' : ''}`}>{toastMsg}</div>
    </div>
  )
}
