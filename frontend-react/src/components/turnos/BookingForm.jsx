import { OBRAS_SOCIALES } from '../../constants/turnos'

export function BookingForm({ values, onChange }) {
  const { nombre, apellido, tel, email, os } = values

  return (
    <div className="card">
      <div className="card-title">Tus datos</div>
      <div className="form-row">
        <div className="form-group">
          <label>Nombre</label>
          <input type="text" placeholder="Ej: María" value={nombre} onChange={e => onChange('nombre', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Apellido</label>
          <input type="text" placeholder="Ej: González" value={apellido} onChange={e => onChange('apellido', e.target.value)} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>Teléfono</label>
          <input type="tel" placeholder="Ej: 221-4567890" value={tel} onChange={e => onChange('tel', e.target.value)} />
        </div>
        <div className="form-group">
          <label>Obra social</label>
          <select value={os} onChange={e => onChange('os', e.target.value)}>
            <option value="">— Seleccioná —</option>
            {OBRAS_SOCIALES.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </div>
      <div className="form-row full">
        <div className="form-group">
          <label>Email</label>
          <input type="email" placeholder="Ej: maria@email.com" value={email} onChange={e => onChange('email', e.target.value)} />
        </div>
      </div>
    </div>
  )
}
