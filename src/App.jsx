import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  users as initialUsers,
  claims as claimsData,
  consortia,
  workshops,
  peopleInCharge,
  insuredDirectory,
  automationRules,
  reminders as initialReminders,
  notifications as initialNotifications,
  catalogSummary,
} from './data/index.js';
import {
  STATUS_ORDER,
  cloneClaims,
  getInitials,
  formatDate,
  formatDateTime,
  formatRelativeDate,
  businessDaysBetween,
  getAlertLevel,
  filterClaims,
  generateClaimId,
  buildClaimFromDraft,
  appendHistory,
  applyClaimUpdates,
  toggleTaskOnClaim,
  addFollowUpToClaim,
  addAttachmentsToClaim,
  detectDuplicates,
  exportClaimsToCsv,
  toDateInput,
  formatFileSize,
} from './utils/index.js';

function App() {
  const [users, setUsers] = useState(() => initialUsers.map((user) => ({ ...user })));
  const [currentUser, setCurrentUser] = useState(null);
  const [activeModule, setActiveModule] = useState('overview');
  const [claims, setClaims] = useState(() => cloneClaims(claimsData));
  const [filters, setFilters] = useState({
    search: '',
    status: 'todos',
    workshop: 'todos',
    consorcio: 'todos',
    claim: 'todos',
    from: '',
    to: '',
  });
  const [reminders, setReminders] = useState(() => [...initialReminders]);
  const [notifications] = useState(() => [...initialNotifications]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 2400);
    return () => clearTimeout(timeout);
  }, [toast]);

  const showToast = (message) => {
    setToast({ id: Date.now(), message });
  };

  const filteredClaims = useMemo(() => filterClaims(claims, filters), [claims, filters]);

  const overviewStats = useMemo(() => {
    const openCount = claims.filter((claim) => claim.state !== 'Cerrado').length;
    const fastTrackCount = claims.filter((claim) => claim.fastTrack).length;
    const alertCount = claims.filter((claim) => getAlertLevel(claim).level !== 'ok').length;
    const closedClaims = claims.filter((claim) => claim.state === 'Cerrado');
    const averageDays = closedClaims.length
      ? Math.round(
          closedClaims.reduce(
            (acc, claim) => acc + Math.max(1, businessDaysBetween(claim.eventDate, claim.lastUpdate)),
            0,
          ) / closedClaims.length,
        )
      : 0;
    return { openCount, fastTrackCount, alertCount, averageDays };
  }, [claims]);

  const funnelData = useMemo(
    () =>
      STATUS_ORDER.map((status) => ({
        status,
        count: claims.filter((claim) => claim.state === status).length,
      })),
    [claims],
  );

  const alertEntries = useMemo(
    () =>
      claims
        .map((claim) => ({ claim, alert: getAlertLevel(claim) }))
        .filter(({ alert }) => alert.level !== 'ok'),
    [claims],
  );

  const automationTasks = useMemo(() => {
    const tasks = [];
    claims.forEach((claim) => {
      claim.tasks
        .filter((task) => !task.completed)
        .forEach((task) => {
          tasks.push({
            claimId: claim.id,
            task,
          });
        });
    });
    return tasks;
  }, [claims]);

  const handleLogin = ({ username, password }) => {
    const match = users.find((user) => user.username === username && user.password === password);
    if (!match) {
      setLoginError('Usuario o contraseña incorrectos. Intenta nuevamente.');
      return false;
    }
    setLoginError('');
    setCurrentUser({ ...match });
    setActiveModule('overview');
    showToast(`Bienvenido ${match.name.split(' ')[0]}!`);
    return true;
  };

  const handleRecover = (email) => {
    showToast(`Enviamos instrucciones de recuperación a ${email}.`);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveModule('overview');
  };

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'todos',
      workshop: 'todos',
      consorcio: 'todos',
      claim: 'todos',
      from: '',
      to: '',
    });
  };

  const handleExportClaims = () => {
    const blob = exportClaimsToCsv(filteredClaims);
    if (!blob) {
      showToast('No hay información para exportar.');
      return;
    }
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `siniestros-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReminderCreate = ({ title, date }) => {
    setReminders((prev) => [
      ...prev,
      {
        id: `rem-${Date.now()}`,
        title,
        dueDate: date,
        createdBy: currentUser ? currentUser.username : 'sistema',
      },
    ]);
    showToast('Recordatorio agregado correctamente.');
  };

  const handleClaimSave = (claimId, updates) => {
    setClaims((prev) =>
      prev.map((claim) => {
        if (claim.id !== claimId) return claim;
        return applyClaimUpdates(claim, updates, currentUser);
      }),
    );
    showToast(`Se guardaron los cambios del siniestro ${claimId}.`);
    setModal(null);
  };

  const handleFollowUp = (claimId, comment) => {
    setClaims((prev) =>
      prev.map((claim) => (claim.id === claimId ? addFollowUpToClaim(claim, comment, currentUser) : claim)),
    );
    showToast('Seguimiento registrado.');
  };

  const handleTaskToggle = (claimId, taskId, completed) => {
    setClaims((prev) =>
      prev.map((claim) => (claim.id === claimId ? toggleTaskOnClaim(claim, taskId, completed, currentUser) : claim)),
    );
    showToast('Tarea actualizada.');
  };

  const handleAddAttachments = (claimId, fileList) => {
    const files = Array.from(fileList || []).map((file) => ({
      name: file.name,
      type: file.type || 'Archivo',
      size: formatFileSize(file.size),
    }));
    if (!files.length) return;
    setClaims((prev) =>
      prev.map((claim) => (claim.id === claimId ? addAttachmentsToClaim(claim, files, currentUser) : claim)),
    );
    showToast('Adjuntos agregados.');
  };

  const handleCreateClaim = (draft) => {
    const newClaim = buildClaimFromDraft(draft);
    const enriched = appendHistory(newClaim, ['Creación de siniestro desde mockup'], currentUser);
    setClaims((prev) => [enriched, ...prev]);
    showToast(`Se creó el siniestro ${draft.id}.`);
    setModal(null);
  };

  const handleChangePassword = ({ current, next, confirm }) => {
    if (!current || !next || !confirm) {
      return { success: false, message: 'Completa todos los campos de contraseña.' };
    }
    if (next !== confirm) {
      return { success: false, message: 'La confirmación no coincide con la nueva contraseña.' };
    }
    const userRecord = users.find((user) => user.username === currentUser.username);
    if (!userRecord || userRecord.password !== current) {
      return { success: false, message: 'La contraseña actual no es correcta.' };
    }
    setUsers((prev) =>
      prev.map((user) => (user.username === currentUser.username ? { ...user, password: next } : user)),
    );
    showToast('Contraseña actualizada correctamente.');
    setModal(null);
    return { success: true };
  };

  const openNewClaimModal = () => {
    const draft = {
      id: generateClaimId(claims),
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
    };
    setModal({ type: 'new-claim', data: { draft } });
  };

  const openClaimDetailModal = (claimId) => {
    setModal({ type: 'claim-detail', data: { claimId } });
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

  const activeCopy = moduleCopy[activeModule] ?? moduleCopy.overview;

  return (
    <div className="app">
      {!currentUser ? (
        <LoginView onLogin={handleLogin} onRecover={handleRecover} error={loginError} />
      ) : (
        <Dashboard
          currentUser={currentUser}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
          moduleCopy={activeCopy}
          onLogout={handleLogout}
          onOpenNotifications={() => setModal({ type: 'notifications' })}
          onOpenChangePassword={() => setModal({ type: 'change-password' })}
        >
          {activeModule === 'overview' && (
            <OverviewModule
              stats={overviewStats}
              funnel={funnelData}
              reminders={reminders}
              onOpenReminder={() => setModal({ type: 'reminder' })}
            />
          )}
          {activeModule === 'siniestros' && (
            <SiniestrosModule
              claims={claims}
              filteredClaims={filteredClaims}
              filters={filters}
              consortia={consortia}
              workshops={workshops}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
              onExport={handleExportClaims}
              onNewClaim={openNewClaimModal}
              onOpenClaim={openClaimDetailModal}
              alertEntries={alertEntries}
              automationTasks={automationTasks}
            />
          )}
          {activeModule === 'consultas' && (
            <ConsultasModule insuredDirectory={insuredDirectory} />
          )}
          {activeModule === 'repuestos' && <PlaceholderModule />}
          {activeModule === 'automatizaciones' && (
            <AutomationsModule rules={automationRules} />
          )}
          {activeModule === 'configuracion' && (
            <ConfigModule catalog={catalogSummary} />
          )}
        </Dashboard>
      )}

      {toast && <Toast message={toast.message} />}

      {modal?.type === 'notifications' && (
        <NotificationsModal notifications={notifications} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'reminder' && (
        <ReminderModal onClose={() => setModal(null)} onSave={handleReminderCreate} />
      )}
      {modal?.type === 'claim-detail' && modal.data && (
        <ClaimDetailModal
          claim={claims.find((claim) => claim.id === modal.data.claimId)}
          onClose={() => setModal(null)}
          onSave={handleClaimSave}
          onAddFollowUp={handleFollowUp}
          onToggleTask={handleTaskToggle}
          onAddAttachments={handleAddAttachments}
          workshops={workshops}
        />
      )}
      {modal?.type === 'new-claim' && modal.data && (
        <NewClaimModal
          initialDraft={modal.data.draft}
          onClose={() => setModal(null)}
          onComplete={handleCreateClaim}
          consortia={consortia}
          workshops={workshops}
          peopleInCharge={peopleInCharge}
          insuredDirectory={insuredDirectory}
          existingClaims={claims}
          onShowToast={showToast}
        />
      )}
      {modal?.type === 'change-password' && (
        <ChangePasswordModal onClose={() => setModal(null)} onSubmit={handleChangePassword} />
      )}
    </div>
  );
}

function LoginView({ onLogin, onRecover, error }) {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', email: '' });

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === 'login') {
      const success = onLogin({ username: form.username, password: form.password });
      if (success) {
        setForm({ username: '', password: '', email: '' });
      }
    } else {
      if (!form.email) return;
      onRecover(form.email);
      setMode('login');
      setForm({ username: '', password: '', email: '' });
    }
  };

  return (
    <section className="view view--login">
      <div className="login-card">
        <div className="login-card__brand">
          <div className="logo-circle">LM</div>
          <div>
            <h1>LM Aseguradora</h1>
            <p>Portal de gestión de siniestros</p>
          </div>
        </div>
        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            <h2>Iniciar sesión</h2>
            <label className="input-field">
              <span>Usuario</span>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))}
                required
                autoComplete="username"
              />
            </label>
            <label className="input-field">
              <span>Contraseña</span>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
                autoComplete="current-password"
              />
            </label>
            {error && <p className="form-helper" style={{ color: 'var(--color-danger)' }}>{error}</p>}
            <div className="login-actions">
              <button type="submit" className="btn btn--primary">
                Ingresar
              </button>
              <button type="button" className="btn btn--link" onClick={() => setMode('recover')}>
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <p className="login-hint">Roles soportados: Administración, Supervisor y Operativo.</p>
          </form>
        ) : (
          <form className="login-form login-form--secondary" onSubmit={handleSubmit}>
            <h2>Recuperar contraseña</h2>
            <label className="input-field">
              <span>Correo electrónico</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                required
                autoComplete="email"
              />
            </label>
            <p className="form-helper">
              Recibirás un correo con las instrucciones para restablecer tu contraseña.
            </p>
            <div className="login-actions">
              <button type="submit" className="btn btn--primary">
                Enviar instrucciones
              </button>
              <button type="button" className="btn btn--ghost" onClick={() => setMode('login')}>
                Volver
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}

function Dashboard({
  currentUser,
  activeModule,
  onModuleChange,
  moduleCopy,
  onLogout,
  onOpenNotifications,
  onOpenChangePassword,
  children,
}) {
  return (
    <section className="view view--dashboard">
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="logo-circle logo-circle--small">LM</div>
          <div>
            <strong>LM Aseguradora</strong>
            <p>Panel integral</p>
          </div>
        </div>
        <nav className="sidebar__nav">
          <button
            className={`nav-item ${activeModule === 'overview' ? 'active' : ''}`}
            onClick={() => onModuleChange('overview')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeModule === 'siniestros' ? 'active' : ''}`}
            onClick={() => onModuleChange('siniestros')}
          >
            Siniestros
          </button>
          <button
            className={`nav-item ${activeModule === 'consultas' ? 'active' : ''}`}
            onClick={() => onModuleChange('consultas')}
          >
            Consultas
          </button>
          <button
            className={`nav-item ${activeModule === 'repuestos' ? 'active' : ''}`}
            onClick={() => onModuleChange('repuestos')}
          >
            Repuestos
          </button>
          <button
            className={`nav-item ${activeModule === 'automatizaciones' ? 'active' : ''}`}
            onClick={() => onModuleChange('automatizaciones')}
          >
            Automatizaciones
          </button>
          <button
            className={`nav-item ${activeModule === 'configuracion' ? 'active' : ''}`}
            onClick={() => onModuleChange('configuracion')}
          >
            Configuración
          </button>
        </nav>
        <div className="sidebar__footer">
          <button className="btn btn--ghost btn--full" onClick={onLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <h1>{moduleCopy.title}</h1>
            <p className="topbar__subtitle">{moduleCopy.subtitle}</p>
          </div>
          <div className="topbar__actions">
            <button className="btn btn--ghost" onClick={onOpenNotifications}>
              Notificaciones
            </button>
            <button className="btn btn--ghost" onClick={onOpenChangePassword}>
              Cambiar contraseña
            </button>
            <div className="user-chip">
              <div className="avatar">{getInitials(currentUser.name)}</div>
              <div>
                <span>{currentUser.name}</span>
                <small>{currentUser.role}</small>
              </div>
            </div>
          </div>
        </header>

        {children}
      </main>
    </section>
  );
}

function OverviewModule({ stats, funnel, reminders, onOpenReminder }) {
  return (
    <section className="module">
      <div className="grid grid--stats">
        <article className="stat-card">
          <h3>Casos activos</h3>
          <p className="stat-card__value">{stats.openCount}</p>
          <span className="stat-card__detail">Casos abiertos y en seguimiento</span>
        </article>
        <article className="stat-card">
          <h3>Fast track</h3>
          <p className="stat-card__value">{stats.fastTrackCount}</p>
          <span className="stat-card__detail">Casos resueltos sin derivación a taller</span>
        </article>
        <article className="stat-card">
          <h3>Alertas activas</h3>
          <p className="stat-card__value">{stats.alertCount}</p>
          <span className="stat-card__detail">Alertas amarillas y rojas</span>
        </article>
        <article className="stat-card">
          <h3>Tiempo promedio</h3>
          <p className="stat-card__value">{stats.averageDays} días</p>
          <span className="stat-card__detail">Duración de ciclo hasta cierre</span>
        </article>
      </div>

      <div className="grid grid--two">
        <section className="card">
          <header className="card__header">
            <h2>Embudo de estados</h2>
          </header>
          <div className="funnel">
            {funnel.map((step) => (
              <div key={step.status} className="funnel__step">
                <span>{step.status}</span>
                <strong>{step.count}</strong>
              </div>
            ))}
          </div>
        </section>
        <section className="card">
          <header className="card__header">
            <h2>Recordatorios automáticos</h2>
            <button className="btn btn--tiny" onClick={onOpenReminder}>
              Agregar recordatorio
            </button>
          </header>
          <ul className="reminder-list">
            {reminders.length === 0 ? (
              <li className="form-helper">No hay recordatorios configurados.</li>
            ) : (
              reminders.map((reminder) => (
                <li key={reminder.id} className="reminder">
                  <strong>{reminder.title}</strong>
                  <small>Vence el {formatDate(reminder.dueDate)}</small>
                </li>
              ))
            )}
          </ul>
        </section>
      </div>
    </section>
  );
}

function SiniestrosModule({
  claims,
  filteredClaims,
  filters,
  consortia,
  workshops,
  onFilterChange,
  onClearFilters,
  onExport,
  onNewClaim,
  onOpenClaim,
  alertEntries,
  automationTasks,
}) {
  const handleChange = (event) => {
    const { name, value } = event.target;
    onFilterChange(name, value);
  };

  return (
    <section className="module">
      <div className="module__header">
        <div>
          <h2>Gestión de siniestros</h2>
          <p>Control integral de casos abiertos, en seguimiento y cerrados.</p>
        </div>
        <button className="btn btn--primary" onClick={onNewClaim}>
          Nuevo siniestro
        </button>
      </div>

      <section className="card">
        <header className="card__header card__header--filters">
          <div className="filters">
            <label className="input-field input-field--compact">
              <span>Buscar</span>
              <input
                type="search"
                name="search"
                value={filters.search}
                placeholder="Patente, DNI, nombre..."
                onChange={handleChange}
              />
            </label>
            <label className="input-field input-field--compact">
              <span>Estado</span>
              <select name="status" value={filters.status} onChange={handleChange}>
                <option value="todos">Todos</option>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="input-field input-field--compact">
              <span>Taller</span>
              <select name="workshop" value={filters.workshop} onChange={handleChange}>
                <option value="todos">Todos</option>
                {workshops
                  .filter((workshop) => workshop.id !== 'taller-particular')
                  .map((workshop) => (
                    <option key={workshop.id} value={workshop.id}>
                      {workshop.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="input-field input-field--compact">
              <span>Consorcio</span>
              <select name="consorcio" value={filters.consorcio} onChange={handleChange}>
                <option value="todos">Todos</option>
                {consortia.map((consorcio) => (
                  <option key={consorcio.id} value={consorcio.id}>
                    {consorcio.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="input-field input-field--compact">
              <span>Reclamo</span>
              <select name="claim" value={filters.claim} onChange={handleChange}>
                <option value="todos">Todos</option>
                <option value="si">Sí</option>
                <option value="no">No</option>
              </select>
            </label>
            <label className="input-field input-field--compact">
              <span>Desde</span>
              <input type="date" name="from" value={filters.from} onChange={handleChange} />
            </label>
            <label className="input-field input-field--compact">
              <span>Hasta</span>
              <input type="date" name="to" value={filters.to} onChange={handleChange} />
            </label>
          </div>
          <div className="filter-actions">
            <button className="btn btn--ghost" onClick={onClearFilters}>
              Limpiar
            </button>
            <button className="btn btn--ghost" onClick={onExport}>
              Exportar Excel
            </button>
          </div>
        </header>
        <div className="kanban">
          {STATUS_ORDER.map((status) => {
            const items = filteredClaims.filter((claim) => claim.state === status);
            return (
              <section key={status} className="kanban__column">
                <div className="kanban__header">
                  <span className="kanban__title">{status}</span>
                  <span className="kanban__count">{items.length}</span>
                </div>
                {items.length === 0 ? (
                  <p className="form-helper">Sin casos en este estado.</p>
                ) : (
                  items.map((claim) => {
                    const alert = getAlertLevel(claim);
                    const badgeClass =
                      alert.level === 'danger'
                        ? 'tag tag--danger'
                        : alert.level === 'warning'
                        ? 'tag tag--warning'
                        : 'tag tag--success';
                    return (
                      <article key={claim.id} className="kanban-card">
                        <div className="kanban-card__header">
                          <div>
                            <h4 className="kanban-card__title">{claim.id}</h4>
                            <div className="kanban-card__meta">
                              <span>{claim.name}</span>
                              <span>{claim.plate}</span>
                              <span>Ocurrió {formatRelativeDate(claim.eventDate)}</span>
                            </div>
                          </div>
                          <span className={badgeClass}>{alert.message}</span>
                        </div>
                        <p>{claim.stage}</p>
                        <div className="kanban-card__meta">
                          {claim.consorcioFlag && <span className="badge badge--consorcio">{claim.consorcio}</span>}
                          {claim.workshopName && <span className="badge badge--workshop">{claim.workshopName}</span>}
                          {claim.hasRecovery && <span className="badge badge--claim">Con reclamo</span>}
                        </div>
                        <div className="kanban-card__meta">
                          <span>Última actualización: {formatRelativeDate(claim.lastUpdate)}</span>
                        </div>
                        <button className="btn btn--ghost" onClick={() => onOpenClaim(claim.id)}>
                          Ver detalle
                        </button>
                      </article>
                    );
                  })
                )}
              </section>
            );
          })}
        </div>
      </section>

      <section className="grid grid--two">
        <article className="card">
          <header className="card__header">
            <h3>Alertas y seguimiento</h3>
          </header>
          <ul className="alert-list">
            {alertEntries.length === 0 ? (
              <li className="form-helper">Sin alertas activas. ¡Buen trabajo!</li>
            ) : (
              alertEntries.map(({ claim, alert }) => {
                const badgeClass =
                  alert.level === 'danger'
                    ? 'alert-badge alert-badge--danger'
                    : alert.level === 'warning'
                    ? 'alert-badge alert-badge--warning'
                    : 'alert-badge alert-badge--success';
                return (
                  <li key={claim.id} className="alert-item">
                    <div>
                      <strong>
                        {claim.id} - {claim.name}
                      </strong>
                      <p>{alert.detail}</p>
                    </div>
                    <span className={badgeClass}>{alert.message}</span>
                  </li>
                );
              })
            )}
          </ul>
        </article>
        <article className="card">
          <header className="card__header">
            <h3>Tareas automáticas</h3>
          </header>
          <ul className="automation-list">
            {automationTasks.length === 0 ? (
              <li className="form-helper">No hay tareas pendientes asociadas a automatizaciones.</li>
            ) : (
              automationTasks.map(({ claimId, task }) => {
                const overdue = new Date(task.dueDate) < new Date();
                return (
                  <li key={`${claimId}-${task.id}`} className="alert-item">
                    <div>
                      <strong>{task.label}</strong>
                      <p>
                        Siniestro {claimId} · Vence el {formatDate(task.dueDate)}
                      </p>
                    </div>
                    {overdue && <span className="tag tag--danger">Vencida</span>}
                  </li>
                );
              })
            )}
          </ul>
        </article>
      </section>
    </section>
  );
}

function ConsultasModule({ insuredDirectory }) {
  const [form, setForm] = useState({ plate: '', dni: '', name: '' });
  const [result, setResult] = useState(null);
  const [query, setQuery] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const plate = form.plate.trim().toUpperCase();
    const dni = form.dni.trim();
    const name = form.name.trim().toLowerCase();
    const match = insuredDirectory.find((insured) => {
      return (
        (plate && insured.plate === plate) ||
        (dni && insured.dni === dni) ||
        (name && insured.name.toLowerCase().includes(name))
      );
    });
    setQuery(plate || dni || form.name.trim());
    setResult(match || null);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section className="module">
      <div className="module__header">
        <div>
          <h2>Consultas de asegurados</h2>
          <p>Consulta ágil de pólizas y siniestros relacionados.</p>
        </div>
      </div>
      <section className="card">
        <header className="card__header">
          <h3>Buscar asegurado</h3>
        </header>
        <form className="search-grid" onSubmit={handleSubmit}>
          <label className="input-field">
            <span>Patente</span>
            <input name="plate" placeholder="AA123BB" value={form.plate} onChange={handleChange} />
          </label>
          <label className="input-field">
            <span>DNI</span>
            <input name="dni" placeholder="00000000" value={form.dni} onChange={handleChange} />
          </label>
          <label className="input-field">
            <span>Nombre y apellido</span>
            <input name="name" placeholder="Juan Pérez" value={form.name} onChange={handleChange} />
          </label>
          <button type="submit" className="btn btn--primary">
            Consultar
          </button>
        </form>
        <div className="search-result">
          {result ? (
            <div>
              <div>
                <strong>{result.name}</strong>
                <p>
                  DNI {result.dni} · Patente {result.plate}
                </p>
                <p>
                  Email {result.email} · Tel {result.phone}
                </p>
              </div>
              <div>
                <p>
                  <strong>Modelo:</strong> {result.vehicle.brand} {result.vehicle.model} ({result.vehicle.year})
                </p>
                <p>
                  <strong>Cobertura:</strong> {result.vehicle.coverage}
                </p>
                <p>
                  <strong>Cía:</strong> {result.vehicle.company}
                </p>
                <p>
                  <strong>Suma asegurada:</strong> {result.vehicle.sum}
                </p>
              </div>
              <div>
                <p>
                  <strong>Motor:</strong> {result.vehicle.engine}
                </p>
                <p>
                  <strong>Chasis:</strong> {result.vehicle.chassis}
                </p>
                <p>
                  <strong>Consorcio:</strong> {result.vehicle.consorcio}
                </p>
              </div>
            </div>
          ) : query ? (
            <p>
              No encontramos resultados para "{query}". Revisa los datos ingresados.
            </p>
          ) : (
            <p>Ingresa datos para realizar una búsqueda.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function PlaceholderModule() {
  return (
    <section className="module">
      <div className="module__header">
        <div>
          <h2>Gestión de repuestos</h2>
          <p>Módulo en diseño. Permitirá solicitar, aprobar y conciliar repuestos.</p>
        </div>
      </div>
      <section className="card placeholder">
        <h3>Próximamente</h3>
        <p>
          El módulo de repuestos incluirá integración con talleres, seguimiento de pedidos y control de stock.
        </p>
        <ul>
          <li>Catálogo de repuestos homologados</li>
          <li>Integración con compras y proveedores</li>
          <li>Alertas por demoras de entrega</li>
        </ul>
      </section>
    </section>
  );
}

function AutomationsModule({ rules }) {
  return (
    <section className="module">
      <div className="module__header">
        <div>
          <h2>Automatizaciones y reglas</h2>
          <p>Diseña el flujo de alertas, asignaciones y notificaciones.</p>
        </div>
      </div>
      <section className="card">
        <header className="card__header">
          <h3>Motor de reglas</h3>
        </header>
        <ul className="automation-rules">
          {rules.map((rule) => (
            <li key={rule.id} className="automation-rule">
              <strong>{rule.name}</strong>
              <p>{rule.description}</p>
            </li>
          ))}
        </ul>
      </section>
    </section>
  );
}

function ConfigModule({ catalog }) {
  return (
    <section className="module">
      <div className="module__header">
        <div>
          <h2>Configuración</h2>
          <p>Administra roles, talleres, consorcios y personas a cargo.</p>
        </div>
      </div>
      <section className="card">
        <header className="card__header">
          <h3>Resumen de catálogo</h3>
        </header>
        <div className="config-grid">
          <div>
            <h3>Roles</h3>
            <div className="grid grid--two">
              {catalog.roles.map((role) => (
                <div key={role.name} className="config-card">
                  <strong>{role.name}</strong>
                  <ul>
                    {role.permissions.map((permission) => (
                      <li key={permission}>{permission}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Talleres</h3>
            <div className="grid grid--two">
              {catalog.workshops
                .filter((workshop) => workshop.id !== 'taller-particular')
                .map((workshop) => (
                  <div key={workshop.id} className="config-card">
                    <strong>{workshop.name}</strong>
                    <small>{workshop.address}</small>
                    <p>Responsable: {workshop.manager}</p>
                    <p>Capacidad: {workshop.capacity} vehículos</p>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h3>Consorcios</h3>
            <div className="grid grid--two">
              {catalog.consortia.map((consorcio) => (
                <div key={consorcio.id} className="config-card">
                  <strong>{consorcio.name}</strong>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3>Personas a cargo</h3>
            <div className="grid grid--two">
              {catalog.people.map((person) => (
                <div key={person.id} className="config-card">
                  <strong>{person.name}</strong>
                  <p>{person.role}</p>
                  <small>{person.contact}</small>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </section>
  );
}

function Toast({ message }) {
  return <div className="toast">{message}</div>;
}

function Modal({ title, onClose, children, footer }) {
  return createPortal(
    <div className="modal-layer is-visible">
      <div className="modal">
        <header className="modal__header">
          <h2>{title}</h2>
          <button className="btn btn--ghost" onClick={onClose}>
            Cerrar
          </button>
        </header>
        <div className="modal__body">{children}</div>
        <footer className="modal__footer">{footer}</footer>
      </div>
    </div>,
    document.body,
  );
}

function NotificationsModal({ notifications, onClose }) {
  return (
    <Modal
      title="Notificaciones del sistema"
      onClose={onClose}
      footer={
        <button className="btn btn--primary" onClick={onClose}>
          Entendido
        </button>
      }
    >
      {notifications.length === 0 ? (
        <p className="form-helper">No hay notificaciones pendientes.</p>
      ) : (
        <ul className="notification-list">
          {notifications.map((notification) => (
            <li key={notification.id} className="notification">
              <strong>{notification.title}</strong>
              <small>{formatDateTime(notification.date)}</small>
              <p>{notification.detail}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function ReminderModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', date: '' });

  const handleSubmit = () => {
    if (!form.title || !form.date) return;
    onSave({ title: form.title, date: form.date });
    onClose();
  };

  return (
    <Modal
      title="Nuevo recordatorio"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Guardar recordatorio
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="input-field">
          <span>Título</span>
          <input
            value={form.title}
            onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Seguimiento del siniestro"
          />
        </label>
        <label className="input-field">
          <span>Fecha límite</span>
          <input
            type="date"
            value={form.date}
            onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
          />
        </label>
      </div>
    </Modal>
  );
}

function ChangePasswordModal({ onClose, onSubmit }) {
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const response = onSubmit(form);
    if (!response.success) {
      setError(response.message);
      return;
    }
    onClose();
  };

  return (
    <Modal
      title="Cambiar contraseña"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn--primary" onClick={handleSubmit}>
            Actualizar
          </button>
        </>
      }
    >
      <div className="form-grid">
        <label className="input-field">
          <span>Contraseña actual</span>
          <input
            type="password"
            value={form.current}
            onChange={(event) => setForm((prev) => ({ ...prev, current: event.target.value }))}
          />
        </label>
        <label className="input-field">
          <span>Nueva contraseña</span>
          <input
            type="password"
            value={form.next}
            onChange={(event) => setForm((prev) => ({ ...prev, next: event.target.value }))}
          />
        </label>
        <label className="input-field">
          <span>Confirmar nueva contraseña</span>
          <input
            type="password"
            value={form.confirm}
            onChange={(event) => setForm((prev) => ({ ...prev, confirm: event.target.value }))}
          />
        </label>
        {error && <p className="form-helper" style={{ color: 'var(--color-danger)' }}>{error}</p>}
      </div>
    </Modal>
  );
}

function ClaimDetailModal({ claim, onClose, onSave, onAddFollowUp, onToggleTask, onAddAttachments, workshops }) {
  const [form, setForm] = useState({
    state: claim?.state ?? 'Ingreso',
    stage: claim?.stage || '',
    workshop: claim?.workshop || '',
    assignedPerson: claim?.assignedPerson || '',
    inspectionDate: claim?.inspectionDate ? toDateInput(claim.inspectionDate) : '',
    fastTrackNotes: claim?.fastTrackNotes || '',
  });
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!claim) return;
    setForm({
      state: claim.state,
      stage: claim.stage || '',
      workshop: claim.workshop || '',
      assignedPerson: claim.assignedPerson || '',
      inspectionDate: claim.inspectionDate ? toDateInput(claim.inspectionDate) : '',
      fastTrackNotes: claim.fastTrackNotes || '',
    });
  }, [claim]);

  if (!claim) return null;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const alert = getAlertLevel(claim);
  const badgeClass =
    alert.level === 'danger'
      ? 'tag tag--danger'
      : alert.level === 'warning'
      ? 'tag tag--warning'
      : 'tag tag--success';

  return (
    <Modal
      title={`Detalle del siniestro ${claim.id}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn--ghost" onClick={onClose}>
            Cerrar
          </button>
          <button className="btn btn--primary" onClick={() => onSave(claim.id, form)}>
            Guardar cambios
          </button>
        </>
      }
    >
      <div className="detail-grid">
        <div>
          <p className="section-title">Datos del asegurado</p>
          <div className="history-item">
            <strong>{claim.name}</strong>
            <small>
              DNI {claim.dni} · Patente {claim.plate}
            </small>
            <small>Consorcio: {claim.consorcio || 'Sin consorcio'}</small>
          </div>
        </div>
        <div>
          <p className="section-title">Estado actual</p>
          <div className="history-item">
            <label className="input-field">
              <span>Estado</span>
              <select name="state" value={form.state} onChange={handleChange}>
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            <label className="input-field">
              <span>Descripción de etapa</span>
              <textarea
                className="textarea"
                name="stage"
                value={form.stage}
                onChange={handleChange}
              />
            </label>
            <span className={badgeClass}>{alert.message}</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div>
          <p className="section-title">Taller y responsable</p>
          <div className="history-item">
            <label className="input-field">
              <span>Ingreso a taller</span>
              <select name="workshop" value={form.workshop} onChange={handleChange}>
                <option value="">Sin derivar</option>
                {workshops
                  .filter((item) => item.id !== 'taller-particular')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                <option value="taller-particular">Taller particular</option>
              </select>
            </label>
            <label className="input-field">
              <span>Persona a cargo</span>
              <input
                name="assignedPerson"
                value={form.assignedPerson}
                onChange={handleChange}
                placeholder="Nombre"
              />
            </label>
            <label className="input-field">
              <span>Fecha de inspección</span>
              <input type="date" name="inspectionDate" value={form.inspectionDate} onChange={handleChange} />
            </label>
          </div>
        </div>
        <div>
          <p className="section-title">Notas y seguimiento</p>
          <div className="history-item">
            <label className="input-field">
              <span>Notas Fast Track / Observaciones</span>
              <textarea
                className="textarea"
                name="fastTrackNotes"
                value={form.fastTrackNotes}
                onChange={handleChange}
              />
            </label>
            <div className="comment-box">
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Agregar comentario o seguimiento"
              />
              <button
                className="btn btn--primary"
                onClick={() => {
                  if (!comment.trim()) return;
                  onAddFollowUp(claim.id, comment.trim());
                  setComment('');
                }}
              >
                Registrar seguimiento
              </button>
            </div>
          </div>
        </div>
      </div>

      <div>
        <p className="section-title">Tareas</p>
        <ul className="task-list">
          {claim.tasks.map((task) => (
            <li key={task.id} className="task-item">
              <label>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={(event) => onToggleTask(claim.id, task.id, event.target.checked)}
                />
                {task.label}
              </label>
              <small>Vence {formatDate(task.dueDate)}</small>
            </li>
          ))}
        </ul>
      </div>

      <div className="detail-grid">
        <div>
          <p className="section-title">Adjuntos</p>
          <ul className="history-list">
            {claim.attachments.length === 0 ? (
              <li>No hay archivos adjuntos.</li>
            ) : (
              claim.attachments.map((file, index) => (
                <li key={`${file.name}-${index}`} className="history-item">
                  <strong>{file.name}</strong>
                  <small>
                    {file.type} · {file.size}
                  </small>
                </li>
              ))
            )}
            <li className="file-input">
              <label>
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={(event) => {
                    onAddAttachments(claim.id, event.target.files);
                    event.target.value = '';
                  }}
                />
                <span className="btn btn--ghost">Agregar adjuntos</span>
              </label>
            </li>
          </ul>
        </div>
        <div>
          <p className="section-title">Historial</p>
          <ul className="history-list">
            {claim.history.map((item, index) => (
              <li key={`${item.date}-${index}`} className="history-item">
                <strong>{formatDateTime(item.date)}</strong>
                <small>{item.user}</small>
                <p>{item.changes.join(', ')}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div>
        <p className="section-title">Seguimientos</p>
        <ul className="history-list">
          {claim.followUps.length === 0 ? (
            <li className="history-item">No hay seguimientos registrados.</li>
          ) : (
            claim.followUps.map((follow, index) => (
              <li key={`${follow.date}-${index}`} className="history-item">
                <strong>{formatDateTime(follow.date)}</strong>
                <small>{follow.user}</small>
                <p>{follow.comment}</p>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}

function NewClaimModal({
  initialDraft,
  onClose,
  onComplete,
  consortia,
  workshops,
  peopleInCharge,
  insuredDirectory,
  existingClaims,
  onShowToast,
}) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState({ ...initialDraft });
  const [insuredHelper, setInsuredHelper] = useState('');
  const [duplicates, setDuplicates] = useState([]);

  useEffect(() => {
    setDraft({ ...initialDraft });
    setStep(1);
    setInsuredHelper('');
    setDuplicates([]);
  }, [initialDraft]);

  const updateDraft = (event) => {
    const { name, value, type, checked, files } = event.target;
    setDraft((prev) => {
      const next = { ...prev };
      switch (name) {
        case 'plate':
          next.plate = value.toUpperCase();
          setDuplicates(detectDuplicates(existingClaims, { ...next }));
          break;
        case 'dni':
          next.dni = value;
          break;
        case 'name':
          next.name = value;
          break;
        case 'eventDate':
          next.eventDate = value;
          setDuplicates(detectDuplicates(existingClaims, { ...next }));
          break;
        case 'reportDate':
          next.reportDate = value;
          break;
        case 'description':
          next.description = value;
          break;
        case 'consorcioFlag':
          next.consorcioFlag = type === 'checkbox' ? checked : value;
          if (!checked) {
            next.consorcioOption = '';
          }
          break;
        case 'consorcioOption':
          next.consorcioOption = value;
          break;
        case 'hasRecovery':
          next.hasRecovery = checked;
          break;
        case 'workshop':
          next.workshop = value;
          next.workshopName = value
            ? workshops.find((item) => item.id === value)?.name || 'Taller particular'
            : '';
          if (value) {
            const suggested = peopleInCharge.find((person) => person.workshops.includes(value));
            if (suggested) {
              next.assignedPerson = suggested.name;
            }
          }
          break;
        case 'assignedPerson':
          next.assignedPerson = value;
          break;
        case 'inspectionDate':
          next.inspectionDate = value;
          break;
        case 'fastTrack':
          next.fastTrack = checked;
          if (checked) {
            next.workshop = '';
            next.workshopName = '';
          }
          break;
        case 'closeDirectly':
          next.closeDirectly = checked;
          break;
        case 'fastTrackNotes':
          next.fastTrackNotes = value;
          break;
        case 'attachments':
          next.attachments = Array.from(files || []).map((file) => ({
            name: file.name,
            type: file.type || 'Archivo',
            size: formatFileSize(file.size),
          }));
          break;
        default:
          break;
      }
      return next;
    });
  };

  const handleLookupInsured = () => {
    const match = insuredDirectory.find((insured) => {
      return (
        (draft.plate && insured.plate === draft.plate) ||
        (draft.dni && insured.dni === draft.dni) ||
        (draft.name && insured.name.toLowerCase().includes(draft.name.toLowerCase()))
      );
    });
    if (match) {
      setDraft((prev) => ({
        ...prev,
        name: match.name,
        dni: match.dni,
        consorcioFlag: true,
        consorcioOption: consortia.find((item) => item.name === match.vehicle.consorcio)?.id || '',
      }));
      setInsuredHelper(
        `${match.name} · ${match.vehicle.brand} ${match.vehicle.model} (${match.vehicle.year}) · Cobertura ${match.vehicle.coverage}`,
      );
    } else {
      setInsuredHelper('No encontramos datos existentes para estos criterios.');
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!draft.plate || !draft.dni || !draft.name || !draft.eventDate || !draft.description) {
        onShowToast('Completa los campos críticos (dominio, DNI, nombre, fecha y relato).');
        return false;
      }
    }
    if (step === 2) {
      if (draft.consorcioFlag && !draft.consorcioOption) {
        onShowToast('Selecciona el consorcio correspondiente.');
        return false;
      }
    }
    if (step === 3) {
      if (draft.workshop && !draft.inspectionDate) {
        onShowToast('Ingresa la fecha de inspección para el taller seleccionado.');
        return false;
      }
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep()) return;
    if (step === 3) {
      onComplete(draft);
      return;
    }
    setStep((prev) => prev + 1);
  };

  const goBack = () => {
    setStep((prev) => Math.max(1, prev - 1));
  };

  return (
    <Modal
      title="Nuevo siniestro"
      onClose={onClose}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <button className="btn btn--ghost" onClick={goBack} disabled={step === 1}>
            Atrás
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn--primary" onClick={goNext}>
              {step === 3 ? 'Crear siniestro' : 'Siguiente'}
            </button>
          </div>
        </div>
      }
    >
      <div className="stepper">
        <span className={`stepper__step ${step === 1 ? 'is-active' : step > 1 ? 'is-complete' : ''}`}>1 · Datos básicos</span>
        <span className={`stepper__step ${step === 2 ? 'is-active' : step > 2 ? 'is-complete' : ''}`}>
          2 · Consorcio y reclamo
        </span>
        <span className={`stepper__step ${step === 3 ? 'is-active' : ''}`}>3 · Taller y resolución</span>
      </div>
      {step === 1 && (
        <form className="form-grid" onSubmit={(event) => event.preventDefault()}>
          <label className="input-field">
            <span>Patente</span>
            <input name="plate" value={draft.plate} onChange={updateDraft} placeholder="AA123BB" required />
          </label>
          <label className="input-field">
            <span>DNI</span>
            <input name="dni" value={draft.dni} onChange={updateDraft} placeholder="00000000" required />
          </label>
          <label className="input-field">
            <span>Nombre y apellido</span>
            <input name="name" value={draft.name} onChange={updateDraft} placeholder="Nombre completo" required />
          </label>
          <label className="input-field">
            <span>Fecha de siniestro</span>
            <input type="date" name="eventDate" value={draft.eventDate} onChange={updateDraft} required />
          </label>
          <label className="input-field">
            <span>Fecha de denuncia</span>
            <input type="date" name="reportDate" value={draft.reportDate} onChange={updateDraft} />
          </label>
          <label className="input-field" style={{ gridColumn: '1 / -1' }}>
            <span>Relato del siniestro</span>
            <textarea
              className="textarea"
              name="description"
              value={draft.description}
              onChange={updateDraft}
              placeholder="Describe lo ocurrido"
              required
            />
          </label>
          <div className={`file-input ${duplicates.length ? '' : 'hidden'}`} style={{ gridColumn: '1 / -1' }}>
            <strong>Posible duplicado detectado</strong>
            <p>
              Existe {duplicates.length > 1 ? `${duplicates.length} siniestros` : 'un siniestro'} con mismo dominio y fecha:
            </p>
            <ul>
              {duplicates.map((item) => (
                <li key={item.id}>
                  {item.id} · Estado {item.state}
                </li>
              ))}
            </ul>
            <p>Puedes continuar la carga igualmente.</p>
          </div>
          <div className="comment-box" style={{ gridColumn: '1 / -1' }}>
            <button type="button" className="btn btn--ghost" onClick={handleLookupInsured}>
              Buscar datos del asegurado
            </button>
            {insuredHelper && <small className="form-helper">{insuredHelper}</small>}
          </div>
        </form>
      )}
      {step === 2 && (
        <div className="form-grid">
          <label className="input-field">
            <span>¿Pertenece a consorcio?</span>
            <input type="checkbox" name="consorcioFlag" checked={draft.consorcioFlag} onChange={updateDraft} />
          </label>
          <label className="input-field">
            <span>Consorcio</span>
            <select
              name="consorcioOption"
              value={draft.consorcioOption}
              onChange={updateDraft}
              disabled={!draft.consorcioFlag}
            >
              <option value="">Selecciona consorcio</option>
              {consortia.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="input-field">
            <span>¿Genera reclamo a terceros?</span>
            <input type="checkbox" name="hasRecovery" checked={draft.hasRecovery} onChange={updateDraft} />
          </label>
          <label className="input-field" style={{ gridColumn: '1 / -1' }}>
            <span>Notas / Detalles adicionales</span>
            <textarea
              name="fastTrackNotes"
              className="textarea"
              value={draft.fastTrackNotes}
              onChange={updateDraft}
              placeholder="Notas para recuperación o consorcio"
            />
          </label>
        </div>
      )}
      {step === 3 && (
        <div className="form-grid">
          <label className="input-field">
            <span>¿Ingreso a taller?</span>
            <select name="workshop" value={draft.workshop} onChange={updateDraft}>
              <option value="">No por el momento</option>
              {workshops.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="input-field">
            <span>Fecha de inspección</span>
            <input
              type="date"
              name="inspectionDate"
              value={draft.inspectionDate}
              onChange={updateDraft}
              disabled={!draft.workshop}
            />
          </label>
          <label className="input-field">
            <span>Persona a cargo</span>
            <input name="assignedPerson" value={draft.assignedPerson} onChange={updateDraft} placeholder="Nombre" />
          </label>
          <label className="input-field">
            <span>¿Gestionar como Fast Track?</span>
            <input type="checkbox" name="fastTrack" checked={draft.fastTrack} onChange={updateDraft} />
          </label>
          <label className="input-field">
            <span>¿Sin daños y cierre inmediato?</span>
            <input type="checkbox" name="closeDirectly" checked={draft.closeDirectly} onChange={updateDraft} />
          </label>
          <label className="input-field" style={{ gridColumn: '1 / -1' }}>
            <span>Comentarios finales</span>
            <textarea
              name="fastTrackNotes"
              className="textarea"
              value={draft.fastTrackNotes}
              onChange={updateDraft}
              placeholder="Observaciones de seguimiento"
            />
          </label>
          <div className="file-input" style={{ gridColumn: '1 / -1' }}>
            <label>
              Adjuntar documentación
              <input type="file" name="attachments" multiple hidden onChange={updateDraft} />
              <span className="btn btn--ghost" style={{ marginTop: '8px' }}>
                Seleccionar archivos
              </span>
            </label>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default App;

