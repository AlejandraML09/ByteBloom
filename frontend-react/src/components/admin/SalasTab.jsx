import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function SalasTab({ onToast }) {
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)

 const [cuposInput, setCuposInput] = useState({}) // { id, nombre, descripcion, cupo, activo }

  async function cargar() {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/salas?incluir_inactivas=true`)
      if (res.ok) {
        const data = await res.json()
        setSalas(data)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  
  async function guardarCupo(s) {
  const cupoNum = parseInt(cuposInput[s.id], 10)
  const res = await fetch(`${API_URL}/api/salas/${s.id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: s.nombre,
      descripcion: s.descripcion || null,
      cupo: cupoNum,
      activo: s.activo,
    }),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    onToast?.(body.detail || 'Error al guardar la sala.')
    return
  }
  onToast?.('Sala actualizada.')
  await cargar()
}


  return (
    <div className='card'>
    <div className='card-header'>
  <div>
    <h3>Salas</h3>
  </div>
</div>
    

      <section>
       
        {loading ? (
          <p>Cargando…</p>
        ) : salas.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No hay salas registradas.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '0.5rem' }}>Nombre</th>
                <th style={{ padding: '0.5rem' }}>Descripción</th>
                <th style={{ padding: '0.5rem' }}>Cupo</th>
          
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((s) => {
  const val = cuposInput[s.id] ?? s.cupo
  const valNum = parseInt(val, 10)
  const valido = valNum >= 1 && val !== ''
  const cambiado = valNum !== s.cupo
  return (
    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)', opacity: s.activo ? 1 : 0.55 }}>
      <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.nombre}</td>
      <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>{s.descripcion || '—'}</td>
      <td style={{ padding: '0.5rem' }}>
        <input
          type='number'
          min='1'
          value={val}
          onChange={(e) => setCuposInput({ ...cuposInput, [s.id]: e.target.value })}
          style={{ padding: '0.3rem', width: '80px' }}
        />
      </td>
   
      <td style={{ padding: '0.5rem', textAlign: 'right' }}>
        <button
          onClick={() => guardarCupo(s)}
          disabled={!valido || !cambiado}
          style={{
            padding: '0.3rem 0.7rem',
            border: '1px solid var(--border)',
            borderRadius: '6px',
            background: 'var(--white)',
            cursor: !valido || !cambiado ? 'not-allowed' : 'pointer',
            opacity: !valido || !cambiado ? 0.4 : 1,
          }}
        >
          Editar
        </button>
      </td>
    </tr>
  )
})}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

