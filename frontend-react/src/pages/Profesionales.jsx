import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import '../css/profesionales.css'

const PROFESIONALES = [
  {
    initials: 'MR',
    name: 'Dra. Marcela Ríos',
    title: 'Kinesióloga · Directora clínica',
    tags: ['Tren superior', 'Neurológica'],
    bio: 'Licenciada en Kinesiología (UNLP) con posgrado en Neurorehabilitación. Más de 14 años acompañando pacientes con lesiones complejas de hombro, cuello y sistema nervioso. Directora del centro desde 2018.',
    stars: '★★★★★',
    reviews: [
      { text: '"Marcela es increíble. Después de mi operación de hombro pensé que no iba a recuperar el movimiento completo. En 3 meses me devolvió la vida."', author: '— Rodrigo M., 42 años' },
      { text: '"Muy profesional, explica todo con paciencia y claridad. Se nota que ama lo que hace."', author: '— Claudia F., 55 años' },
    ],
  },
  {
    initials: 'JP',
    name: 'Lic. Julián Pedraza',
    title: 'Kinesiólogo deportivo',
    tags: ['Tren inferior', 'Deportiva'],
    bio: 'Especialista en kinesiología del deporte con formación en FIFA Medical Centre of Excellence. Trabajó con equipos de fútbol y atletismo de primera división. Experto en lesiones de rodilla, tobillo y cadera.',
    stars: '★★★★★',
    reviews: [
      { text: '"Me rompí los ligamentos y en 5 meses volví a correr. Julián es un crack, sabe exactamente qué hacer en cada etapa."', author: '— Tomás G., 28 años' },
      { text: '"Muy detallista, siempre está al tanto de las últimas técnicas. Mejoré muchísimo."', author: '— Sofía L., 31 años' },
    ],
  },
  {
    initials: 'AS',
    name: 'Lic. Andrea Salinas',
    title: 'Kinesióloga · Terapia manual',
    tags: ['Tren medio', 'Osteopatía'],
    bio: 'Especialista en terapia manual ortopédica y osteopatía, certificada por la Asociación Argentina de Kinesiología. Trabaja patologías de columna lumbar, core y zona abdominal profunda con técnicas manuales avanzadas.',
    stars: '★★★★★',
    reviews: [
      { text: '"Tenía una hernia de disco que me limitaba completamente. Andrea me enseñó a moverme diferente y el dolor desapareció."', author: '— Néstor V., 48 años' },
      { text: '"Manos de oro, literalmente. Salgo de cada sesión como nueva persona."', author: '— Daniela K., 37 años' },
    ],
  },
  {
    initials: 'LB',
    name: 'Lic. Lucas Bertoldi',
    title: 'Kinesiólogo · Pilates clínico',
    tags: ['Tren medio', 'Pilates'],
    bio: 'Certificado en Pilates clínico y rehabilitación postural por el Instituto Stott Pilates. Combina ejercicio terapéutico con control motor para tratar síndromes posturales, dolor crónico de espalda y pre/posquirúrgicos.',
    stars: '★★★★☆',
    reviews: [
      { text: '"Lucas me ayudó a entender mi cuerpo. Nunca había prestado atención a mi postura y ahora tengo cero dolores."', author: '— Valeria O., 44 años' },
      { text: '"Las sesiones de Pilates son muy completas y bien explicadas. Muy recomendable."', author: '— Marcos H., 52 años' },
    ],
  },
  {
    initials: 'CF',
    name: 'Lic. Carolina Fuentes',
    title: 'Kinesióloga · Electroterapia',
    tags: ['Tren superior', 'Electroterapia'],
    bio: 'Especialista en agentes físicos y electroterapia. Formada en ultrasonido terapéutico, TENS, iontoforesis y láser de baja potencia. Trabaja principalmente lesiones de hombro rotador, codo y muñeca.',
    stars: '★★★★★',
    reviews: [
      { text: '"Tenía epicondilitis desde hace años. Carolina es la primera profesional que realmente me alivió el dolor con el láser."', author: '— Alberto R., 60 años' },
      { text: '"Puntual, amable y muy eficiente. El tratamiento con ultrasonido fue clave en mi recuperación."', author: '— Patricia N., 39 años' },
    ],
  },
  {
    initials: 'EM',
    name: 'Lic. Emilio Manrique',
    title: 'Kinesiólogo · Rehabilitación neurológica',
    tags: ['Tren inferior', 'Neurológica'],
    bio: 'Especializado en rehabilitación neurológica y funcional. Trabaja con pacientes con ACV, lesiones medulares y enfermedades neurodegenerativas. Certificado en técnica Bobath y reeducación de la marcha.',
    stars: '★★★★★',
    reviews: [
      { text: '"Mi papá tuvo un ACV y gracias a Emilio recuperó la movilidad del lado derecho. Es un profesional extraordinario."', author: '— Florencia T., 45 años' },
      { text: '"Paciencia infinita y un método muy sólido. Lo recomiendo con los ojos cerrados."', author: '— Ernesto C., 67 años' },
    ],
  },
]

export default function Profesionales() {
  return (
    <>
      <Navbar />

      <div className="page-hero">
        <div className="page-hero-badge">Nuestro equipo</div>
        <h1>Profesionales <span>especializados</span><br />a tu servicio</h1>
        <p>Cada kinesiólogo de nuestro equipo cuenta con formación universitaria, especialización clínica y años de experiencia acompañando la recuperación de nuestros pacientes.</p>
      </div>

      <div className="stats-strip">
        {[
          { num: '6', lbl: 'Profesionales' },
          { num: '12+', lbl: 'Años de trayectoria' },
          { num: '3', lbl: 'Especialidades' },
          { num: '98%', lbl: 'Satisfacción de pacientes' },
        ].map(({ num, lbl }) => (
          <div className="stat-item" key={lbl}>
            <span className="stat-num">{num}</span>
            <span className="stat-lbl">{lbl}</span>
          </div>
        ))}
      </div>

      <div className="section-wrap">
        <div className="section-label">Conocé al equipo</div>
        <h2 className="section-title">Quiénes nos cuidan</h2>

        <div className="prof-grid">
          {PROFESIONALES.map((p) => (
            <div className="prof-card" key={p.initials}>
              <div className="prof-photo-placeholder">
                <div className="prof-initials">{p.initials}</div>
              </div>
              <div className="prof-body">
                <div className="prof-name">{p.name}</div>
                <div className="prof-title">{p.title}</div>
                <div className="prof-tags">
                  {p.tags.map(t => <span className="prof-tag" key={t}>{t}</span>)}
                </div>
                <p className="prof-bio">{p.bio}</p>
                <div className="reviews-title">
                  <span className="stars">{p.stars}</span> Reseñas de pacientes
                </div>
                {p.reviews.map((r, i) => (
                  <div className="review-item" key={i}>
                    <div className="review-text">{r.text}</div>
                    <div className="review-author">{r.author}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="cta-section">
        <h2>¿Querés conocer a nuestro equipo en persona?</h2>
        <p>Reservá tu primera consulta sin cargo y encontrá al profesional ideal para tu recuperación</p>
        <Link to="/turnos" className="btn-cta">Reservar turno →</Link>
      </div>

      <Footer />
    </>
  )
}
