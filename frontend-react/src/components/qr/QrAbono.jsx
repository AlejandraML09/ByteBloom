import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getQrAbono } from '../../api/qr'

export default function QrAbono({ abonoId, usuarioId }) {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    getQrAbono(abonoId, usuarioId)
      .then((res) => setToken(res.qr_token))
      .catch(() => setError('No se pudo cargar el QR.'))
      .finally(() => setLoading(false))
  }, [abonoId, usuarioId])

  if (loading) return null
  if (error) return <p style={{ color: 'red', fontSize: 13 }}>{error}</p>

  return (
    <div style={{ marginTop: '1rem' }}>
      <button
        className='ma-action-btn ma-action-btn--outline'
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Ocultar QR' : 'Mostrar QR de asistencia'}
      </button>

      {visible && token && (
        <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
          <QRCodeSVG value={token} size={180} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Mostrá este QR al secretario para registrar tu asistencia.
          </p>
        </div>
      )}
    </div>
  )
}