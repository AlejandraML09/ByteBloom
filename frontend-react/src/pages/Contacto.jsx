import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import { ContactForm } from '../components/contacto/ContactForm'
import '../css/contacto.css'
import { Map } from '../components/contacto/Map'

export default function Contacto() {
  const { msg, visible, showToast } = useToast()

  function handleSubmit() {
    showToast('✓ Mensaje enviado. Te respondemos a la brevedad.')
  }

  return (
    <>
      <Navbar />
      <div className="page-hero">
        <div className="page-hero-badge">Contacto</div>
        <h1>¿Cómo podemos <span>ayudarte</span>?</h1>
        <p>Escribinos y te respondemos a la brevedad. También podés usar el formulario y te contactamos nosotros.</p>
      </div>

      <div className="contact-wrap">
        <div>
          {/* InfoGrid */}
          <div className="section-label">Información del centro</div>
          <div className="info-grid">
            {[
              {
                title: 'Dirección',
                value: <>Plaza San Martín<br />La Plata, Buenos Aires</>,
                icon: <><path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></>,
              },
              {
                title: 'Horario de atención',
                value: <>Lun – Vie: 9:00 a 18:00 hs<br />Sáb: 9:00 a 13:00 hs</>,
                icon: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
              },
              {
                title: 'Teléfono central',
                value: <a href="tel:08005550463">0800-555-KINE</a>,
                icon: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>,
              },
              {
                title: 'Email general',
                value: <a href="mailto:info@endereza2.com.ar">info@Endereza2.com.ar</a>,
                icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></>,
              },
            ].map(({ title, value, icon }) => (
              <div className="info-card" key={title}>
                <div className="info-icon">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                    {icon}
                  </svg>
                </div>
                <div>
                  <div className="info-title">{title}</div>
                  <div className="info-value">{value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mapa */}
          <div className="map-wrap">
            <Map />
          </div>
        </div>

        <ContactForm onSubmit={handleSubmit} />
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}