import { initials } from '../../utils/strings'
import { HORARIOS, ZONAS } from '../../constants/admin'

export function AsistenciaTab({ turnos, filterDate, filterHora, onDateChange, onHoraChange, asistencia, onAsistChange, onSave }) {
  const asistTurnos = turnos.filter(t => t.hora === filterHora && t.estado !== 'cancelado')

  return (
    <div className="card">
      <div className="card-header">
        <div><h3>Tomar asistencia</h3><p>Marcá la presencia de cada paciente</p></div>
        <div className="date-filter">
          <input type="date" value={filterDate} onChange={e => onDateChange(e.target.value)} />
          <select value={filterHora} onChange={e => onHoraChange(e.target.value)}>
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
              const key = `${filterDate}_${filterHora}_${t.paciente.id}`
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
                      onChange={e => onAsistChange(key, e.target.checked)}
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
          onClick={onSave}
        >
          Guardar asistencia
        </button>
      </div>
    </div>
  )
}
