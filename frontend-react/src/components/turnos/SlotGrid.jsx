import { HORARIOS } from '../../constants/turnos'

export function SlotGrid({ selectedDay, selectedSlot, onSlotSelect, getOcupados, bookedSlots }) {
  if (!selectedDay) {
    return (
      <div className='empty-state'>
        <svg
          width='32'
          height='32'
          viewBox='0 0 24 24'
          fill='none'
          stroke='currentColor'
          strokeWidth='1.5'
        >
          <circle cx='12' cy='12' r='10' />
          <path d='M12 6v6l4 2' />
        </svg>
        <p>Seleccioná un día para ver los turnos disponibles</p>
      </div>
    )
  }

  return (
    <div className='slots-grid'>
      {HORARIOS.map((hora) => {
        const taken = getOcupados(selectedDay, hora)
        const isFull = taken >= 5
        const isBooked = bookedSlots?.has(hora)
        const isSelected = selectedSlot === hora
        const disabled = isFull || isBooked

        return (
          <button
            key={hora}
            className={`slot-btn${isFull ? ' full' : ''}${isBooked ? ' booked' : ''}${isSelected ? ' selected' : ''}`}
            disabled={disabled}
            onClick={() => onSlotSelect(hora)}
          >
            <span className='slot-time'>{hora}</span>
            <div className='slot-dots'>
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className={`slot-dot${i < taken ? ' taken' : ''}`} />
              ))}
            </div>
            <div
              className='slot-cupos'
              style={{
                color: isBooked
                  ? 'var(--primary)'
                  : isFull
                    ? 'var(--text-muted)'
                    : taken >= 4
                      ? 'var(--danger)'
                      : 'var(--primary-dark)',
              }}
            >
              {isBooked
                ? 'Agendado'
                : isFull
                  ? 'Sin cupos'
                  : `${5 - taken} lugar${5 - taken === 1 ? '' : 'es'}`}
            </div>
          </button>
        )
      })}
    </div>
  )
}
