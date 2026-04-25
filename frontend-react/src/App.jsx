import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Servicios from './pages/Servicios'
import Profesionales from './pages/Profesionales'
import Turnos from './pages/Turnos'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import Admin from './pages/Admin'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/servicios" element={<Servicios />} />
        <Route path="/profesionales" element={<Profesionales />} />
        <Route path="/turnos" element={<Turnos />} />
        <Route path="/contacto" element={<Contacto />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
