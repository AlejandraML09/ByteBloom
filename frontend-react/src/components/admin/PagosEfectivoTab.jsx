import { useState, useEffect } from 'react'
import { getPagosEfectivo, confirmarPagoEfectivo } from '../../api/turnos'
import { fmtLargo } from '../../utils/dates'

const PAYMENT_STATUS = {
  pago_completo: { label: 'Pago recibido', css: 'badge-green' },
  pago_pendiente: { label: 'Pago pendiente', css: 'badge-amber' },
  vencido: { label: 'Pago vencido', css: 'badge-red' },
}

export default function PagosEfectivoTab() {
  const [reservas, setReservas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  useEffect(() => {
    loadReservas()
  }, [])

  async function loadReservas() {
    setLoading(true)
    setError('')
    try {
      const data = await getPagosEfectivo()
      setReservas(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('No se pudo cargar los pagos en efectivo.')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirmarPago(reserva) {
    setSavingId(reserva.id)
    try {
      const resp = await confirmarPagoEfectivo(reserva.id)
      setReservas((prev) =>
        prev.map((item) =>
          item.id === reserva.id
            ? { 
                ...item, 
                estado_pago: 'pago_completo', 
                estado: resp.estado_reserva || 'confirmada'
              }
            : item
        )
      )
    } catch (err) {
      setError(err?.response?.data?.detail || 'No se pudo confirmar el pago.')
    } finally {
      setSavingId(null)
    }
  }

  const ordered = reservas.filter(r => r.clase_activa).slice().sort((a, b) => {
    if (a.estado_pago !== b.estado_pago) {
      return a.estado_pago === 'pago_pendiente' ? -1 : 1
    }
    if (a.horas_restantes !== b.horas_restantes) {
      return a.horas_restantes - b.horas_restantes
    }
    return a.fecha.localeCompare(b.fecha) || a.hora.localeCompare(b.hora)
  })

  return (
    <div className='tab-content'>
      <div className='card'>
        <div className='card-header'>
          <div>
            <h3>Pagos en efectivo</h3>
            <p>Lista de reservas en efectivo. Confirmá el pago en el centro para efectivizar la reserva.</p>
          </div>
        </div>

        <div className='card-body'>
          {error && <div className='error-msg show'>{error}</div>}

          {loading ? (
            <div>Cargando pagos...</div>
          ) : ordered.length === 0 ? (
            <div className='admin-page td-empty'>No hay reservas en efectivo para mostrar.</div>
          ) : (
            <table className='data-table'>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Fecha clase</th>
                  <th>Zona</th>
                  <th>Pago</th>
                  <th>Estado</th>
                  <th>Vence en</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {ordered.map((reserva) => {
                  const vencido = reserva.estado_pago === 'vencido' || (reserva.estado_pago === 'pago_pendiente' && reserva.horas_restantes === 0)
                  const status = vencido
                    ? PAYMENT_STATUS['vencido']
                    : PAYMENT_STATUS[reserva.estado_pago] || { label: reserva.estado_pago, css: 'badge-gray' }
                  const expiresLabel = reserva.estado_pago === 'pago_completo'
                    ? 'Pago recibido'
                    : `${reserva.horas_restantes}h`
                  return (
                    <tr key={reserva.id}>
                      <td>{reserva.cliente || reserva.email}</td>
                      <td>
                        {fmtLargo(reserva.fecha)}<br />
                        <small>{reserva.hora}</small>
                      </td>
                      <td>{reserva.zona}</td>
                      <td>
                        {reserva.precio_pagado != null && reserva.monto_total != null
                          ? `${reserva.precio_pagado.toFixed(2)} / ${reserva.monto_total.toFixed(2)}`
                          : reserva.medio_pago}
                      </td>
                      <td>
                        <span className={`badge ${status.css}`}>{status.label}</span>
                      </td>
                      <td>
                        <div>
                          <small>{new Date(reserva.fecha_vencimiento).toLocaleString('es-AR')}</small><br />
                          <span className={`badge ${vencido ? 'badge-gray' : 'badge-gray'}`}>
                            {`${reserva.horas_restantes}h`}
                          </span>
                        </div>
                      </td>
                      <td>
                        {(() => {
                          if (vencido || reserva.estado_pago === 'pago_completo') {
                            return <span>—</span>
                          }

                          const disabled = reserva.estado_pago !== 'pago_pendiente' || savingId === reserva.id
                          let label = 'Marcar como recibido'
                          if (disabled) {
                            const disabledStyle = {
                              background: '#e6e6e6',
                              color: '#777',
                              borderColor: '#d0d0d0',
                              cursor: 'not-allowed',
                              pointerEvents: 'none',
                              boxShadow: 'none'
                            }
                            return (
                              <button
                                className={`btn-action btn-action--disabled`}
                                type='button'
                                disabled
                                aria-disabled='true'
                                tabIndex={-1}
                                style={disabledStyle}
                              >
                                {label}
                              </button>
                            )
                          }
                          return (
                            <button className='btn-action' type='button' onClick={() => handleConfirmarPago(reserva)}>
                              {savingId === reserva.id ? 'Guardando...' : label}
                            </button>
                          )
                        })()}
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
