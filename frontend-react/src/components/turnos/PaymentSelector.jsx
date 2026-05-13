const METHODS = [
  {
    id: 'mercadopago',
    label: 'MercadoPago',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M8 12h.01M12 12h.01M16 12h.01"/>
        <path d="M2 10h20"/>
      </svg>
    ),
  },
  {
    id: 'cuentadni',
    label: 'CuentaDNI',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <path d="M9 7h6M9 11h6M9 15h4"/>
      </svg>
    ),
  },
  {
    id: 'credito',
    label: 'Tarjeta de Crédito',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
        <path d="M6 15h4"/>
      </svg>
    ),
  },
  {
    id: 'debito',
    label: 'Tarjeta de Débito',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2"/>
        <path d="M2 10h20"/>
        <circle cx="17" cy="15" r="1.5" fill="currentColor" stroke="none"/>
      </svg>
    ),
  },
]

export function PaymentSelector({ selected, onSelect }) {
  return (
    <div className="card">
      <div className="card-title">Medio de pago</div>
      <div className="payment-grid">
        {METHODS.map(({ id, label, icon }) => (
          <button
            key={id}
            className={`payment-btn${selected === id ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div className="payment-icon">{icon}</div>
            <span className="payment-label">{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
