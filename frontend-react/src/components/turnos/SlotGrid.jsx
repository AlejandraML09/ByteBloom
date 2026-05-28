import { WaitlistToggle } from './WaitList'

const MAX_DOTS = 10

export function SlotGrid({
  selectedDay,
  selectedSlot,
  onSlotSelect,
  clases,
  bookedClaseIds = new Set(),
  waitlistClaseIds = new Set(),
  onWaitlistToggle = null,
  shifts = [],
}) {
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

  if (!clases || clases.length === 0) {
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
          <path d='M12 8v4M12 16h.01' />
        </svg>
        <p>No hay clases programadas para este día</p>
      </div>
    )
  }

  return (
    <div className='slots-grid'>
      {clases.map((clase) => {
        const isFull = clase.cupo_disponible <= 0
        const isBooked = bookedClaseIds.has(clase.id)
        const isSelected = selectedSlot === clase.hora
        const inWaitlist = waitlistClaseIds.has(clase.id)
        const alreadySelected = shifts.some(
          (s) =>
            s.slot === clase.hora &&
            new Date(s.diaDate).toDateString() === new Date(selectedDay).toDateString()
        )
        const disabled = isFull || isBooked || alreadySelected
        const taken = clase.cupo_maximo - clase.cupo_disponible
        const dots = Math.min(clase.cupo_maximo, MAX_DOTS)
        const takenDots = Math.round((taken / clase.cupo_maximo) * dots)

        return (
          <div key={clase.id} className='slot-item'>
            <button
              className={`slot-btn${isFull ? ' full' : ''}${isBooked ? ' booked' : ''}${isSelected ? ' selected' : ''}${inWaitlist ? ' in-waitlist' : ''}${alreadySelected ? ' already-selected' : ''}`}
              disabled={disabled}
              onClick={() => onSlotSelect(clase.hora)}
            >
              <span className='slot-time'>{clase.hora}</span>
              <div className='slot-dots'>
                {Array.from({ length: dots }, (_, i) => (
                  <div key={i} className={`slot-dot${i < takenDots ? ' taken' : ''}`} />
                ))}
              </div>
              <div
                className='slot-cupos'
                style={{
                  color: alreadySelected
                    ? 'var(--text-muted)'
                    : isBooked
                      ? 'var(--primary)'
                      : isFull
                        ? inWaitlist
                          ? 'var(--warning, #b45309)'
                          : 'var(--text-muted)'
                        : clase.cupo_disponible <= 2
                          ? 'var(--danger)'
                          : 'var(--primary-dark)',
                }}
              >
                {alreadySelected
                  ? 'Ya seleccionado'
                  : isBooked
                    ? 'Ya reservado'
                    : isFull
                      ? inWaitlist
                        ? 'En lista de espera'
                        : 'Sin cupos'
                      : `${clase.cupo_disponible} lugar${clase.cupo_disponible === 1 ? '' : 'es'}`}
              </div>
            </button>

            {isFull && onWaitlistToggle && (
              <WaitlistToggle clase={clase} inWaitlist={inWaitlist} onToggle={onWaitlistToggle} />
            )}
          </div>
        )
      })}
    </div>
  )
}
