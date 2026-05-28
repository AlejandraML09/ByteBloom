import { ZONA_LABELS } from '../../constants/turnos'
import { fmtDiaLargo, nextHour } from '../../utils/dates'

const PAYMENT_LABELS = {
  mercadopago: 'MercadoPago',
  cuentadni: 'Cuenta DNI',
  modo: 'Modo',
  credito: 'Tarjeta de Crédito',
  debito: 'Tarjeta de Débito',
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  'Crédito a favor': 'Crédito a favor',
}

const fmt = (n) => `$${n.toLocaleString('es-AR')}`

function IconZona() {
  return (
    <svg
      className='summary-v2-row-icon'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    >
      <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
      <circle cx='7' cy='7' r='1.5' />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg
      className='summary-v2-row-icon'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    >
      <rect x='3' y='4' width='18' height='18' rx='2' />
      <path d='M16 2v4M8 2v4M3 10h18' />
    </svg>
  )
}

function IconClock() {
  return (
    <svg
      className='summary-v2-row-icon'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    >
      <circle cx='12' cy='12' r='10' />
      <path d='M12 6v6l4 2' />
    </svg>
  )
}

function IconCard() {
  return (
    <svg
      className='summary-v2-row-icon'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    >
      <rect x='1' y='4' width='22' height='16' rx='2' />
      <path d='M1 10h22' />
    </svg>
  )
}

function IconDiscount() {
  return (
    <svg
      className='summary-v2-row-icon'
      width='16'
      height='16'
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
    >
      <path d='M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z' />
      <circle cx='7' cy='7' r='1.5' />
    </svg>
  )
}

export function SummaryPanel({
  zona,
  shifts,
  medioPago,
  onConfirm,
  confirmando,
  tipoPago = 'completo',
  onTipoPagoChange,
  aplicaDescuento = true,
  hasAusentePack = true,
}) {
  const precioTurno = zona?.precio ?? 0
  const subtotal = shifts.length * precioTurno
  const discountPctBase = shifts.length === 2 ? 10 : shifts.length === 3 ? 20 : 0
  const discountPct = aplicaDescuento && !hasAusentePack ? discountPctBase : 0
  const discount = Math.round((subtotal * discountPct) / 100)
  const total = subtotal - discount
  const aPagarAhora = tipoPago === 'sena' ? Math.round(total / 2) : total
  const usandoCreditos = medioPago === 'Crédito a favor'
  const senaDisabled = medioPago === 'efectivo'
  const handleMedioPagoChange = (id) => {
    setMedioPago(id)
    if (id === 'efectivo') setTipoPago('completo') // 👈 reset
  }

  return (
    <div className='summary-v2'>
      <div className='summary-v2-header'>
        <span className='step-number'>4</span>
        <div>
          <h2>Resumen de tu reserva</h2>
          <p>Revisá los detalles antes de confirmar</p>
        </div>
      </div>

      <div className='summary-v2-columns'>
        {/* Left: detail table */}
        <div className='summary-v2-table'>
          <div className='summary-v2-rows'>
            <div className='summary-v2-row'>
              <IconZona />
              <span className='summary-v2-row-label'>Zona</span>
              <span className='summary-v2-row-value'>
                {zona ? (ZONA_LABELS[zona.nombre] ?? zona.nombre) : '—'}
              </span>
            </div>

            {shifts.map((s, i) => (
              <div className='summary-v2-row' key={i}>
                <IconCalendar />
                <span className='summary-v2-row-label'>
                  {shifts.length > 1 ? `Turno ${i + 1}` : 'Día'}
                </span>
                <span className='summary-v2-row-value'>
                  {fmtDiaLargo(s.diaDate)}
                  <br />
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    {s.slot} – {nextHour(s.slot)}
                  </span>
                </span>
              </div>
            ))}

            <div className='summary-v2-row'>
              <IconClock />
              <span className='summary-v2-row-label'>Duración</span>
              <span className='summary-v2-row-value'>1 hora por turno</span>
            </div>

            <div className='summary-v2-row'>
              <IconCard />
              <span className='summary-v2-row-label'>Medio de pago</span>
              <span className='summary-v2-row-value'>
                {medioPago ? PAYMENT_LABELS[medioPago] : '—'}
              </span>
            </div>

            {!usandoCreditos && discountPct > 0 && (
              <div className='summary-v2-row'>
                <IconDiscount />
                <span className='summary-v2-row-label'>Pack {shifts.length} clases</span>
                <span className='summary-v2-row-value summary-v2-discount'>
                  − {fmt(discount)} ({discountPct}% off)
                </span>
              </div>
            )}
            {!usandoCreditos && hasAusentePack && discountPctBase > 0 && (
              <div className='summary-v2-row'>
                <IconDiscount />
                <span className='summary-v2-row-label'>Descuento por pack</span>
                <span className='summary-v2-row-value summary-v2-discount'>
                  No aplica por ausente en tu última clase
                </span>
              </div>
            )}
          </div>

          {!usandoCreditos && (
            <>
              <div className='summary-v2-total'>
                <span className='summary-v2-total-label'>Total</span>
                <div className='summary-v2-total-value'>
                  {fmt(total)}
                  {discountPct > 0 && <span className='summary-v2-original'>{fmt(subtotal)}</span>}
                </div>
              </div>

              {tipoPago === 'sena' && (
                <div className='summary-v2-total summary-v2-total--sena'>
                  <span className='summary-v2-total-label'>A pagar ahora (seña 50%)</span>
                  <div className='summary-v2-total-value'>{fmt(aPagarAhora)}</div>
                </div>
              )}
            </>
          )}

          {usandoCreditos && (
            <div className='summary-v2-total'>
              <span className='summary-v2-total-label'>Pago</span>
              <div className='summary-v2-total-value'>
                {shifts.length} crédito{shifts.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {/* Right: info cards */}
        <div className='summary-v2-info'>
          <div className='summary-v2-info-card summary-v2-info-card--highlight'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--primary)'
              strokeWidth='1.8'
              strokeLinecap='round'
              style={{ flexShrink: 0 }}
            >
              <path d='M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' />
              <path d='M9 12l2 2 4-4' />
            </svg>
            <div>
              <div className='summary-v2-info-title'>Tu reserva quedará confirmada</div>
              <p className='summary-v2-info-text'>
                Una vez que completes el pago, recibirás un email con los detalles de tu reserva.
              </p>
            </div>
          </div>

          <div className='summary-v2-info-card'>
            <svg
              width='24'
              height='24'
              viewBox='0 0 24 24'
              fill='none'
              stroke='var(--text-muted)'
              strokeWidth='1.8'
              strokeLinecap='round'
              style={{ flexShrink: 0 }}
            >
              <circle cx='12' cy='12' r='10' />
              <path d='M12 6v6l4 2' />
            </svg>
            <div>
              <div className='summary-v2-info-title' style={{ color: 'var(--text-main)' }}>
                Importante
              </div>
              <p className='summary-v2-info-text'>
                Podés cancelar o reprogramar tu turno con hasta 48 hs de anticipación.
              </p>
            </div>
          </div>
        </div>
      </div>

      {!usandoCreditos && (
        <>
          <div className='summary-v2-sena-info'>
            Para que tus selecciones queden reservadas, es necesario pagar una seña del 50% del
            valor total de las clases.
          </div>

          <div className='summary-v2-tipo-pago'>
            <button
              type='button'
              className={`summary-v2-tipo-btn${tipoPago === 'completo' ? ' selected' : ''}`}
              onClick={() => onTipoPagoChange?.('completo')}
            >
              <span className='summary-v2-tipo-title'>Pagar el total</span>
              <span className='summary-v2-tipo-sub'>{fmt(total)}</span>
            </button>
            <button
              type='button'
              className={`summary-v2-tipo-btn${tipoPago === 'sena' ? ' selected' : ''}`}
              onClick={() => onTipoPagoChange?.('sena')}
              disabled={senaDisabled}
              title={senaDisabled ? 'La seña no está disponible para pago en efectivo' : undefined}
              style={senaDisabled ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            >
              <span className='summary-v2-tipo-title'>Pagar seña (50%)</span>
              <span className='summary-v2-tipo-sub'>
                {fmt(Math.round(total / 2))} ahora · saldo después
              </span>
            </button>
          </div>
        </>
      )}

      <button className='btn-confirm-v2' disabled={confirmando} onClick={onConfirm}>
        <svg
          width='18'
          height='18'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='2'
          strokeLinecap='round'
        >
          <rect x='3' y='11' width='18' height='11' rx='2' />
          <path d='M7 11V7a5 5 0 0 1 10 0v4' />
        </svg>
        {confirmando ? 'Confirmando…' : 'Realizar reserva'}
      </button>

      <p className='summary-v2-redirect'>Serás redirigido al medio de pago seleccionado</p>
    </div>
  )
}
