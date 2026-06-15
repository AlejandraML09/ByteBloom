import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import Servicios from './pages/Servicios'
import Profesionales from './pages/Profesionales'
import Turnos from './pages/Turnos'
import Contacto from './pages/Contacto'
import Login from './pages/Login'
import Admin from './pages/Admin'
import Registro from './pages/Registro'
import RecuperarContrasena from './pages/RecuperarContrasena'
import MisReservas from './pages/MisReservas'
import ScrollToTop from './components/ScrollToTop'
import RestablecerContrasena from './pages/RestablecerContrasena'
import MisDatos from './pages/MisDatos'
import QuieroSerAbonado from './pages/QuieroSerAbonado'
import MisCreditos from './pages/MisCreditos'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path='/servicios' element={<Servicios />} />
        <Route path='/profesionales' element={<Profesionales />} />
        <Route path='/turnos' element={<Turnos />} />
        <Route path='/contacto' element={<Contacto />} />
        <Route path='/login' element={<Login />} />
        <Route path='/admin' element={<Admin />} />
        <Route path='/registro' element={<Registro />} />
        <Route path='/recuperar-contrasena' element={<RecuperarContrasena />} />
        <Route path='/mis-reservas' element={<MisReservas />} />
        <Route path='/restablecer-password' element={<RestablecerContrasena />} />
        <Route path='/mis-datos' element={<MisDatos />} />
        <Route path='/quiero-ser-abonado' element={<QuieroSerAbonado />} />
        <Route path='/mis-creditos' element={<MisCreditos />} />
        {/* route removed: InscribirseNotificacion is unused; email links point to /turnos with query params */}
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  )
}
