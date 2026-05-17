import { useState } from 'react'
import { profesionales } from '../../constants/profesionales'

export function EliminarTab({ onEliminar }) {
  const [emailSeleccionado, setEmailSeleccionado] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [confirmando, setConfirmando] = useState(false)

  const profesionalSeleccionado = profesionales.find(
    (p) => p.email === emailSeleccionado
  )

  const handleSeleccionar = (e) => {
    setEmailSeleccionado(e.target.value)
    setError('')
    setSuccessMsg('')
    setConfirmando(false)
  }

  const handleConfirmar = () => {
    if (!emailSeleccionado) {
      setError('Seleccioná un profesional.')
      return
    }
    setConfirmando(true)
  }

  const handleEliminar = async () => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    try {
      const resultado = await onEliminar(emailSeleccionado)
      setSuccessMsg(
        `Se cancelaron ${resultado.eliminadas} clase${resultado.eliminadas !== 1 ? 's' : ''} de ${profesionalSeleccionado.name}.`
      )
      setEmailSeleccionado('')
      setConfirmando(false)
    } catch (err) {
      setError(err.message || 'Error al eliminar las clases.')
      setConfirmando(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = () => {
    setConfirmando(false)
    setError('')
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <h3>Cancelar clases por profesional</h3>
          <p>Cancelá todas las clases futuras asignadas a un profesional.</p>
        </div>
      </div>

      <div className="create-form">
        {successMsg && <div className="form-success">{successMsg}</div>}
        {error && <div className="form-error">{error}</div>}

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="profesional_email">Profesional</label>
            <select
              id="profesional_email"
              value={emailSeleccionado}
              onChange={handleSeleccionar}
              className={error && !emailSeleccionado ? 'input-error' : ''}
              disabled={confirmando}
            >
              <option value="">Seleccioná un profesional</option>
              {profesionales.map((p) => (
                <option key={p.email} value={p.email}>
                  {p.name} — {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Preview del profesional seleccionado */}
        {profesionalSeleccionado && !confirmando && (
          <div className="eliminar-preview">
            <div className="eliminar-preview-info">
              <div className="eliminar-preview-initials">
                {profesionalSeleccionado.initials}
              </div>
              <div>
                <div className="eliminar-preview-name">
                  {profesionalSeleccionado.name}
                </div>
                <div className="eliminar-preview-title">
                  {profesionalSeleccionado.title}
                </div>
                <div className="eliminar-preview-email">
                  {profesionalSeleccionado.email}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bloque de confirmación */}
        {confirmando && profesionalSeleccionado && (
          <div className="eliminar-confirm">
            <div className="eliminar-confirm-icon">⚠️</div>
            <div className="eliminar-confirm-text">
              <strong>¿Confirmar cancelación?</strong>
              <p>
                Se cancelarán todas las clases futuras de{' '}
                <strong>{profesionalSeleccionado.name}</strong>. Esta acción no
                se puede deshacer.
              </p>
            </div>
            <div className="eliminar-confirm-actions">
              <button
                className="btn-action"
                onClick={handleCancelar}
                disabled={loading}
              >
                No, volver
              </button>
              <button
                className="btn-action danger"
                onClick={handleEliminar}
                disabled={loading}
              >
                {loading ? 'Cancelando...' : 'Sí, cancelar clases'}
              </button>
            </div>
          </div>
        )}

        {/* Botón inicial */}
        {!confirmando && (
          <div className="form-actions">
            <button
              className="btn-action danger"
              onClick={handleConfirmar}
              disabled={!emailSeleccionado || loading}
            >
              Cancelar clases
            </button>
          </div>
        )}
      </div>
    </div>
  )
}