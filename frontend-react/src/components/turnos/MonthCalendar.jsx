import { useState, useMemo } from 'react'
import { fmtDate, MESES_ES } from '../../utils/dates'
import { HORARIOS } from '../../constants/turnos'

const DIAS_HEADER = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MAX_PER_SLOT = 5

export function MonthCalendar({ selectedDay, onDaySelect, today, getOcupados, bookedDays }) {
  const [monthOffset, setMonthOffset] = useState(0)

  const displayDate = useMemo(() => {
    return new Date(today.getFullYear(), today.getMonth() + monthOffset, 1)
  }, [today, monthOffset])

  const prevDisabled = useMemo(() => {
    return monthOffset <= 0
  }, [monthOffset])

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
      <div className="month-nav">
        <button className="week-arrow" disabled={prevDisabled} onClick={() => setMonthOffset(o => o - 1)}>&#8249;</button>
        <span className="week-label">{monthLabel}</span>
        <button className="week-arrow" onClick={() => setMonthOffset(o => o + 1)}>&#8250;</button>
      </div>

      <div className="month-header">
        {DIAS_HEADER.map(d => <span key={d}>{d}</span>)}
      </div>

      <div className="month-grid">
        {calendarDays.map((d, i) => {
          if (!d) return <div key={`e-${i}`} className="month-empty" />

          const isPast = d < today
          const isToday = fmtDate(d) === fmtDate(today)
          const isSelected = selectedDay && fmtDate(d) === fmtDate(selectedDay)
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          const isBooked = bookedDays?.has(fmtDate(d))
          const disabled = isPast || isWeekend || isBooked

          const totalOcupados = disabled ? 0 : HORARIOS.reduce((s, h) => s + getOcupados(d, h), 0)
          const maxCapacity = HORARIOS.length * MAX_PER_SLOT
          const pct = Math.min(100, Math.round((totalOcupados / maxCapacity) * 100))

          return (
            <button
              key={fmtDate(d)}
              className={[
                'month-day',
                isToday ? 'today' : '',
                isSelected ? 'selected' : '',
                isBooked ? 'booked' : '',
                disabled ? 'disabled' : '',
              ].filter(Boolean).join(' ')}
              disabled={disabled}
              onClick={() => onDaySelect(d)}
            >
              <span className="month-day-num">{d.getDate()}</span>
              {!disabled && (
                <div className="month-day-bar">
                  <div className="month-day-fill" style={{ width: `${pct}%` }} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </>
  )
}
