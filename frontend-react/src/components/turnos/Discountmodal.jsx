import { useEffect } from 'react'

const tiers = [
  {
    clases: 1,
    label: '1 clase',
    descuento: 0,
    desc: 'Precio estándar por clase.',
    color: 'var(--primary-tint)',
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

function buildClosedKey() {
  try {
    const stored = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
    if (!stored) return 'discount_modal_closed_guest'
    // Intentar extraer un id claro del JSON si está disponible
    try {
      const obj = JSON.parse(stored)
      if (obj && (obj.id || obj.usuario_id)) return `discount_modal_closed_user_${obj.id ?? obj.usuario_id}`
    } catch {
      // no es JSON, seguiremos con base64
    }
    try {
      return `discount_modal_closed_user_${btoa(stored)}`
    } catch {
      return `discount_modal_closed_guest`
    }
  } catch {
    return 'discount_modal_closed_guest'
  }
}

export default function DiscountModal({ isOpen, onClose }) {
  const closedKey = buildClosedKey()

  // Si no está abierto o el usuario ya lo cerró en esta sesión, no renderizamos
  try {
    if (!isOpen || localStorage.getItem(closedKey)) return null
  } catch (err) {
    // Si localStorage falla, seguimos y mostramos el modal normalmente
  }

  function handleClose() {
    try {
      localStorage.setItem(closedKey, '1')
    } catch (err) {
      // ignorar errores de storage
    }
    if (typeof onClose === 'function') onClose()
  }

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen])

  return (
    <div
      className='discount-modal-overlay'
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose()
      }}
      role='dialog'
      aria-modal='true'
      aria-labelledby='discount-modal-title'
    >
      <div className='discount-modal'>
        {/* Close button */}
        <button className='discount-modal-close' onClick={handleClose} aria-label='Cerrar'>
          ×
        </button>

        {/* Header */}
        <div className='discount-modal-header'>
          <div className='discount-modal-badge'>🏷️ Descuentos por pack</div>
          <h2 id='discount-modal-title'>¡Reservá más y pagás menos!</h2>
          <p>
            Podés agendar <strong>3 clases</strong> en una sola reserva. Cuantas más clases
            reservés, mayor es tu descuento.
          </p>
        </div>

        {/* Tiers */}
        <div className='discount-tiers'>
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
                <div className='discount-tier-best' style={{ background: tier.border, color: tier.text }}>
                  ✦ Mejor opción
                </div>
              )}
              <div className='discount-tier-top'>
                <span className='discount-tier-label' style={{ color: tier.text }}>
                  {tier.label}
                </span>
                <span className='discount-tier-pct' style={{ color: tier.text }}>
                  {tier.descuento > 0 ? `-${tier.descuento}%` : 'Sin descuento'}
                </span>
              </div>
              <p className='discount-tier-desc' style={{ color: tier.text }}>
                {tier.desc}
              </p>
            </div>
          ))}
        </div>
        {/* Footer note */}
        <p className='discount-modal-footnote'>
          El descuento se aplica automáticamente al seleccionar 2 o 3 turnos. ¡No necesitás ningún
          código!
        </p>
      </div>
    </div>
  )
}
