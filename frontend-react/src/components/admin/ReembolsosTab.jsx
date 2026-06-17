import { useState, useEffect } from 'react'
import { getReembolsosPendientes, confirmarReembolso } from '../../api/turnos'
import { fmtLargo } from '../../utils/dates'



const fmt = (n) => `$${Number(n).toLocaleString('es-AR')}`

const REEMBOLSO_STATUS = {
  reembolso_solicitado: { label: 'Pendiente', css: 'badge-amber' },
  reembolso_entregado:  { label: 'Entregado', css: 'badge-green' },
}

export default function ReembolsosTab() {
  const [reservas, setReservas]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState('')
  const [savingId, setSavingId]   = useState(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => { loadReservas() }, [])

  async function loadReservas() {
    setLoading(true)
    setError('')
    try {
      const data = await getReembolsosPendientes()
      setReservas(Array.isArray(data) ? data : [])
    } catch {
      setError('No se pudieron cargar los reembolsos.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarReembolso(reserva) {
    setSavingId(reserva.id)
    try {
      await confirmarReembolso(reserva.id)
      setReservas((prev) =>
        prev.map((item) =>
          item.id === reserva.id
            ? { ...item, estado_pago: 'reembolso_entregado' }
            : item
        )
      )
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo confirmar el reembolso.')
    } finally {
      setSavingId(null)
    }
  }

  let filtered = reservas

  const ordered = reservas
  .filter((r) => {
    if (!busqueda.trim()) return true
    const q = busqueda.toLowerCase()
    return (
      (r.cliente || r.email || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.zona || '').toLowerCase().includes(q) ||
      r.fecha.includes(q)
    )
  })
  .slice()
  .sort((a, b) => {
    if (a.estado_pago !== b.estado_pago) {
      return a.estado_pago === 'reembolso_solicitado' ? -1 : 1
    }
    return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)
  })

  return (
    <div className='tab-content'>
      <div className='card'>
        <div className='card-header'>
          <div>
            <h3>Reembolsos solicitados</h3>
            <p>Clientes que cancelaron y solicitaron reembolso en efectivo. Marcalos como entregados una vez abonados.</p>
          </div>
        </div>

        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray)' }}>
        <input
            type='text'
            placeholder='Buscar por cliente, zona o fecha (YYYY-MM-DD)…'
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            style={{
            width: '100%',
            padding: '0.65rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--text-muted)',
            fontSize: '14px',
            boxSizing: 'border-box',
            }}
        />
        </div>

        <div className='card-body'>
          {error && <div className='error-msg show'>{error}</div>}

          {loading ? (
            <div>Cargando reembolsos...</div>
          ) : ordered.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
              No hay reembolsos pendientes.
            </div>
          ) : (
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha clase</th>
                  <th>Zona</th>
                  <th>Monto a reembolsar</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((reserva) => {
                  const status = REEMBOLSO_STATUS[reserva.estado_pago] ?? { label: reserva.estado_pago, css: 'badge-gray' }
                  const yaEntregado = reserva.estado_pago === 'reembolso_entregado'
                  return (
                    <tr key={reserva.id}>
                      <td>{reserva.cliente || reserva.email}</td>
                      <td>
                        {fmtLargo(reserva.fecha)}<br />
                        <small>{reserva.hora}</small>
                      </td>
                      <td>{reserva.zona}</td>
                      <td><strong>{fmt(reserva.precio_pagado ?? 0)}</strong></td>
                      <td>
                        <span className={`badge ${status.css}`}>{status.label}</span>
                      </td>
                      <td>
                        {yaEntregado ? (
                          <span>—</span>
                        ) : (
                          <button
                            className='btn-action'
                            type='button'
                            disabled={savingId === reserva.id}
                            onClick={() => handleConfirmarReembolso(reserva)}
                          >
                            {savingId === reserva.id ? 'Guardando...' : 'Marcar como reembolsado'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}