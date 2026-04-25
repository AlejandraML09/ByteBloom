# Estructura del proyecto — ByteBloom Kinesiología

## Estándar React adoptado

### Componentes funcionales
Todos los componentes son **funciones** — no se usan clases.

### Exportaciones
- **Componentes de página** (`src/pages/`): `export default function NombrePagina()`
- **Componentes reutilizables** (`src/components/`): `export function NombreComponente()`
- **Constantes y utilidades** (`src/constants/`, `src/utils/`): exportaciones nombradas, sin `default`

### Convenciones de nombres
- Constantes escalares: `UPPER_SNAKE_CASE` (ej. `HORARIOS`, `NAV_LINKS`)
- Arrays y objetos de datos: `camelCase` (ej. `profesionales`, `zonasInfo`, `personas`)
- Componentes: `PascalCase` (ej. `PageHero`, `ProfCard`)
- Archivos de componentes: `PascalCase.jsx`
- Archivos de constantes y utils: `kebab-case.js` (o `.jsx` si contienen JSX)

### Props
Los props siempre se desestructuran en la firma de la función:
```jsx
export function ProfCard({ profesional }) { ... }
```

### Hooks
Los hooks se declaran al **principio del cuerpo** del componente, antes de cualquier lógica o JSX.

### Orden en un componente
1. Imports
2. Constantes locales (si aplica)
3. Definición del componente: hooks → funciones de soporte → return JSX

---

## Estructura de carpetas

```
src/
├── index.css           — Estilos globales (reset, body, toast). Importa vars.css primero.
├── App.jsx             — Router principal con rutas de la app
├── main.jsx            — Entry point de React
│
├── css/                — Archivos CSS por página/componente
│   ├── vars.css        — Custom properties CSS (--green, --off, --gray, etc.)
│   ├── navbar.css
│   ├── home.css
│   ├── servicios.css
│   ├── profesionales.css
│   ├── turnos.css
│   ├── contacto.css
│   ├── login.css
│   └── admin.css
│
├── constants/          — Datos y constantes extraídos de los componentes
│   ├── nav.js          — NAV_LINKS para la barra de navegación
│   ├── profesionales.js — Array de profesionales del equipo
│   ├── turnos.jsx      — HORARIOS, ZONA_LABELS, zonasInfo, OBRAS_SOCIALES (JSX en los íconos)
│   ├── servicios.jsx   — ZONES, zonesData con la info completa de cada zona corporal
│   ├── admin.js        — PACIENTES, DIST, ZONAS, re-exporta HORARIOS desde turnos
│   └── contacto.js     — personas (datos de José y Laura), infoCards
│
├── utils/              — Funciones puras reutilizables
│   ├── dates.js        — fmtDate, fmtDiaLargo, fmtLargo, getMonday, nextHour; DIAS_ES, MESES_ES
│   └── strings.js      — initials(nombre)
│
├── components/
│   ├── Navbar.jsx      — Barra de navegación global (usa NAV_LINKS)
│   ├── Footer.jsx      — Pie de página global
│   ├── Toast.jsx       — Notificación flotante + hook useToast
│   │
│   ├── layout/         — Componentes de layout reutilizables entre páginas
│   │   ├── PageHero.jsx    — Hero con badge, título y subtítulo
│   │   └── CtaSection.jsx  — Sección CTA oscura con botón de enlace
│   │
│   ├── home/           — Secciones de la página Home
│   │   ├── HeroSection.jsx — Hero principal con stats
│   │   ├── ServicesGrid.jsx — Grilla de 4 servicios
│   │   └── CtaBanner.jsx   — Banner CTA con teléfono y enlace a turnos
│   │
│   ├── servicios/      — Componentes de la página Servicios
│   │   ├── ZoneNav.jsx     — Tabs de navegación por zona (sticky)
│   │   └── ZoneSection.jsx — Sección completa de una zona corporal
│   │
│   ├── profesionales/  — Componentes de la página Profesionales
│   │   ├── StatsStrip.jsx  — Franja de estadísticas numéricas
│   │   └── ProfCard.jsx    — Tarjeta individual de profesional
│   │
│   ├── turnos/         — Componentes del flujo de reserva de turno
│   │   ├── StepIndicator.jsx — Indicador de pasos 1-2-3
│   │   ├── ZonaSelector.jsx  — Botones de selección de zona corporal
│   │   ├── WeekCalendar.jsx  — Navegador semanal + botones de día
│   │   ├── SlotGrid.jsx      — Grilla de horarios disponibles
│   │   ├── BookingForm.jsx   — Formulario de datos del paciente
│   │   └── SummaryPanel.jsx  — Panel lateral de resumen + confirmar
│   │
│   ├── contacto/       — Componentes de la página Contacto
│   │   ├── PersonCard.jsx    — Tarjeta de persona de contacto
│   │   ├── InfoGrid.jsx      — Grilla de 4 cards de información del centro
│   │   └── ContactForm.jsx   — Formulario de mensaje con validación
│   │
│   └── admin/          — Componentes del panel de administración
│       ├── AdminNav.jsx      — Navbar del panel admin
│       ├── AdminStatsRow.jsx — Fila de 4 tarjetas de estadísticas
│       ├── TurnosTab.jsx     — Tab de turnos del día (tabla)
│       ├── PacientesTab.jsx  — Tab de datos de pacientes (tabla)
│       ├── CuposTab.jsx      — Tab de gestión de cupos (tabla)
│       └── AsistenciaTab.jsx — Tab de toma de asistencia (tabla)
│
└── pages/              — Orquestadores de cada ruta (thin pages)
    ├── Home.jsx
    ├── Servicios.jsx
    ├── Profesionales.jsx
    ├── Turnos.jsx
    ├── Contacto.jsx
    ├── Login.jsx
    └── Admin.jsx
```

---

## Cómo agregar una nueva página

1. **Crear el archivo de página** en `src/pages/NuevaPagina.jsx`:
   ```jsx
   import Navbar from '../components/Navbar'
   import Footer from '../components/Footer'
   import '../css/nueva-pagina.css'

   export default function NuevaPagina() {
     return (
       <>
         <Navbar />
         {/* contenido */}
         <Footer />
       </>
     )
   }
   ```

2. **Crear el CSS** en `src/css/nueva-pagina.css`.

3. **Registrar la ruta** en `src/App.jsx`:
   ```jsx
   import NuevaPagina from './pages/NuevaPagina'
   // ...
   <Route path="/nueva-pagina" element={<NuevaPagina />} />
   ```

4. **Agregar el link al nav** en `src/constants/nav.js`:
   ```js
   { to: '/nueva-pagina', label: 'Nueva página' },
   ```

5. Si la página requiere datos propios, crear `src/constants/nueva-pagina.js` con los arrays/objetos correspondientes.

---

## Cómo agregar un nuevo componente

1. **Decidir la carpeta** según el ámbito:
   - Reutilizable entre páginas → `src/components/layout/`
   - Exclusivo de una página → `src/components/<nombre-pagina>/`

2. **Crear el archivo** con exportación nombrada:
   ```jsx
   // src/components/turnos/NuevoComponente.jsx
   export function NuevoComponente({ prop1, prop2 }) {
     return (
       <div className="nuevo-componente">
         {/* JSX */}
       </div>
     )
   }
   ```

3. **Importar en la página** o componente padre:
   ```jsx
   import { NuevoComponente } from '../components/turnos/NuevoComponente'
   ```

4. Si el componente necesita datos constantes, extraerlos al archivo de constantes correspondiente en `src/constants/`.

5. Si el componente necesita lógica de fecha/string, usar las funciones de `src/utils/dates.js` o `src/utils/strings.js`.
