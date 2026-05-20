export const DIAS_ES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
export const MESES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const DIAS_LARGO = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const MESES_LARGO = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

/** Returns an ISO date string "YYYY-MM-DD" for a Date object */
export function fmtDate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Returns a short day label like "Lun 5 de Enero" */
export function fmtDiaLargo(d) {
  return `${DIAS_ES[d.getDay()]} ${d.getDate()} de ${MESES_ES[d.getMonth()]}`
}

/** Returns a long day label like "Lunes 5 de enero" from an ISO date string */
export function fmtLargo(dateStr) {
  const dt = new Date(dateStr + 'T00:00:00')
  return `${DIAS_LARGO[dt.getDay()]} ${dt.getDate()} de ${MESES_LARGO[dt.getMonth()]}`
}

/** Returns the Monday of the week containing date d */
export function getMonday(d) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const mon = new Date(d)
  mon.setDate(d.getDate() + diff)
  return mon
}

/** Returns an ISO week key "YYYY-Www" for a given Date (week starts Monday) */
export function getISOWeekKey(d) {
  const utc = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  const dow = utc.getUTCDay() || 7 // 1=Mon … 7=Sun
  utc.setUTCDate(utc.getUTCDate() + 4 - dow) // Thursday of this week
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1))
  const weekNum = Math.ceil(((utc - yearStart) / 86400000 + 1) / 7)
  return `${utc.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Returns the next hour string given an "HH:MM" string */
export function nextHour(hora) {
  const [h, m] = hora.split(':').map(Number)
  return `${String(h + 1).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}
