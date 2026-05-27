import iconsuperior from '../assets/back.png'
import iconmedia from '../assets/abdominal.png'
import iconinferior from '../assets/running.png'

export const HORARIOS = [
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
]

export const ZONA_LABELS = {
  superior: 'Tren superior',
  medio: 'Zona media',
  inferior: 'Tren inferior',
}

const iconStyle = {
  width: '36px',
  height: '36px',
  objectFit: 'contain',
}

export const zonasInfoMap = {
  superior: {
    name: 'Tren superior',
    sub: 'Hombros, brazos, cuello y espalda alta',
    icon: <img src={iconsuperior} alt='Tren superior' style={iconStyle} />,
  },
  medio: {
    name: 'Zona media',
    sub: 'Core, lumbar y zona abdominal',
    icon: <img src={iconmedia} alt='Zona media' style={iconStyle} />,
  },
  inferior: {
    name: 'Tren inferior',
    sub: 'Caderas, rodillas, tobillos y pies',
    icon: <img src={iconinferior} alt='Tren inferior' style={iconStyle} />,
  },
}

export const OBRAS_SOCIALES = ['OSDE', 'Swiss Medical', 'IOMA', 'PAMI', 'Galeno', 'Particular']
