import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getQrReserva } from '../../api/qr'

export default function QrReserva({ reservaId, usuarioId }) {
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    getQrReserva(reservaId, usuarioId)
      .then((res) => setToken(res.qr_token))
      .catch(() => setError('No se pudo cargar el QR.'))
      .finally(() => setLoading(false))
  }, [reservaId, usuarioId])

  if (loading || error) return null

  return (
    <>
      <button
        className='mr-action-btn mr-action-btn--outline'
        style={{ fontSize: 12, padding: '6px 10px' }}
        onClick={() => setVisible((v) => !v)}
      >
        {visible ? 'Ocultar QR' : 'Ver QR'}
      </button>

      {visible && token && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <QRCodeSVG value={token} size={160} />
          <p style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', maxWidth: 160 }}>
            Mostrá este QR al secretario para registrar tu asistencia.
          </p>
        </div>
      )}
    </>
  )
}