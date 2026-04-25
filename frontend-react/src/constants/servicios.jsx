export const ZONES = ['superior', 'medio', 'inferior']

export const zonesData = [
  {
    id: 'superior',
    zoneNum: 'Zona 01',
    title: 'Tren superior',
    desc: 'El tren superior comprende todas las estructuras desde la cabeza hasta la cintura. Su rehabilitación requiere un abordaje preciso que combine movilidad, fuerza y control neuromuscular para restaurar la función en actividades cotidianas y deportivas.',
    icon: (
      <>
        <circle cx="12" cy="5" r="2.2"/>
        <path d="M12 7.5v5.5"/>
        <path d="M6.5 10.5c1.8-.7 3.5-1.2 5.5-1.2s3.7.5 5.5 1.2"/>
        <path d="M6.5 10.5L4.5 17"/>
        <path d="M17.5 10.5L19.5 17"/>
      </>
    ),
    structures: [
      'Hombro: manguito rotador, articulación glenohumeral y acromioclavicular',
      'Codo: epicóndilo, epitróclea y tendón del bíceps',
      'Muñeca y mano: túnel carpiano, tendones flexores y extensores',
      'Cuello: columna cervical, discos intervertebrales C1–C7',
      'Articulación temporomandibular (ATM)',
      'Nervio radial, cubital y mediano',
    ],
    goals: [
      'Recuperar el rango de movimiento articular completo',
      'Reducir dolor e inflamación en fase aguda',
      'Fortalecer músculos estabilizadores de la escápula',
      'Reeducar el patrón motor y la coordinación fina',
      'Prevenir recidivas mediante ejercicio terapéutico progresivo',
      'Reintegración deportiva o laboral gradual y segura',
    ],
    technologies: [
      { name: 'Electroterapia (TENS / EMS)', desc: 'Corrientes eléctricas para analgesia, reducción del espasmo muscular y estimulación neuromuscular en fase aguda y subaguda.', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/> },
      { name: 'Ultrasonido terapéutico', desc: 'Ondas de ultrasonido para tratar tendinopatías, bursitis y cicatrices. Efecto térmico y mecánico para regeneración tisular profunda.', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></> },
      { name: 'Láser de baja potencia', desc: 'Fotobiomodulación para acelerar la cicatrización, reducir la inflamación y aliviar el dolor en estructuras superficiales y profundas.', icon: <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/> },
      { name: 'Terapia manual ortopédica', desc: 'Movilizaciones articulares, manipulaciones cervicales, masoterapia y técnicas miofasciales aplicadas por profesionales certificados.', icon: <><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M7 8V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/><path d="M12 12v.01"/></> },
      { name: 'Punción seca', desc: 'Técnica invasiva con aguja fina para tratar puntos gatillo miofasciales en musculatura cervical, del manguito rotador y antebrazo.', icon: <><path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></> },
      { name: 'Kinesiotaping', desc: 'Vendaje neuromuscular elástico para soporte articular, drenaje linfático y facilitación/inhibición muscular sin restringir el movimiento.', icon: <><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/></> },
    ],
    pathologies: [
      'Síndrome de manguito rotador', 'Epicondilitis lateral', 'Síndrome del túnel carpiano', 'Cervicalgia',
      'Luxación de hombro', 'Tendinitis bicipital', 'Contracturas cervicales',
      'Fractura de clavícula (posquirúrgico)', 'Bursitis subacromial', 'Dedo en gatillo',
    ],
  },
  {
    id: 'medio',
    zoneNum: 'Zona 02',
    title: 'Tren medio',
    desc: 'El tren medio o "core" es el centro biomecánico del cuerpo. Incluye la columna lumbar, la pelvis, el diafragma y toda la musculatura profunda que sostiene la postura y transfiere fuerzas entre la parte superior e inferior del cuerpo.',
    icon: (
      <>
        <path d="M6 10h12M6 14h12"/><path d="M9 6v12M15 6v12"/>
      </>
    ),
    structures: [
      'Columna lumbar: vértebras L1–L5 y discos intervertebrales',
      'Sacro, articulación sacroilíaca y cóccix',
      'Musculatura profunda: transverso, multífidos y cuadrado lumbar',
      'Diafragma y musculatura respiratoria',
      'Pelvis y suelo pélvico',
      'Nervio ciático y raíces lumbares',
    ],
    goals: [
      'Reducir el dolor lumbar agudo y crónico',
      'Activar y fortalecer la musculatura estabilizadora profunda',
      'Corregir alteraciones posturales y de la mecánica lumbar',
      'Liberar compresiones nerviosas y síntomas radiculares',
      'Educar en higiene postural y ergonomía en el trabajo',
      'Prevenir recaídas con programas de ejercicio activo',
    ],
    technologies: [
      { name: 'Pilates clínico', desc: 'Ejercicio terapéutico basado en el método Pilates para activar la musculatura profunda del core, mejorar la postura y prevenir recidivas.' },
      { name: 'Osteopatía y terapia manual', desc: 'Técnicas osteopáticas de movilización de la columna lumbar, pelvis y sacroilíacas. Tratamiento global que busca restaurar el movimiento articular.' },
      { name: 'Magnetoterapia', desc: 'Campos electromagnéticos pulsados para reducir la inflamación discal, estimular la regeneración ósea y aliviar el dolor en patologías crónicas de columna.' },
      { name: 'Tracción lumbar mecánica', desc: 'Descompresión vertebral mediante tracción controlada, indicada en hernias discales, estenosis de canal y radiculopatías lumbares.' },
      { name: 'Biofeedback', desc: 'Retroalimentación visual o auditiva para reeducar la activación de la musculatura del suelo pélvico y los estabilizadores lumbares profundos.' },
      { name: 'Diatermia (Tecarterapia)', desc: 'Radiofrecuencia de alta potencia para calentar tejidos profundos, acelerar la regeneración en lumbalgias crónicas y contracturas musculares.' },
    ],
    pathologies: [
      'Hernia de disco lumbar', 'Lumbalgia aguda y crónica', 'Ciática', 'Estenosis de canal lumbar',
      'Síndrome sacroilíaco', 'Escoliosis', 'Síndrome de dolor miofascial',
      'Disfunción de suelo pélvico', 'Espondilolisis', 'Fibromialgia',
    ],
  },
  {
    id: 'inferior',
    zoneNum: 'Zona 03',
    title: 'Tren inferior',
    desc: 'El tren inferior soporta todo el peso corporal y absorbe los impactos de la marcha y el deporte. Su rehabilitación es fundamental para restaurar la funcionalidad en actividades básicas como caminar, subir escaleras y practicar deporte de manera segura.',
    icon: (
      <>
        <path d="M12 3v9"/><path d="M8.5 12l-4 9"/><path d="M15.5 12l4 9"/><path d="M7 17h10"/>
      </>
    ),
    structures: [
      'Cadera: articulación coxofemoral, labrum y bursas',
      'Rodilla: ligamentos cruzados, meniscos y tendón rotuliano',
      'Tobillo: ligamentos laterales, tendón de Aquiles y sindesmosis',
      'Pie: fascitis plantar, metatarsos y articulación de Lisfranc',
      'Musculatura: cuádriceps, isquiotibiales, glúteos y tríceps sural',
      'Nervio ciático, femorocutáneo y tibial posterior',
    ],
    goals: [
      'Restaurar la estabilidad articular y el control propioceptivo',
      'Fortalecer progresivamente la musculatura periarticular',
      'Recuperar la marcha normal y el patrón de carrera',
      'Rehabilitación posquirúrgica de ligamentos y meniscos',
      'Control del dolor e inflamación en fase aguda',
      'Retorno al deporte con criterios funcionales objetivos',
    ],
    technologies: [
      { name: 'Ondas de choque extracorpóreas', desc: 'Presión acústica de alta energía para tratar tendinopatías crónicas como fascitis plantar, tendinitis aquilea y calcificaciones de cadera.' },
      { name: 'Plataforma de propiocepción', desc: 'Entrenamiento del equilibrio y control neuromuscular mediante plataformas inestables. Fundamental en la recuperación postesguince y posoperatoria de rodilla.' },
      { name: 'Electroestimulación funcional (FES)', desc: 'Estimulación eléctrica funcional para fortalecer cuádriceps e isquiotibiales, especialmente en posquirúrgicos de ligamento cruzado anterior.' },
      { name: 'Crioterapia y termoterapia', desc: 'Aplicación controlada de frío y calor para manejo del dolor, reducción del edema posoperatorio y preparación de tejidos para el ejercicio.' },
      { name: 'Laser de alta potencia (HILT)', desc: 'Láser de alta intensidad para penetrar tejidos profundos como cartílago y menisco. Reduce la inflamación y estimula la reparación celular en articulaciones.' },
      { name: 'Análisis de la marcha', desc: 'Evaluación biomecánica visual y funcional del patrón de marcha y carrera. Permite detectar compensaciones y prescribir ejercicios específicos de corrección.' },
    ],
    pathologies: [
      'Rotura de ligamento cruzado anterior', 'Lesión de menisco', 'Esguince de tobillo', 'Fascitis plantar',
      'Tendinitis rotuliana', 'Tendinitis aquílea', 'Síndrome femoropatelar',
      'Fractura de tibia (posquirúrgico)', 'Artrosis de cadera y rodilla', 'Síndrome de la cintilla iliotibial',
    ],
  },
]
