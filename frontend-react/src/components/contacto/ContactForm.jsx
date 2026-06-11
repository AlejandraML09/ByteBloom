import { useState } from 'react'
import emailjs from '@emailjs/browser'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ContactForm({ onSubmit, onError }) {
  const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

  const [nombre, setNombre] = useState(usuario.nombre || '')
  const [apellido, setApellido] = useState(usuario.apellido || '')
  const [email, setEmail] = useState(usuario.email || '')
  const [asunto, setAsunto] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [formError, setFormError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit() {
    if (!nombre || !apellido || !email || !asunto || !mensaje) {
      setFormError('Por favor completá los campos obligatorios.')
      return
    }
    if (!emailRegex.test(email)) {
      setFormError('El email ingresado no es válido.')
      return
    }
    setFormError('')
    setCargando(true)
    try {
      await emailjs.send(
        'service_6ykscxl',
        'template_ex4mwhm',
        { nombre, apellido, email, asunto, mensaje },
        'xE1dZGV6BTFUQMpsb'
      )
      onSubmit()
      setNombre(''); setApellido(''); setEmail(''); setAsunto(''); setMensaje('')
    } catch {
      onError()
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className='form-card'>
      <div className='form-header'>
        <h3>Envianos un mensaje</h3>
        <p>Te respondemos en menos de 24 horas hábiles</p>
      </div>
      <div className='form-body'>
        {formError && (
          <div style={{ background: '#FEE8E8', border: '1px solid #F5BBBB', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', color: '#B03030', marginBottom: '14px' }}>
            {formError}
          </div>
        )}
        <div className='form-row'>
          <div className='form-group'>
            <label>Nombre <span style={{ color: '#E84040' }}>*</span></label>
            <input type='text' placeholder='Tu nombre' value={nombre} onChange={(e) => setNombre(e.target.value)}disabled={!!usuario.nombre} style={usuario.nombre ? { opacity: 0.6, cursor: 'not-allowed' } : {}} />
          </div>
          <div className='form-group'>
            <label>Apellido <span style={{ color: '#E84040' }}>*</span></label>
            <input type='text' placeholder='Tu apellido' value={apellido} onChange={(e) => setApellido(e.target.value)} disabled={!!usuario.apellido} style={usuario.apellido ? { opacity: 0.6, cursor: 'not-allowed' } : {}}/>
          </div>
        </div>
        <div className='form-group'>
          <label>Email <span style={{ color: '#E84040' }}>*</span></label>
          <input type='email' placeholder='tu@email.com' value={email} onChange={(e) => setEmail(e.target.value)} disabled={!!usuario.email} style={usuario.email ? { opacity: 0.6, cursor: 'not-allowed' } : {}}/>
        </div>
        <div className='form-group'>
          <label>Asunto <span style={{ color: '#E84040' }}>*</span></label>
          <input type='text' placeholder='Ej: Consulta sobre obra social' value={asunto} onChange={(e) => setAsunto(e.target.value)} />
        </div>
        <div className='form-group'>
          <label>Mensaje <span style={{ color: '#E84040' }}>*</span></label>
          <textarea rows={4} placeholder='Escribí tu consulta acá...' value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
        </div>
        <button className='btn-send' onClick={handleSubmit} disabled={cargando}>
          {cargando ? 'Enviando...' : 'Enviar mensaje →'}
        </button>
      </div>
    </div>
  )
}