import { zonasInfoMap } from '../../constants/turnos'
import iconsuperior from '../../assets/back.png'
import { useEffect, useState } from 'react'

const fmt = (n) => `$${n.toLocaleString('es-AR')}`
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const iconStyle = {
  width: '36px',
  height: '36px',
  objectFit: 'contain',
}
export function ZonaSelector({ selected, onSelect }) {
  const [zonasInfo, setZonasInfo] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    // fetch zonas info from backend
    async function fetchZonas() {
      const res = await fetch(`${API_URL}/api/zonas`)
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) setZonasInfo(data)
        setLoading(false)
      }
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
          {zonasInfo.map(({ id, nombre, descripcion, precio }) => (
            <button
              key={id}
              className={`zona-btn${selected === id ? ' selected' : ''}`}
              onClick={() => onSelect(id)}
            >
              <div className='zona-icon'>
                <div className='zona-icon-bg'>
                  {' '}
                  {zonasInfoMap[nombre].icon}
                </div>
              </div>
              <div>
                <div className='zona-name'>{zonasInfoMap[nombre].name}</div>
                <div className='zona-sub'>{descripcion}</div>
                <div className='zona-price'>{fmt(precio)}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
