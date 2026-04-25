import { HORARIOS } from '../../constants/admin'

export function CuposTab({ ocupados, cuposMax, cuposInput, onInputChange, onSave, filterDate, onFilterChange }) {
  return (
    <div className="card">
      <div className="card-header">
        <div><h3>Gestionar cupos por horario</h3><p>Cupo máximo: 5 personas por turno</p></div>
        <div className="date-filter">
          <input type="date" value={filterDate} onChange={e => onFilterChange(e.target.value)} />
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
                      onChange={e => onInputChange(hora, e.target.value)}
                    />
                  </td>
                  <td>{libres} lugar{libres !== 1 ? 'es' : ''}</td>
                  <td>{estadoBadge}</td>
                  <td>
                    <button className="btn-action" onClick={() => onSave(hora)}>Guardar</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
