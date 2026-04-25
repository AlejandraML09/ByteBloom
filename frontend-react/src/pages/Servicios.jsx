import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { ZoneNav } from '../components/servicios/NavZonas'
import { ZONES, zonesData } from '../constants/servicios'
import '../css/servicios.css'

export default function Servicios() {
  const [activeZone, setActiveZone] = useState('superior')
  const sectionRefs = {
    superior: useRef(null),
    medio: useRef(null),
    inferior: useRef(null),
  }

  function scrollToZone(zona) {
    setActiveZone(zona)
    sectionRefs[zona].current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    function onScroll() {
      let current = 'superior'
      ZONES.forEach(z => {
        const el = sectionRefs[z].current
        if (el && el.getBoundingClientRect().top < 180) current = z
      })
      setActiveZone(current)
    }
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <>
      <Navbar />
      <div className="page-hero">
        <div className="page-hero-badge">Tratamientos</div>
        <h1>Rehabilitación <span>integral</span><br />para cada zona del cuerpo</h1>
        <p>Combinamos evidencia científica, tecnología de vanguardia y terapia manual para lograr tu recuperación más rápida y duradera.</p>
      </div>

      <ZoneNav activeZone={activeZone} onSelect={scrollToZone} />

      {/* Zonas */}
      <div className="main-wrap">
        {zonesData.map(({ id, label, zoneNum, title, desc, icon, structures, goals, technologies, pathologies }) => (
          <div className="zone-section" id={`zona-${id}`} ref={sectionRefs[id]} key={id}>
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
              {[
                { heading: 'Estructuras que tratamos', items: structures },
                { heading: 'Objetivos del tratamiento', items: goals },
              ].map(({ heading, items }) => (
                <div className="anatomy-card" key={heading}>
                  <div className="card-inner-title"><span />{heading}</div>
                  <ul className="anatomy-list">
                    {items.map((item, i) => <li key={i}>{item}</li>)}
                  </ul>
                </div>
              ))}
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
              <div className="card-inner-title"><span />Patologías frecuentes que tratamos</div>
              <div className="patologias-tags">
                {pathologies.map(p => <span className="pat-tag" key={p}>{p}</span>)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="cta-section">
        <h2>¿No sabés por dónde empezar?</h2>
        <p>Pedí una evaluación inicial y nuestro equipo te guía hacia el tratamiento indicado</p>
        <Link to="/turnos" className="btn-cta">Reservar evaluación →</Link>
      </div>

      <Footer />
    </>
  )
}
