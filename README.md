# LM Aseguradora React

Aplicación web creada con React y Vite que simula un portal interno para la gestión integral de siniestros de una aseguradora. El foco está puesto en mostrar flujos operativos completos (desde la denuncia hasta el cierre) utilizando datos mockeados y componentes sin dependencias externas adicionales.

## Requisitos previos

- Node.js 18 o superior
- npm 9 o superior

## Puesta en marcha

```bash
npm install
npm run dev        # Ejecuta el entorno de desarrollo en http://localhost:5173
npm run build      # Genera la versión lista para producción
npm run preview    # Sirve la build generada localmente
```

## Estructura principal del proyecto

```
├── index.html        # Punto de entrada de Vite
├── src
│   ├── App.jsx       # Contiene la lógica principal y los componentes de la interfaz
│   ├── data          # Datos mockeados (usuarios, siniestros, catálogos)
│   ├── main.jsx      # Bootstrap de ReactDOM y carga de estilos globales
│   ├── styles        # Hojas de estilo CSS
│   └── utils         # Utilidades compartidas para formateos y lógica de negocio
└── vite.config.js    # Configuración de Vite
```

## Flujos y módulos disponibles

### Autenticación
- Formulario de inicio de sesión con validaciones y mensajes de error.
- Recuperación de contraseña simulada mediante notificación emergente.

### Dashboard general
- Métricas de estado del portafolio (casos activos, fast track, alertas, ciclo promedio).
- Visualización del embudo de estados y lista de recordatorios automáticos con opción de alta rápida.
- Barra superior con acceso a notificaciones, cambio de contraseña y datos del usuario activo.

### Gestión de siniestros
- Panel con filtros combinables por búsqueda, estado, taller, consorcio, reclamo y rango de fechas.
- Tablero tipo kanban organizado según `STATUS_ORDER`, con tarjetas que destacan alertas, tareas y responsables.
- Exportación de los resultados filtrados a CSV, creación de nuevos siniestros y acceso a detalle completo por tarjeta.

### Detalle de siniestro
- Modal con edición de estado, etapa, taller, responsable, inspección y notas.
- Registro de seguimientos, historial de cambios, adjuntos y tareas asociadas (incluye marcado de finalización).
- Alertas dinámicas según SLA calculado con `getAlertLevel` y posibilidad de subir nuevos archivos.

### Alta de siniestro
- Asistente de tres pasos que valida campos críticos, sugiere responsables según el taller y detecta posibles duplicados por dominio y fecha.
- Integración con el directorio de asegurados para autocompletar datos de póliza y consorcio.
- Generación automática de tareas iniciales y determinación del estado inicial (taller, fast track o cierre inmediato) mediante `buildClaimFromDraft`.

### Otros módulos
- **Consultas de asegurados:** formulario de búsqueda por patente, DNI o nombre que muestra la ficha completa del asegurado cuando existe una coincidencia.
- **Automatizaciones y reglas:** listado descriptivo de reglas operativas configuradas en `automationRules`.
- **Configuración:** resumen de roles, talleres, consorcios y responsables mantenidos en `catalogSummary`.
- **Repuestos:** módulo placeholder con información sobre funcionalidades planificadas.

### Utilidades y datos mockeados
- `src/data/index.js` concentra usuarios, talleres, consorcios, reglas, recordatorios, notificaciones y casos de siniestros de ejemplo.
- `src/utils/index.js` ofrece funciones para clonar datos, formatear fechas, calcular días hábiles, generar IDs y CSVs, manejar tareas/seguimientos y detectar duplicados.
- Las operaciones de actualización de siniestros gestionan histórico, adjuntos y cambios de estado reutilizando dichas utilidades para mantener consistencia.

### Estilos
- `src/styles/main.css` define tokens de color, layout responsivo de dashboard, tarjetas reutilizables, formularios y componentes como modales, stepper y etiquetas de estado.

## Scripts de npm

| Comando        | Descripción |
| -------------- | ----------- |
| `npm run dev`  | Levanta el servidor de desarrollo con recarga en caliente. |
| `npm run build`| Crea la build optimizada para producción en `dist/`. |
| `npm run preview` | Sirve la build generada para validaciones previas al deploy. |

## Pruebas

El proyecto no incluye pruebas automatizadas específicas. Para validar el estado de la aplicación se recomienda ejecutar `npm run build`, que compila la aplicación completa y asegura que no existan errores de bundling.

## Próximos pasos sugeridos

- Incorporar pruebas unitarias/funcionales para los flujos críticos (filtro de siniestros, creación y actualización).
- Externalizar los componentes en archivos dedicados a medida que se agreguen nuevas funcionalidades.
- Integrar una API real o capa de persistencia para reemplazar los datos mockeados y permitir operaciones CRUD reales.
