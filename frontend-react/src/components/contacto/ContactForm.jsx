import { useState } from 'react'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm({ onSubmit }) {
  const [nombre, setNombre]   = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail]     = useState('')
  const [tel, setTel]         = useState('')
  const [destino, setDestino] = useState('')
  const [asunto, setAsunto]   = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formError, setFormError] = useState('')

  function handleSubmit() {
    if (!nombre || !email || !destino || !mensaje) {
      setFormError('Por favor completá los campos obligatorios.')
      return
    }
    if (!emailRegex.test(email)) {
      setFormError('El email ingresado no es válido.')
      return
    }
    setFormError('')
    onSubmit({ nombre, apellido, email, tel, destino, asunto, mensaje })
    setNombre(''); setApellido(''); setEmail(''); setTel(''); setDestino(''); setAsunto(''); setMensaje('')
  }

  return (
    <div className="form-card">
      <div className="form-header">
        <h3>Envianos un mensaje</h3>
        <p>Te respondemos en menos de 24 horas hábiles</p>
      </div>
      <div className="form-body">
        {formError && (
          <div style={{ display: 'block', background: '#FEE8E8', border: '1px solid #F5BBBB', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#B03030', marginBottom: '14px' }}>
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
        <button className="btn-send" onClick={handleSubmit}>Enviar mensaje →</button>
      </div>
    </div>
  )
}
