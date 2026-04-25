import { initials } from '../../utils/strings'
import { ZONAS } from '../../constants/admin'

export function PacientesTab({ pacientes }) {
  return (
    <div className="card">
      <div className="card-header">
        <div><h3>Datos de pacientes</h3><p>Historial completo del sistema</p></div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Paciente</th><th>Email</th><th>Teléfono</th><th>Obra social</th><th>Zona habitual</th><th>Asistencias</th>
            </tr>
          </thead>
          <tbody>
            {pacientes.map(p => (
              <tr key={p.id}>
                <td>
                  <div className="patient-name">
                    <div className="patient-avatar">{initials(p.nombre)}</div>
                    <span>{p.nombre}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--p-dark)' }}>{p.email}</td>
                <td>{p.tel}</td>
                <td>{p.os}</td>
                <td><span className="badge badge-purple">{ZONAS[p.zona]}</span></td>
                <td><span className="badge badge-green">{p.asistencias} sesiones</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
