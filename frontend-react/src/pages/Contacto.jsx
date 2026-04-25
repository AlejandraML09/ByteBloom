import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { PageHero } from '../components/layout/PageHero'
import { PersonCard } from '../components/contacto/PersonCard'
import { InfoGrid } from '../components/contacto/InfoGrid'
import { ContactForm } from '../components/contacto/ContactForm'
import { personas } from '../constants/contacto'
import '../css/contacto.css'

export default function Contacto() {
  const { msg, visible, showToast } = useToast()

  function handleSubmit({ destino, nombre }) {
    const destinoNombre = destino === 'jose' ? 'José' : 'Laura'
    showToast(`✓ Mensaje enviado a ${destinoNombre}. Te respondemos a la brevedad.`)
  }

  return (
    <>
      <Navbar />

      <PageHero
        badge="Contacto"
        title={<>¿Cómo podemos <span>ayudarte</span>?</>}
        subtitle="Escribinos y te respondemos a la brevedad. También podés usar el formulario y te contactamos nosotros."
      />

      <div className="contact-wrap">
        <div>
          <div className="people-section">
            <div className="section-label">Nuestro equipo de atención</div>
            <div className="people-grid">
              {personas.map(p => (
                <PersonCard key={p.id} person={p} />
              ))}
            </div>
          </div>

          <div className="section-label">Información del centro</div>
          <InfoGrid />
        </div>

        <ContactForm onSubmit={handleSubmit} />
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
