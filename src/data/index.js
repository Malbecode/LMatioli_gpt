export const users = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    name: 'Laura Mattioli',
    email: 'admin@lmattioli.com.ar',
  },
  {
    username: 'supervisor',
    password: 'super123',
    role: 'Supervisor',
    name: 'Martín Cabrera',
    email: 'martin.cabrera@lmattioli.com.ar',
  },
  {
    username: 'operativo',
    password: 'operativo123',
    role: 'Operativo',
    name: 'Julieta López',
    email: 'julieta.lopez@lmattioli.com.ar',
  },
];

export const consortia = [
  { id: 'norte', name: 'Consorcio Norte' },
  { id: 'sur', name: 'Consorcio Sur' },
  { id: 'centro', name: 'Consorcio Centro' },
  { id: 'premium', name: 'Consorcio Premium' },
];

export const workshops = [
  {
    id: 'taller-central',
    name: 'Taller Central',
    address: 'Av. Libertador 1520, CABA',
    manager: 'María García',
    phone: '+54 11 4567-8900',
    sla: 5,
    capacity: 12,
  },
  {
    id: 'taller-sur',
    name: 'Carrocerías del Sur',
    address: 'Av. Mitre 4032, Avellaneda',
    manager: 'Gonzalo Ferreyra',
    phone: '+54 11 4233-8745',
    sla: 4,
    capacity: 9,
  },
  {
    id: 'taller-elite',
    name: 'Elite Motors',
    address: 'Panamericana Km 46, Pilar',
    manager: 'Sofía Morales',
    phone: '+54 11 4878-0099',
    sla: 6,
    capacity: 7,
  },
  {
    id: 'taller-particular',
    name: 'Particular',
    address: 'A designar',
    manager: 'A definir',
    phone: '',
    sla: 0,
    capacity: 0,
  },
];

export const peopleInCharge = [
  {
    id: 'maria-garcia',
    name: 'María García',
    role: 'Coordinadora taller Central',
    contact: '+54 11 4567-2311',
    workshops: ['taller-central'],
  },
  {
    id: 'gonzalo-ferreyra',
    name: 'Gonzalo Ferreyra',
    role: 'Supervisor taller Sur',
    contact: '+54 11 4233-3344',
    workshops: ['taller-sur'],
  },
  {
    id: 'sofia-morales',
    name: 'Sofía Morales',
    role: 'Líder Elite Motors',
    contact: '+54 11 4878-1211',
    workshops: ['taller-elite'],
  },
  {
    id: 'julieta-lopez',
    name: 'Julieta López',
    role: 'Operativa Fast Track',
    contact: '+54 11 3345-9087',
    workshops: ['fast-track'],
  },
];

export const insuredDirectory = [
  {
    plate: 'AE456RT',
    dni: '30255678',
    name: 'Federico Díaz',
    email: 'f.diaz@mail.com',
    phone: '+54 9 11 4556-8890',
    vehicle: {
      brand: 'Toyota',
      model: 'Corolla XEi',
      year: 2022,
      coverage: 'Todo riesgo sin franquicia',
      company: 'LM Aseguradora',
      sum: '$8.500.000',
      engine: '2ZR-FE 1.8',
      chassis: '8BRBT12345K23900',
      consorcio: 'Consorcio Norte',
    },
  },
  {
    plate: 'AC321BD',
    dni: '28900765',
    name: 'Mariana Ferreyra',
    email: 'mariana.ferreyra@mail.com',
    phone: '+54 9 11 3334-5500',
    vehicle: {
      brand: 'Ford',
      model: 'Kuga SEL',
      year: 2021,
      coverage: 'Todo riesgo con franquicia',
      company: 'LM Aseguradora',
      sum: '$10.200.000',
      engine: 'EcoBoost 1.5',
      chassis: 'AFGHT6743219900',
      consorcio: 'Consorcio Sur',
    },
  },
  {
    plate: 'AD890GH',
    dni: '37800988',
    name: 'Lucía Pereyra',
    email: 'lucia.pereyra@mail.com',
    phone: '+54 9 11 3402-1123',
    vehicle: {
      brand: 'Chevrolet',
      model: 'Tracker Premier',
      year: 2023,
      coverage: 'Cobertura Premium',
      company: 'LM Aseguradora',
      sum: '$12.000.000',
      engine: '1.2 Turbo',
      chassis: 'GHJPQ987654321',
      consorcio: 'Consorcio Premium',
    },
  },
];

export const automationRules = [
  {
    id: 'rule-1',
    name: 'Asignación automática a taller',
    description:
      'Si el siniestro requiere ingreso a taller y la patente corresponde a zona norte, asignar Taller Central y responsable María García.',
  },
  {
    id: 'rule-2',
    name: 'Recordatorio de seguimiento',
    description:
      'Genera recordatorio automático a los 3 días hábiles de la última actualización. Escala al supervisor si supera los 5 días.',
  },
  {
    id: 'rule-3',
    name: 'Notificación a cías asociadas',
    description:
      'Envía automáticamente la denuncia a las compañías aliadas cuando el siniestro pertenece a consorcio Premium.',
  },
];

export const reminders = [
  {
    id: 'rem-1',
    title: 'Revisión documentación Siniestro SIN-2024-004',
    dueDate: '2024-06-14',
    createdBy: 'supervisor',
  },
  {
    id: 'rem-2',
    title: 'Confirmar repuestos Taller Central',
    dueDate: '2024-06-16',
    createdBy: 'operativo',
  },
];

export const notifications = [
  {
    id: 'not-1',
    title: 'Alerta roja en SIN-2024-002',
    detail: 'Se superaron los 5 días hábiles sin inspección. Revisar con urgencia.',
    date: '2024-06-11T10:15:00',
  },
  {
    id: 'not-2',
    title: 'Nuevo adjunto en SIN-2024-003',
    detail: 'El asegurado subió fotografías adicionales del daño.',
    date: '2024-06-10T17:02:00',
  },
  {
    id: 'not-3',
    title: 'Cambio de estado',
    detail: 'SIN-2024-005 pasó a Fast Track por decisión de supervisor.',
    date: '2024-06-09T09:40:00',
  },
];

export const catalogSummary = {
  roles: [
    { name: 'Admin', permissions: ['Gestiona catálogos', 'Define reglas', 'Gestiona usuarios'] },
    { name: 'Supervisor', permissions: ['Aprueba cierres', 'Reasigna casos', 'Gestiona alertas'] },
    { name: 'Operativo', permissions: ['Carga siniestros', 'Actualiza estados', 'Gestiona documentación'] },
  ],
  workshops,
  consortia,
  people: peopleInCharge,
};

export const claims = [
  {
    id: 'SIN-2024-001',
    plate: 'AE456RT',
    dni: '30255678',
    name: 'Federico Díaz',
    eventDate: '2024-06-03',
    reportDate: '2024-06-03',
    description: 'Choque en cadena en Panamericana, daños en lateral izquierdo. Sin lesionados.',
    consorcio: 'Consorcio Norte',
    consorcioFlag: true,
    consorcioOption: 'norte',
    hasRecovery: true,
    state: 'Documentación',
    stage: 'Esperando inspección en Taller Central',
    fastTrack: false,
    workshop: 'taller-central',
    workshopName: 'Taller Central',
    assignedPerson: 'María García',
    inspectionDate: '2024-06-06',
    fastTrackNotes: '',
    history: [
      {
        date: '2024-06-03T09:10:00',
        user: 'operativo',
        changes: ['Creación de siniestro', 'Estado inicial: Ingreso'],
      },
      {
        date: '2024-06-04T11:22:00',
        user: 'supervisor',
        changes: ['Estado actualizado a Documentación', 'Taller asignado: Taller Central'],
      },
    ],
    followUps: [
      {
        date: '2024-06-05T15:45:00',
        user: 'operativo',
        comment: 'Se solicitó documentación adicional al asegurado.',
      },
    ],
    attachments: [
      { name: 'Fotos-dano.pdf', type: 'PDF', size: '420 KB' },
      { name: 'Registro-denuncia.mp4', type: 'Video', size: '3.1 MB' },
    ],
    tasks: [
      {
        id: 't1',
        label: 'Revisar documentación',
        dueDate: '2024-06-06',
        completed: false,
      },
      {
        id: 't2',
        label: 'Coordinar inspección',
        dueDate: '2024-06-07',
        completed: false,
      },
    ],
    lastUpdate: '2024-06-05T15:45:00',
  },
  {
    id: 'SIN-2024-002',
    plate: 'AC321BD',
    dni: '28900765',
    name: 'Mariana Ferreyra',
    eventDate: '2024-05-28',
    reportDate: '2024-05-29',
    description: 'Robo parcial de ruedas y espejos retrovisores. Denuncia policial realizada.',
    consorcio: 'Consorcio Sur',
    consorcioFlag: true,
    consorcioOption: 'sur',
    hasRecovery: true,
    state: 'Taller',
    stage: 'Pendiente de repuestos',
    fastTrack: false,
    workshop: 'taller-sur',
    workshopName: 'Carrocerías del Sur',
    assignedPerson: 'Gonzalo Ferreyra',
    inspectionDate: '2024-05-30',
    fastTrackNotes: '',
    history: [
      {
        date: '2024-05-29T10:24:00',
        user: 'operativo',
        changes: ['Creación de siniestro', 'Estado inicial: Ingreso'],
      },
      {
        date: '2024-05-30T12:01:00',
        user: 'supervisor',
        changes: ['Ingreso a taller: Carrocerías del Sur', 'Asignación de responsable: Gonzalo Ferreyra'],
      },
    ],
    followUps: [
      {
        date: '2024-06-01T09:30:00',
        user: 'operativo',
        comment: 'Se confirmó pedido de repuestos. ETA 5 días hábiles.',
      },
      {
        date: '2024-06-05T09:12:00',
        user: 'supervisor',
        comment: 'Se eleva alerta roja por demora en repuestos.',
      },
    ],
    attachments: [{ name: 'Denuncia-policial.pdf', type: 'PDF', size: '280 KB' }],
    tasks: [
      {
        id: 't1',
        label: 'Seguimiento pedido de repuestos',
        dueDate: '2024-06-04',
        completed: false,
      },
      {
        id: 't2',
        label: 'Actualizar asegurado',
        dueDate: '2024-06-06',
        completed: false,
      },
    ],
    lastUpdate: '2024-06-05T09:12:00',
  },
  {
    id: 'SIN-2024-003',
    plate: 'AD890GH',
    dni: '37800988',
    name: 'Lucía Pereyra',
    eventDate: '2024-05-20',
    reportDate: '2024-05-20',
    description: 'Impacto frontal con daños en paragolpes y capot. Vehículo circulable.',
    consorcio: 'Consorcio Premium',
    consorcioFlag: true,
    consorcioOption: 'premium',
    hasRecovery: false,
    state: 'Fast Track',
    stage: 'Documentación enviada a compañía asociada',
    fastTrack: true,
    workshop: null,
    workshopName: '',
    assignedPerson: 'Julieta López',
    inspectionDate: null,
    fastTrackNotes: 'Cliente aceptó reparación express en fast track.',
    history: [
      {
        date: '2024-05-20T10:42:00',
        user: 'operativo',
        changes: ['Creación de siniestro', 'Validación de duplicados'],
      },
      {
        date: '2024-05-21T14:07:00',
        user: 'supervisor',
        changes: ['Se define estrategia Fast Track', 'Notificación enviada a cía asociada'],
      },
    ],
    followUps: [
      {
        date: '2024-05-22T09:20:00',
        user: 'operativo',
        comment: 'Se envió documentación completa. Esperando conformidad de la cía.',
      },
    ],
    attachments: [{ name: 'Fotos-frontales.zip', type: 'ZIP', size: '6.2 MB' }],
    tasks: [
      {
        id: 't1',
        label: 'Confirmar transferencia a taller aliado',
        dueDate: '2024-05-23',
        completed: true,
      },
      {
        id: 't2',
        label: 'Registrar devolución de vehículo',
        dueDate: '2024-05-27',
        completed: false,
      },
    ],
    lastUpdate: '2024-05-27T11:00:00',
  },
  {
    id: 'SIN-2024-004',
    plate: 'AB123CD',
    dni: '30123456',
    name: 'Jorge Ramírez',
    eventDate: '2024-06-07',
    reportDate: '2024-06-08',
    description: 'Granizo en estacionamiento. Daños leves en capot y techo.',
    consorcio: 'Consorcio Centro',
    consorcioFlag: false,
    consorcioOption: null,
    hasRecovery: false,
    state: 'Ingreso',
    stage: 'Esperando validación inicial',
    fastTrack: false,
    workshop: null,
    workshopName: '',
    assignedPerson: null,
    inspectionDate: null,
    fastTrackNotes: '',
    history: [
      {
        date: '2024-06-08T08:22:00',
        user: 'operativo',
        changes: ['Creación de siniestro', 'Pendiente de revisión de documentación'],
      },
    ],
    followUps: [],
    attachments: [],
    tasks: [
      {
        id: 't1',
        label: 'Validar póliza vigente',
        dueDate: '2024-06-10',
        completed: false,
      },
    ],
    lastUpdate: '2024-06-08T08:22:00',
  },
  {
    id: 'SIN-2024-005',
    plate: 'AF678XY',
    dni: '31123098',
    name: 'Carolina Suárez',
    eventDate: '2024-05-02',
    reportDate: '2024-05-03',
    description: 'Daños traseros por impacto en estacionamiento. Sin heridos.',
    consorcio: 'Consorcio Norte',
    consorcioFlag: false,
    consorcioOption: 'norte',
    hasRecovery: true,
    state: 'Cerrado',
    stage: 'Caso cerrado - Liquidación emitida',
    fastTrack: true,
    workshop: null,
    workshopName: '',
    assignedPerson: 'Julieta López',
    inspectionDate: null,
    fastTrackNotes: 'Liquidación automática y reintegro a la asegurada.',
    history: [
      {
        date: '2024-05-03T10:22:00',
        user: 'operativo',
        changes: ['Creación de siniestro'],
      },
      {
        date: '2024-05-06T11:55:00',
        user: 'supervisor',
        changes: ['Cambio a fast track'],
      },
      {
        date: '2024-05-15T16:01:00',
        user: 'admin',
        changes: ['Estado actualizado a Cerrado', 'Liquidación emitida'],
      },
    ],
    followUps: [
      {
        date: '2024-05-07T08:50:00',
        user: 'operativo',
        comment: 'Documentación enviada a cía asociada 1.',
      },
      {
        date: '2024-05-13T09:10:00',
        user: 'supervisor',
        comment: 'Confirmado reembolso por compañía asociada.',
      },
    ],
    attachments: [{ name: 'Liquidacion.pdf', type: 'PDF', size: '180 KB' }],
    tasks: [
      {
        id: 't1',
        label: 'Confirmar pago al asegurado',
        dueDate: '2024-05-16',
        completed: true,
      },
    ],
    lastUpdate: '2024-05-15T16:01:00',
  },
];
