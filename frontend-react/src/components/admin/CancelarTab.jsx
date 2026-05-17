import { ZONAS } from '../../constants/admin'

export function CancelarTab({ classes, onCancelar, filterDate, onFilterChange }) {
  const filteredClasses = filterDate
    ? classes.filter((clase) => clase.fecha === filterDate)
    : classes

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Cancelar clase</h3>
          <p>Selecciona una clase no cancelada para cancelarla.</p>
        </div>
        <div className='date-filter'>
          <input type='date' value={filterDate} onChange={(e) => onFilterChange(e.target.value)} />
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Zona</th>
              <th>Fecha</th>
              <th>Horario</th>
              <th>Precio</th>
              <th>Cupo máx</th>
              <th>Inscritos</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan='7' style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No hay clases disponibles para cancelar.
                </td>
              </tr>
            ) : (
              filteredClasses.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.zona}</td>
                  <td>{clase.fecha}</td>
                  <td>{clase.hora}</td>
                  <td>${clase.precio}</td>
                  <td>{clase.cupo_max}</td>
                  <td>{clase.inscritos}</td>
                  <td>
                    <button
                      className='btn-action'
                      onClick={() => onCancelar(clase.id)}
                      style={{ backgroundColor: '#d32f2f', color: 'white' }}
                    >
                      Cancelar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
