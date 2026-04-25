import { initials } from '../../utils/strings'
import { fmtLargo, nextHour } from '../../utils/dates'
import { ZONAS } from '../../constants/admin'

export function TurnosTab({ turnos, cancelados, onCancel, filterDate, onFilterChange }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Turnos del día</h3>
          <p>{fmtLargo(filterDate)}</p>
        </div>
        <div className="date-filter">
          <input type="date" value={filterDate} onChange={e => onFilterChange(e.target.value)} />
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
            {turnos.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-t)', padding: '2rem' }}>Sin turnos para esta fecha</td></tr>
            ) : turnos.map(t => (
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
                    onClick={() => onCancel(t.id, t.paciente.nombre)}
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
  )
}
