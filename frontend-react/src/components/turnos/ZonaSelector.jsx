import { zonasInfo } from '../../constants/turnos'

export function ZonaSelector({ selected, onSelect }) {
  return (
    <div className="card">
      <div className="card-title">¿Qué zona querés trabajar?</div>
      <div className="zona-grid">
        {zonasInfo.map(({ id, name, sub, icon }) => (
          <button
            key={id}
            className={`zona-btn${selected === id ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div className="zona-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                {icon}
              </svg>
            </div>
            <div>
              <div className="zona-name">{name}</div>
              <div className="zona-sub">{sub}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
