import { useState, useEffect, useMemo } from 'react'
import { ZONA_LABELS } from '../../constants/turnos'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function CancelarTab({ onToast }) {
  const [zonas, setZonas] = useState([])
  const [clasesConInscriptos, setClasesConInscriptos] = useState([])
  const [cargandoClases, setCargandoClases] = useState(true)

  const [zonaId, setZonaId] = useState('')
  const [fecha, setFecha] = useState('')
  const [hora, setHora] = useState('')

  const [buscando, setBuscando] = useState(false)
  const [resumen, setResumen] = useState(null) // { id, inscriptos, activo } | null
  const [resumenError, setResumenError] = useState(null)

  const [mostrarModal, setMostrarModal] = useState(false)
  const [confirmando, setConfirmando] = useState(false)

  // Cargar zonas
  useEffect(() => {
    let cancelado = false
    async function cargar() {
      try {
        const res = await fetch(`${API_URL}/api/zonas`)
        if (!res.ok) return
        const data = await res.json()
        if (!cancelado) setZonas(Array.isArray(data) ? data : [])
      } catch {
        /* ignore */
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  // Cargar clases futuras activas y filtrar las que ya tienen cupos ocupados
  useEffect(() => {
    let cancelado = false
    async function cargar() {
      setCargandoClases(true)
      try {
        const res = await fetch(`${API_URL}/api/clases-cancelar`)
        if (!res.ok) return
        const data = await res.json()
        if (cancelado) return
        setClasesConInscriptos(Array.isArray(data) ? data : [])
      } catch {
        /* ignore */
      } finally {
        if (!cancelado) setCargandoClases(false)
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  // Fechas únicas con inscriptos para la zona elegida
  const fechasDisponibles = useMemo(() => {
    if (!zonaId) return []
    const set = new Set(
      clasesConInscriptos
        .filter((c) => String(c.zona_id) === String(zonaId))
        .map((c) => c.fecha)
    )
    return Array.from(set).sort()
  }, [zonaId, clasesConInscriptos])

  // Horas únicas con inscriptos para zona + fecha elegida
  const horasDisponibles = useMemo(() => {
    if (!zonaId || !fecha) return []
    const set = new Set(
      clasesConInscriptos
        .filter(
          (c) =>
            String(c.zona_id) === String(zonaId) && c.fecha === fecha
        )
        .map((c) => c.hora)
    )
    return Array.from(set).sort()
  }, [zonaId, fecha, clasesConInscriptos])

  // Si cambia la zona, reseteo fecha y hora
  useEffect(() => {
    setFecha('')
    setHora('')
  }, [zonaId])

  // Si cambia la fecha, reseteo la hora
  useEffect(() => {
    setHora('')
  }, [fecha])

  // Buscar clase apenas estén los 3 selectores con valor
  useEffect(() => {
    if (!zonaId || !fecha || !hora) {
      setResumen(null)
      setResumenError(null)
      return
    }
    let cancelado = false
    setBuscando(true)
    setResumenError(null)
    fetch(
      `${API_URL}/api/clases-cancelar/buscar?zona_id=${zonaId}&fecha=${fecha}&hora=${hora}`
    )
      .then(async (res) => {
        const body = await res.json().catch(() => ({}))
        if (cancelado) return
        if (!res.ok) {
          setResumen(null)
          setResumenError(body?.detail || 'No se pudo buscar la clase.')
          return
        }
        setResumen(body)
      })
      .catch(() => {
        if (!cancelado) {
          setResumen(null)
          setResumenError('No se pudo buscar la clase.')
        }
      })
      .finally(() => {
        if (!cancelado) setBuscando(false)
      })
    return () => {
      cancelado = true
    }
  }, [zonaId, fecha, hora])

  const zonaNombre = useMemo(() => {
    const z = zonas.find((x) => String(x.id) === String(zonaId))
    if (!z) return ''
    return ZONA_LABELS[z.nombre] ?? z.nombre
  }, [zonaId, zonas])

  function resetForm() {
    setZonaId('')
    setFecha('')
    setHora('')
    setResumen(null)
    setResumenError(null)
  }

  async function recargarClases() {
    try {
      const res = await fetch(`${API_URL}/api/clases-cancelar`)
      if (!res.ok) return
      const data = await res.json()
     setClasesConInscriptos(Array.isArray(data) ? data : [])
    } catch {
      /* ignore */
    }
  }

  async function confirmarCancelacion() {
    if (!resumen?.id) return
    setConfirmando(true)
    try {
      const res = await fetch(`${API_URL}/api/clases-cancelar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clase_programada_id: resumen.id }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        onToast?.(body?.detail || 'Error al cancelar la clase.')
        setMostrarModal(false)
        return
      }
      onToast?.('La clase ha sido cancelada exitosamente')
      setMostrarModal(false)
      resetForm()
      recargarClases()
    } catch {
      onToast?.('Error al cancelar la clase.')
      setMostrarModal(false)
    } finally {
      setConfirmando(false)
    }
  }

  const canCancelar = !!resumen?.id && !buscando
  const sinClasesParaZona = !!zonaId && fechasDisponibles.length === 0 && !cargandoClases

  return (
    <div style={{ padding: '1.5rem', maxWidth: 560 }}>
      <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.25rem' }}>
        Cancelar clase
      </h3>
      <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
       Se listan todas las clases futuras activas.
      </p>

      {/* Formulario */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#444' }}>
          Zona
          <select
            value={zonaId}
            onChange={(e) => setZonaId(e.target.value)}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '0.45rem 0.75rem',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          >
            <option value=''>— Elegí una zona —</option>
            {zonas.map((z) => (
              <option key={z.id} value={z.id}>
                {ZONA_LABELS[z.nombre] ?? z.nombre}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#444' }}>
          Fecha
          <select
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            disabled={!zonaId || sinClasesParaZona}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '0.45rem 0.75rem',
              fontSize: '0.9rem',
              outline: 'none',
              background: !zonaId || sinClasesParaZona ? '#f5f5f5' : '#fff',
            }}
          >
            <option value=''>
              {!zonaId
                ? '— Elegí primero una zona —'
                : sinClasesParaZona
                  ? '— No hay clases disponibles —'
                  : '— Elegí una fecha —'}
            </option>
            {fechasDisponibles.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: '#444' }}>
          Hora
          <select
            value={hora}
            onChange={(e) => setHora(e.target.value)}
            disabled={!fecha}
            style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              padding: '0.45rem 0.75rem',
              fontSize: '0.9rem',
              outline: 'none',
              background: !fecha ? '#f5f5f5' : '#fff',
            }}
          >
            <option value=''>
              {!fecha ? '— Elegí primero una fecha —' : '— Elegí un horario —'}
            </option>
            {horasDisponibles.map((h) => (
              <option key={h} value={h}>
                {h}hs
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Resumen / error */}
      <div style={{ marginTop: '1.25rem', minHeight: 22, fontSize: '0.875rem' }}>
        {buscando && <span style={{ color: '#888' }}>Buscando clase…</span>}
        {!buscando && resumenError && (
          <span style={{ color: '#c0435a' }}>{resumenError}</span>
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
            <strong>{zonaNombre}</strong> · {fecha} · {hora}hs ·{' '}
            <span>
              {resumen.inscriptos} inscripto{resumen.inscriptos === 1 ? '' : 's'}
            </span>
            {!resumen.activo && (
              <div style={{ marginTop: 4, color: '#c0435a', fontSize: '0.8rem' }}>
                Esta clase ya se encuentra cancelada.
              </div>
            )}
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
        Cancelar
      </button>

      {/* Modal de confirmación */}
      {mostrarModal && resumen && (
        <div
          onClick={(e) => e.target === e.currentTarget && setMostrarModal(false)}
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
            <h4 style={{ margin: 0, marginBottom: 12, fontSize: '1.05rem' }}>
              ¿Cancelar la clase de {zonaNombre} del {fecha} a las {hora}hs?
            </h4>
            <p style={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
              {resumen.inscriptos > 0
                ? `Esto también cancelará las reservas de ${resumen.inscriptos} usuario${
                    resumen.inscriptos === 1 ? '' : 's'
                  }.`
                : 'No hay usuarios inscriptos en esta clase.'}{' '}
              La acción no se puede deshacer.
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
                  cursor: confirmando ? 'not-allowed' : 'pointer',
                }}
              >
                Volver
              </button>
              <button
                onClick={confirmarCancelacion}
                disabled={confirmando}
                style={{
                  background: '#c0435a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  cursor: confirmando ? 'not-allowed' : 'pointer',
                }}
              >
                {confirmando ? 'Cancelando…' : 'Confirmar cancelación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
