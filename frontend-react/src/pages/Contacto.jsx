import { useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import Toast, { useToast } from '../components/Toast'
import '../css/contacto.css'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function Contacto() {
  const [nombre, setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail]     = useState('')
  const [tel, setTel]         = useState('')
  const [destino, setDestino] = useState('')
  const [asunto, setAsunto]   = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formError, setFormError] = useState('')
  const { msg, visible, showToast } = useToast()

  function enviarConsulta() {
    if (!nombre || !email || !destino || !mensaje) {
      setFormError('Por favor completá los campos obligatorios.')
      return
    }
    if (!emailRegex.test(email)) {
      setFormError('El email ingresado no es válido.')
      return
    }
    setFormError('')
    const destinoNombre = destino === 'jose' ? 'José' : 'Laura'
    showToast(`✓ Mensaje enviado a ${destinoNombre}. Te respondemos a la brevedad.`)
    setNombre(''); setApellido(''); setEmail(''); setTel(''); setDestino(''); setAsunto(''); setMensaje('')
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
          <div className="people-section">
            <div className="section-label">Nuestro equipo de atención</div>
            <div className="people-grid">
              {/* José */}
              <div className="person-card">
                <div className="person-avatar">J</div>
                <div className="person-name">José</div>
                <div className="person-role">Rol</div>
                <div className="person-contacts">
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <a href="mailto:jose@kinesiologia.com">jose@kinesiologia.com</a>
                  </div>
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>
                      </svg>
                    </div>
                    <a href="tel:+542214561001">221 456-1001</a>
                  </div>
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <a href="https://wa.me/5492214561001" target="_blank" rel="noopener">WhatsApp</a>
                  </div>
                </div>
                <div className="availability">
                  <div className="avail-label">Disponible</div>
                  <div className="avail-days">
                    {['Lun','Mar','Mié','Jue','Vie'].map(d => <span className="avail-day" key={d}>{d}</span>)}
                  </div>
                </div>
              </div>

              {/* Laura */}
              <div className="person-card">
                <div className="person-avatar">L</div>
                <div className="person-name">Laura</div>
                <div className="person-role">Rol</div>
                <div className="person-contacts">
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                    </div>
                    <a href="mailto:laura@Empresa.com.ar">laura@Empresa.com.ar</a>
                  </div>
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>
                      </svg>
                    </div>
                    <a href="tel:+542214561002">221 456-1002</a>
                  </div>
                  <div className="person-contact-row">
                    <div className="contact-icon">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="2" strokeLinecap="round">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                    </div>
                    <a href="https://wa.me/5492214561002" target="_blank" rel="noopener">WhatsApp</a>
                  </div>
                </div>
                <div className="availability">
                  <div className="avail-label">Disponible</div>
                  <div className="avail-days">
                    {['Lun','Mar','Jue','Vie'].map(d => <span className="avail-day" key={d}>{d}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="section-label">Información del centro</div>
          <div className="info-grid">
            <div className="info-card">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M12 2a7 7 0 0 1 7 7c0 5-7 13-7 13S5 14 5 9a7 7 0 0 1 7-7z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
              </div>
              <div>
                <div className="info-title">Dirección</div>
                <div className="info-value">Lugar<br />La Plata, Buenos Aires</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div>
                <div className="info-title">Horario de atención</div>
                <div className="info-value">Lun – Vie: 9:00 a 18:00 hs<br />Sáb: 9:00 a 13:00 hs</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.78a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 21.5 16z"/>
                </svg>
              </div>
              <div>
                <div className="info-title">Teléfono central</div>
                <div className="info-value"><a href="tel:08005550463">0800-555-KINE</a></div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5A8A1A" strokeWidth="1.8" strokeLinecap="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <div>
                <div className="info-title">Email general</div>
                <div className="info-value"><a href="mailto:info@Empresa.com.ar">info@Empresa.com.ar</a></div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <div className="form-card">
          <div className="form-header">
            <h3>Envianos un mensaje</h3>
            <p>Te respondemos en menos de 24 horas hábiles</p>
          </div>
          <div className="form-body">
            {formError && (
              <div style={{ display:'block', background:'#FEE8E8', border:'1px solid #F5BBBB', borderRadius:'8px', padding:'8px 12px', fontSize:'13px', color:'#B03030', marginBottom:'14px' }}>
                {formError}
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>Nombre <span style={{ color: '#E84040' }}>*</span></label>
                <input type="text" placeholder="Tu nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input type="text" placeholder="Tu apellido" value={apellido} onChange={e => setApellido(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Email <span style={{ color: '#E84040' }}>*</span></label>
              <input type="email" placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Teléfono</label>
              <input type="tel" placeholder="Ej: 221-4567890" value={tel} onChange={e => setTel(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Dirigido a <span style={{ color: '#E84040' }}>*</span></label>
              <select value={destino} onChange={e => setDestino(e.target.value)}>
                <option value="">— Seleccioná —</option>
                <option value="jose">José Martínez – Turnos y atención</option>
                <option value="laura">Laura Vidal – Administración y obras sociales</option>
              </select>
            </div>
            <div className="form-group">
              <label>Asunto</label>
              <input type="text" placeholder="Ej: Consulta sobre obra social" value={asunto} onChange={e => setAsunto(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mensaje <span style={{ color: '#E84040' }}>*</span></label>
              <textarea rows={4} placeholder="Escribí tu consulta acá..." value={mensaje} onChange={e => setMensaje(e.target.value)} />
            </div>
            <button className="btn-send" onClick={enviarConsulta}>Enviar mensaje →</button>
          </div>
        </div>
      </div>

      <Footer />
      <Toast msg={msg} visible={visible} />
    </>
  )
}
