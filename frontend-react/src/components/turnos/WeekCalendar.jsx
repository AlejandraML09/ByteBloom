import { useMemo } from 'react'
import { fmtDate, getMonday, DIAS_ES, MESES_ES } from '../../utils/dates'

export function WeekCalendar({ weekOffset, onWeekChange, selectedDay, onDaySelect, today }) {
  const base = useMemo(() => {
    const d = new Date(today)
    d.setDate(today.getDate() + weekOffset * 7)
    return d
  }, [today, weekOffset])

  const monday = useMemo(() => getMonday(base), [base])

  const friday = useMemo(() => {
    const f = new Date(monday)
    f.setDate(monday.getDate() + 4)
    return f
  }, [monday])

  const weekLabel = `${monday.getDate()} al ${friday.getDate()} de ${MESES_ES[friday.getMonth()]}`

  const prevMonday = useMemo(() => {
    const pm = new Date(monday)
    pm.setDate(monday.getDate() - 7)
    return pm
  }, [monday])

  const prevDisabled = prevMonday < today

  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }, [monday])

  return (
    <>
      <div className="week-nav">
        <button className="week-arrow" disabled={prevDisabled} onClick={() => onWeekChange(o => o - 1)}>&#8249;</button>
        <span className="week-label">{weekLabel}</span>
        <button className="week-arrow" onClick={() => onWeekChange(o => o + 1)}>&#8250;</button>
      </div>
      <div className="days-row">
        {weekDays.map((d) => {
          const isPast = d < today
          const isToday = fmtDate(d) === fmtDate(today)
          const isSelected = selectedDay && fmtDate(d) === fmtDate(selectedDay)
          return (
            <button
              key={fmtDate(d)}
              className={`day-btn${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isPast ? ' past' : ''}`}
              disabled={isPast}
              style={{ opacity: isPast ? 0.35 : 1, cursor: isPast ? 'not-allowed' : 'pointer' }}
              onClick={() => onDaySelect(d)}
            >
              <div className="day-name">{DIAS_ES[d.getDay()]}</div>
              <div className="day-num">{d.getDate()}</div>
            </button>
          )
        })}
      </div>
    </>
  )
}
