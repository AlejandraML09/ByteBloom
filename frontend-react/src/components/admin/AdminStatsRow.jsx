export function AdminStatsRow({ statTurnos, presentes, totalLibres }) {
  return (
    <div className="stats-row">
      <div className="stat-card">
        <div className="stat-label">Turnos hoy</div>
        <div className="stat-val">{statTurnos}</div>
        <div className="stat-sub">de lunes a viernes</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Presentes hoy</div>
        <div className="stat-val">{presentes}</div>
        <div className="stat-sub">confirmados</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Cupos libres</div>
        <div className="stat-val">{totalLibres}</div>
        <div className="stat-sub">en todos los horarios</div>
      </div>
      <div className="stat-card">
        <div className="stat-label">Pacientes activos</div>
        <div className="stat-val">8</div>
        <div className="stat-sub">en el sistema</div>
      </div>
    </div>
  )
}
