import { HORARIOS } from '../../constants/turnos'

export function SlotGrid({ selectedDay, selectedSlot, onSlotSelect, getOcupados }) {
  if (!selectedDay) {
    return (
      <div className="empty-state">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
        </svg>
        <p>Seleccioná un día para ver los turnos disponibles</p>
      </div>
    )
  }

  return (
    <div className="slots-grid">
      {HORARIOS.map(hora => {
        const taken = getOcupados(selectedDay, hora)
        const isFull = taken >= 5
        const isSelected = selectedSlot === hora
        return (
          <button
            key={hora}
            className={`slot-btn${isFull ? ' full' : ''}${isSelected ? ' selected' : ''}`}
            disabled={isFull}
            onClick={() => onSlotSelect(hora)}
          >
            <span className="slot-time">{hora}</span>
            <div className="slot-dots">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`slot-dot${i < taken ? ' taken' : ''}`} />
              ))}
            </div>
            <div className="slot-cupos" style={{ color: isFull ? 'var(--gray-text)' : taken >= 4 ? 'var(--red)' : 'var(--green-dark)' }}>
              {isFull ? 'Sin cupos' : `${5 - taken} lugar${5 - taken === 1 ? '' : 'es'}`}
            </div>
          </button>
        )
      })}
    </div>
  )
}
