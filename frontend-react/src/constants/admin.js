export { HORARIOS } from './turnos'

export const PACIENTES = [
  { id: 1, nombre: 'María González',  email: 'paciente@endereza2.com', tel: '221-4561234', os: 'IOMA',          zona: 'superior', asistencias: 12 },
  { id: 2, nombre: 'Carlos Pérez',    email: 'cperez@mail.com',      tel: '221-7893456', os: 'OSDE',          zona: 'inferior', asistencias: 8  },
  { id: 3, nombre: 'Ana Rodríguez',   email: 'ana.r@mail.com',       tel: '221-5554321', os: 'Swiss Medical', zona: 'medio',    asistencias: 15 },
  { id: 4, nombre: 'Luis Martínez',   email: 'luism@mail.com',       tel: '221-3217654', os: 'PAMI',          zona: 'inferior', asistencias: 5  },
  { id: 5, nombre: 'Sofía Torres',    email: 'sofiat@mail.com',      tel: '221-6549870', os: 'Galeno',        zona: 'superior', asistencias: 20 },
  { id: 6, nombre: 'Diego Fernández', email: 'diegof@mail.com',      tel: '221-1236540', os: 'Particular',    zona: 'medio',    asistencias: 3  },
  { id: 7, nombre: 'Laura Sánchez',   email: 'lauras@mail.com',      tel: '221-9874561', os: 'IOMA',          zona: 'superior', asistencias: 9  },
  { id: 8, nombre: 'Roberto Díaz',    email: 'rdíaz@mail.com',       tel: '221-7412580', os: 'OSDE',          zona: 'inferior', asistencias: 11 },
]

export const DIST = [
  { pac: 0, hora: '09:00', zona: 'superior', estado: 'confirmado' },
  { pac: 4, hora: '09:00', zona: 'superior', estado: 'confirmado' },
  { pac: 1, hora: '10:00', zona: 'inferior', estado: 'confirmado' },
  { pac: 2, hora: '10:00', zona: 'medio',    estado: 'confirmado' },
  { pac: 6, hora: '11:00', zona: 'superior', estado: 'pendiente'  },
  { pac: 3, hora: '12:00', zona: 'inferior', estado: 'confirmado' },
  { pac: 5, hora: '13:00', zona: 'medio',    estado: 'cancelado'  },
  { pac: 7, hora: '14:00', zona: 'inferior', estado: 'confirmado' },
  { pac: 2, hora: '15:00', zona: 'medio',    estado: 'pendiente'  },
]

export const ZONAS = {
  superior: 'Tren superior',
  medio: 'Zona media',
  inferior: 'Tren inferior',
}
