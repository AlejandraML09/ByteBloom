import mpLogo from '../../assets/MP_RGB_HANDSHAKE_color_horizontal.png'
import cuentaDniLogo from '../../assets/cuenta_dni.png'
import modoLogo from '../../assets/modo_logo.png'

const METHODS = [
  {
    id: 'mercadopago',
    logo: <img src={mpLogo} alt='MercadoPago' />,
  },
  {
    id: 'credito',
    label: 'Crédito/Débito',
    logo: (
      <svg viewBox='0 0 48 30' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect
          x='1'
          y='1'
          width='46'
          height='28'
          rx='4'
          fill='#1a1a2e'
          stroke='#f59e0b'
          strokeWidth='1.5'
        />
        <rect x='1' y='9' width='46' height='6' fill='#f59e0b' />
        <rect x='6' y='20' width='10' height='4' rx='1' fill='#f59e0b' opacity='0.6' />
        <circle cx='34' cy='22' r='5' fill='#e53e3e' opacity='0.9' />
        <circle cx='39' cy='22' r='5' fill='#f59e0b' opacity='0.9' />
      </svg>
    ),
  },
  {
    id: 'efectivo',
    label: 'Efectivo/Transferencia',
    logo: (
      <svg viewBox='0 0 48 30' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect
          x='1'
          y='1'
          width='46'
          height='28'
          rx='4'
          fill='#166534'
          stroke='#22c55e'
          strokeWidth='1.5'
        />
        <text
          x='24'
          y='21'
          textAnchor='middle'
          fill='#22c55e'
          fontFamily='Arial,sans-serif'
          fontWeight='800'
          fontSize='16'
        >
          $
        </text>
        <rect x='6' y='5' width='8' height='5' rx='1' fill='#22c55e' opacity='0.4' />
        <rect x='34' y='20' width='8' height='5' rx='1' fill='#22c55e' opacity='0.4' />
      </svg>
    ),
  },
  {
    id: 'Crédito a favor',
    label: 'Crédito a favor',
    logo: (
      <svg viewBox='0 0 48 30' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect
          x='1'
          y='1'
          width='46'
          height='28'
          rx='4'
          fill='#0c2340'
          stroke='#38bdf8'
          strokeWidth='1.5'
        />
        <circle
          cx='24'
          cy='15'
          r='8'
          fill='none'
          stroke='#38bdf8'
          strokeWidth='1.5'
        />
        <text
          x='24'
          y='19.5'
          textAnchor='middle'
          fill='#38bdf8'
          fontFamily='Arial,sans-serif'
          fontWeight='800'
          fontSize='11'
        >
          ★
        </text>
      </svg>
    ),
  },
]

export function PaymentSelector({
  selected,
  onSelect,
  allowCreditos = true,
  showCreditsNotice = true,
  shiftsCount = 1,
  excludeMethods = [],
}) {
  const storedUser =
    localStorage.getItem('usuario') ||
    localStorage.getItem('ks_user')

  const usuario = storedUser ? JSON.parse(storedUser) : null

  const creditosDisponibles =
    Number(localStorage.getItem(`creditos_${usuario?.id}`)) || 0

  return (
    <div className='card'>
      <div className='card-title'>
        <span className='step-number'>3</span> Medios de pago
      </div>

      <div className='payment-row'>
        {METHODS
          .filter((m) => allowCreditos || m.id !== 'Crédito a favor')
          .filter((m) => !excludeMethods.includes(m.id))
          .map(({ id, label, logo }) => {
            const disabled =
              id === 'Crédito a favor' && creditosDisponibles < shiftsCount

            return (
              <button
                key={id}
                className={`payment-btn${selected === id ? ' selected' : ''}${disabled ? ' disabled' : ''}`}
                onClick={() => !disabled && onSelect(id)}
                aria-disabled={disabled}
                title={disabled ? 'No tenés créditos disponibles' : undefined}
              >
                <div
                  className='payment-logo'
                  style={disabled ? { opacity: 0.4 } : undefined}
                >
                  {logo}
                </div>

                <span
                  className='payment-label'
                  style={disabled ? { opacity: 0.4 } : undefined}
                >
                  {label}
                </span>

                {id === 'Crédito a favor' && (
                  <span
                    className='payment-badge-credits'
                    style={creditosDisponibles < shiftsCount ? { background: '#ef4444' } : undefined}
                  >
                    {creditosDisponibles < shiftsCount
                      ? `${creditosDisponibles}/${shiftsCount}`
                      : creditosDisponibles}
                  </span>
                )}
              </button>
            )
          })}
      </div>

      {showCreditsNotice && (
        <p className='payment-credits-notice'>
          Cada crédito equivale a una clase.
        </p>
      )}
    </div>
  )
}