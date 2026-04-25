import { useState, useEffect } from 'react'

const services = [
  {
    name: 'Rehabilitación',
    desc: 'Recuperación post-quirúrgica y lesiones deportivas',
    detail: 'Diseñamos programas personalizados para cada etapa de tu recuperación, combinando ejercicio terapéutico, electroterapia y terapia manual para volver a la actividad lo antes posible.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 12l2 2 4-4"/><path d="M21 12c0 4.97-4.03 9-9 9S3 16.97 3 12 7.03 3 12 3s9 4.03 9 9z"/>
      </svg>
    ),
  },
  {
    name: 'Kinesiología deportiva',
    desc: 'Prevención y tratamiento de lesiones en atletas',
    detail: 'Trabajamos con deportistas amateur y de alto rendimiento. Evaluamos biomecánica, prevenimos lesiones recurrentes y acompañamos el retorno al deporte con protocolos basados en evidencia.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
      </svg>
    ),
  },
  {
    name: 'Terapia manual',
    desc: 'Masoterapia, osteopatía y técnicas manuales',
    detail: 'Utilizamos técnicas de movilización articular, masoterapia profunda y osteopatía para tratar el dolor, mejorar la movilidad y restaurar el equilibrio músculo-esquelético.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    name: 'Pilates terapéutico',
    desc: 'Fortalecimiento postural y control del movimiento',
    detail: 'Clases individuales y reducidas orientadas a la corrección postural, fortalecimiento del core y rehabilitación. Ideal para dolor lumbar, escoliosis y recuperación post-parto.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    ),
  },
]

export function ServicesGrid() {
  const [focused, setFocused] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    const interval = setInterval(() => {
      setFocused(prev => (prev + 1) % services.length)
    }, 2800)
    return () => clearInterval(interval)
  }, [paused])

  return (
    <section className="services" id="servicios">
      <h2 className="section-title">Nuestros servicios</h2>
      <p className="section-sub">Tratamientos especializados para cada necesidad</p>
      <div className="services-grid">
        {services.map(({ name, desc, detail, icon }, i) => {
          const isFocused = focused === i
          return (
            <div
              key={name}
              className={`service-card${isFocused ? ' highlighted' : ''}`}
              onMouseEnter={() => { setFocused(i); setPaused(true) }}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="service-icon">{icon}</div>
              <div className="service-name">{name}</div>
              <div className="service-desc">{desc}</div>
              <div className={`service-detail${isFocused ? ' visible' : ''}`}>
                {detail}
              </div>
            </div>
          )
        })}
      </div>
      <div className="service-dots">
        {services.map((_, i) => (
          <button
            key={i}
            className={`service-dot${focused === i ? ' active' : ''}`}
            onClick={() => { setFocused(i); setPaused(true) }}
          />
        ))}
      </div>
    </section>
  )
}