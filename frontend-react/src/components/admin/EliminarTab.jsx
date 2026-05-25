import { useState, useEffect } from 'react'
import { profesionales } from '../../constants/profesionales'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function EliminarTab({ onToast }) {
  const [emailSeleccionado, setEmailSeleccionado] = useState('')

  const [buscando, setBuscando] = useState(false)
  const [resumen, setResumen] = useState(null)
  const [resumenError, setResumenError] = useState(null)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  const profesionalSeleccionado = profesionales.find(
    (p) => p.email === emailSeleccionado
  )

  useEffect(() => {
    if (!emailSeleccionado) {
      setResumen(null)
      setResumenError(null)
      return
    }

    let cancelado = false

    setBuscando(true)
    setResumen(null)
    setResumenError(null)

    fetch(
      `${API_URL}/api/clases-programadas/por-profesional/${encodeURIComponent(emailSeleccionado)}/resumen`
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))

        if (cancelado) return

        if (!res.ok) {
          setResumenError(
            body?.detail ||
              'No se pudieron obtener las clases del profesional.'
          )
          return
        }

        setResumen(body)
      })
      .catch(() => {
        if (!cancelado) {
          setResumenError('No se pudo conectar con el servidor.')
        }
      })
      .finally(() => {
        if (!cancelado) {
          setBuscando(false)
        }
      })

    return () => {
      cancelado = true
    }
  }, [emailSeleccionado])

  function resetForm() {
    setEmailSeleccionado('')
    setResumen(null)
    setResumenError(null)
  }

  async function confirmarEliminacion() {
    if (!emailSeleccionado) return

    setConfirmando(true)

    try {
      const res = await fetch(
        `${API_URL}/api/clases-programadas/por-profesional/${encodeURIComponent(emailSeleccionado)}`,
        {
          method: 'DELETE',
        }
      )

      const body = await res.json().catch(() => ({}))

      if (!res.ok) {
        onToast?.(body?.detail || 'Error al cancelar las clases.')
        setMostrarModal(false)
        return
      }

      const nombre =
        profesionalSeleccionado?.name ?? emailSeleccionado

      const n = body.eliminadas ?? 0
      const r = body.reservas_canceladas ?? 0
      const l = body.lista_espera_cancelada ?? 0

      let mensaje =
        `Se cancelaron ${n} clase${n !== 1 ? 's' : ''} de ${nombre}.`

      if (r > 0) {
        mensaje += ` ${r} reserva${r !== 1 ? 's' : ''} cancelada${r !== 1 ? 's' : ''}.`
      }

      if (l > 0) {
        mensaje += ` ${l} persona${l !== 1 ? 's' : ''} removida${l !== 1 ? 's' : ''} de lista de espera.`
      }

      onToast?.(mensaje)

      setMostrarModal(false)
      resetForm()
    } catch {
      onToast?.('Error al cancelar las clases.')
      setMostrarModal(false)
    } finally {
      setConfirmando(false)
    }
  }

  const canCancelar =
    !!resumen &&
    !buscando &&
    resumen.clases_programadas > 0

  return (
    <div style={{ padding: '1.5rem', maxWidth: 560 }}>
      <h3
        style={{
          fontSize: '1.1rem',
          fontWeight: 600,
          marginBottom: '0.25rem',
        }}
      >
        Cancelar clases por profesional
      </h3>

      <p
        style={{
          color: '#666',
          fontSize: '0.875rem',
          marginBottom: '1.5rem',
        }}
      >
        Cancelá todas las clases futuras del profesional.
      </p>

      <label
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          fontSize: '0.85rem',
          color: '#444',
        }}
      >
        Profesional

        <select
          value={emailSeleccionado}
          onChange={(e) => setEmailSeleccionado(e.target.value)}
          style={{
            border: '1px solid #ddd',
            borderRadius: 6,
            padding: '0.45rem 0.75rem',
            fontSize: '0.9rem',
          }}
        >
          <option value=''>— Elegí un profesional —</option>

          {profesionales.map((p) => (
            <option key={p.email} value={p.email}>
              {p.name} — {p.title}
            </option>
          ))}
        </select>
      </label>

      <div
        style={{
          marginTop: '1.25rem',
          minHeight: 22,
          fontSize: '0.875rem',
        }}
      >
        {buscando && (
          <span style={{ color: '#888' }}>
            Buscando clases…
          </span>
        )}

        {!buscando && resumenError && (
          <span style={{ color: '#c0435a' }}>
            {resumenError}
          </span>
        )}

        {!buscando && resumen && (
          <div
            style={{
              background: '#fafafa',
              border: '1px solid #eee',
              borderRadius: 8,
              padding: '0.75rem 1rem',
              color: '#444',
            }}
          >
            <strong>
              {profesionalSeleccionado?.name ??
                emailSeleccionado}
            </strong>

            <div style={{ marginTop: 6 }}>
              {resumen.clases_programadas} clase
              {resumen.clases_programadas !== 1 ? 's' : ''} futuras
            </div>

            <div>
              {resumen.reservas_activas} reserva
              {resumen.reservas_activas !== 1 ? 's' : ''} activas
            </div>

            <div>
              {resumen.lista_espera} persona
              {resumen.lista_espera !== 1 ? 's' : ''} en lista de espera
            </div>
          </div>
        )}
      </div>

      <button
        onClick={() => setMostrarModal(true)}
        disabled={!canCancelar}
        style={{
          marginTop: '1.25rem',
          background: canCancelar ? '#c0435a' : '#d8b9c2',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          padding: '0.55rem 1.25rem',
          fontSize: '0.9rem',
          fontWeight: 500,
          cursor: canCancelar ? 'pointer' : 'not-allowed',
        }}
      >
        Cancelar clases
      </button>

      {mostrarModal && resumen && (
        <div
          onClick={(e) =>
            e.target === e.currentTarget &&
            setMostrarModal(false)
          }
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: '1.5rem',
              maxWidth: 460,
              width: '90%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <h4
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: '1.05rem',
              }}
            >
              ¿Cancelar todas las clases de{' '}
              {profesionalSeleccionado?.name ??
                emailSeleccionado}
              ?
            </h4>

            <p
              style={{
                color: '#555',
                fontSize: '0.9rem',
                lineHeight: 1.5,
                margin: 0,
              }}
            >
              Se cancelarán{' '}
              <strong>
                {resumen.clases_programadas} clase
                {resumen.clases_programadas !== 1
                  ? 's'
                  : ''}
              </strong>{' '}
              futuras.
            </p>

            <div
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                gap: 10,
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setMostrarModal(false)}
                disabled={confirmando}
                style={{
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: 6,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: confirmando
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                Volver
              </button>

              <button
                onClick={confirmarEliminacion}
                disabled={confirmando}
                style={{
                  background: '#c0435a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: confirmando
                    ? 'not-allowed'
                    : 'pointer',
                }}
              >
                {confirmando
                  ? 'Cancelando…'
                  : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}