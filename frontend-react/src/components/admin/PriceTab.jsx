export function PriceTab({ classes, priceValue, onPriceChange, onModifyPrice, currentPrice }) {
  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Modificar precio de clases</h3>
          <p>Aplica el nuevo precio a todas las próximas clases programadas sin inscriptos.</p>
        </div>
      </div>

      <div className='card-body' style={{ padding: '1.5rem' }}>
        <div
          style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            marginBottom: '1.5rem',
            alignItems: 'flex-end',
          }}
        >
          <div style={{ flex: '1 1 220px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              Precio actual: <strong>${currentPrice ?? 0}</strong>
            </label>
            <input
              type='number'
              value={priceValue}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder='Ej: 1800'
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '10px',
                border: '1.5px solid #EAE4F2',
                fontSize: '14px',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className='btn-action' onClick={onModifyPrice} style={{ minWidth: '180px' }}>
              Modificar precio
            </button>
          </div>
        </div>

        <div>
          <div
            style={{ marginBottom: '0.75rem', fontSize: '13px', color: '#6B5D8C', fontWeight: 500 }}
          >
            Próximas clases sin inscriptos
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Zona</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>
                  Horario
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>
                  Cupo máx
                </th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>
                  Inscriptos
                </th>
              </tr>
            </thead>
            <tbody>
              {classes.length === 0 ? (
                <tr>
                  <td
                    colSpan='5'
                    style={{ textAlign: 'center', padding: '1.5rem', color: '#7A6F9B' }}
                  >
                    No hay clases disponibles.
                  </td>
                </tr>
              ) : (
                classes.map((clase) => (
                  <tr key={clase.id} style={{ borderBottom: '1px solid #EAE4F2' }}>
                    <td style={{ padding: '10px 12px' }}>{clase.zona_nombre ?? clase.zona}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.fecha}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.hora}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.cupo_maximo}</td>
                    <td style={{ padding: '10px 12px' }}>{clase.cupo_maximo - clase.cupo_disponible}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
