export function CuposTab({
  classes,
  cuposInput,
  onInputChange,
  onModifyCupo,
  filterDate,
  onFilterChange,
}) {
  const filteredClasses = filterDate
    ? classes.filter((clase) => clase.fecha === filterDate)
    : classes

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Modificar cupo de clase</h3>
          <p>Selecciona una clase sin inscriptos y ajusta su cupo máximo.</p>
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
              <th>Cupo actual</th>
              <th>Nuevo cupo</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td colSpan='6' style={{ textAlign: 'center', padding: '1.5rem' }}>
                  No hay clases sin inscriptos disponibles.
                </td>
              </tr>
            ) : (
              filteredClasses.map((clase) => (
                <tr key={clase.id}>
                  <td>{clase.zona_nombre}</td>
                  <td>{clase.fecha}</td>
                  <td>{clase.hora}</td>
                  <td>{clase.cupo_maximo}</td>
                  <td>
                    <input
                      className='cupo-input'
                      type='number'
                      min='1'
                      value={cuposInput[clase.id] ?? clase.cupo_maximo}
                      onChange={(e) => onInputChange(clase.id, e.target.value)}
                    />
                  </td>
                  <td>
                    <button className='btn-action' onClick={() => onModifyCupo(clase.id)}>
                      Modificar
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
