import { Link } from 'react-router-dom'

export function CtaBanner() {
  return (
    <div className="cta-banner-wrap" id="contacto">
      <div className="cta-banner">
        <div>
          <h3 className="cta-title">Reservá tu turno hoy</h3>
          <p className="cta-info">
            Atención de lunes a sábado · 8:00 a 20:00 hs<br />
            Cobertura con las principales obras sociales
          </p>
        </div>
        <div className="cta-right">
          <div>
            <div className="cta-phone-label">Llamanos</div>
            <div className="cta-phone">0800-555-KINE</div>
          </div>
          <Link to="/turnos" className="btn-cta">Turno online →</Link>
        </div>
      </div>
    </div>
  )
}
