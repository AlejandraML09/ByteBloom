export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']

export const ZONA_LABELS = {
  superior: 'Tren superior',
  medio: 'Zona media',
  inferior: 'Tren inferior',
}

export const zonasInfo = [
  {
    id: 'superior',
    name: 'Tren superior',
    sub: 'Hombros, brazos, cuello y espalda alta',
    icon: (
      <>
        <circle cx="12" cy="5" r="2"/>
        <path d="M12 7v5"/>
        <path d="M7 10c1.5-.5 3-1 5-1s3.5.5 5 1"/>
        <path d="M7 10l-2 5"/>
        <path d="M17 10l2 5"/>
      </>
    ),
  },
  {
    id: 'medio',
    name: 'Zona media',
    sub: 'Core, lumbar y zona abdominal',
    icon: (
      <>
        <path d="M7 10h10"/>
        <path d="M7 14h10"/>
        <path d="M9 7v10"/>
        <path d="M15 7v10"/>
      </>
    ),
  },
  {
    id: 'inferior',
    name: 'Tren inferior',
    sub: 'Caderas, rodillas, tobillos y pies',
    icon: (
      <>
        <path d="M12 4v8"/>
        <path d="M9 12l-3 8"/>
        <path d="M15 12l3 8"/>
        <path d="M8 16h8"/>
      </>
    ),
  },
]

export const OBRAS_SOCIALES = ['OSDE', 'Swiss Medical', 'IOMA', 'PAMI', 'Galeno', 'Particular']
