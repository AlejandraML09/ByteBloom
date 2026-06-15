import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { inscribirDesdeNotificacion } from '../api/turnos'

export default function InscribirseNotificacion() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error | no-params
  const [message, setMessage] = useState('')

  useEffect(() => {
    const claseId = searchParams.get('clase_id') || searchParams.get('claseId')
    const usuarioId = searchParams.get('usuario_id') || searchParams.get('usuarioId')
    if (!claseId || !usuarioId) {
      setStatus('no-params')
      setMessage('Enlace inválido. Faltan parámetros.')
      return
    }

    async function intentarInscripcion() {
      try {
        await inscribirDesdeNotificacion(Number(claseId), Number(usuarioId))
        setStatus('success')
        setMessage('Te inscribiste correctamente al turno. Mirá "Mis reservas" para más detalles.')
      } catch (err) {
        const detalle = err?.response?.data?.detail || err?.message || 'No se pudo inscribir.'
        setStatus('error')
        setMessage(detalle)
      }
    }

    intentarInscripcion()
  }, [searchParams])

  return (
    <div className='page-container'>
      <h2>Inscribirse a turno</h2>
      {status === 'loading' && <p>Validando disponibilidad y registrando tu inscripción...</p>}
      {status === 'success' && (
        <div>
          <p style={{ color: 'green' }}>{message}</p>
          <button onClick={() => navigate('/mis-reservas')}>Ir a Mis reservas</button>
        </div>
      )}
      {status === 'error' && (
        <div>
          <p style={{ color: 'red' }}>{message}</p>
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate('/turnos')}>Elegir otro turno</button>
            <button style={{ marginLeft: 8 }} onClick={() => navigate('/turnos')}>Inscribirme nuevamente a la lista de espera</button>
          </div>
        </div>
      )}
      {status === 'no-params' && (
        <div>
          <p style={{ color: 'red' }}>{message}</p>
          <button onClick={() => navigate('/turnos')}>Volver a Turnos</button>
        </div>
      )}
    </div>
  )
}
