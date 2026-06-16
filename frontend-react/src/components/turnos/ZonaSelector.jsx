import { zonasInfoMap } from '../../constants/turnos'
import { useEffect, useState } from 'react'

const fmt = (n) => `$${n.toLocaleString('es-AR')}`
const API_URL = import.meta.env.VITE_API_URL 

export function ZonaSelector({ selected, onSelect }) {
  const [zonas, setZonas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchZonas() {
      const res = await fetch(`${API_URL}/api/zonas`)
      if (res.ok) {
        const data = await res.json()
        setZonas(data)
      }
      setLoading(false)
    }
    fetchZonas()
  }, [])

  return (
    <div className='card'>
      <div className='card-title'>
        <span className='step-number'>1</span> ¿Qué zona querés trabajar?
      </div>
      {loading ? (
        <p>Cargando zonas…</p>
      ) : (
        <div className='zona-grid'>
          {zonas.map((zona) => (
            <button
              key={zona.id}
              className={`zona-btn${selected?.id === zona.id ? ' selected' : ''}`}
              onClick={() => onSelect(zona)}
            >
              <div className='zona-icon'>
                <div className='zona-icon-bg'>{zonasInfoMap[zona.nombre]?.icon}</div>
              </div>
              <div>
                <div className='zona-name'>{zonasInfoMap[zona.nombre]?.name ?? zona.nombre}</div>
                <div className='zona-sub'>{zona.descripcion}</div>
                <div className='zona-price'>{fmt(zona.precio)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
