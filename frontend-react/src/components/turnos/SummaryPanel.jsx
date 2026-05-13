import { ZONA_LABELS, PRICE_PER_SHIFT } from '../../constants/turnos'
import { fmtDiaLargo, nextHour } from '../../utils/dates'

const PAYMENT_LABELS = {
  mercadopago: 'MercadoPago',
  cuentadni:   'CuentaDNI',
  credito:     'Tarjeta de Crédito',
  debito:      'Tarjeta de Débito',
}

const fmt = n => `$${n.toLocaleString('es-AR')}`

export function SummaryPanel({ zona, shifts, medioPago, onConfirm }) {
  const subtotal    = shifts.length * PRICE_PER_SHIFT
  const discountPct = shifts.length === 2 ? 10 : shifts.length === 3 ? 20 : 0
  const discount    = Math.round(subtotal * discountPct / 100)
  const total       = subtotal - discount

  const allFilled = zona && shifts.length > 0 && medioPago

  return (
    <div className="sidebar">
      <div className="summary-card">
        <div className="summary-header">
          <h3>Resumen del turno</h3>
          <p>Revisá los datos antes de confirmar</p>
        </div>
        <div className="summary-body">

          <div className="summary-row">
            <span className="summary-key">Zona</span>
            <span className={`summary-val${zona ? '' : ' empty'}`}>
              {zona ? ZONA_LABELS[zona] : 'Sin seleccionar'}
            </span>
          </div>

          {shifts.length === 0 ? (
            <div className="summary-row">
              <span className="summary-key">Turno</span>
              <span className="summary-val empty">Sin seleccionar</span>
            </div>
          ) : (
            shifts.map((s, i) => (
              <div className="summary-row" key={i}>
                <span className="summary-key">Turno {i + 1}</span>
                <span className="summary-val">
                  {fmtDiaLargo(s.diaDate)}<br />
                  <span style={{ fontSize: '11px', opacity: 0.8 }}>
                    {s.slot} – {nextHour(s.slot)}
                  </span>
                </span>
              </div>
            ))
          )}

          <div className="summary-row">
            <span className="summary-key">Duración</span>
            <span className="summary-val"><span className="summary-badge">1 hora</span></span>
          </div>

          {discountPct > 0 && (
            <div className="summary-discount-row">
              <span>Pack {shifts.length} clases · {discountPct}% off</span>
              <span>− {fmt(discount)}</span>
            </div>
          )}

          <div className="summary-row">
            <span className="summary-key">Total</span>
            <span className="summary-val">
              {shifts.length > 0 ? (
                <>
                  {fmt(total)}
                  {discountPct > 0 && (
                    <span className="summary-original"> {fmt(subtotal)}</span>
                  )}
                </>
              ) : (
                <span className="empty">—</span>
              )}
            </span>
          </div>

          <div className="summary-row">
            <span className="summary-key">Pago</span>
            <span className={`summary-val${medioPago ? '' : ' empty'}`}>
              {medioPago ? PAYMENT_LABELS[medioPago] : 'Sin seleccionar'}
            </span>
          </div>

          <button className="btn-confirm" disabled={!allFilled} onClick={onConfirm}>
            Confirmar turno
          </button>
        </div>
      </div>
    </div>
  )
}
