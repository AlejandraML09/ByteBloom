const services = [
  {
    name: 'Rehabilitación',
    desc: 'Recuperación post-quirúrgica y lesiones deportivas',
    highlighted: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/>
      </svg>
    ),
  },
  {
    name: 'Kinesiología deportiva',
    desc: 'Prevención y tratamiento de lesiones en atletas',
    highlighted: true,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    name: 'Terapia manual',
    desc: 'Masoterapia, osteopatía y técnicas manuales',
    highlighted: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    name: 'Pilates terapéutico',
    desc: 'Fortalecimiento postural y control del movimiento',
    highlighted: false,
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
]

export function ServicesGrid() {
  return (
    <section className="services" id="servicios">
      <h2 className="section-title">Nuestros servicios</h2>
      <p className="section-sub">Tratamientos especializados para cada necesidad</p>
      <div className="services-grid">
        {services.map(({ name, desc, highlighted, icon }) => (
          <div className={`service-card${highlighted ? ' highlighted' : ''}`} key={name}>
            <div className="service-icon">{icon}</div>
            <div className="service-name">{name}</div>
            <div className="service-desc">{desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
