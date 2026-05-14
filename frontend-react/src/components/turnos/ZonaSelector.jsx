import { zonasInfo, PRICE_PER_SHIFT } from '../../constants/turnos'

const fmt = n => `$${n.toLocaleString('es-AR')}`

export function ZonaSelector({ selected, onSelect }) {
  return (
    <div className="card">
      <div className="card-title"><span className="step-number">1</span> ¿Qué zona querés trabajar?</div>
      <div className="zona-grid">
        {zonasInfo.map(({ id, name, sub, icon }) => (
          <button
            key={id}
            className={`zona-btn${selected === id ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div className="zona-icon">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.5" strokeLinecap="round">
                {icon}
              </svg>
            </div>
            <div>
              <div className="zona-name">{name}</div>
              <div className="zona-sub">{sub}</div>
              <div className="zona-price">{fmt(PRICE_PER_SHIFT)}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
