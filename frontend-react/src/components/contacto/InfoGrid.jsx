export function InfoGrid() {
  return (
    <div className="info-grid">
      <div className="info-card">
        <div className="info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
            <circle cx="12" cy="9" r="2.5"/>
          </svg>
        </div>
        <div>
          <div className="info-title">Dirección</div>
          <div className="info-value">Lugar<br />La Plata, Buenos Aires</div>
        </div>
      </div>
      <div className="info-card">
        <div className="info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <div>
          <div className="info-title">Horario de atención</div>
          <div className="info-value">Lun – Vie: 9:00 a 18:00 hs<br />Sáb: 9:00 a 13:00 hs</div>
        </div>
      </div>
      <div className="info-card">
        <div className="info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>
          </svg>
        </div>
        <div>
          <div className="info-title">Teléfono central</div>
          <div className="info-value"><a href="tel:08005550463">0800-555-KINE</a></div>
        </div>
      </div>
      <div className="info-card">
        <div className="info-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
            <polyline points="22,6 12,13 2,6"/>
          </svg>
        </div>
        <div>
          <div className="info-title">Email general</div>
          <div className="info-value"><a href="mailto:info@Empresa.com.ar">info@Empresa.com.ar</a></div>
        </div>
      </div>
    </div>
  )
}
