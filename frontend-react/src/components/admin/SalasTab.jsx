import { useState, useEffect } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function SalasTab({ onToast }) {
  const [salas, setSalas] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ nombre: '', descripcion: '', cupo: '' })
  const [editing, setEditing] = useState(null) // { id, nombre, descripcion, cupo, activo }

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

  async function crear() {
    if (!form.nombre.trim() || !form.cupo) {
      onToast?.('Completá nombre y cupo.')
      return
    }
    const cupoNum = parseInt(form.cupo, 10)
    if (!cupoNum || cupoNum < 1) {
      onToast?.('El cupo debe ser al menos 1.')
      return
    }
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/salas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: form.nombre.trim(),
          descripcion: form.descripcion.trim() || null,
          cupo: cupoNum,
        }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        onToast?.(body.detail || 'Error al crear la sala.')
        return
      }
      onToast?.('Sala creada.')
      setForm({ nombre: '', descripcion: '', cupo: '' })
      await cargar()
    } finally {
      setCreating(false)
    }
  }

  async function guardarEdicion() {
    if (!editing) return
    const cupoNum = parseInt(editing.cupo, 10)
    if (!cupoNum || cupoNum < 1) {
      onToast?.('El cupo debe ser al menos 1.')
      return
    }
    const res = await fetch(`${API_URL}/api/salas/${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: editing.nombre.trim(),
        descripcion: editing.descripcion?.trim() || null,
        cupo: cupoNum,
        activo: editing.activo,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      onToast?.(body.detail || 'Error al guardar la sala.')
      return
    }
    onToast?.('Sala actualizada.')
    setEditing(null)
    await cargar()
  }

  async function desactivar(sala) {
    if (!confirm(`¿Desactivar "${sala.nombre}"?`)) return
    const res = await fetch(`${API_URL}/api/salas/${sala.id}`, { method: 'DELETE' })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      onToast?.(body.detail || 'No se pudo desactivar la sala.')
      return
    }
    onToast?.('Sala desactivada.')
    await cargar()
  }

  async function reactivar(sala) {
    const res = await fetch(`${API_URL}/api/salas/${sala.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: true }),
    })
    if (res.ok) {
      onToast?.('Sala reactivada.')
      await cargar()
    } else {
      onToast?.('No se pudo reactivar la sala.')
    }
  }

  return (
    <div className='card'>
      <div className='card-header'>
        <div>
          <h3>Gestión de salas</h3>
          <p>El cupo de cada sala define el cupo de las clases nuevas que se programen allí.</p>
        </div>
      </div>

      <section style={{ marginBottom: '1.5rem' }}>
        <h4
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          Nueva sala
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr 100px auto',
            gap: '0.5rem',
            alignItems: 'end',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Nombre</span>
            <input
              type='text'
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              placeholder='Sala A1'
              style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Descripción (opcional)</span>
            <input
              type='text'
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              placeholder='Equipamiento, observaciones, etc.'
              style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Cupo</span>
            <input
              type='number'
              min='1'
              value={form.cupo}
              onChange={(e) => setForm((f) => ({ ...f, cupo: e.target.value }))}
              style={{ padding: '0.5rem', border: '1px solid var(--border)', borderRadius: '6px' }}
            />
          </label>
          <button
            className='btn-action'
            onClick={crear}
            disabled={creating}
            style={{ padding: '0.5rem 1rem' }}
          >
            {creating ? 'Creando…' : 'Crear sala'}
          </button>
        </div>
      </section>

      <section>
        <h4
          style={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.75rem',
          }}
        >
          Salas
        </h4>
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
                <th style={{ padding: '0.5rem' }}>Estado</th>
                <th style={{ padding: '0.5rem', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {salas.map((s) =>
                editing?.id === s.id ? (
                  <tr key={s.id} style={{ background: 'var(--bg-alt)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type='text'
                        value={editing.nombre}
                        onChange={(e) => setEditing({ ...editing, nombre: e.target.value })}
                        style={{ padding: '0.3rem', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type='text'
                        value={editing.descripcion ?? ''}
                        onChange={(e) =>
                          setEditing({ ...editing, descripcion: e.target.value })
                        }
                        style={{ padding: '0.3rem', width: '100%' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <input
                        type='number'
                        min='1'
                        value={editing.cupo}
                        onChange={(e) => setEditing({ ...editing, cupo: e.target.value })}
                        style={{ padding: '0.3rem', width: '80px' }}
                      />
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <label style={{ fontSize: '0.85rem' }}>
                        <input
                          type='checkbox'
                          checked={editing.activo}
                          onChange={(e) =>
                            setEditing({ ...editing, activo: e.target.checked })
                          }
                        />{' '}
                        Activa
                      </label>
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button
                        className='btn-action'
                        onClick={guardarEdicion}
                        style={{ marginRight: '0.4rem', padding: '0.3rem 0.7rem' }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditing(null)}
                        style={{
                          padding: '0.3rem 0.7rem',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--white)',
                          cursor: 'pointer',
                        }}
                      >
                        Cancelar
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr
                    key={s.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: s.activo ? 1 : 0.55,
                    }}
                  >
                    <td style={{ padding: '0.5rem', fontWeight: 600 }}>{s.nombre}</td>
                    <td style={{ padding: '0.5rem', color: 'var(--text-muted)' }}>
                      {s.descripcion || '—'}
                    </td>
                    <td style={{ padding: '0.5rem' }}>{s.cupo}</td>
                    <td style={{ padding: '0.5rem' }}>{s.activo ? 'Activa' : 'Inactiva'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button
                        onClick={() =>
                          setEditing({
                            id: s.id,
                            nombre: s.nombre,
                            descripcion: s.descripcion ?? '',
                            cupo: s.cupo,
                            activo: s.activo,
                          })
                        }
                        style={{
                          padding: '0.3rem 0.7rem',
                          marginRight: '0.4rem',
                          border: '1px solid var(--border)',
                          borderRadius: '6px',
                          background: 'var(--white)',
                          cursor: 'pointer',
                        }}
                      >
                        Editar
                      </button>
                      {s.activo ? (
                        <button
                          onClick={() => desactivar(s)}
                          style={{
                            padding: '0.3rem 0.7rem',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            background: 'var(--white)',
                            color: '#c0392b',
                            cursor: 'pointer',
                          }}
                        >
                          Desactivar
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivar(s)}
                          style={{
                            padding: '0.3rem 0.7rem',
                            border: '1px solid var(--border)',
                            borderRadius: '6px',
                            background: 'var(--white)',
                            cursor: 'pointer',
                          }}
                        >
                          Reactivar
                        </button>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}
