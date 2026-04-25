import { useEffect, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHero } from '../components/layout/PageHero'
import { CtaSection } from '../components/layout/CtaSection'
import { ZoneNav } from '../components/servicios/ZoneNav'
import { ZoneSection } from '../components/servicios/ZoneSection'
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

      <PageHero
        badge="Tratamientos"
        title={<>Rehabilitación <span>integral</span><br />para cada zona del cuerpo</>}
        subtitle="Combinamos evidencia científica, tecnología de vanguardia y terapia manual para lograr tu recuperación más rápida y duradera."
      />

      <ZoneNav activeZone={activeZone} onSelect={scrollToZone} />

      <div className="main-wrap">
        {zonesData.map(zone => (
          <ZoneSection
            key={zone.id}
            zone={zone}
            sectionRef={sectionRefs[zone.id]}
          />
        ))}
      </div>

      <CtaSection
        title="¿No sabés por dónde empezar?"
        subtitle="Pedí una evaluación inicial y nuestro equipo te guía hacia el tratamiento indicado"
        linkTo="/turnos"
        linkLabel="Reservar evaluación →"
      />

      <Footer />
    </>
  )
}
