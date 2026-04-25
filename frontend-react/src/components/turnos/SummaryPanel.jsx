import { ZONA_LABELS } from '../../constants/turnos'
import { fmtDiaLargo, nextHour } from '../../utils/dates'

export function SummaryPanel({ zona, diaDate, slot, nombre, apellido, os, onConfirm }) {
  const sumZona   = zona    ? ZONA_LABELS[zona] : null
  const sumDia    = diaDate ? fmtDiaLargo(diaDate) : null
  const sumHora   = slot    ? `${slot} – ${nextHour(slot)}` : null
  const sumNombre = (nombre || apellido) ? `${nombre} ${apellido}`.trim() : null

  const allFilled = zona && diaDate && slot && nombre && apellido && os

  const rows = [
    { key: 'Zona',       val: sumZona,   fallback: 'Sin seleccionar' },
    { key: 'Día',        val: sumDia,    fallback: 'Sin seleccionar' },
    { key: 'Horario',    val: sumHora,   fallback: 'Sin seleccionar' },
    { key: 'Duración',   val: <span className="summary-badge">1 hora</span>, fallback: null },
    { key: 'Paciente',   val: sumNombre, fallback: 'Sin completar' },
    { key: 'Obra social', val: os || null, fallback: 'Sin completar' },
  ]

  return (
    <div className="sidebar">
      <div className="summary-card">
        <div className="summary-header">
          <h3>Resumen del turno</h3>
          <p>Revisá los datos antes de confirmar</p>
        </div>
        <div className="summary-body">
          {rows.map(({ key, val, fallback }) => (
            <div className="summary-row" key={key}>
              <span className="summary-key">{key}</span>
              <span className={`summary-val${val ? '' : ' empty'}`}>{val || fallback}</span>
            </div>
          ))}
          <button className="btn-confirm" disabled={!allFilled} onClick={onConfirm}>
            Confirmar turno
          </button>
        </div>
      </div>
    </div>
  )
}
