import marcelaImg from '../assets/marcela.jpeg'
import julianImg from '../assets/julian.jpeg'
import andreaImg from '../assets/andrea.jpeg'
import lucasImg from '../assets/lucas.jpeg'
import carolinaImg from '../assets/carolina.jpeg'
import emilioImg from '../assets/emilio.jpeg'

// Metadata descriptiva de cada profesional. La calificación (estrellas) y las
// reseñas ya NO se hardcodean: se calculan dinámicamente desde la base de datos
// (endpoints /reviews/*), cruzando por `email`.
export const profesionales = [
  {
    initials: 'MR',
    name: 'Dra. Marcela Ríos',
    email: 'marcela.rios@endereza2.com',
    image: marcelaImg,
    title: 'Kinesióloga · Directora clínica',
    tags: ['Tren superior', 'Neurológica'],
    bio: 'Licenciada en Kinesiología (UNLP) con posgrado en Neurorehabilitación. Más de 14 años acompañando pacientes con lesiones complejas de hombro, cuello y sistema nervioso. Directora del centro desde 2018.',
  },
  {
    initials: 'JP',
    name: 'Lic. Julián Pedraza',
    email: 'julian.pedraza@endereza2.com',
    image: julianImg,
    title: 'Kinesiólogo deportivo',
    tags: ['Tren inferior', 'Deportiva'],
    bio: 'Especialista en kinesiología del deporte con formación en FIFA Medical Centre of Excellence. Trabajó con equipos de fútbol y atletismo de primera división. Experto en lesiones de rodilla, tobillo y cadera.',
  },
  {
    initials: 'AS',
    name: 'Lic. Andrea Salinas',
    email: 'andrea.salinas@endereza2.com',
    image: andreaImg,
    title: 'Kinesióloga · Terapia manual',
    tags: ['Zona media', 'Osteopatía'],
    bio: 'Especialista en terapia manual ortopédica y osteopatía, certificada por la Asociación Argentina de Kinesiología. Trabaja patologías de columna lumbar, core y zona abdominal profunda con técnicas manuales avanzadas.',
  },
  {
    initials: 'LB',
    name: 'Lic. Lucas Bertoldi',
    email: 'lucas.bertoldi@endereza2.com',
    image: lucasImg,
    title: 'Kinesiólogo · Pilates clínico',
    tags: ['Zona media', 'Pilates'],
    bio: 'Certificado en Pilates clínico y rehabilitación postural por el Instituto Stott Pilates. Combina ejercicio terapéutico con control motor para tratar síndromes posturales, dolor crónico de espalda y pre/posquirúrgicos.',
  },
  {
    initials: 'CF',
    name: 'Lic. Carolina Fuentes',
    email: 'carolina.fuentes@endereza2.com',
    image: carolinaImg,
    title: 'Kinesióloga · Electroterapia',
    tags: ['Tren superior', 'Electroterapia'],
    bio: 'Especialista en agentes físicos y electroterapia. Formada en ultrasonido terapéutico, TENS, iontoforesis y láser de baja potencia. Trabaja principalmente lesiones de hombro rotador, codo y muñeca.',
  },
  {
    initials: 'EM',
    name: 'Lic. Emilio Manrique',
    email: 'emilio.manrique@endereza2.com',
    image: emilioImg,
    title: 'Kinesiólogo · Rehabilitación neurológica',
    tags: ['Tren inferior', 'Neurológica'],
    bio: 'Especializado en rehabilitación neurológica y funcional. Trabaja con pacientes con ACV, lesiones medulares y enfermedades neurodegenerativas. Certificado en técnica Bobath y reeducación de la marcha.',
  },
]
