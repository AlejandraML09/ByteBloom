export function ZoneSection({ zone, sectionRef }) {
  const { id, label, zoneNum, title, desc, icon, structures, goals, technologies, pathologies } = zone

  return (
    <div className="zone-section" id={`zona-${id}`} ref={sectionRef}>
      <div className="zone-header">
        <div className="zone-icon-big">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.6" strokeLinecap="round">
            {icon}
          </svg>
        </div>
        <div className="zone-header-text">
          <div className="zone-label">{zoneNum}</div>
          <h2 className="zone-title">{title}</h2>
          <p className="zone-desc">{desc}</p>
        </div>
      </div>

      <div className="zone-content">
        <div className="anatomy-card">
          <div className="card-inner-title"><span/>Estructuras que tratamos</div>
          <ul className="anatomy-list">
            {structures.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
        <div className="anatomy-card">
          <div className="card-inner-title"><span/>Objetivos del tratamiento</div>
          <ul className="anatomy-list">
            {goals.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      </div>

      <div className="tech-grid">
        {technologies.map(({ name, desc: techDesc, icon: techIcon }) => (
          <div className="tech-card" key={name}>
            <div className="tech-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.7" strokeLinecap="round">
                {techIcon || <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>}
              </svg>
            </div>
            <div>
              <div className="tech-name">{name}</div>
              <div className="tech-desc">{techDesc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="patologias-row">
        <div className="card-inner-title"><span/>Patologías frecuentes que tratamos</div>
        <div className="patologias-tags">
          {pathologies.map(p => (
            <span className="pat-tag" key={p}>{p}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
