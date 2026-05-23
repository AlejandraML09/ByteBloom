import { ZONAS } from '../../constants/admin'

export function CancelarTab({ classes, onCancelar, filterDate, onFilterChange }) {
  const filteredClasses = filterDate
    ? classes.filter((clase) => clase.fecha === filterDate)
    : classes

  return (
    <div style={{ padding: '1.5rem' }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
        Cancelar clase
      </h3>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Selecciona una clase no cancelada para cancelarla.
      </p>

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

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
          <thead>
            <tr>
              {['Zona', 'Sala', 'Profesional', 'Fecha', 'Horario', 'Cupo máx', 'Inscriptos', 'Acción'].map((col) => (
                <th
                  key={col}
                  style={{
                    textAlign: 'left',
                    padding: '0.75rem 1rem',
                    color: '#7c3d52',
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
                  No hay clases disponibles para cancelar.
                </td>
              </tr>
            ) : (
              filteredClasses.map((clase, index) => (
                <tr key={clase.id} style={{ background: index % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.zona_nombre}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.sala_nombre ?? '—'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: '#666', fontSize: '0.85rem' }}>
                    {clase.profesional_email ? clase.profesional_email.split('@')[0] : 'Sin asignar'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.fecha}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.hora}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.cupo_maximo}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>{clase.cupo_maximo - clase.cupo_disponible}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <button
                      onClick={() => onCancelar(clase.id)}
                      style={{
                        background: '#c0435a',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '0.4rem 1rem',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                      }}
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