import { useEffect } from 'react'

const tiers = [
  {
    clases: 1,
    label: '1 clase',
    descuento: 0,
    desc: 'Precio estándar por clase.',
    color: "var(--primary-tint)",
    text: 'var(--primary-text)',
    border: 'var(--border)',
  },
  {
    clases: 2,
    label: '2 clases',
    descuento: 10,
    desc: '¡Combiná dos clases en una sola reserva y ahorrá!',
    color: 'var(--primary-mid)',
    text: 'var(--white)',
    border: 'var(--border)',
    highlight: false,
  },
  {
    clases: 3,
    label: '3 clases',
    descuento: 20,
    desc: 'El mejor valor. Reservá tres clases y maximizá tu ahorro.',
    color: 'var(--primary)',
    text: 'var(--white)',
    border: 'var(--primary-mid)',
    highlight: true,
  },
]

export default function DiscountModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="discount-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="discount-modal-title"
    >
      <div className="discount-modal">
        {/* Close button */}
        <button className="discount-modal-close" onClick={onClose} aria-label="Cerrar">
          ×
        </button>

        {/* Header */}
        <div className="discount-modal-header">
          <div className="discount-modal-badge">🏷️ Descuentos por pack</div>
          <h2 id="discount-modal-title">¡Reservá más y pagás menos!</h2>
          <p>
            Podés agendar <strong>3 clases</strong> en una sola reserva.
            Cuantas más clases reservés, mayor es tu descuento.
          </p>
        </div>

        {/* Tiers */}
        <div className="discount-tiers">
          {tiers.map((tier) => (
            <div
              key={tier.clases}
              className={`discount-tier${tier.highlight ? ' discount-tier--highlight' : ''}`}
              style={{
                background: tier.color,
                borderColor: tier.border,
              }}
            >
              {tier.highlight && (
                <div className="discount-tier-best" style={{ background: tier.border, color: tier.text }}>
                  ✦ Mejor opción
                </div>
              )}
              <div className="discount-tier-top">
                <span className="discount-tier-label" style={{ color: tier.text }}>
                  {tier.label}
                </span>
                <span className="discount-tier-pct" style={{ color: tier.text }}>
                  {tier.descuento > 0 ? `-${tier.descuento}%` : 'Sin descuento'}
                </span>
              </div>
              <p className="discount-tier-desc" style={{ color: tier.text }}>
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
        {/* Footer note */}
        <p className="discount-modal-footnote">
          El descuento se aplica automáticamente al seleccionar 2 o 3 turnos. ¡No necesitás ningún código!
        </p>
        {/* <button className="discount-modal-cta" onClick={onClose}>
          Entendido, ¡vamos a reservar!
        </button> */}
      </div>
    </div>
  )
}