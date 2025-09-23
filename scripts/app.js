import {
  users,
  claims as initialClaims,
  consortia,
  workshops,
  peopleInCharge,
  insuredDirectory,
  automationRules,
  reminders as initialReminders,
  notifications as initialNotifications,
  catalogSummary,
} from './data.js';

const loginView = document.getElementById('login-view');
const dashboardView = document.getElementById('dashboard-view');
const moduleTitle = document.getElementById('module-title');
const moduleSubtitle = document.querySelector('.topbar__subtitle');
const navButtons = Array.from(document.querySelectorAll('.nav-item'));
const moduleElements = {
  overview: document.getElementById('module-overview'),
  siniestros: document.getElementById('module-siniestros'),
  consultas: document.getElementById('module-consultas'),
  repuestos: document.getElementById('module-repuestos'),
  automatizaciones: document.getElementById('module-automatizaciones'),
  configuracion: document.getElementById('module-configuracion'),
};
const modalLayer = document.getElementById('modal-layer');

const state = {
  currentUser: null,
  module: 'overview',
  claims: cloneClaims(initialClaims),
  filters: {
    search: '',
    status: 'todos',
    workshop: 'todos',
    consorcio: 'todos',
    claim: 'todos',
    from: '',
    to: '',
  },
  reminders: [...initialReminders],
  notifications: [...initialNotifications],
};

const moduleCopy = {
  overview: {
    title: 'Dashboard general',
    subtitle: 'Visualiza y gestiona el ciclo completo de los siniestros.',
  },
  siniestros: {
    title: 'Gestión de siniestros',
    subtitle: 'Seguimiento de casos abiertos, en seguimiento y cerrados.',
  },
  consultas: {
    title: 'Consultas de asegurados',
    subtitle: 'Busca pólizas por patente, DNI o nombre del asegurado.',
  },
  repuestos: {
    title: 'Gestión de repuestos',
    subtitle: 'Módulo en diseño: pedidos, aprobaciones y conciliación.',
  },
  automatizaciones: {
    title: 'Automatizaciones y reglas',
    subtitle: 'Configura alertas, tareas recurrentes y envíos automáticos.',
  },
  configuracion: {
    title: 'Configuración',
    subtitle: 'Administra roles, talleres, consorcios y responsables.',
  },
};

const statusOrder = ['Ingreso', 'Documentación', 'Taller', 'Fast Track', 'Cerrado'];

init();

function init() {
  setupLogin();
  setupNavigation();
  setupFilters();
  setupActions();
  populateCatalogOptions();
}

function cloneClaims(list) {
  return list.map((claim) => ({
    ...claim,
    history: claim.history ? claim.history.map((h) => ({ ...h, changes: [...h.changes] })) : [],
    followUps: claim.followUps ? claim.followUps.map((f) => ({ ...f })) : [],
    attachments: claim.attachments ? claim.attachments.map((a) => ({ ...a })) : [],
    tasks: claim.tasks ? claim.tasks.map((t) => ({ ...t })) : [],
  }));
}

function setupLogin() {
  const loginForm = document.getElementById('login-form');
  const recoverForm = document.getElementById('recover-form');
  const forgotPassword = document.getElementById('forgot-password');
  const backToLogin = document.getElementById('back-to-login');
  const logoutButton = document.getElementById('logout');
  const changePasswordButton = document.getElementById('change-password');
  const loginError = document.createElement('p');
  loginError.className = 'form-helper';
  loginError.style.color = 'var(--color-danger)';
  loginError.style.display = 'none';
  loginForm.appendChild(loginError);

  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(loginForm);
    const username = data.get('username');
    const password = data.get('password');
    const user = users.find((item) => item.username === username && item.password === password);
    if (!user) {
      loginError.textContent = 'Usuario o contraseña incorrectos. Intenta nuevamente.';
      loginError.style.display = 'block';
      return;
    }
    loginError.style.display = 'none';
    state.currentUser = { ...user };
    loginView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    syncUserChip();
    renderAll();
  });

  forgotPassword.addEventListener('click', () => {
    loginForm.classList.add('hidden');
    recoverForm.classList.remove('hidden');
  });

  backToLogin.addEventListener('click', () => {
    recoverForm.reset();
    recoverForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  recoverForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const email = new FormData(recoverForm).get('email');
    showToast(`Enviamos instrucciones de recuperación a ${email}.`);
    recoverForm.reset();
    recoverForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  logoutButton.addEventListener('click', () => {
    state.currentUser = null;
    dashboardView.classList.add('hidden');
    loginView.classList.remove('hidden');
    moduleTitle.textContent = moduleCopy.overview.title;
    moduleSubtitle.textContent = moduleCopy.overview.subtitle;
    loginForm.reset();
  });

  changePasswordButton.addEventListener('click', openChangePasswordModal);
}

function syncUserChip() {
  const userName = document.getElementById('user-name');
  const userRole = document.getElementById('user-role');
  const userAvatar = document.getElementById('user-avatar');
  if (!state.currentUser) {
    userName.textContent = 'Invitado';
    userRole.textContent = '';
    userAvatar.textContent = 'LM';
    return;
  }
  userName.textContent = state.currentUser.name;
  userRole.textContent = state.currentUser.role;
  userAvatar.textContent = getInitials(state.currentUser.name);
}

function setupNavigation() {
  navButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const module = button.dataset.module;
      state.module = module;
      navButtons.forEach((item) => item.classList.toggle('active', item === button));
      updateModuleVisibility(module);
    });
  });
}

function setupFilters() {
  document.getElementById('filter-search').addEventListener('input', (event) => {
    state.filters.search = event.target.value.trim();
    renderSiniestros();
  });
  document.getElementById('filter-status').addEventListener('change', (event) => {
    state.filters.status = event.target.value;
    renderSiniestros();
  });
  document.getElementById('filter-workshop').addEventListener('change', (event) => {
    state.filters.workshop = event.target.value;
    renderSiniestros();
  });
  document.getElementById('filter-consorcio').addEventListener('change', (event) => {
    state.filters.consorcio = event.target.value;
    renderSiniestros();
  });
  document.getElementById('filter-claim').addEventListener('change', (event) => {
    state.filters.claim = event.target.value;
    renderSiniestros();
  });
  document.getElementById('filter-from').addEventListener('change', (event) => {
    state.filters.from = event.target.value;
    renderSiniestros();
  });
  document.getElementById('filter-to').addEventListener('change', (event) => {
    state.filters.to = event.target.value;
    renderSiniestros();
  });
  document.getElementById('clear-filters').addEventListener('click', () => {
    state.filters = {
      search: '',
      status: 'todos',
      workshop: 'todos',
      consorcio: 'todos',
      claim: 'todos',
      from: '',
      to: '',
    };
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-status').value = 'todos';
    document.getElementById('filter-workshop').value = 'todos';
    document.getElementById('filter-consorcio').value = 'todos';
    document.getElementById('filter-claim').value = 'todos';
    document.getElementById('filter-from').value = '';
    document.getElementById('filter-to').value = '';
    renderSiniestros();
  });
  document.getElementById('export-data').addEventListener('click', () => {
    exportClaimsToCsv(getFilteredClaims());
  });
}

function setupActions() {
  document.getElementById('new-claim').addEventListener('click', openNewClaimModal);
  document.getElementById('notifications-button').addEventListener('click', openNotificationsModal);
  document.getElementById('insured-search').addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target;
    const plate = form.plate.value.trim().toUpperCase();
    const dni = form.dni.value.trim();
    const name = form.name.value.trim().toLowerCase();
    const match = insuredDirectory.find((insured) => {
      return (
        (plate && insured.plate === plate) ||
        (dni && insured.dni === dni) ||
        (name && insured.name.toLowerCase().includes(name))
      );
    });
    renderInsuredResult(match, plate || dni || name);
  });
  document.getElementById('add-reminder').addEventListener('click', openReminderModal);
}

function populateCatalogOptions() {
  const workshopSelect = document.getElementById('filter-workshop');
  const consorcioSelect = document.getElementById('filter-consorcio');
  workshops.forEach((workshop) => {
    if (workshop.id === 'taller-particular') return;
    const option = document.createElement('option');
    option.value = workshop.id;
    option.textContent = workshop.name;
    workshopSelect.appendChild(option);
  });
  consortia.forEach((consorcio) => {
    const option = document.createElement('option');
    option.value = consorcio.id;
    option.textContent = consorcio.name;
    consorcioSelect.appendChild(option);
  });
}

function renderAll() {
  renderOverview();
  renderSiniestros();
  renderAutomationsModule();
  renderConfigModule();
}

function updateModuleVisibility(module) {
  Object.entries(moduleElements).forEach(([key, element]) => {
    if (!element) return;
    element.classList.toggle('hidden', key !== module);
  });
  const copy = moduleCopy[module] ?? moduleCopy.overview;
  moduleTitle.textContent = copy.title;
  if (moduleSubtitle) {
    moduleSubtitle.textContent = copy.subtitle;
  }
  if (module === 'siniestros') {
    renderSiniestros();
  }
  if (module === 'overview') {
    renderOverview();
  }
}

function renderOverview() {
  const claims = state.claims;
  const openCount = claims.filter((claim) => claim.state !== 'Cerrado').length;
  const fastTrackCount = claims.filter((claim) => claim.fastTrack).length;
  const alertCount = claims.filter((claim) => getAlertLevel(claim).level !== 'ok').length;
  const closedClaims = claims.filter((claim) => claim.state === 'Cerrado');
  const averageDays = closedClaims.length
    ? Math.round(
        closedClaims.reduce((acc, claim) => acc + Math.max(1, businessDaysBetween(claim.eventDate, claim.lastUpdate)), 0) /
          closedClaims.length,
      )
    : 0;
  document.getElementById('stat-open').textContent = openCount;
  document.getElementById('stat-fast-track').textContent = fastTrackCount;
  document.getElementById('stat-alerts').textContent = alertCount;
  document.getElementById('stat-average').textContent = `${averageDays} días`;
  renderFunnelOverview();
  renderReminderList();
}

function renderFunnelOverview() {
  const container = document.getElementById('funnel-overview');
  if (!container) return;
  container.innerHTML = statusOrder
    .map((status) => {
      const count = state.claims.filter((claim) => claim.state === status).length;
      return `<div class=\"funnel__step\"><span>${status}</span><strong>${count}</strong></div>`;
    })
    .join('');
}

function renderReminderList() {
  const list = document.getElementById('reminder-list');
  if (!list) return;
  if (state.reminders.length === 0) {
    list.innerHTML = '<p class="form-helper">No hay recordatorios configurados.</p>';
    return;
  }
  list.innerHTML = state.reminders
    .map((reminder) => {
      const due = new Date(reminder.dueDate);
      return `<li class=\"reminder\">
          <strong>${reminder.title}</strong>
          <small>Vence el ${formatDate(due)}</small>
        </li>`;
    })
    .join('');
}

function renderSiniestros() {
  renderKanban();
  renderAlertList();
  renderAutomationList();
}

function getFilteredClaims() {
  const { search, status, workshop, consorcio, claim, from, to } = state.filters;
  return state.claims.filter((item) => {
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
        : claim === 'si'
        ? item.hasRecovery
        : claim === 'no'
        ? !item.hasRecovery
        : true;
    const matchesFrom = from ? new Date(item.eventDate) >= new Date(from) : true;
    const matchesTo = to ? new Date(item.eventDate) <= new Date(to) : true;
    return (
      matchesSearch &&
      matchesStatus &&
      matchesWorkshop &&
      matchesConsorcio &&
      matchesClaim &&
      matchesFrom &&
      matchesTo
    );
  });
}

function renderKanban() {
  const container = document.getElementById('kanban-board');
  if (!container) return;
  const filtered = getFilteredClaims();
  const columns = statusOrder.map((status) => {
    const items = filtered.filter((claim) => claim.state === status);
    return {
      status,
      items,
    };
  });
  container.innerHTML = columns
    .map(
      ({ status, items }) => `
        <section class="kanban__column">
          <div class="kanban__header">
            <span class="kanban__title">${status}</span>
            <span class="kanban__count">${items.length}</span>
          </div>
          ${
            items.length === 0
              ? '<p class="form-helper">Sin casos en este estado.</p>'
              : items
                  .map((claim) => {
                    const alert = getAlertLevel(claim);
                    const badgeClass =
                      alert.level === 'danger'
                        ? 'tag tag--danger'
                        : alert.level === 'warning'
                        ? 'tag tag--warning'
                        : 'tag tag--success';
                    const consorcioBadge = claim.consorcioFlag
                      ? `<span class="badge badge--consorcio">${claim.consorcio}</span>`
                      : '';
                    const workshopBadge = claim.workshopName
                      ? `<span class="badge badge--workshop">${claim.workshopName}</span>`
                      : '';
                    const claimBadge = claim.hasRecovery
                      ? '<span class="badge badge--claim">Con reclamo</span>'
                      : '';
                    return `
                      <article class="kanban-card">
                        <div class="kanban-card__header">
                          <div>
                            <h4 class="kanban-card__title">${claim.id}</h4>
                            <div class="kanban-card__meta">
                              <span>${claim.name}</span>
                              <span>${claim.plate}</span>
                              <span>Ocurrió ${formatRelativeDate(claim.eventDate)}</span>
                            </div>
                          </div>
                          <span class="${badgeClass}">${alert.message}</span>
                        </div>
                        <p>${claim.stage}</p>
                        <div class="kanban-card__meta">
                          ${consorcioBadge}
                          ${workshopBadge}
                          ${claimBadge}
                        </div>
                        <div class="kanban-card__meta">
                          <span>Última actualización: ${formatRelativeDate(claim.lastUpdate)}</span>
                        </div>
                        <button class="btn btn--ghost" data-action="open-claim" data-claim="${claim.id}">Ver detalle</button>
                      </article>`;
                  })
                  .join('')
          }
        </section>`
    )
    .join('');

  container.querySelectorAll('[data-action="open-claim"]').forEach((button) => {
    button.addEventListener('click', () => openClaimDetailModal(button.dataset.claim));
  });
}

function renderAlertList() {
  const list = document.getElementById('alert-list');
  if (!list) return;
  const alerts = state.claims
    .map((claim) => ({ claim, alert: getAlertLevel(claim) }))
    .filter(({ alert }) => alert.level !== 'ok');
  if (alerts.length === 0) {
    list.innerHTML = '<p class="form-helper">Sin alertas activas. ¡Buen trabajo!</p>';
    return;
  }
  list.innerHTML = alerts
    .map(({ claim, alert }) => {
      const badgeClass =
        alert.level === 'danger'
          ? 'alert-badge alert-badge--danger'
          : alert.level === 'warning'
          ? 'alert-badge alert-badge--warning'
          : 'alert-badge alert-badge--success';
      return `<li class="alert-item">
          <div>
            <strong>${claim.id} - ${claim.name}</strong>
            <p>${alert.detail}</p>
          </div>
          <span class="${badgeClass}">${alert.message}</span>
        </li>`;
    })
    .join('');
}

function renderAutomationList() {
  const list = document.getElementById('automation-list');
  if (!list) return;
  const automationItems = state.claims.flatMap((claim) => {
    return claim.tasks
      .filter((task) => !task.completed)
      .map((task) => {
        return {
          claimId: claim.id,
          task,
        };
      });
  });
  if (automationItems.length === 0) {
    list.innerHTML = '<p class="form-helper">No hay tareas pendientes asociadas a automatizaciones.</p>';
    return;
  }
  list.innerHTML = automationItems
    .map(({ claimId, task }) => {
      const overdue = daysDifference(new Date(task.dueDate), new Date()) < 0;
      const badge = overdue ? '<span class="tag tag--danger">Vencida</span>' : '';
      return `<li class="alert-item">
          <div>
            <strong>${task.label}</strong>
            <p>Siniestro ${claimId} · Vence el ${formatDate(task.dueDate)}</p>
          </div>
          ${badge}
        </li>`;
    })
    .join('');
}

function renderAutomationsModule() {
  const rulesList = document.getElementById('automation-rules');
  if (!rulesList) return;
  rulesList.innerHTML = automationRules
    .map(
      (rule) => `<li class="automation-rule">
        <strong>${rule.name}</strong>
        <p>${rule.description}</p>
      </li>`
    )
    .join('');
}

function renderConfigModule() {
  const container = document.getElementById('config-grid');
  if (!container) return;
  const roles = catalogSummary.roles
    .map(
      (role) => `<div class="config-card">
        <strong>${role.name}</strong>
        <ul>${role.permissions.map((permission) => `<li>${permission}</li>`).join('')}</ul>
      </div>`
    )
    .join('');
  const workshopCards = catalogSummary.workshops
    .filter((workshop) => workshop.id !== 'taller-particular')
    .map(
      (workshop) => `<div class="config-card">
        <strong>${workshop.name}</strong>
        <small>${workshop.address}</small>
        <p>Responsable: ${workshop.manager}</p>
        <p>Capacidad: ${workshop.capacity} vehículos</p>
      </div>`
    )
    .join('');
  const consorcioCards = catalogSummary.consortia
    .map((consorcio) => `<div class="config-card"><strong>${consorcio.name}</strong></div>`)
    .join('');
  const peopleCards = catalogSummary.people
    .map(
      (person) => `<div class="config-card">
        <strong>${person.name}</strong>
        <p>${person.role}</p>
        <small>${person.contact}</small>
      </div>`
    )
    .join('');
  container.innerHTML = `
    <div>
      <h3>Roles</h3>
      <div class="grid grid--two">${roles}</div>
    </div>
    <div>
      <h3>Talleres</h3>
      <div class="grid grid--two">${workshopCards}</div>
    </div>
    <div>
      <h3>Consorcios</h3>
      <div class="grid grid--two">${consorcioCards}</div>
    </div>
    <div>
      <h3>Personas a cargo</h3>
      <div class="grid grid--two">${peopleCards}</div>
    </div>`;
}

function openClaimDetailModal(claimId) {
  const claim = state.claims.find((item) => item.id === claimId);
  if (!claim) return;
  const alert = getAlertLevel(claim);
  const modal = createModal(`Detalle del siniestro ${claim.id}`, () => closeModal());
  const body = modal.querySelector('.modal__body');
  body.innerHTML = `
    <div class="detail-grid">
      <div>
        <p class="section-title">Datos del asegurado</p>
        <div class="history-item">
          <strong>${claim.name}</strong>
          <small>DNI ${claim.dni} · Patente ${claim.plate}</small>
          <small>Consorcio: ${claim.consorcio || 'Sin consorcio'}</small>
        </div>
      </div>
      <div>
        <p class="section-title">Estado actual</p>
        <div class="history-item">
          <label class="input-field">
            <span>Estado</span>
            <select id="detail-state">
              ${statusOrder.map((status) => `<option value="${status}" ${status === claim.state ? 'selected' : ''}>${status}</option>`).join('')}
            </select>
          </label>
          <label class="input-field">
            <span>Descripción de etapa</span>
            <textarea id="detail-stage" class="textarea">${claim.stage || ''}</textarea>
          </label>
          <span class="tag ${alert.level === 'danger' ? 'tag--danger' : alert.level === 'warning' ? 'tag--warning' : 'tag--success'}">${alert.message}</span>
        </div>
      </div>
    </div>
    <div class="detail-grid">
      <div>
        <p class="section-title">Taller y responsable</p>
        <div class="history-item">
          <label class="input-field">
            <span>Ingreso a taller</span>
            <select id="detail-workshop">
              <option value="">Sin derivar</option>
              ${workshops
                .filter((item) => item.id !== 'taller-particular')
                .map((item) => `<option value="${item.id}" ${item.id === claim.workshop ? 'selected' : ''}>${item.name}</option>`)
                .join('')}
              <option value="taller-particular" ${claim.workshop === 'taller-particular' ? 'selected' : ''}>Taller particular</option>
            </select>
          </label>
          <label class="input-field">
            <span>Persona a cargo</span>
            <input id="detail-person" value="${claim.assignedPerson || ''}" placeholder="Nombre" />
          </label>
          <label class="input-field">
            <span>Fecha de inspección</span>
            <input type="date" id="detail-inspection" value="${claim.inspectionDate ? toDateInput(claim.inspectionDate) : ''}" />
          </label>
        </div>
      </div>
      <div>
        <p class="section-title">Notas y seguimiento</p>
        <div class="history-item">
          <label class="input-field">
            <span>Notas Fast Track / Observaciones</span>
            <textarea id="detail-notes" class="textarea">${claim.fastTrackNotes || ''}</textarea>
          </label>
          <div class="comment-box">
            <textarea id="detail-comment" placeholder="Agregar comentario o seguimiento"></textarea>
            <button class="btn btn--primary" id="detail-add-comment">Registrar seguimiento</button>
          </div>
        </div>
      </div>
    </div>
    <div>
      <p class="section-title">Tareas</p>
      <ul class="task-list" id="detail-task-list">
        ${claim.tasks
          .map(
            (task) => `<li class="task-item">
              <label>
                <input type="checkbox" data-task="${task.id}" ${task.completed ? 'checked' : ''} />
                ${task.label}
              </label>
              <small>Vence ${formatDate(task.dueDate)}</small>
            </li>`
          )
          .join('')}
      </ul>
    </div>
    <div class="detail-grid">
      <div>
        <p class="section-title">Adjuntos</p>
        <ul class="history-list">
          ${
            claim.attachments.length === 0
              ? '<li>No hay archivos adjuntos.</li>'
              : claim.attachments
                  .map((file) => `<li class="history-item"><strong>${file.name}</strong><small>${file.type} · ${file.size}</small></li>`)
                  .join('')
          }
          <li class="file-input">
            <label>
              <input type="file" id="detail-add-file" multiple hidden />
              <span class="btn btn--ghost">Agregar adjuntos</span>
            </label>
          </li>
        </ul>
      </div>
      <div>
        <p class="section-title">Historial</p>
        <ul class="history-list">
          ${claim.history
            .map(
              (item) => `<li class="history-item">
                <strong>${formatDateTime(item.date)}</strong>
                <small>${item.user}</small>
                <p>${item.changes.join(', ')}</p>
              </li>`
            )
            .join('')}
        </ul>
      </div>
    </div>
    <div>
      <p class="section-title">Seguimientos</p>
      <ul class="history-list" id="detail-followups">
        ${
          claim.followUps.length === 0
            ? '<li class="history-item">No hay seguimientos registrados.</li>'
            : claim.followUps
                .map(
                  (follow) => `<li class="history-item">
                    <strong>${formatDateTime(follow.date)}</strong>
                    <small>${follow.user}</small>
                    <p>${follow.comment}</p>
                  </li>`
                )
                .join('')
        }
      </ul>
    </div>`;

  modal.querySelector('.modal__footer').innerHTML = `
    <button class="btn btn--ghost" data-action="close">Cerrar</button>
    <button class="btn btn--primary" data-action="save">Guardar cambios</button>`;

  modal.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  modal.querySelector('[data-action="save"]').addEventListener('click', () => {
    persistClaimChanges(claim.id, modal);
    closeModal();
    renderAll();
    showToast(`Se guardaron los cambios del siniestro ${claim.id}.`);
  });
  modal.querySelector('#detail-add-comment').addEventListener('click', () => {
    const textarea = modal.querySelector('#detail-comment');
    if (!textarea.value.trim()) return;
    addFollowUp(claim.id, textarea.value.trim());
    textarea.value = '';
    renderAll();
    closeModal();
    openClaimDetailModal(claim.id);
  });
  modal.querySelectorAll('#detail-task-list input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', () => {
      toggleTask(claim.id, checkbox.dataset.task, checkbox.checked);
      renderAll();
      closeModal();
      openClaimDetailModal(claim.id);
    });
  });
  const fileInputWrapper = modal.querySelector('#detail-add-file');
  if (fileInputWrapper) {
    fileInputWrapper.addEventListener('change', (event) => {
      const files = Array.from(event.target.files || []);
      if (files.length === 0) return;
      appendAttachments(claim.id, files);
      renderAll();
      closeModal();
      openClaimDetailModal(claim.id);
    });
  }
}

function persistClaimChanges(claimId, modal) {
  const claim = state.claims.find((item) => item.id === claimId);
  if (!claim) return;
  const newState = modal.querySelector('#detail-state').value;
  const stage = modal.querySelector('#detail-stage').value.trim();
  const workshop = modal.querySelector('#detail-workshop').value;
  const person = modal.querySelector('#detail-person').value.trim();
  const inspection = modal.querySelector('#detail-inspection').value;
  const notes = modal.querySelector('#detail-notes').value.trim();
  const changes = [];
  if (claim.state !== newState) {
    changes.push(`Estado: ${claim.state} → ${newState}`);
    claim.state = newState;
  }
  if (claim.stage !== stage) {
    changes.push('Actualización de etapa');
    claim.stage = stage;
  }
  const workshopName = workshop ? (workshops.find((item) => item.id === workshop)?.name || 'Taller particular') : '';
  if (claim.workshop !== workshop) {
    changes.push(`Taller: ${claim.workshopName || 'Sin taller'} → ${workshopName || 'Sin taller'}`);
    claim.workshop = workshop || null;
    claim.workshopName = workshopName;
  }
  if ((claim.assignedPerson || '') !== person) {
    changes.push('Responsable actualizado');
    claim.assignedPerson = person || null;
  }
  const inspectionValue = inspection ? new Date(inspection).toISOString() : null;
  if ((claim.inspectionDate || null) !== inspectionValue) {
    changes.push('Fecha de inspección actualizada');
    claim.inspectionDate = inspectionValue;
  }
  if ((claim.fastTrackNotes || '') !== notes) {
    changes.push('Notas actualizadas');
    claim.fastTrackNotes = notes;
  }
  if (changes.length > 0) {
    appendHistory(claim, changes);
  }
}

function appendHistory(claim, changes) {
  claim.lastUpdate = new Date().toISOString();
  claim.history.unshift({
    date: claim.lastUpdate,
    user: state.currentUser ? state.currentUser.username : 'sistema',
    changes,
  });
}

function toggleTask(claimId, taskId, completed) {
  const claim = state.claims.find((item) => item.id === claimId);
  if (!claim) return;
  const task = claim.tasks.find((item) => item.id === taskId);
  if (!task) return;
  task.completed = completed;
  appendHistory(claim, [completed ? `Tarea completada: ${task.label}` : `Tarea marcada como pendiente: ${task.label}`]);
  if (completed) {
    claim.lastUpdate = new Date().toISOString();
  }
  if (completed && claim.tasks.every((item) => item.completed) && claim.state !== 'Cerrado') {
    claim.state = 'Documentación';
    appendHistory(claim, ['Todas las tareas completadas. Listo para revisión.']);
  }
}

function addFollowUp(claimId, comment) {
  const claim = state.claims.find((item) => item.id === claimId);
  if (!claim) return;
  const entry = {
    date: new Date().toISOString(),
    user: state.currentUser ? state.currentUser.username : 'sistema',
    comment,
  };
  claim.followUps.unshift(entry);
  appendHistory(claim, ['Nuevo seguimiento agregado']);
}

function appendAttachments(claimId, files) {
  const claim = state.claims.find((item) => item.id === claimId);
  if (!claim) return;
  const newFiles = files.map((file) => ({ name: file.name, type: file.type || 'Archivo', size: formatFileSize(file.size) }));
  claim.attachments.push(...newFiles);
  appendHistory(claim, ['Se agregaron archivos adjuntos']);
}

function openNotificationsModal() {
  const modal = createModal('Notificaciones del sistema', () => closeModal());
  const body = modal.querySelector('.modal__body');
  if (state.notifications.length === 0) {
    body.innerHTML = '<p class="form-helper">No hay notificaciones pendientes.</p>';
  } else {
    body.innerHTML = `<ul class="notification-list">${state.notifications
      .map(
        (notification) => `<li class="notification">
            <strong>${notification.title}</strong>
            <small>${formatDateTime(notification.date)}</small>
            <p>${notification.detail}</p>
          </li>`
      )
      .join('')}</ul>`;
  }
  modal.querySelector('.modal__footer').innerHTML = '<button class="btn btn--primary">Entendido</button>';
  modal.querySelector('.modal__footer button').addEventListener('click', closeModal);
}

function openReminderModal() {
  const modal = createModal('Nuevo recordatorio', () => closeModal());
  const body = modal.querySelector('.modal__body');
  body.innerHTML = `
    <div class="form-grid">
      <label class="input-field">
        <span>Título</span>
        <input id="reminder-title" placeholder="Seguimiento del siniestro" />
      </label>
      <label class="input-field">
        <span>Fecha límite</span>
        <input type="date" id="reminder-date" />
      </label>
    </div>`;
  modal.querySelector('.modal__footer').innerHTML = `
    <button class="btn btn--ghost" data-action="close">Cancelar</button>
    <button class="btn btn--primary" data-action="save">Guardar recordatorio</button>`;
  modal.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  modal.querySelector('[data-action="save"]').addEventListener('click', () => {
    const title = body.querySelector('#reminder-title').value.trim();
    const date = body.querySelector('#reminder-date').value;
    if (!title || !date) {
      showToast('Completa título y fecha para guardar el recordatorio.');
      return;
    }
    state.reminders.push({
      id: `rem-${Date.now()}`,
      title,
      dueDate: date,
      createdBy: state.currentUser ? state.currentUser.username : 'sistema',
    });
    renderOverview();
    closeModal();
  });
}

function renderInsuredResult(match, query) {
  const container = document.getElementById('insured-result');
  if (!container) return;
  if (!match) {
    container.innerHTML = `<p>No encontramos resultados para "${query}". Revisa los datos ingresados.</p>`;
    return;
  }
  container.innerHTML = `
    <div>
      <strong>${match.name}</strong>
      <p>DNI ${match.dni} · Patente ${match.plate}</p>
      <p>Email ${match.email} · Tel ${match.phone}</p>
    </div>
    <div>
      <p><strong>Modelo:</strong> ${match.vehicle.brand} ${match.vehicle.model} (${match.vehicle.year})</p>
      <p><strong>Cobertura:</strong> ${match.vehicle.coverage}</p>
      <p><strong>Cía:</strong> ${match.vehicle.company}</p>
      <p><strong>Suma asegurada:</strong> ${match.vehicle.sum}</p>
    </div>
    <div>
      <p><strong>Motor:</strong> ${match.vehicle.engine}</p>
      <p><strong>Chasis:</strong> ${match.vehicle.chassis}</p>
      <p><strong>Consorcio:</strong> ${match.vehicle.consorcio}</p>
    </div>`;
}

function openNewClaimModal() {
  const modalState = {
    step: 1,
    draft: {
      id: generateClaimId(),
      plate: '',
      dni: '',
      name: '',
      eventDate: '',
      reportDate: toDateInput(new Date()),
      description: '',
      consorcioFlag: false,
      consorcioOption: '',
      hasRecovery: false,
      workshop: '',
      workshopName: '',
      assignedPerson: '',
      inspectionDate: '',
      fastTrack: false,
      fastTrackNotes: '',
      closeDirectly: false,
      attachments: [],
      duplicates: [],
    },
  };
  const modal = createModal('Nuevo siniestro', () => closeModal());
  const body = modal.querySelector('.modal__body');
  const footer = modal.querySelector('.modal__footer');
  modal.querySelector('.modal__header').insertAdjacentHTML(
    'beforeend',
    `<div class="stepper" id="new-claim-stepper">
      <span class="stepper__step is-active" data-step="1">1 · Datos básicos</span>
      <span class="stepper__step" data-step="2">2 · Consorcio y reclamo</span>
      <span class="stepper__step" data-step="3">3 · Taller y resolución</span>
    </div>`,
  );
  const stepper = modal.querySelector('#new-claim-stepper');

  function renderStep() {
    stepper.querySelectorAll('.stepper__step').forEach((stepEl) => {
      const stepValue = Number(stepEl.dataset.step);
      stepEl.classList.toggle('is-active', stepValue === modalState.step);
      stepEl.classList.toggle('is-complete', stepValue < modalState.step);
    });
    body.innerHTML = getStepMarkup(modalState);
    attachStepEvents();
    footer.innerHTML = `
      <button class="btn btn--ghost" data-action="back" ${modalState.step === 1 ? 'disabled' : ''}>Atrás</button>
      <div style="display:flex;gap:12px;">
        <button class="btn btn--ghost" data-action="cancel">Cancelar</button>
        <button class="btn btn--primary" data-action="next">${modalState.step === 3 ? 'Crear siniestro' : 'Siguiente'}</button>
      </div>`;
    footer.querySelector('[data-action="cancel"]').addEventListener('click', closeModal);
    const backButton = footer.querySelector('[data-action="back"]');
    backButton.addEventListener('click', () => {
      if (modalState.step > 1) {
        modalState.step -= 1;
        renderStep();
      }
    });
    footer.querySelector('[data-action="next"]').addEventListener('click', () => {
      if (!validateStep(modalState)) return;
      if (modalState.step === 3) {
        persistNewClaim(modalState.draft);
        closeModal();
        renderAll();
        showToast(`Se creó el siniestro ${modalState.draft.id}.`);
        return;
      }
      modalState.step += 1;
      renderStep();
    });
  }

  function attachStepEvents() {
    if (modalState.step === 1) {
      const form = body.querySelector('form');
      form.addEventListener('input', (event) => updateDraft(modalState, event));
      form.addEventListener('change', (event) => updateDraft(modalState, event));
      form.addEventListener('submit', (event) => event.preventDefault());
      form.querySelector('[data-action="lookup"]').addEventListener('click', () => lookupInsured(modalState));
    }
    if (modalState.step === 2) {
      body.querySelectorAll('input, select, textarea').forEach((input) => {
        input.addEventListener('change', (event) => updateDraft(modalState, event));
      });
    }
    if (modalState.step === 3) {
      body.querySelectorAll('input, select, textarea').forEach((input) => {
        input.addEventListener('change', (event) => updateDraft(modalState, event));
      });
      const fileInput = body.querySelector('#new-claim-files');
      fileInput.addEventListener('change', (event) => {
        const files = Array.from(event.target.files || []);
        modalState.draft.attachments = files.map((file) => ({
          name: file.name,
          type: file.type || 'Archivo',
          size: formatFileSize(file.size),
        }));
      });
    }
  }

  renderStep();
}

function updateDraft(modalState, event) {
  const { draft } = modalState;
  const target = event.target;
  const { name, value, checked } = target;
  if (!name) return;
  switch (name) {
    case 'plate':
      draft.plate = value.toUpperCase();
      break;
    case 'dni':
      draft.dni = value;
      break;
    case 'name':
      draft.name = value;
      break;
    case 'eventDate':
      draft.eventDate = value;
      draft.duplicates = detectDuplicates(draft);
      displayDuplicateWarning(draft.duplicates);
      break;
    case 'reportDate':
      draft.reportDate = value;
      break;
    case 'description':
      draft.description = value;
      break;
    case 'consorcioFlag':
      draft.consorcioFlag = checked;
      if (!checked) {
        draft.consorcioOption = '';
      }
      break;
    case 'consorcioOption':
      draft.consorcioOption = value;
      break;
    case 'hasRecovery':
      draft.hasRecovery = checked;
      break;
    case 'workshop':
      draft.workshop = value;
      draft.workshopName = value ? workshops.find((item) => item.id === value)?.name || '' : '';
      const suggested = value
        ? peopleInCharge.find((person) => person.workshops.includes(value))?.name || draft.assignedPerson
        : draft.assignedPerson;
      if (suggested) {
        const input = document.getElementById('new-claim-person');
        if (input) input.value = suggested;
        draft.assignedPerson = suggested;
      }
      break;
    case 'assignedPerson':
      draft.assignedPerson = value;
      break;
    case 'inspectionDate':
      draft.inspectionDate = value;
      break;
    case 'fastTrack':
      draft.fastTrack = checked;
      if (checked) {
        draft.workshop = '';
        draft.workshopName = '';
      }
      break;
    case 'closeDirectly':
      draft.closeDirectly = checked;
      break;
    case 'fastTrackNotes':
      draft.fastTrackNotes = value;
      break;
    default:
      break;
  }
}

function lookupInsured(modalState) {
  const { draft } = modalState;
  const match = insuredDirectory.find((insured) => {
    return (
      (draft.plate && insured.plate === draft.plate) ||
      (draft.dni && insured.dni === draft.dni) ||
      (draft.name && insured.name.toLowerCase().includes(draft.name.toLowerCase()))
    );
  });
  const helper = document.getElementById('insured-helper');
  if (match) {
    draft.name = match.name;
    draft.dni = match.dni;
    draft.consorcioFlag = true;
    draft.consorcioOption = consortia.find((item) => item.name === match.vehicle.consorcio)?.id || '';
    helper.innerHTML = `
      <strong>${match.name}</strong><br />
      ${match.vehicle.brand} ${match.vehicle.model} (${match.vehicle.year}) · Cobertura ${match.vehicle.coverage}<br />
      Consorcio: ${match.vehicle.consorcio}
    `;
    helper.classList.remove('hidden');
    const nameInput = document.querySelector('input[name="name"]');
    if (nameInput) nameInput.value = draft.name;
    const dniInput = document.querySelector('input[name="dni"]');
    if (dniInput) dniInput.value = draft.dni;
  } else {
    helper.textContent = 'No encontramos datos existentes para estos criterios.';
    helper.classList.remove('hidden');
  }
}

function detectDuplicates(draft) {
  if (!draft.plate || !draft.eventDate) return [];
  return state.claims.filter((claim) => claim.plate === draft.plate && claim.eventDate === draft.eventDate);
}

function displayDuplicateWarning(duplicates) {
  const container = document.getElementById('duplicate-warning');
  if (!container) return;
  if (duplicates.length === 0) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  container.classList.remove('hidden');
  container.innerHTML = `
    <strong>Posible duplicado detectado</strong>
    <p>Existe ${duplicates.length > 1 ? `${duplicates.length} siniestros` : 'un siniestro'} con mismo dominio y fecha:</p>
    <ul>
      ${duplicates.map((item) => `<li>${item.id} · Estado ${item.state}</li>`).join('')}
    </ul>
    <p>Puedes continuar la carga igualmente.</p>`;
}

function validateStep(modalState) {
  const { step, draft } = modalState;
  if (step === 1) {
    if (!draft.plate || !draft.dni || !draft.name || !draft.eventDate || !draft.description) {
      showToast('Completa los campos críticos (dominio, DNI, nombre, fecha y relato).');
      return false;
    }
  }
  if (step === 2) {
    if (draft.consorcioFlag && !draft.consorcioOption) {
      showToast('Selecciona el consorcio correspondiente.');
      return false;
    }
  }
  if (step === 3) {
    if (draft.workshop && !draft.inspectionDate) {
      showToast('Ingresa la fecha de inspección para el taller seleccionado.');
      return false;
    }
  }
  return true;
}

function persistNewClaim(draft) {
  const newClaim = {
    id: draft.id,
    plate: draft.plate,
    dni: draft.dni,
    name: draft.name,
    eventDate: draft.eventDate,
    reportDate: draft.reportDate,
    description: draft.description,
    consorcioFlag: draft.consorcioFlag,
    consorcioOption: draft.consorcioOption,
    consorcio: draft.consorcioFlag
      ? consortia.find((item) => item.id === draft.consorcioOption)?.name || 'Consorcio asignado'
      : 'Sin consorcio',
    hasRecovery: draft.hasRecovery,
    state: draft.closeDirectly ? 'Cerrado' : draft.fastTrack ? 'Fast Track' : draft.workshop ? 'Taller' : 'Ingreso',
    stage: draft.fastTrack
      ? 'Derivado a circuito Fast Track'
      : draft.workshop
      ? `Derivado a ${draft.workshopName}`
      : draft.closeDirectly
      ? 'Caso cerrado sin daños reportados'
      : 'Pendiente de revisión inicial',
    fastTrack: draft.fastTrack || false,
    workshop: draft.workshop || null,
    workshopName: draft.workshopName || '',
    assignedPerson: draft.assignedPerson || null,
    inspectionDate: draft.inspectionDate ? new Date(draft.inspectionDate).toISOString() : null,
    fastTrackNotes: draft.fastTrackNotes,
    history: [],
    followUps: [],
    attachments: [...draft.attachments],
    tasks: generateInitialTasks(draft),
    lastUpdate: new Date().toISOString(),
  };
  appendHistory(newClaim, ['Creación de siniestro desde mockup']);
  state.claims.unshift(newClaim);
}

function generateInitialTasks(draft) {
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

function getStepMarkup(modalState) {
  const { step, draft } = modalState;
  if (step === 1) {
    return `
      <form class="form-grid">
        <label class="input-field">
          <span>Patente</span>
          <input name="plate" value="${draft.plate}" placeholder="AA123BB" required />
        </label>
        <label class="input-field">
          <span>DNI</span>
          <input name="dni" value="${draft.dni}" placeholder="00000000" required />
        </label>
        <label class="input-field">
          <span>Nombre y apellido</span>
          <input name="name" value="${draft.name}" placeholder="Nombre completo" required />
        </label>
        <label class="input-field">
          <span>Fecha de siniestro</span>
          <input type="date" name="eventDate" value="${draft.eventDate}" required />
        </label>
        <label class="input-field">
          <span>Fecha de denuncia</span>
          <input type="date" name="reportDate" value="${draft.reportDate}" />
        </label>
        <label class="input-field" style="grid-column: 1 / -1;">
          <span>Relato del siniestro</span>
          <textarea class="textarea" name="description" placeholder="Describe lo ocurrido" required>${draft.description}</textarea>
        </label>
        <div class="file-input" id="duplicate-warning"></div>
        <div class="comment-box" style="grid-column: 1 / -1;">
          <button type="button" class="btn btn--ghost" data-action="lookup">Buscar datos del asegurado</button>
          <small id="insured-helper" class="form-helper hidden"></small>
        </div>
      </form>`;
  }
  if (step === 2) {
    return `
      <div class="form-grid">
        <label class="input-field">
          <span>¿Pertenece a consorcio?</span>
          <input type="checkbox" name="consorcioFlag" ${draft.consorcioFlag ? 'checked' : ''} />
        </label>
        <label class="input-field">
          <span>Consorcio</span>
          <select name="consorcioOption" ${draft.consorcioFlag ? '' : 'disabled'}>
            <option value="">Selecciona consorcio</option>
            ${consortia
              .map((item) => `<option value="${item.id}" ${item.id === draft.consorcioOption ? 'selected' : ''}>${item.name}</option>`)
              .join('')}
          </select>
        </label>
        <label class="input-field">
          <span>¿Genera reclamo a terceros?</span>
          <input type="checkbox" name="hasRecovery" ${draft.hasRecovery ? 'checked' : ''} />
        </label>
        <label class="input-field" style="grid-column: 1 / -1;">
          <span>Notas / Detalles adicionales</span>
          <textarea name="fastTrackNotes" class="textarea" placeholder="Notas para recuperación o consorcio">${draft.fastTrackNotes}</textarea>
        </label>
      </div>`;
  }
  return `
    <div class="form-grid">
      <label class="input-field">
        <span>¿Ingreso a taller?</span>
        <select name="workshop">
          <option value="">No por el momento</option>
          ${workshops
            .map((item) => `<option value="${item.id}" ${item.id === draft.workshop ? 'selected' : ''}>${item.name}</option>`)
            .join('')}
        </select>
      </label>
      <label class="input-field">
        <span>Fecha de inspección</span>
        <input type="date" name="inspectionDate" value="${draft.inspectionDate}" ${draft.workshop ? '' : 'disabled'} />
      </label>
      <label class="input-field">
        <span>Persona a cargo</span>
        <input id="new-claim-person" name="assignedPerson" value="${draft.assignedPerson}" placeholder="Nombre del responsable" />
      </label>
      <label class="input-field">
        <span>¿Gestionar como Fast Track?</span>
        <input type="checkbox" name="fastTrack" ${draft.fastTrack ? 'checked' : ''} />
      </label>
      <label class="input-field">
        <span>¿Sin daños y cierre inmediato?</span>
        <input type="checkbox" name="closeDirectly" ${draft.closeDirectly ? 'checked' : ''} />
      </label>
      <label class="input-field" style="grid-column: 1 / -1;">
        <span>Comentarios finales</span>
        <textarea name="fastTrackNotes" class="textarea" placeholder="Observaciones de seguimiento">${draft.fastTrackNotes}</textarea>
      </label>
      <div class="file-input" style="grid-column: 1 / -1;">
        <label>
          Adjuntar documentación
          <input type="file" id="new-claim-files" multiple hidden />
          <span class="btn btn--ghost" style="margin-top:8px;">Seleccionar archivos</span>
        </label>
      </div>
    </div>`;
}

function generateClaimId() {
  const existingIds = state.claims
    .map((claim) => Number(claim.id.replace(/\D/g, '')))
    .filter((num) => !Number.isNaN(num));
  const nextNumber = existingIds.length ? Math.max(...existingIds) + 1 : 1;
  return `SIN-${new Date().getFullYear()}-${String(nextNumber).padStart(3, '0')}`;
}

function openChangePasswordModal() {
  if (!state.currentUser) {
    showToast('Debes iniciar sesión para cambiar la contraseña.');
    return;
  }
  const modal = createModal('Cambiar contraseña', () => closeModal());
  const body = modal.querySelector('.modal__body');
  body.innerHTML = `
    <div class="form-grid">
      <label class="input-field">
        <span>Contraseña actual</span>
        <input type="password" id="current-password" />
      </label>
      <label class="input-field">
        <span>Nueva contraseña</span>
        <input type="password" id="new-password" />
      </label>
      <label class="input-field">
        <span>Confirmar nueva contraseña</span>
        <input type="password" id="confirm-password" />
      </label>
    </div>`;
  modal.querySelector('.modal__footer').innerHTML = `
    <button class="btn btn--ghost" data-action="close">Cancelar</button>
    <button class="btn btn--primary" data-action="save">Actualizar</button>`;
  modal.querySelector('[data-action="close"]').addEventListener('click', closeModal);
  modal.querySelector('[data-action="save"]').addEventListener('click', () => {
    const current = body.querySelector('#current-password').value;
    const next = body.querySelector('#new-password').value;
    const confirm = body.querySelector('#confirm-password').value;
    if (!current || !next || !confirm) {
      showToast('Completa todos los campos de contraseña.');
      return;
    }
    if (next !== confirm) {
      showToast('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    const user = users.find((item) => item.username === state.currentUser.username);
    if (!user || user.password !== current) {
      showToast('La contraseña actual no es correcta.');
      return;
    }
    user.password = next;
    showToast('Contraseña actualizada correctamente.');
    closeModal();
  });
}

function createModal(title, onClose) {
  modalLayer.innerHTML = `
    <div class="modal">
      <header class="modal__header">
        <h2>${title}</h2>
        <button class="btn btn--ghost" data-action="close">Cerrar</button>
      </header>
      <div class="modal__body"></div>
      <footer class="modal__footer"></footer>
    </div>`;
  modalLayer.classList.add('is-visible');
  const modal = modalLayer.querySelector('.modal');
  modal.querySelector('[data-action="close"]').addEventListener('click', () => {
    closeModal();
    if (typeof onClose === 'function') onClose();
  });
  return modal;
}

function closeModal() {
  modalLayer.classList.remove('is-visible');
  modalLayer.innerHTML = '';
}

function exportClaimsToCsv(claims) {
  if (!claims.length) {
    showToast('No hay información para exportar.');
    return;
  }
  const headers = ['ID', 'Patente', 'DNI', 'Asegurado', 'Fecha de siniestro', 'Estado', 'Consorcio', 'Taller', 'Reclamo', 'Fast Track'];
  const rows = claims.map((claim) => [
    claim.id,
    claim.plate,
    claim.dni,
    claim.name,
    claim.eventDate,
    claim.state,
    claim.consorcio,
    claim.workshopName || '',
    claim.hasRecovery ? 'Sí' : 'No',
    claim.fastTrack ? 'Sí' : 'No',
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell ?? ''}"`).join(';')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `siniestros-${Date.now()}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.style.position = 'fixed';
  toast.style.bottom = '24px';
  toast.style.right = '24px';
  toast.style.background = '#0f172a';
  toast.style.color = 'white';
  toast.style.padding = '12px 18px';
  toast.style.borderRadius = '12px';
  toast.style.boxShadow = '0 12px 30px rgba(15, 23, 42, 0.3)';
  toast.style.zIndex = '100';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

function getAlertLevel(claim) {
  const pendingTask = claim.tasks.filter((task) => !task.completed).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0];
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

function formatDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value) {
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

function formatRelativeDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = daysDifference(date, new Date());
  if (diff === 0) return 'hoy';
  if (diff === 1) return 'hace 1 día';
  if (diff > 1) return `hace ${diff} días`;
  return `en ${Math.abs(diff)} días`;
}

function daysDifference(from, to) {
  const start = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const end = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  const diff = (end - start) / (1000 * 60 * 60 * 24);
  return Math.round(diff);
}

function businessDaysBetween(from, to) {
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

function addBusinessDays(date, days) {
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

function toDateInput(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
}

function formatFileSize(bytes) {
  if (!bytes) return '0 KB';
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  return `${(kb / 1024).toFixed(1)} MB`;
}

function getInitials(name) {
  if (!name) return 'LM';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

