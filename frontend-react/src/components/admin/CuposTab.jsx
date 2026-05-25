export function CuposTab({
  classes,
  cuposInput,
  onInputChange,
  onModifyCupo,
  filterDate,
  onFilterChange,
  salas = [], 
}) {
  const filteredClasses = filterDate
    ? classes.filter((clase) => clase.fecha === filterDate)
    : classes
 
  function getCupoSala(salaNombre) {
    const sala = salas.find((s) => s.nombre === salaNombre)
    return sala ? sala.cupo : null
  }
  return (
    <div style={{ padding: '1.5rem' }}>
      {/* Header igual al de Modificar precio */}
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
        Modificar cupo de clases
      </h3>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Selecciona una clase sin inscriptos y ajusta su cupo máximo.
      </p>

      {/* Filtro de fecha alineado a la derecha, estilo limpio */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => onFilterChange(e.target.value)}
          style={{
            border: '1px solid #ddd',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Tabla estilo Modificar precio */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Zona', 'Sala', 'Profesional', 'Fecha', 'Horario', 'Cupo actual', 'Nuevo cupo', 'Acción'].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    color: '#7c3d52',        // color vino/morado como en la tabla
                    fontWeight: '600',
                    fontSize: '0.85rem',
                    borderBottom: '1px solid #eee',
                    background: 'transparent',
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredClasses.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{ textAlign: 'center', padding: '2rem', color: '#999', fontSize: '0.875rem' }}
                >
                  No hay clases sin inscriptos disponibles.
                </td>
              </tr>
            ) : (
             filteredClasses.map((clase, index) => {
                const cupoSala = getCupoSala(clase.sala_nombre)
                const valorInput = parseInt(cuposInput[clase.id] ?? clase.cupo_maximo, 10)
                const superaCupo = cupoSala !== null && valorInput > cupoSala
                return (
                  <tr
                    key={clase.id}
                    style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}
                  >
                    <td style={{ padding: '0.75rem 1rem' }}>{clase.zona_nombre}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{clase.sala_nombre ?? '—'}</td>
                    <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.85rem' }}>
                      {clase.profesional_email ? clase.profesional_email.split('@')[0] : 'Sin asignar'}
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>{clase.fecha}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{clase.hora}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>{clase.cupo_maximo}</td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        <input
                          type="number"
                          min="1"
                          value={cuposInput[clase.id] ?? clase.cupo_maximo}
                          onChange={(e) => onInputChange(clase.id, e.target.value)}
                          style={{
                            width: '80px',
                            border: `1px solid ${superaCupo ? '#f87171' : '#ddd'}`,
                            borderRadius: '6px',
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.875rem',
                            outline: 'none',
                            background: superaCupo ? '#fee2e2' : 'transparent',
                          }}
                        />
                        {superaCupo && (
                          <span style={{ fontSize: '0.72rem', color: '#c0435a' }}>
                            Máx. sala: {cupoSala}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem 1rem' }}>
                      <button
                        onClick={() => !superaCupo && onModifyCupo(clase.id)}
                        disabled={superaCupo}
                        style={{
background: superaCupo ? '#d1d5db' : '#c0435a',
color: superaCupo ? '#9ca3af' : '#fff',
border: 'none',
                          borderRadius: '6px',
                          padding: '0.4rem 1rem',
                          fontSize: '0.85rem',
                          cursor: superaCupo ? 'not-allowed' : 'pointer',
                          fontWeight: '500',
                          pointerEvents: superaCupo ? 'none' : 'auto',
                        }}
                      >
                        Modificar
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
