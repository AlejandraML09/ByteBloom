export const HORARIOS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
export const PRICE_PER_SHIFT = 20000

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
        {/* shoulder span */}
        <path d="M5 9 C5 7 8 6 12 6 C16 6 19 7 19 9"/>
        {/* left arm */}
        <path d="M5 9 L4 15"/>
        {/* right arm */}
        <path d="M19 9 L20 15"/>
        {/* torso sides */}
        <path d="M9 9 L9 21"/>
        <path d="M15 9 L15 21"/>
        {/* torso bottom */}
        <path d="M9 21 L15 21"/>
        {/* collar/chest */}
        <path d="M9 9 C10 8 14 8 15 9"/>
        {/* neck */}
        <path d="M11 3 L11 6"/>
        <path d="M13 3 L13 6"/>
      </>
    ),
  },
  {
    id: 'medio',
    name: 'Zona media',
    sub: 'Core, lumbar y zona abdominal',
    icon: (
      <>
        {/* upper torso sides */}
        <path d="M8 3 C6 4 6 8 8 10"/>
        <path d="M16 3 C18 4 18 8 16 10"/>
        {/* top */}
        <path d="M8 3 C10 2 14 2 16 3"/>
        {/* waist */}
        <path d="M8 10 C10 11 14 11 16 10"/>
        {/* hip curves */}
        <path d="M8 10 C6 12 6 16 8 18"/>
        <path d="M16 10 C18 12 18 16 16 18"/>
        {/* bottom hip */}
        <path d="M8 18 C10 20 14 20 16 18"/>
      </>
    ),
  },
  {
    id: 'inferior',
    name: 'Tren inferior',
    sub: 'Caderas, rodillas, tobillos y pies',
    icon: (
      <>
        {/* hip */}
        <path d="M8 3 C8 5 10 6 12 6 C14 6 16 5 16 3"/>
        <path d="M8 3 L16 3"/>
        {/* left thigh */}
        <path d="M10 6 L9 13"/>
        {/* left knee + calf */}
        <path d="M9 13 C8 14 8 16 9 17 L8 22"/>
        {/* right thigh */}
        <path d="M14 6 L15 13"/>
        {/* right knee + calf */}
        <path d="M15 13 C16 14 16 16 15 17 L16 22"/>
      </>
    ),
  },
]

export const OBRAS_SOCIALES = ['OSDE', 'Swiss Medical', 'IOMA', 'PAMI', 'Galeno', 'Particular']
