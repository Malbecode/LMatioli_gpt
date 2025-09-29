import { consortia, workshops as workshopCatalog } from '../data/index.js';

export const STATUS_ORDER = ['Ingreso', 'Documentación', 'Taller', 'Fast Track', 'Cerrado'];

export function cloneClaims(list) {
  return list.map((claim) => ({
    ...claim,
    history: claim.history ? claim.history.map((h) => ({ ...h, changes: [...h.changes] })) : [],
    followUps: claim.followUps ? claim.followUps.map((f) => ({ ...f })) : [],
    attachments: claim.attachments ? claim.attachments.map((a) => ({ ...a })) : [],
    tasks: claim.tasks ? claim.tasks.map((t) => ({ ...t })) : [],
    documentation: claim.documentation ? claim.documentation.map((doc) => ({ ...doc })) : [],
    expansions: claim.expansions ? claim.expansions.map((expansion) => ({ ...expansion })) : [],
    otherConcepts: claim.otherConcepts ? [...claim.otherConcepts] : [],
    partsDetail: claim.partsDetail ? claim.partsDetail.map((part) => ({ ...part })) : [],
  }));
}

export function getInitials(name) {
  if (!name) return 'LM';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysDifference(from, to) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

export function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = daysDifference(date, new Date());
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'hace 1 día';
  if (diff > 1) return `hace ${diff} días`;
  return `en ${Math.abs(diff)} días`;
}

export function businessDaysBetween(from, to) {
  const start = new Date(from);
  const end = new Date(to);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  let businessDays = 0;
  const direction = start <= end ? 1 : -1;
  let cursor = new Date(start);
  while ((direction === 1 && cursor <= end) || (direction === -1 && cursor >= end)) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      businessDays += direction;
    }
    cursor.setDate(cursor.getDate() + direction);
  }
  return direction === 1 ? Math.max(0, businessDays - 1) : Math.min(0, businessDays + 1);
}

export function addBusinessDays(date, days) {
  const reference = new Date(date);
  if (Number.isNaN(reference.getTime())) return toDateInput(new Date());
  let added = 0;
  while (added < days) {
    reference.setDate(reference.getDate() + 1);
    const day = reference.getDay();
    if (day !== 0 && day !== 6) {
      added += 1;
    }
  }
  return toDateInput(reference);
}

export function toDateInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function getAlertLevel(claim) {
  const pendingTask = claim.tasks
    .filter((task) => !task.completed)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
  const referenceDate = pendingTask ? pendingTask.dueDate : claim.lastUpdate;
  if (!referenceDate) {
    return { level: 'ok', message: 'En término', detail: 'Sin tareas pendientes.' };
  }
  const diff = businessDaysBetween(referenceDate, new Date());
  if (diff <= 0) {
    return { level: 'ok', message: 'En término', detail: 'Seguimiento dentro del plazo.' };
  }
  if (diff >= 5) {
    return {
      level: 'danger',
      message: 'Alerta roja',
      detail: `Se superaron ${diff} días hábiles sin avance.`,
    };
  }
  if (diff >= 3) {
    return {
      level: 'warning',
      message: 'Alerta amarilla',
      detail: `El caso tiene ${diff} días hábiles sin novedades.`,
    };
  }
  return { level: 'ok', message: 'En término', detail: 'Seguimiento dentro de SLA.' };
}

export function appendHistory(claim, changes, user) {
  if (!changes.length) return { ...claim };
  const timestamp = new Date().toISOString();
  const entry = {
    date: timestamp,
    user: user?.username ?? 'sistema',
    changes,
  };
  return {
    ...claim,
    lastUpdate: timestamp,
    history: [entry, ...(claim.history ?? [])],
  };
}

export function applyClaimUpdates(claim, updates, user) {
  const changes = [];
  let updated = { ...claim };
  if (claim.state !== updates.state) {
    changes.push(`Estado: ${claim.state} → ${updates.state}`);
    updated.state = updates.state;
  }
  if ((claim.stage || '') !== (updates.stage || '')) {
    changes.push('Actualización de etapa');
    updated.stage = updates.stage || '';
  }
  const workshop = updates.workshop || null;
  const workshopName = workshop
    ? workshopCatalog.find((item) => item.id === workshop)?.name || 'Taller particular'
    : '';
  if ((claim.workshop || null) !== workshop) {
    changes.push(`Taller: ${claim.workshopName || 'Sin taller'} → ${workshopName || 'Sin taller'}`);
    updated.workshop = workshop;
    updated.workshopName = workshopName;
  }
  const assignedPerson = updates.assignedPerson?.trim() || null;
  if ((claim.assignedPerson || null) !== assignedPerson) {
    changes.push('Responsable actualizado');
    updated.assignedPerson = assignedPerson;
  }
  const inspectionValue = updates.inspectionDate ? new Date(updates.inspectionDate).toISOString() : null;
  if ((claim.inspectionDate || null) !== inspectionValue) {
    changes.push('Fecha de inspección actualizada');
    updated.inspectionDate = inspectionValue;
  }
  const notes = updates.fastTrackNotes?.trim() || '';
  if ((claim.fastTrackNotes || '') !== notes) {
    changes.push('Notas actualizadas');
    updated.fastTrackNotes = notes;
  }
  const claimType = updates.claimType || 'Reparación';
  if ((claim.claimType || 'Reparación') !== claimType) {
    changes.push(`Tipo de siniestro: ${claim.claimType || 'Sin dato'} → ${claimType}`);
    updated.claimType = claimType;
  }
  const stroNumber = updates.stroNumber?.trim() || '';
  if ((claim.stroNumber || '') !== stroNumber) {
    changes.push('STR0 actualizado');
    updated.stroNumber = stroNumber;
  }
  const repairNumber = updates.repairNumber?.trim() || '';
  if ((claim.repairNumber || '') !== repairNumber) {
    changes.push('Número de reparación actualizado');
    updated.repairNumber = repairNumber;
  }
  const recoveryType = updates.recoveryType || 'Ninguno';
  if ((claim.recoveryType || 'Ninguno') !== recoveryType) {
    changes.push(`Reclamo / Recupero: ${claim.recoveryType || 'Sin dato'} → ${recoveryType}`);
    updated.recoveryType = recoveryType;
    updated.hasRecovery = recoveryType !== 'Ninguno';
  }
  const creditorType = updates.creditorType || '';
  if ((claim.creditorType || '') !== creditorType) {
    changes.push('Tipo de acreedor actualizado');
    updated.creditorType = creditorType;
  }
  const creditorName = updates.creditorName?.trim() || '';
  if ((claim.creditorName || '') !== creditorName) {
    changes.push('Acreedor actualizado');
    updated.creditorName = creditorName;
  }
  const hasInvoice = Boolean(updates.hasInvoice);
  if (Boolean(claim.hasInvoice) !== hasInvoice) {
    changes.push(hasInvoice ? 'Factura recibida' : 'Factura pendiente');
    updated.hasInvoice = hasInvoice;
  }
  const otherConcepts = updates.otherConcepts ? updates.otherConcepts.filter(Boolean) : [];
  const currentConcepts = claim.otherConcepts ? claim.otherConcepts.filter(Boolean) : [];
  if (JSON.stringify(currentConcepts) !== JSON.stringify(otherConcepts)) {
    changes.push('Otros conceptos actualizados');
    updated.otherConcepts = otherConcepts;
  }
  if (changes.length) {
    updated = appendHistory(updated, changes, user);
  }
  return updated;
}

export function toggleTaskOnClaim(claim, taskId, completed, user) {
  const tasks = claim.tasks.map((task) =>
    task.id === taskId ? { ...task, completed } : task,
  );
  let updated = { ...claim, tasks };
  updated = appendHistory(
    updated,
    [completed ? `Tarea completada: ${claim.tasks.find((task) => task.id === taskId)?.label || ''}` : `Tarea marcada como pendiente: ${claim.tasks.find((task) => task.id === taskId)?.label || ''}`],
    user,
  );
  if (completed && tasks.every((task) => task.completed) && updated.state !== 'Cerrado') {
    updated = appendHistory({ ...updated, state: 'Documentación' }, ['Todas las tareas completadas. Listo para revisión.'], user);
  }
  return updated;
}

export function addFollowUpToClaim(claim, comment, user) {
  const entry = {
    date: new Date().toISOString(),
    user: user?.username ?? 'sistema',
    comment,
  };
  const updated = {
    ...claim,
    followUps: [entry, ...(claim.followUps ?? [])],
  };
  return appendHistory(updated, ['Nuevo seguimiento agregado'], user);
}

export function addAttachmentsToClaim(claim, files, user) {
  if (!files.length) return { ...claim };
  const attachments = [...(claim.attachments ?? []), ...files];
  const updated = { ...claim, attachments };
  return appendHistory(updated, ['Se agregaron archivos adjuntos'], user);
}

export function filterClaims(claims, filters) {
  const { search, status, workshop, consorcio, claim, from, to } = filters;
  return claims.filter((item) => {
    const matchesSearch = search
      ? [item.id, item.plate, item.dni, item.name, item.consorcio]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(search.toLowerCase()))
      : true;
    const matchesStatus = status === 'todos' ? true : item.state === status;
    const matchesWorkshop = workshop === 'todos' ? true : item.workshop === workshop;
    const matchesConsorcio = consorcio === 'todos' ? true : item.consorcioOption === consorcio;
    const matchesClaim =
      claim === 'todos'
        ? true
        : claim === 'reclamo'
        ? item.recoveryType === 'Reclamo'
        : claim === 'recupero'
        ? item.recoveryType === 'Recupero'
        : claim === 'ninguno'
        ? !item.recoveryType || item.recoveryType === 'Ninguno'
        : true;
    const matchesFrom = from ? new Date(item.eventDate) >= new Date(from) : true;
    const matchesTo = to ? new Date(item.eventDate) <= new Date(to) : true;
    return matchesSearch && matchesStatus && matchesWorkshop && matchesConsorcio && matchesClaim && matchesFrom && matchesTo;
  });
}

export function generateClaimId(claims) {
  const existingIds = claims
    .map((claim) => Number(claim.id.replace(/\D/g, '')))
    .filter((num) => !Number.isNaN(num));
  const nextNumber = existingIds.length ? Math.max(...existingIds) + 1 : 1;
  return `SIN-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;
}

export function generateInitialTasks(draft) {
  const tasks = [
    {
      id: `t-${Date.now()}-1`,
      label: 'Validar póliza y cobertura',
      dueDate: addBusinessDays(draft.reportDate || new Date(), 2),
      completed: false,
    },
    {
      id: `t-${Date.now()}-2`,
      label: 'Contactar asegurado',
      dueDate: addBusinessDays(draft.reportDate || new Date(), 3),
      completed: false,
    },
  ];
  if (draft.workshop) {
    tasks.push({
      id: `t-${Date.now()}-3`,
      label: 'Confirmar turno de inspección',
      dueDate: draft.inspectionDate || addBusinessDays(draft.reportDate || new Date(), 5),
      completed: false,
    });
  }
  if (draft.fastTrack) {
    tasks.push({
      id: `t-${Date.now()}-4`,
      label: 'Enviar denuncia a cía asociada',
      dueDate: addBusinessDays(draft.reportDate || new Date(), 1),
      completed: false,
    });
  }
  return tasks;
}

export function buildClaimFromDraft(draft) {
  const consorcioName = draft.consorcioFlag
    ? consortia.find((item) => item.id === draft.consorcioOption)?.name || 'Consorcio asignado'
    : 'Sin consorcio';
  const workshopName = draft.workshop
    ? workshopCatalog.find((item) => item.id === draft.workshop)?.name || 'Taller particular'
    : '';
  return {
    id: draft.id,
    plate: draft.plate,
    dni: draft.dni,
    name: draft.name,
    brand: draft.brand || '',
    model: draft.model || '',
    eventDate: draft.eventDate,
    reportDate: draft.reportDate,
    description: draft.description,
    consorcioFlag: draft.consorcioFlag,
    consorcioOption: draft.consorcioOption,
    consorcio: consorcioName,
    hasRecovery: draft.recoveryType && draft.recoveryType !== 'Ninguno',
    stroNumber: draft.stroNumber || '',
    repairNumber: draft.repairNumber || '',
    claimType: draft.claimType || 'Reparación',
    recoveryType: draft.recoveryType || 'Ninguno',
    creditorType: draft.creditorType || '',
    creditorName: draft.creditorName?.trim() || '',
    hasInvoice: Boolean(draft.hasInvoice),
    otherConcepts: draft.otherConcepts ? draft.otherConcepts.filter(Boolean) : [],
    state: draft.closeDirectly
      ? 'Cerrado'
      : draft.fastTrack
      ? 'Fast Track'
      : draft.workshop
      ? 'Taller'
      : 'Ingreso',
    stage: draft.fastTrack
      ? 'Derivado a circuito Fast Track'
      : draft.workshop
      ? `Derivado a ${workshopName}`
      : draft.closeDirectly
      ? 'Caso cerrado sin daños reportados'
      : 'Pendiente de revisión inicial',
    fastTrack: draft.fastTrack || false,
    workshop: draft.workshop || null,
    workshopName,
    assignedPerson: draft.assignedPerson || null,
    inspectionDate: draft.inspectionDate ? new Date(draft.inspectionDate).toISOString() : null,
    fastTrackNotes: draft.fastTrackNotes,
    history: [],
    followUps: [],
    attachments: [...(draft.attachments || [])],
    tasks: generateInitialTasks(draft),
    partsDetail: draft.partsDetail ? draft.partsDetail.map((part) => ({ ...part })) : [],
    lastUpdate: new Date().toISOString(),
  };
}

export function detectDuplicates(claims, draft) {
  if (!draft.plate || !draft.eventDate) return [];
  return claims.filter((claim) => claim.plate === draft.plate && claim.eventDate === draft.eventDate);
}

export function exportClaimsToCsv(claims) {
  if (!claims.length) {
    return null;
  }
  const headers = [
    'ID',
    'Patente',
    'DNI',
    'Asegurado',
    'Fecha de siniestro',
    'Estado',
    'Consorcio',
    'Taller',
    'Tipo de siniestro',
    'Reclamo / Recupero',
    'Factura recibida',
    'Fast Track',
  ];
  const rows = claims.map((claim) => [
    claim.id,
    claim.plate,
    claim.dni,
    claim.name,
    claim.eventDate,
    claim.state,
    claim.consorcio,
    claim.workshopName || '',
    claim.claimType || '',
    claim.recoveryType && claim.recoveryType !== 'Ninguno' ? claim.recoveryType : 'No aplica',
    claim.hasInvoice ? 'Sí' : 'No',
    claim.fastTrack ? 'Sí' : 'No',
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell ?? ''}"`).join(';'))
    .join('\n');
  return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
}
