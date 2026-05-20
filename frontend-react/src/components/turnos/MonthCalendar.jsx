import { useState, useMemo, useEffect } from 'react'
import { fmtDate, MESES_ES, getISOWeekKey } from '../../utils/dates'

const DIAS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function MonthCalendar({
  selectedDay,
  onDaySelect,
  today,
  getClasesForDay,
  bookedDays,
  onMonthChange,
  blockedWeekKeys,
  defaultMonthOffset = 0,
  minMonthOffset = 0,
  maxMonthOffset = null,
}) {
  const [monthOffset, setMonthOffset] = useState(defaultMonthOffset)

  const displayDate = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  }, [today, monthOffset])

  useEffect(() => {
    onMonthChange?.(displayDate)
  }, [displayDate])

  const prevDisabled = monthOffset <= minMonthOffset
  const nextDisabled = maxMonthOffset !== null && monthOffset >= maxMonthOffset
  const monthLabel = `${MESES_ES[displayDate.getMonth()]} ${displayDate.getFullYear()}`

  const calendarDays = useMemo(() => {
    const year = displayDate.getFullYear()
    const month = displayDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    const startDow = firstDay.getDay()
    const leadingEmpty = startDow === 0 ? 6 : startDow - 1

    const cells = Array(leadingEmpty).fill(null)
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(new Date(year, month, d))
    }
    return cells
  }, [displayDate])

  return (
    <>
      <div className='month-nav'>
        <button
          className='week-arrow'
          disabled={prevDisabled}
          onClick={() => setMonthOffset((o) => o - 1)}
        >
          &#8249;
        </button>
        <span className='week-label'>{monthLabel}</span>
        <button
          className='week-arrow'
          disabled={nextDisabled}
          onClick={() => setMonthOffset((o) => o + 1)}
        >
          &#8250;
        </button>
      </div>

      <div className='month-header'>
        {DIAS_HEADER.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>

      <div className='month-grid'>
        {calendarDays.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className='month-empty' />

          const isPast = d < today
          const isToday = fmtDate(d) === fmtDate(today)
          const isSelected = selectedDay && fmtDate(d) === fmtDate(selectedDay)
          const isBooked = bookedDays?.has(fmtDate(d))

          const clases = isPast || isBooked ? [] : (getClasesForDay?.(d) ?? [])
          const hasAvailable = clases.some((c) => c.cupo_disponible > 0)

          const weekKey = getISOWeekKey(d)
          const isWeekBlocked = blockedWeekKeys?.has(weekKey) ?? false

          const totalMax = clases.reduce((s, c) => s + c.cupo_maximo, 0)
          const totalTaken = clases.reduce((s, c) => s + (c.cupo_maximo - c.cupo_disponible), 0)
          const pct = totalMax > 0 ? Math.min(100, Math.round((totalTaken / totalMax) * 100)) : 0

          const disabled = isPast || isBooked || !hasAvailable || isWeekBlocked

          return (
            <button
              key={fmtDate(d)}
              className={[
                'month-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isBooked ? 'booked' : '',
                isWeekBlocked ? 'week-blocked' : '',
                disabled ? 'disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={disabled}
              onClick={() => onDaySelect(d)}
            >
              <span className='month-day-num'>{d.getDate()}</span>
              {!disabled && (
                <div className='month-day-bar'>
                  <div className='month-day-fill' style={{ width: `${pct}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
