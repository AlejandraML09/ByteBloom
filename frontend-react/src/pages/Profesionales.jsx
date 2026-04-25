import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { PageHero } from '../components/layout/PageHero'
import { CtaSection } from '../components/layout/CtaSection'
import { StatsStrip } from '../components/profesionales/StatsStrip'
import { ProfCard } from '../components/profesionales/ProfCard'
import { profesionales } from '../constants/profesionales'
import '../css/profesionales.css'

export default function Profesionales() {
  return (
    <>
      <Navbar />

      <PageHero
        badge="Nuestro equipo"
        title={<>Profesionales <span>especializados</span><br />a tu servicio</>}
        subtitle="Cada kinesiólogo de nuestro equipo cuenta con formación universitaria, especialización clínica y años de experiencia acompañando la recuperación de nuestros pacientes."
      />

      <StatsStrip />

      <div className="section-wrap">
        <div className="section-label">Conocé al equipo</div>
        <h2 className="section-title">Quiénes nos cuidan</h2>

        <div className="prof-grid">
          {profesionales.map(p => (
            <ProfCard key={p.initials} profesional={p} />
          ))}
        </div>
      </div>

      <CtaSection
        title="¿Querés conocer a nuestro equipo en persona?"
        subtitle="Reservá tu primera consulta sin cargo y encontrá al profesional ideal para tu recuperación"
        linkTo="/turnos"
        linkLabel="Reservar turno →"
      />

      <Footer />
    </>
  )
}
