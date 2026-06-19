import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import { escanearQrAbono, escanearQrReserva } from '../../api/qr'

const esCelular = /iPhone|iPad|Android/i.test(navigator.userAgent)

export default function EscanerQR({ secretarioId, onSuccess }) {
  const [activo, setActivo] = useState(false)
  const [resultado, setResultado] = useState(null)
  const scannerRef = useRef(null)

  useEffect(() => {
    if (!activo) return

    const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false)

    scanner.render(
      async (texto) => {
        scanner.clear()
        setActivo(false)

        try {
          let res
          try {
            res = await escanearQrAbono(texto, secretarioId)
          } catch (errAbono) {
            if (errAbono?.response?.status === 404) {
              res = await escanearQrReserva(texto, secretarioId)
            } else {
              throw errAbono
            }
          }
          setResultado({ ok: true, mensaje: res.mensaje })
          onSuccess?.()
        } catch (err) {
          setResultado({
            ok: false,
            mensaje: err?.response?.data?.detail || 'Error al registrar asistencia.',
          })
        }
      },
      () => {}
    )

    scannerRef.current = scanner
    return () => { scanner.clear().catch(() => {}) }
  }, [activo, secretarioId])

  if (!esCelular) return null

  return (
    <div style={{ padding: '1rem' }}>
      {!activo && (
        <button
          className='ma-action-btn'
          onClick={() => {
            setResultado(null)
            setActivo(true)
          }}
        >
        Escanear QR de asistencia
        </button>
      )}

      {activo && <div id='qr-reader' style={{ width: '100%', maxWidth: 400 }} />}

      {resultado && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: 10,
            backgroundColor: resultado.ok ? '#d1fae5' : '#fee2e2',
            color: resultado.ok ? '#065f46' : '#991b1b',
            fontWeight: 500,
            fontSize: 15,
            textAlign: 'center',
          }}
        >
          {resultado.ok ? '✅' : '❌'} {resultado.mensaje}
        </div>
      )}
    </div>
  )
}