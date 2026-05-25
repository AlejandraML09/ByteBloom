import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'  // ✅ CAMBIAR de { Footer } a Footer
import '../css/miscreditos.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export default function MisCreditos() {
  const navigate = useNavigate()
  const [creditos, setCreditos] = useState(3) // ✅ HARDCODED POR AHORA
  const [loading, setLoading] = useState(true)

  const storedUser = localStorage.getItem('usuario') || localStorage.getItem('ks_user')
  const user = storedUser ? JSON.parse(storedUser) : null

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    // ✅ AQUÍ PUEDES AGREGAR LA LÓGICA REAL DESPUÉS
    const cargarCreditos = async () => {
      try {
        // const res = await fetch(`${API_URL}/api/usuarios/${user.id}/creditos`)
        // const data = await res.json()
        // setCreditos(data.creditos_disponibles)
        
        // Por ahora solo usamos el valor hardcodeado
        const creditosGuardados =
          Number(localStorage.getItem(`creditos_${user.id}`)) || 0

        setCreditos(creditosGuardados)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    cargarCreditos()
  }, [user, navigate])

  return (
    <>
      <Navbar />
      <div className='misc-container'>
        <div className='misc-header'>
          <button className='misc-back' onClick={() => navigate(-1)}>
            ← Volver
          </button>
          <h1 style={{ color: 'var(--primary-dark)' }}>Mis Créditos</h1>
        </div>

        <div className='misc-content'>
          <div className='creditos-card'>
            <div className='creditos-icon'>💳</div>
            <h2 style={{ color: 'var(--primary-dark)' }}>Créditos Disponibles</h2>
            
            <div className='creditos-amount'>
              <span className='creditos-number' style={{ color: 'var(--primary-dark)' }}>{creditos}</span>
              <span className='creditos-label' style={{ color: 'var(--primary-dark)' }}>créditos</span>
            </div>

            <p className='creditos-description'>
              Podés utilizar tus créditos para reservar clases en Endereza2.
              Cada clase consume 1 crédito.
            </p>

            <div className='creditos-info'>
              <h3 style={{ color: 'var(--primary-dark)' }}>¿Cómo funcionan los créditos?</h3>
              <ul>
                <li>1 crédito = 1 clase a favor</li>
                <li>Los créditos no vencen</li>
                <li>Cada reserva se confirma automáticamente</li>
              </ul>
            </div>

            {/* <button 
              className='creditos-btn-comprar'
              onClick={() => navigate('/turnos')}
            >
              Usar mis creditos
            </button> */}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}