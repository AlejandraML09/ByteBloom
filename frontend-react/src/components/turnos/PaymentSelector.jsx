import mpLogo from '../../assets/MP_RGB_HANDSHAKE_color_horizontal.png'
import cuentaDniLogo from '../../assets/cuenta_dni.png'
import modoLogo from '../../assets/modo_logo.png'

const METHODS = [
  {
    id: 'mercadopago',
    logo: <img src={mpLogo} alt='MercadoPago' />,
  },
  {
    id: 'cuentadni',
    logo: <img src={cuentaDniLogo} alt='Cuenta DNI' />,
  },
  {
    id: 'modo',
    logo: <img src={modoLogo} alt='Modo' />,
  },
  {
    id: 'credito',
    label: 'Crédito',
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
    id: 'debito',
    label: 'Débito',
    logo: (
      <svg viewBox='0 0 48 30' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect
          x='1'
          y='1'
          width='46'
          height='28'
          rx='4'
          fill='#0f2044'
          stroke='#10b981'
          strokeWidth='1.5'
        />
        <rect x='1' y='9' width='46' height='6' fill='#10b981' />
        <rect x='6' y='20' width='10' height='4' rx='1' fill='#10b981' opacity='0.6' />
        <circle cx='36' cy='22' r='4' fill='#10b981' opacity='0.8' />
      </svg>
    ),
  },
  {
    id: 'efectivo',
    label: 'Efectivo',
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
    id: 'transferencia',
    label: 'Transferencia',
    logo: (
      <svg viewBox='0 0 48 30' fill='none' xmlns='http://www.w3.org/2000/svg'>
        <rect
          x='1'
          y='1'
          width='46'
          height='28'
          rx='4'
          fill='#1e0a4a'
          stroke='#8b5cf6'
          strokeWidth='1.5'
        />
        <path
          d='M8 10 H34 L28 6 M34 10 L28 14'
          stroke='#8b5cf6'
          strokeWidth='1.8'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
        <path
          d='M40 20 H14 L20 16 M14 20 L20 24'
          stroke='#8b5cf6'
          strokeWidth='1.8'
          fill='none'
          strokeLinecap='round'
          strokeLinejoin='round'
        />
      </svg>
    ),
  },
]

export function PaymentSelector({ selected, onSelect }) {
  return (
    <div className='card'>
      <div className='card-title'>
        <span className='step-number'>3</span> Medios de pago
      </div>
      <div className='payment-row'>
        {METHODS.map(({ id, label, logo }) => (
          <button
            key={id}
            className={`payment-btn${selected === id ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
          >
            <div className='payment-logo'>{logo}</div>
            <span className='payment-label'>{label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
