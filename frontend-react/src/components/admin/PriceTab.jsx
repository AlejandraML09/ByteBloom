import { ZONAS } from '../../constants/admin'

export function PriceTab({ classes, selectedZona, priceValue, onSelectZona, onPriceChange, onModifyPrice, currentPrices }) {
  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Modificar precio de clases</h3>
          <p>Aplica el nuevo precio a las próximas clases programadas sin inscriptos.</p>
        </div>
      </div>

      <div className="card-body" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: 500 }}>Zona</label>
            <select
              value={selectedZona}
              onChange={e => onSelectZona(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE4F2', fontSize: '14px' }}
            >
              {Object.entries(ZONAS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div style={{ flex: '1 1 220px' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '13px', fontWeight: 500 }}>Nuevo precio</label>
            <input
              type="number"
              value={priceValue}
              onChange={e => onPriceChange(e.target.value)}
              placeholder="Ej: 1800"
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1.5px solid #EAE4F2', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              className="btn-action"
              onClick={onModifyPrice}
              style={{ minWidth: '180px' }}
            >
              Modificar precio
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem' }}>
            {Object.entries(currentPrices).map(([key, value]) => (
              <div key={key} className="stat-card" style={{ padding: '0.95rem 1rem' }}>
                <div className="stat-label">{ZONAS[key]}</div>
                <div className="stat-val">${value}</div>
                <div className="stat-sub">Precio actual</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={{ marginBottom: '0.75rem', fontSize: '13px', color: '#6B5D8C', fontWeight: 500 }}>Próximas clases sin inscriptos</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Zona</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Fecha</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Horario</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Precio</th>
                <th style={{ textAlign: 'left', padding: '10px 12px', color: '#7A6F9B' }}>Inscriptos</th>
              </tr>
            </thead>
            <tbody>
              {classes.map(clase => (
                <tr key={clase.id} style={{ borderBottom: '1px solid #EAE4F2' }}>
                  <td style={{ padding: '10px 12px' }}>{ZONAS[clase.zona]}</td>
                  <td style={{ padding: '10px 12px' }}>{clase.fecha}</td>
                  <td style={{ padding: '10px 12px' }}>{clase.hora}</td>
                  <td style={{ padding: '10px 12px' }}>${clase.precio}</td>
                  <td style={{ padding: '10px 12px' }}>{clase.inscriptos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
