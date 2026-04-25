import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/servicios.css'

const ZONES = ['superior', 'medio', 'inferior']

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

      <div className="zones-nav">
        {[
          { id: 'superior', label: 'Tren superior' },
          { id: 'medio',    label: 'Tren medio' },
          { id: 'inferior', label: 'Tren inferior' },
        ].map(({ id, label }) => (
          <button
            key={id}
            className={`zone-tab${activeZone === id ? ' active' : ''}`}
            onClick={() => scrollToZone(id)}
          >
            <div className="zone-dot" /> {label}
          </button>
        ))}
      </div>

      <div className="main-wrap">

        {/* ── TREN SUPERIOR ── */}
        <div className="zone-section" id="zona-superior" ref={sectionRefs.superior}>
          <div className="zone-header">
            <div className="zone-icon-big">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.6" strokeLinecap="round">
                <circle cx="12" cy="5" r="2.2"/>
                <path d="M12 7.5v5.5"/>
                <path d="M6.5 10.5c1.8-.7 3.5-1.2 5.5-1.2s3.7.5 5.5 1.2"/>
                <path d="M6.5 10.5L4.5 17"/>
                <path d="M17.5 10.5L19.5 17"/>
              </svg>
            </div>
            <div className="zone-header-text">
              <div className="zone-label">Zona 01</div>
              <h2 className="zone-title">Tren superior</h2>
              <p className="zone-desc">El tren superior comprende todas las estructuras desde la cabeza hasta la cintura. Su rehabilitación requiere un abordaje preciso que combine movilidad, fuerza y control neuromuscular para restaurar la función en actividades cotidianas y deportivas.</p>
            </div>
          </div>

          <div className="zone-content">
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Estructuras que tratamos</div>
              <ul className="anatomy-list">
                <li>Hombro: manguito rotador, articulación glenohumeral y acromioclavicular</li>
                <li>Codo: epicóndilo, epitróclea y tendón del bíceps</li>
                <li>Muñeca y mano: túnel carpiano, tendones flexores y extensores</li>
                <li>Cuello: columna cervical, discos intervertebrales C1–C7</li>
                <li>Articulación temporomandibular (ATM)</li>
                <li>Nervio radial, cubital y mediano</li>
              </ul>
            </div>
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Objetivos del tratamiento</div>
              <ul className="anatomy-list">
                <li>Recuperar el rango de movimiento articular completo</li>
                <li>Reducir dolor e inflamación en fase aguda</li>
                <li>Fortalecer músculos estabilizadores de la escápula</li>
                <li>Reeducar el patrón motor y la coordinación fina</li>
                <li>Prevenir recidivas mediante ejercicio terapéutico progresivo</li>
                <li>Reintegración deportiva o laboral gradual y segura</li>
              </ul>
            </div>
          </div>

          <div className="tech-grid">
            {[
              { name: 'Electroterapia (TENS / EMS)', desc: 'Corrientes eléctricas para analgesia, reducción del espasmo muscular y estimulación neuromuscular en fase aguda y subaguda.', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/> },
              { name: 'Ultrasonido terapéutico', desc: 'Ondas de ultrasonido para tratar tendinopatías, bursitis y cicatrices. Efecto térmico y mecánico para regeneración tisular profunda.', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></> },
              { name: 'Láser de baja potencia', desc: 'Fotobiomodulación para acelerar la cicatrización, reducir la inflamación y aliviar el dolor en estructuras superficiales y profundas.', icon: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/> },
              { name: 'Terapia manual ortopédica', desc: 'Movilizaciones articulares, manipulaciones cervicales, masoterapia y técnicas miofasciales aplicadas por profesionales certificados.', icon: <><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M12 12v.01"/></> },
              { name: 'Punción seca', desc: 'Técnica invasiva con aguja fina para tratar puntos gatillo miofasciales en musculatura cervical, del manguito rotador y antebrazo.', icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></> },
              { name: 'Kinesiotaping', desc: 'Vendaje neuromuscular elástico para soporte articular, drenaje linfático y facilitación/inhibición muscular sin restringir el movimiento.', icon: <><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></> },
            ].map(({ name, desc, icon }) => (
              <div className="tech-card" key={name}>
                <div className="tech-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.7" strokeLinecap="round">{icon}</svg>
                </div>
                <div>
                  <div className="tech-name">{name}</div>
                  <div className="tech-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="patologias-row">
            <div className="card-inner-title"><span/>Patologías frecuentes que tratamos</div>
            <div className="patologias-tags">
              {['Síndrome de manguito rotador','Epicondilitis lateral','Síndrome del túnel carpiano','Cervicalgia','Luxación de hombro','Tendinitis bicipital','Contracturas cervicales','Fractura de clavícula (posquirúrgico)','Bursitis subacromial','Dedo en gatillo'].map(p => (
                <span className="pat-tag" key={p}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── TREN MEDIO ── */}
        <div className="zone-section" id="zona-medio" ref={sectionRefs.medio}>
          <div className="zone-header">
            <div className="zone-icon-big">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.6" strokeLinecap="round">
                <path d="M6 10h12M6 14h12"/><path d="M9 6v12M15 6v12"/>
              </svg>
            </div>
            <div className="zone-header-text">
              <div className="zone-label">Zona 02</div>
              <h2 className="zone-title">Tren medio</h2>
              <p className="zone-desc">El tren medio o "core" es el centro biomecánico del cuerpo. Incluye la columna lumbar, la pelvis, el diafragma y toda la musculatura profunda que sostiene la postura y transfiere fuerzas entre la parte superior e inferior del cuerpo.</p>
            </div>
          </div>

          <div className="zone-content">
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Estructuras que tratamos</div>
              <ul className="anatomy-list">
                <li>Columna lumbar: vértebras L1–L5 y discos intervertebrales</li>
                <li>Sacro, articulación sacroilíaca y cóccix</li>
                <li>Musculatura profunda: transverso, multífidos y cuadrado lumbar</li>
                <li>Diafragma y musculatura respiratoria</li>
                <li>Pelvis y suelo pélvico</li>
                <li>Nervio ciático y raíces lumbares</li>
              </ul>
            </div>
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Objetivos del tratamiento</div>
              <ul className="anatomy-list">
                <li>Reducir el dolor lumbar agudo y crónico</li>
                <li>Activar y fortalecer la musculatura estabilizadora profunda</li>
                <li>Corregir alteraciones posturales y de la mecánica lumbar</li>
                <li>Liberar compresiones nerviosas y síntomas radiculares</li>
                <li>Educar en higiene postural y ergonomía en el trabajo</li>
                <li>Prevenir recaídas con programas de ejercicio activo</li>
              </ul>
            </div>
          </div>

          <div className="tech-grid">
            {[
              { name: 'Pilates clínico', desc: 'Ejercicio terapéutico basado en el método Pilates para activar la musculatura profunda del core, mejorar la postura y prevenir recidivas.' },
              { name: 'Osteopatía y terapia manual', desc: 'Técnicas osteopáticas de movilización de la columna lumbar, pelvis y sacroilíacas. Tratamiento global que busca restaurar el movimiento articular.' },
              { name: 'Magnetoterapia', desc: 'Campos electromagnéticos pulsados para reducir la inflamación discal, estimular la regeneración ósea y aliviar el dolor en patologías crónicas de columna.' },
              { name: 'Tracción lumbar mecánica', desc: 'Descompresión vertebral mediante tracción controlada, indicada en hernias discales, estenosis de canal y radiculopatías lumbares.' },
              { name: 'Biofeedback', desc: 'Retroalimentación visual o auditiva para reeducar la activación de la musculatura del suelo pélvico y los estabilizadores lumbares profundos.' },
              { name: 'Diatermia (Tecarterapia)', desc: 'Radiofrecuencia de alta potencia para calentar tejidos profundos, acelerar la regeneración en lumbalgias crónicas y contracturas musculares.' },
            ].map(({ name, desc }) => (
              <div className="tech-card" key={name}>
                <div className="tech-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <div className="tech-name">{name}</div>
                  <div className="tech-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="patologias-row">
            <div className="card-inner-title"><span/>Patologías frecuentes que tratamos</div>
            <div className="patologias-tags">
              {['Hernia de disco lumbar','Lumbalgia aguda y crónica','Ciática','Estenosis de canal lumbar','Síndrome sacroilíaco','Escoliosis','Síndrome de dolor miofascial','Disfunción de suelo pélvico','Espondilolisis','Fibromialgia'].map(p => (
                <span className="pat-tag" key={p}>{p}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── TREN INFERIOR ── */}
        <div className="zone-section" id="zona-inferior" ref={sectionRefs.inferior}>
          <div className="zone-header">
            <div className="zone-icon-big">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.6" strokeLinecap="round">
                <path d="M12 3v9"/><path d="M8.5 12l-4 9"/><path d="M15.5 12l4 9"/><path d="M7 17h10"/>
              </svg>
            </div>
            <div className="zone-header-text">
              <div className="zone-label">Zona 03</div>
              <h2 className="zone-title">Tren inferior</h2>
              <p className="zone-desc">El tren inferior soporta todo el peso corporal y absorbe los impactos de la marcha y el deporte. Su rehabilitación es fundamental para restaurar la funcionalidad en actividades básicas como caminar, subir escaleras y practicar deporte de manera segura.</p>
            </div>
          </div>

          <div className="zone-content">
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Estructuras que tratamos</div>
              <ul className="anatomy-list">
                <li>Cadera: articulación coxofemoral, labrum y bursas</li>
                <li>Rodilla: ligamentos cruzados, meniscos y tendón rotuliano</li>
                <li>Tobillo: ligamentos laterales, tendón de Aquiles y sindesmosis</li>
                <li>Pie: fascitis plantar, metatarsos y articulación de Lisfranc</li>
                <li>Musculatura: cuádriceps, isquiotibiales, glúteos y tríceps sural</li>
                <li>Nervio ciático, femorocutáneo y tibial posterior</li>
              </ul>
            </div>
            <div className="anatomy-card">
              <div className="card-inner-title"><span/>Objetivos del tratamiento</div>
              <ul className="anatomy-list">
                <li>Restaurar la estabilidad articular y el control propioceptivo</li>
                <li>Fortalecer progresivamente la musculatura periarticular</li>
                <li>Recuperar la marcha normal y el patrón de carrera</li>
                <li>Rehabilitación posquirúrgica de ligamentos y meniscos</li>
                <li>Control del dolor e inflamación en fase aguda</li>
                <li>Retorno al deporte con criterios funcionales objetivos</li>
              </ul>
            </div>
          </div>

          <div className="tech-grid">
            {[
              { name: 'Ondas de choque extracorpóreas', desc: 'Presión acústica de alta energía para tratar tendinopatías crónicas como fascitis plantar, tendinitis aquilea y calcificaciones de cadera.' },
              { name: 'Plataforma de propiocepción', desc: 'Entrenamiento del equilibrio y control neuromuscular mediante plataformas inestables. Fundamental en la recuperación postesguince y posoperatoria de rodilla.' },
              { name: 'Electroestimulación funcional (FES)', desc: 'Estimulación eléctrica funcional para fortalecer cuádriceps e isquiotibiales, especialmente en posquirúrgicos de ligamento cruzado anterior.' },
              { name: 'Crioterapia y termoterapia', desc: 'Aplicación controlada de frío y calor para manejo del dolor, reducción del edema posoperatorio y preparación de tejidos para el ejercicio.' },
              { name: 'Laser de alta potencia (HILT)', desc: 'Láser de alta intensidad para penetrar tejidos profundos como cartílago y menisco. Reduce la inflamación y estimula la reparación celular en articulaciones.' },
              { name: 'Análisis de la marcha', desc: 'Evaluación biomecánica visual y funcional del patrón de marcha y carrera. Permite detectar compensaciones y prescribir ejercicios específicos de corrección.' },
            ].map(({ name, desc }) => (
              <div className="tech-card" key={name}>
                <div className="tech-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.7" strokeLinecap="round">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                  </svg>
                </div>
                <div>
                  <div className="tech-name">{name}</div>
                  <div className="tech-desc">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="patologias-row">
            <div className="card-inner-title"><span/>Patologías frecuentes que tratamos</div>
            <div className="patologias-tags">
              {['Rotura de ligamento cruzado anterior','Lesión de menisco','Esguince de tobillo','Fascitis plantar','Tendinitis rotuliana','Tendinitis aquílea','Síndrome femoropatelar','Fractura de tibia (posquirúrgico)','Artrosis de cadera y rodilla','Síndrome de la cintilla iliotibial'].map(p => (
                <span className="pat-tag" key={p}>{p}</span>
              ))}
            </div>
          </div>
        </div>

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
