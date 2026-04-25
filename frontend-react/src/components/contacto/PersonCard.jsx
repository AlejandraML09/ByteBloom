export function PersonCard({ person }) {
  const { initial, name, role, emailHref, email, phoneHref, phone, whatsappHref, availableDays } = person

  return (
    <div className="person-card">
      <div className="person-avatar">{initial}</div>
      <div className="person-name">{name}</div>
      <div className="person-role">{role}</div>
      <div className="person-contacts">
        <div className="person-contact-row">
          <div className="contact-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <a href={emailHref}>{email}</a>
        </div>
        <div className="person-contact-row">
          <div className="contact-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>
            </svg>
          </div>
          <a href={phoneHref}>{phone}</a>
        </div>
        <div className="person-contact-row">
          <div className="contact-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <a href={whatsappHref} target="_blank" rel="noopener">WhatsApp</a>
        </div>
      </div>
      <div className="availability">
        <div className="avail-label">Disponible</div>
        <div className="avail-days">
          {availableDays.map(d => <span className="avail-day" key={d}>{d}</span>)}
        </div>
      </div>
    </div>
  )
}
