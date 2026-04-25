const stats = [
  { num: '6',   lbl: 'Profesionales' },
  { num: '12+', lbl: 'Años de trayectoria' },
  { num: '3',   lbl: 'Especialidades' },
  { num: '98%', lbl: 'Satisfacción de pacientes' },
]

export function StatsStrip() {
  return (
    <div className="stats-strip">
      {stats.map(({ num, lbl }) => (
        <div className="stat-item" key={lbl}>
          <span className="stat-num">{num}</span>
          <span className="stat-lbl">{lbl}</span>
        </div>
      ))}
    </div>
  )
}
