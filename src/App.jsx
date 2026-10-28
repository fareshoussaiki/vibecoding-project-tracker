import { useEffect, useMemo, useRef, useState } from 'react';

export const STAGES = [
  { id: 'todo', label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review', label: 'Review' },
  { id: 'done', label: 'Done' },
];

export const AI_TOOLS = ['Claude', 'ChatGPT', 'Gemini', 'Other'];
const TASKS_KEY = 'vibetracker.tasks.v3';
const MEMBERS_KEY = 'vibetracker.members.v2';
const TEAM_MODE_KEY = 'vibetracker.teamMode.v2';
const ANCHORS_KEY = 'vibetracker.anchors';
const DEFAULT_ANCHORS = [
  { id: 'presentation', label: 'Presentation', url: '' },
  { id: 'demo', label: 'Demo', url: '' },
  { id: 'report', label: 'Report', url: '' },
  { id: 'documentation', label: 'Documentation', url: '' },
];
// TESTING ONLY: mark incomplete tasks as stalled after 5 seconds without changes.
const STALE_AFTER_MS = 5 * 1000;

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const nowISO = () => new Date().toISOString();
const emptyTask = () => ({
  id: uid(), title: '', description: '', type: 'feature', status: 'todo', assigneeId: '', reviewerId: '', dueDate: '',
  background: 'Provide a brief background of why this task is needed.', 
  constraints: 'List any technical, time, or resource constraints.', 
  triedSoFar: 'Detail what approaches have already been attempted.', 
  pickUp: 'Explain exactly what the next developer or AI needs to do to continue this work.', 
  aiTool: 'ChatGPT',
  prompts: [], lastChangedAt: nowISO(),
});
const seedTasks = [
  { id: 'task-auth', title: 'Implement user authentication', description: 'Add secure session-based authentication to the web app.', type: 'feature', status: 'todo', assigneeId: '', reviewerId: '', dueDate: '', background: 'Add authentication to the application.', constraints: 'Must use secure session cookies.', triedSoFar: 'Reviewed the existing application structure.', pickUp: 'Need to set up the authentication context provider.', aiTool: 'ChatGPT', prompts: [], lastChangedAt: nowISO() },
  { id: 'task-schema', title: 'Design database schema', description: 'Define entities and relationships for PostgreSQL database.', type: 'feature', status: 'in-progress', assigneeId: '', reviewerId: '', dueDate: '', background: 'Plan the data model for the application.', constraints: 'PostgreSQL compatible.', triedSoFar: 'Listed the main entities.', pickUp: 'Need to confirm relationships between entities.', aiTool: 'Claude', prompts: [], lastChangedAt: nowISO() },
];

function safeRead(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}
function dateLabel(date) {
  if (!date) return 'No deadline';
  const diff = Math.round((new Date(`${date}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86400000);
  if (diff < 0) return `${Math.abs(diff)} day${diff === -1 ? '' : 's'} overdue`;
  if (diff === 0) return 'Due today';
  if (diff === 1) return 'Due tomorrow';
  return `Due ${date}`;
}
function isOverdue(task) {
  return task.status !== 'done' && Boolean(task.dueDate) && task.dueDate < todayISO();
}
function dueDateState(task) {
  if (task.status === 'done' || !task.dueDate) return 'neutral';
  const daysUntilDue = Math.round((new Date(`${task.dueDate}T00:00:00`) - new Date(`${todayISO()}T00:00:00`)) / 86400000);
  if (daysUntilDue < 0) return 'alarm';
  if (daysUntilDue <= 2) return 'warning';
  return 'calm';
}
function isStalled(task) {
  return task.status !== 'done' && Date.now() - new Date(task.lastChangedAt || 0).getTime() >= STALE_AFTER_MS;
}
function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text);
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.select();
  const ok = document.execCommand('copy');
  el.remove();
  return ok ? Promise.resolve() : Promise.reject(new Error('Copy failed'));
}
function taskTypeInfo(type) {
  return type === 'bug'
    ? { label: 'Bug', icon: '🐞', className: 'border-red-300 bg-red-100 text-red-900' }
    : { label: 'Feature', icon: '✨', className: 'border-blue-300 bg-blue-100 text-blue-900' };
}
function taskBriefing(task, members) {
  const owner = members.find((m) => m.id === task.assigneeId)?.name || 'Unassigned';
  const reviewer = members.find((m) => m.id === task.reviewerId)?.name || 'Unassigned';
  const bg = task.background || 'Not provided';
  const constraints = task.constraints ?? task.purpose ?? 'Not provided';
  const tried = task.triedSoFar ?? task.workDone ?? 'Not provided';
  const pickup = task.pickUp ?? task.bottleneck ?? 'Not provided';
  
  const desc = task.description || bg;
  return `# Task: ${task.title}\nDescription: ${desc}\nType: ${taskTypeInfo(task.type).label}\nTask ID: ${task.id}\nStatus: ${STAGES.find((s) => s.id === task.status)?.label || task.status}\nAssignee: ${owner}\nReviewer: ${task.status === 'review' ? reviewer : 'Not applicable'}\nDue date: ${task.dueDate || 'No deadline'}\nAI tool: ${task.aiTool || 'Other'}\n\n## Background\n${bg}\n\n## Constraints\n${constraints}\n\n## Tried so far\n${tried}\n\n## Pick up\n${pickup}`;
}

function Field({ label, children, hint }) {
  return <label className="flex flex-col gap-1 text-sm font-semibold text-slate-800">{label}{children}{hint && <span className="text-xs font-normal text-slate-700">{hint}</span>}</label>;
}
function Button({ children, className = '', ...props }) {
  return <button {...props} className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}>{children}</button>;
}

export default function App() {
  const [tasks, setTasks] = useState(() => safeRead(TASKS_KEY, seedTasks));
  const [members, setMembers] = useState(() => {
    const stored = safeRead(MEMBERS_KEY, null);
    return Array.isArray(stored) && stored.some((m) => m.id === 'you') ? stored : [{ id: 'you', name: 'YOU' }];
  });
  const [teamMode, setTeamMode] = useState(() => safeRead(TEAM_MODE_KEY, false) === true);
  const [darkMode, setDarkMode] = useState(() => safeRead('vibetracker.theme', 'light') === 'dark');
  const [formTab, setFormTab] = useState('Details');
  const [previewContext, setPreviewContext] = useState(false);
  const [anchors, setAnchors] = useState(() => {
    const saved = safeRead(ANCHORS_KEY, DEFAULT_ANCHORS);
    return Array.isArray(saved) ? DEFAULT_ANCHORS.map((item) => ({ ...item, ...(saved.find((a) => a.id === item.id) || {}) })) : DEFAULT_ANCHORS;
  });
  const [storageWarning, setStorageWarning] = useState('');
  const [editingTask, setEditingTask] = useState(null);
  const [showTeam, setShowTeam] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [toast, setToast] = useState('');
  const [stallClock, setStallClock] = useState(Date.now());
  const [draggedId, setDraggedId] = useState(null);
  const [dragOver, setDragOver] = useState('');
  const [promptText, setPromptText] = useState('');
  const [promptOutcome, setPromptOutcome] = useState('worked');
  const [promptTool, setPromptTool] = useState('ChatGPT');
  const lastFocusedBeforeModal = useRef(null);
  const activeModal = editingTask ? 'task' : showTeam ? 'team' : showSummary ? 'summary' : null;

  // Persist all app data together so one successful write cannot hide another failure.
  useEffect(() => {
    try {
      window.localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
      window.localStorage.setItem(MEMBERS_KEY, JSON.stringify(members));
      window.localStorage.setItem(TEAM_MODE_KEY, JSON.stringify(teamMode));
      window.localStorage.setItem(ANCHORS_KEY, JSON.stringify(anchors));
      setStorageWarning('');
    } catch {
      setStorageWarning('Could not save to this browser. Your latest changes may not persist. Check browser storage settings or available space.');
    }
  }, [tasks, members, teamMode, anchors]);
  useEffect(() => {
    try { window.localStorage.setItem('vibetracker.theme', darkMode ? 'dark' : 'light'); } catch { /* Theme preference is optional. */ }
  }, [darkMode]);
  // Recheck stalled tasks periodically so the 5-second testing threshold updates without user interaction.
  useEffect(() => {
    const timer = window.setInterval(() => setStallClock(Date.now()), 3000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);
  // Keep keyboard focus inside whichever modal is open and support Escape to close it.
  useEffect(() => {
    if (!activeModal) {
      if (lastFocusedBeforeModal.current && document.contains(lastFocusedBeforeModal.current)) lastFocusedBeforeModal.current.focus();
      lastFocusedBeforeModal.current = null;
      return undefined;
    }
    const dialog = document.querySelector('[role="dialog"][aria-modal="true"]');
    if (!dialog) return undefined;
    if (!lastFocusedBeforeModal.current) lastFocusedBeforeModal.current = document.activeElement;
    const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const getFocusable = () => Array.from(dialog.querySelectorAll(focusableSelector)).filter((el) => !el.hasAttribute('hidden') && el.getAttribute('aria-hidden') !== 'true');
    const focusable = getFocusable();
    (dialog.querySelector('[autofocus]') || focusable[0] || dialog).focus();
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (activeModal === 'task') setEditingTask(null);
        else if (activeModal === 'team') setShowTeam(false);
        else setShowSummary(false);
        return;
      }
      if (e.key !== 'Tab') return;
      const items = getFocusable();
      if (!items.length) { e.preventDefault(); dialog.focus(); return; }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [activeModal]);

  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const incompleteCount = tasks.length - completedCount;
  const stageCounts = useMemo(() => Object.fromEntries(STAGES.map((s) => [s.id, tasks.filter((t) => t.status === s.id).length])), [tasks]);
  const stalledTasks = tasks.filter((task) => task.status !== 'done' && stallClock - new Date(task.lastChangedAt || 0).getTime() >= STALE_AFTER_MS);
  const overdueTasks = tasks.filter(isOverdue);
  const openTaskCount = (memberId) => tasks.filter((t) => t.assigneeId === memberId && t.status !== 'done').length;

  const announce = (message) => setToast(message);
  const updateAnchor = (id, url) => setAnchors((current) => current.map((anchor) => anchor.id === id ? { ...anchor, url } : anchor));
  const normalizedUrl = (url) => /^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`;
  const touchTask = (task, updates) => ({ ...task, ...updates, lastChangedAt: nowISO() });
  
  // Resets form tab and markdown preview when modal opens
  const openNewTask = () => { setEditingTask(emptyTask()); setFormTab('Details'); setPreviewContext(false); };
  const openEditTask = (task) => { setEditingTask({ ...task, type: task.type === 'bug' ? 'bug' : 'feature', prompts: Array.isArray(task.prompts) ? task.prompts : [] }); setFormTab('Details'); setPreviewContext(false); };

  const saveTask = (e) => {
    e.preventDefault();
    const title = editingTask.title.trim();
    if (!title || title.length > 100) return;
    const existing = tasks.find((t) => t.id === editingTask.id);
    const cleaned = { ...editingTask, title, type: editingTask.type === 'bug' ? 'bug' : 'feature', dueDate: editingTask.dueDate || '', lastChangedAt: nowISO() };
    setTasks((previous) => previous.some((t) => t.id === cleaned.id)
      ? previous.map((t) => t.id === cleaned.id ? cleaned : t)
      : [...previous, cleaned]);
    setEditingTask(null);
    if (existing && existing.assigneeId !== cleaned.assigneeId) {
      const newAssigneeName = members.find((m) => m.id === cleaned.assigneeId)?.name || 'Unassigned';
      announce(`Task successfully reassigned to ${newAssigneeName}.`);
    } else {
      announce('Task saved.');
    }
  };
  const deleteTask = () => {
    if (!editingTask || !window.confirm('Delete this task permanently?')) return;
    setTasks((previous) => previous.filter((t) => t.id !== editingTask.id));
    setEditingTask(null);
    announce('Task deleted.');
  };
  const changeStatus = (taskId, status) => {
    setTasks((previous) => previous.map((t) => t.id === taskId && t.status !== status ? touchTask(t, { status }) : t));
    announce(`Status changed to ${STAGES.find((s) => s.id === status)?.label || status}.`);
  };
  const changeAssignee = (taskId, assigneeId) => {
    setTasks((previous) => previous.map((t) => t.id === taskId && t.assigneeId !== assigneeId ? touchTask(t, { assigneeId }) : t));
    const name = members.find((m) => m.id === assigneeId)?.name || 'Unassigned';
    announce(`Task successfully reassigned to ${name}.`);
  };
  const changeReviewer = (taskId, reviewerId) => {
    setTasks((previous) => previous.map((t) => t.id === taskId && (t.reviewerId || '') !== reviewerId ? touchTask(t, { reviewerId }) : t));
    const name = members.find((m) => m.id === reviewerId)?.name || 'Unassigned';
    announce(`Review assigned to ${name}.`);
  };
  const copyBriefing = (task) => copyText(taskBriefing(task, members)).then(() => announce('Task briefing copied.')).catch(() => announce('Could not copy briefing.'));
  const addPrompt = () => {
    if (!promptText.trim() || !editingTask) return;
    const prompt = { id: uid(), text: promptText.trim(), outcome: promptOutcome, tool: promptTool, dateAdded: nowISO() };
    setEditingTask((current) => ({ ...current, prompts: [...(current.prompts || []), prompt], lastChangedAt: nowISO() }));
    setPromptText('');
  };
  const removePrompt = (promptId) => setEditingTask((current) => ({ ...current, prompts: current.prompts.filter((p) => p.id !== promptId), lastChangedAt: nowISO() }));
  const updatePromptOutcome = (promptId, outcome) => setEditingTask((current) => ({ ...current, prompts: current.prompts.map((p) => p.id === promptId ? { ...p, outcome } : p), lastChangedAt: nowISO() }));

  const toggleTeamMode = () => {
    if (teamMode) {
      setTeamMode(false);
      setShowTeam(false);
      announce('Solo mode active. Team data is preserved but hidden.');
    } else {
      setTeamMode(true);
      setShowTeam(true);
      announce('Team mode enabled.');
    }
  };

  const addMember = (e) => {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    if (name.toUpperCase() === 'YOU' || members.some((m) => m.name.toLowerCase() === name.toLowerCase())) {
      announce('Choose a different, unique team member name.'); return;
    }
    setMembers((previous) => [...previous, { id: uid(), name }]);
    setNewMemberName('');
    announce(`${name} added.`);
  };
  const removeMember = (member) => {
    if (member.id === 'you') return;
    if (!window.confirm(`Remove ${member.name}? Their tasks will become unassigned.`)) return;
    setMembers((previous) => previous.filter((m) => m.id !== member.id));
    setTasks((previous) => previous.map((t) => {
      const updates = {};
      if (t.assigneeId === member.id) updates.assigneeId = '';
      if (t.reviewerId === member.id) updates.reviewerId = '';
      return Object.keys(updates).length ? touchTask(t, updates) : t;
    }));
    announce(`${member.name} removed; their assigned tasks and reviews are now unassigned.`);
  };

  const handleDrop = (status, e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedId;
    if (taskId) changeStatus(taskId, status);
    setDraggedId(null); setDragOver('');
  };
  const progressSummary = `PROJECT PROGRESS SUMMARY\nGenerated: ${new Date().toLocaleString()}\n\nTASKS BY STAGE\n${STAGES.map((s) => `${s.label}: ${stageCounts[s.id]}`).join('\n')}\n\nDEADLINES AND OVERDUE TASKS\n${tasks.map((t) => `- ${t.title} (ID: ${t.id}) — ${STAGES.find((s) => s.id === t.status)?.label}; deadline: ${t.dueDate || 'No deadline'}${t.status === 'review' ? `; reviewer: ${members.find((m) => m.id === t.reviewerId)?.name || 'Unassigned'}` : ''}${isOverdue(t) ? '; OVERDUE' : ''}`).join('\n') || 'No tasks yet.'}`;

  return <div className={`app-shell min-h-screen font-sans ${darkMode ? 'theme-dark bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
    <header className="relative overflow-hidden border-b border-slate-200 bg-white px-3 py-1.5 shadow-sm md:px-5">
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-l from-blue-50 via-indigo-50/50 to-transparent md:block" />
      <div className="relative flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <div aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-indigo-700 text-white shadow-sm">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="4" />
              <path d="m8 12 2.5 2.5L16 9" />
              <path d="M8 2.5v3M16 2.5v3" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="mb-0 text-[9px] font-bold uppercase tracking-[0.18em] text-blue-700">Your project workspace</p>
            <h1 className="text-lg font-extrabold leading-tight tracking-tight text-slate-950">TaskPilot</h1>
            <p className="hidden max-w-xl text-[11px] leading-tight text-slate-600 sm:block">Tasks, team ownership and AI-assisted work — all in one clear view.</p>
          </div>
        </div>
        <div className="relative flex flex-wrap items-center gap-1.5">
          <Button onClick={() => setDarkMode((value) => !value)} aria-pressed={darkMode} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">{darkMode ? '☀ Light mode' : '☾ Night mode'}</Button>
          {teamMode && <Button onClick={() => setShowTeam(true)} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Manage team</Button>}
          <Button onClick={() => setShowSummary(true)} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">Progress summary</Button>
          <Button onClick={toggleTeamMode} className="border border-slate-300 bg-white text-slate-700 hover:bg-slate-50">{teamMode ? 'Disable team mode' : 'Enable team features'}</Button>
          <Button onClick={openNewTask} className="bg-blue-700 text-white shadow-sm hover:bg-blue-800">+ Add task</Button>
        </div>
      </div>
    </header>

    <main className="w-full px-2 py-1.5 md:px-3 md:py-2">
      {storageWarning && <div role="alert" className="mb-4 rounded-md border border-red-400 bg-red-50 p-3 text-sm font-semibold text-red-900">{storageWarning}</div>}
      {toast && <div role="status" aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[80] max-w-[min(90vw,28rem)] -translate-x-1/2 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-xl">{toast}</div>}

      <section aria-label="Task overview" className="mb-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 px-1 text-[11px] leading-tight text-slate-700 sm:gap-x-4 sm:text-xs">
        <span><strong className="font-semibold text-slate-600">Total:</strong> <span className="tabular-nums font-bold text-slate-900">{tasks.length}</span></span>
        <span><strong className="font-semibold text-slate-600">Completed:</strong> <span className="tabular-nums font-bold text-slate-900">{completedCount}</span></span>
        <span><strong className="font-semibold text-slate-600">Incomplete:</strong> <span className="tabular-nums font-bold text-slate-900">{incompleteCount}</span></span>
        <span className={overdueTasks.length ? 'font-semibold text-red-800' : ''}><strong className={overdueTasks.length ? '' : 'font-semibold text-slate-600'}>Overdue:</strong> <span className="tabular-nums font-bold">{overdueTasks.length}</span></span>
      </section>

      <details className="mb-1.5 rounded-lg border border-blue-300 bg-blue-50 px-2 py-1 text-[11px] text-blue-950">
        <summary id="keyboard-help-heading" className="cursor-pointer font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 rounded-sm">
          Keyboard help <span className="font-normal text-blue-900">— Tab to navigate, Enter/Space to activate</span>
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Tab</strong> moves to the next control; <strong>Shift + Tab</strong> moves to the previous control.</li>
          <li>When a task card is focused, press <strong>Enter</strong> or <strong>Space</strong> to open and edit it.</li>
          <li>Use <strong>Tab</strong> to reach buttons, links, fields and the task status menu. Use the menu's arrow keys to choose a status, then press <strong>Enter</strong>.</li>
          <li>In a dialog, <strong>Tab</strong> stays within the dialog. Press <strong>Escape</strong> to close it, or use its Close/Cancel button.</li>
          <li>Dragging tasks is optional. Change a task's status using the <strong>Status</strong> menu in its edit form.</li>
        </ul>
      </details>

      <details className="mb-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-800"><summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">Project links <span className="font-normal text-slate-600">— presentation, demo, report and documentation</span></summary><section aria-label="Deliverable anchors" className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {anchors.map((anchor) => {
          const hasUrl = Boolean(anchor.url && anchor.url.trim());
          return <div key={anchor.id} className={`flex min-w-0 flex-col gap-1.5 rounded-lg border bg-white p-2.5 shadow-sm ${hasUrl ? 'border-emerald-300' : 'border-slate-300'}`}>
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`anchor-${anchor.id}`} className="text-sm font-bold text-slate-900">{anchor.label}</label>
              {hasUrl && <a href={normalizedUrl(anchor.url)} target="_blank" rel="noreferrer" className="shrink-0 text-xs font-semibold text-blue-800 underline underline-offset-2">Open link</a>}
            </div>
            <input id={`anchor-${anchor.id}`} type="url" value={anchor.url} onChange={(e) => updateAnchor(anchor.id, e.target.value)} placeholder={`${anchor.label} URL (optional)`} className="w-full min-w-0 rounded-md border border-slate-400 bg-white px-2.5 py-1.5 text-sm text-slate-950 placeholder:text-slate-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700" />
          </div>;
        })}
      </section></details>

      <details className="mb-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-[11px] text-slate-800">
        <summary className="cursor-pointer font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">Team workload and stalled tasks <span className="font-normal text-slate-600">— {teamMode ? `${members.length} team members` : 'team mode off'} · {stalledTasks.length} stalled</span></summary>
      <div className={`mb-1.5 grid grid-cols-1 items-start gap-1.5 ${teamMode ? 'lg:grid-cols-2' : ''}`}>

        {teamMode && <section className="min-w-0 rounded-lg border border-slate-200 bg-white p-2 shadow-sm" aria-label="Open tasks by team member">
          <div className="mb-1 flex flex-wrap items-end justify-between gap-1">
            <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">Team workload</p><h2 className="mt-0.5 text-sm font-bold text-slate-950">Open tasks by team member</h2></div>
            <span className="text-xs text-slate-600">Tasks not marked Done</span>
          </div>
          {members.length ? <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((m) => {
              const count = openTaskCount(m.id);
              return <div key={m.id} className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2">
                <div aria-hidden="true" className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-800">{m.name.trim().split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-900">{m.name}</p><p className="mt-0.5 text-xs text-slate-600">{count === 1 ? '1 open task' : `${count} open tasks`}</p></div>
                <span className={`flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-extrabold tabular-nums ${count > 0 ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'}`} aria-label={`${count} open tasks assigned to ${m.name}`}>{count}</span>
              </div>;
            })}
          </div> : <p className="text-sm text-slate-600">Add team members to see workload counts.</p>}
        </section>}

        <section className="min-w-0 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2" aria-labelledby="stalled-heading">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 id="stalled-heading" className="text-xs font-bold text-amber-950">Stalled tasks <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-950">{stalledTasks.length}</span></h2>
            <span className="text-[11px] font-semibold text-amber-950">Unchanged 5 seconds (testing)</span>
          </div>
          {stalledTasks.length ? <ul className="mt-1.5 flex flex-wrap gap-1.5">{stalledTasks.map((t) => <li key={t.id} className="flex max-w-full items-center gap-2 rounded-md border border-amber-200 bg-white px-2 py-1"><button onClick={() => openEditTask(t)} className="max-w-[14rem] truncate text-left text-xs font-semibold text-slate-900 underline decoration-amber-500 underline-offset-2">{t.title}</button><span className="shrink-0 text-[11px] text-slate-800">{STAGES.find((s) => s.id === t.status)?.label}</span></li>)}</ul> : <p className="mt-1 text-xs text-slate-800">No incomplete tasks have been unchanged for 5 seconds (testing).</p>}
        </section>
      </div>
      </details>

      {overdueTasks.length > 0 && <section className="mb-5 rounded-lg border border-red-300 bg-red-50 p-4" aria-labelledby="overdue-heading"><h2 id="overdue-heading" className="mb-2 font-bold text-red-950">Overdue tasks</h2><ul className="list-disc space-y-1 pl-5 text-sm text-red-950">{overdueTasks.map((t) => <li key={t.id}><button onClick={() => openEditTask(t)} className="font-semibold underline underline-offset-2">{t.title}</button> — deadline {t.dueDate}</li>)}</ul></section>}

      {tasks.length === 0 && <div className="mb-3 rounded-lg border border-dashed border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-950"><strong>Start with your first task.</strong> Select <strong>+ Add task</strong> above to create it. No setup is required.</div>}
      <section className="grid w-full grid-cols-1 items-stretch gap-2 md:grid-cols-2 xl:grid-cols-4 xl:min-h-[calc(100vh-155px)]" aria-label="Task board" aria-describedby="keyboard-help-heading">
        {STAGES.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);
          const stageStyle = {
            todo: { column: 'border-t-slate-500 bg-slate-100', heading: 'text-slate-800', count: 'border-slate-400 bg-white text-slate-800', drag: 'border-slate-600 bg-slate-200' },
            'in-progress': { column: 'border-t-blue-700 bg-blue-50', heading: 'text-blue-900', count: 'border-blue-300 bg-white text-blue-900', drag: 'border-blue-700 bg-blue-100' },
            review: { column: 'border-t-orange-600 bg-orange-50', heading: 'text-orange-950', count: 'border-orange-300 bg-white text-orange-950', drag: 'border-orange-600 bg-orange-100' },
            done: { column: 'border-t-green-700 bg-green-50', heading: 'text-green-900', count: 'border-green-300 bg-white text-green-900', drag: 'border-green-700 bg-green-100' },
          }[stage.id];
          return <div key={stage.id} onDragOver={(e) => { e.preventDefault(); setDragOver(stage.id); }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOver(''); }} onDrop={(e) => handleDrop(stage.id, e)} className={`flex min-h-[420px] xl:min-h-[calc(100vh-195px)] h-full flex-col rounded-lg border border-t-4 p-3 ${stageStyle.column} ${dragOver === stage.id ? stageStyle.drag : 'border-slate-300'}`}>
            <div className="mb-3 flex items-center justify-between"><h2 className={`font-bold ${stageStyle.heading}`}>{stage.label}</h2><span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${stageStyle.count}`}>{columnTasks.length}</span></div>
            <div className="flex flex-1 flex-col gap-3">
              {columnTasks.map((task) => {
                const assigneeMember = members.find((m) => m.id === task.assigneeId);
                const assignee = assigneeMember?.name || 'Unassigned';
                const assigneeInitials = assigneeMember
                  ? assigneeMember.name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join('')
                  : '?';
                const overdue = isOverdue(task);
                const stalled = isStalled(task);
                const dueState = dueDateState(task);
                const dueTint = {
                  calm: { card: 'border-emerald-400 bg-emerald-50/40', text: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-900', label: 'ON TRACK' },
                  warning: { card: 'border-amber-400 bg-amber-50/50', text: 'text-amber-950', badge: 'bg-amber-100 text-amber-950', label: 'DUE SOON' },
                  alarm: { card: 'border-red-500 bg-red-50/60', text: 'text-red-950', badge: 'bg-red-100 text-red-950', label: 'OVERDUE' },
                  neutral: { card: 'border-slate-300 bg-white', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700', label: '' },
                }[dueState];
                return <article key={task.id} role="group" draggable onDragStart={(e) => { setDraggedId(task.id); e.dataTransfer.setData('text/plain', task.id); }} onDragEnd={() => { setDraggedId(null); setDragOver(''); }} onClick={() => openEditTask(task)} tabIndex={0} aria-label={`Task ${task.title}. Status: ${STAGES.find((s) => s.id === task.status)?.label || task.status}. Press Enter or Space to open and edit this task.`} onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); openEditTask(task); } }} className={`cursor-pointer rounded-md border p-3 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2 ${dueTint.card} ${stalled && dueState !== 'alarm' ? 'ring-1 ring-amber-400' : ''} ${draggedId === task.id ? 'opacity-50' : ''}`}>
                  <div className="mb-2 flex flex-wrap items-center gap-1"><span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-bold ${taskTypeInfo(task.type).className}`}><span aria-hidden="true">{taskTypeInfo(task.type).icon}</span>{taskTypeInfo(task.type).label}</span><span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800">Status: {STAGES.find((s) => s.id === task.status)?.label || task.status}</span>{dueTint.label && <span className={`rounded px-1.5 py-0.5 text-xs font-bold ${dueTint.badge}`}>{dueTint.label}</span>}{stalled && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-950">STALLED</span>}</div>
                  <button onClick={(e) => { e.stopPropagation(); openEditTask(task); }} className="mb-2 block w-full text-left text-sm font-bold text-slate-950 underline-offset-2 hover:underline">{task.title}</button>
                  <p className={`mb-3 text-xs font-semibold ${dueTint.text}`}>{dateLabel(task.dueDate)}</p>
                  {teamMode && <div className="mb-2 flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}><span aria-hidden="true" title={assignee} className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-blue-300 bg-blue-100 text-[11px] font-bold text-blue-950">{assigneeInitials}</span><label className="flex items-center gap-1 text-xs font-semibold text-slate-800"><span className="sr-only">Reassign task</span><select aria-label={`Reassign ${task.title}`} value={task.assigneeId || ''} onChange={(e) => changeAssignee(task.id, e.target.value)} className="rounded border border-slate-300 bg-white p-1 text-xs font-semibold text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><option value="">Unassigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label></div>}
                  {teamMode && task.status === 'review' && <label className="mb-3 flex flex-col gap-1 text-xs font-semibold text-slate-800">Assign review to team member<select aria-label={`Assign review for ${task.title} to team member`} value={task.reviewerId || ''} onChange={(e) => changeReviewer(task.id, e.target.value)} onClick={(e) => e.stopPropagation()} className="w-full rounded-md border border-slate-400 bg-white p-2 text-sm text-slate-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><option value="">Unassigned reviewer</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>}
                  
                  <p className="mb-2 line-clamp-2 text-xs text-slate-700">{task.description || task.background || task.constraints || task.purpose || 'No description added yet.'}</p><div className="flex flex-wrap items-center gap-1.5"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">{task.aiTool || 'Other'}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-800">{(task.prompts || []).length} prompts</span><Button onClick={(e) => { e.stopPropagation(); copyBriefing(task); }} className="ml-auto border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900 hover:bg-slate-100">Copy Context</Button></div>
                </article>;
              })}
              {!columnTasks.length && <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-slate-400 p-5 text-center text-sm text-slate-700">No tasks in {stage.label}.</div>}
            </div>
          </div>;
        })}
      </section>
      <p className="mt-4 text-xs text-slate-700">Data is stored in this browser only. Clearing browser data will delete this board.</p>
    </main>

    {editingTask && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3">
      <section role="dialog" aria-modal="true" aria-labelledby="task-modal-title" tabIndex={-1} className="my-auto flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-slate-300 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><div><div className="flex flex-wrap items-center gap-2"><h2 id="task-modal-title" className="text-lg font-bold">{tasks.some((t) => t.id === editingTask.id) ? 'Edit task' : 'Create task'}</h2><span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs font-bold ${taskTypeInfo(editingTask.type).className}`}><span aria-hidden="true">{taskTypeInfo(editingTask.type).icon}</span>{taskTypeInfo(editingTask.type).label}</span></div><p className="text-xs text-slate-700">Required title: 1–100 characters.</p></div><Button onClick={() => setEditingTask(null)} aria-label="Close task form" className="bg-slate-100 text-slate-900 hover:bg-slate-200">Close</Button></div>
        <form onSubmit={saveTask} className="flex min-h-0 flex-col">
          <div className="flex flex-wrap gap-2 border-b border-slate-200 px-5 pt-3" aria-label="Task form sections">
            {['Details', 'Context', 'Prompts'].map((tab) => <Button key={tab} type="button" aria-pressed={formTab === tab} onClick={() => setFormTab(tab)} className={formTab === tab ? 'bg-blue-800 text-white' : 'border border-slate-300 bg-white text-slate-800'}>{tab}</Button>)}
          </div>
          <div className="flex flex-col gap-4 overflow-y-auto px-5 py-4">
            {formTab === 'Details' && <>
            <Field label="Task title"><input autoFocus required maxLength={100} value={editingTask.title} onChange={(e) => setEditingTask((t) => ({ ...t, title: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="What needs to be done?" /></Field>
            <Field label="Description"><textarea rows={2} value={editingTask.description || ''} onChange={(e) => setEditingTask((t) => ({ ...t, description: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950 focus:outline-none focus:ring-2 focus:ring-blue-700" placeholder="Brief summary or description of the task..." /></Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Task type"><select aria-label="Task type" value={editingTask.type || 'feature'} onChange={(e) => setEditingTask((t) => ({ ...t, type: e.target.value, lastChangedAt: nowISO() }))} className={`rounded-md border p-2.5 font-semibold ${taskTypeInfo(editingTask.type).className}`}><option value="feature">✨ Feature</option><option value="bug">🐞 Bug</option></select></Field>
              <Field label="Status"><select value={editingTask.status} onChange={(e) => setEditingTask((t) => ({ ...t, status: e.target.value, lastChangedAt: nowISO() }))} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950">{STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
              <Field label="Due date" hint="Optional. Leave empty for no deadline."><input type="date" value={editingTask.dueDate || ''} onChange={(e) => setEditingTask((t) => ({ ...t, dueDate: e.target.value, lastChangedAt: nowISO() }))} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950" /></Field>
            </div>
            {teamMode && <Field label="Assigned team member"><select value={editingTask.assigneeId || ''} onChange={(e) => setEditingTask((t) => ({ ...t, assigneeId: e.target.value, lastChangedAt: nowISO() }))} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950"><option value="">Unassigned</option>{members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></Field>}
            </>}
            {formTab === 'Context' && <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-blue-200 bg-blue-50 p-3">
              <div><h3 className="text-sm font-bold text-blue-950">Task context briefing</h3><p className="text-xs text-blue-900">Copy the full task context to paste into a new AI conversation.</p></div>
              <div className="flex gap-2">
                <Button type="button" onClick={() => setPreviewContext(!previewContext)} className="border border-blue-300 bg-white text-blue-900 hover:bg-blue-50">{previewContext ? 'Edit Fields' : 'Preview Markdown'}</Button>
                <Button type="button" onClick={() => copyBriefing(editingTask)} className="bg-blue-800 text-white hover:bg-blue-900">Copy Context</Button>
              </div>
            </div>
            {previewContext ? (
              <div className="rounded-md border border-slate-300 bg-slate-50 p-4 text-slate-900 shadow-inner">
                {taskBriefing(editingTask, members).split('\n').map((line, i) => {
                  if (line.startsWith('# ')) return <h1 key={i} className="mb-3 text-xl font-extrabold text-slate-950">{line.slice(2)}</h1>;
                  if (line.startsWith('## ')) return <h2 key={i} className="mb-2 mt-4 text-sm font-bold uppercase tracking-wider text-slate-800">{line.slice(3)}</h2>;
                  if (line.startsWith('- ')) return <li key={i} className="ml-4 list-disc text-sm text-slate-700">{line.slice(2)}</li>;
                  if (!line.trim()) return <div key={i} className="h-2" />;
                  return <p key={i} className="mb-1 text-sm text-slate-700">{line}</p>;
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Background"><textarea rows={3} value={editingTask.background || ''} onChange={(e) => setEditingTask((t) => ({ ...t, background: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950" placeholder="Explain the context or background..." /></Field>
                <Field label="Constraints"><textarea rows={3} value={editingTask.constraints ?? editingTask.purpose ?? ''} onChange={(e) => setEditingTask((t) => ({ ...t, constraints: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950" placeholder="List technical, time, or business constraints..." /></Field>
                <Field label="Tried so far"><textarea rows={3} value={editingTask.triedSoFar ?? editingTask.workDone ?? ''} onChange={(e) => setEditingTask((t) => ({ ...t, triedSoFar: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950" placeholder="Detail what has been investigated or built..." /></Field>
                <Field label="Pick up"><textarea rows={3} value={editingTask.pickUp ?? editingTask.bottleneck ?? ''} onChange={(e) => setEditingTask((t) => ({ ...t, pickUp: e.target.value }))} className="rounded-md border border-slate-400 p-2.5 text-slate-950" placeholder="Explain what needs to be done next..." /></Field>
              </div>
            )}
            </>}
            {formTab === 'Prompts' && <>
            <Field label="AI tool used for this task"><select value={editingTask.aiTool || 'ChatGPT'} onChange={(e) => setEditingTask((t) => ({ ...t, aiTool: e.target.value }))} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950">{AI_TOOLS.map((tool) => <option key={tool} value={tool}>{tool}</option>)}</select></Field>
            <section className="rounded-lg border border-slate-300 bg-slate-50 p-3" aria-labelledby="prompts-heading"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h3 id="prompts-heading" className="font-bold">Saved AI prompts</h3><span className="text-xs text-slate-700">{(editingTask.prompts || []).length} saved</span></div>
              {(editingTask.prompts || []).length > 0 ? <ul className="mb-4 space-y-2">{editingTask.prompts.map((p) => <li key={p.id} className="rounded-md border border-slate-300 bg-white p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-800">{p.tool} · {new Date(p.dateAdded).toLocaleString()}</span><Button type="button" onClick={() => removePrompt(p.id)} className="px-2 py-1 text-xs text-red-900 hover:bg-red-50">Delete prompt</Button></div><p className="whitespace-pre-wrap break-words text-sm text-slate-950">{p.text}</p><div className="mt-2 flex flex-wrap items-center gap-2"><label className="text-xs font-semibold text-slate-800">Outcome<select value={p.outcome} onChange={(e) => updatePromptOutcome(p.id, e.target.value)} className="ml-2 rounded border border-slate-400 bg-white p-1.5 text-slate-950"><option value="worked">Worked</option><option value="failed">Failed</option></select></label><Button type="button" onClick={() => copyText(p.text).then(() => announce('Prompt copied.')).catch(() => announce('Could not copy prompt.'))} className="border border-slate-300 bg-white px-2 py-1 text-xs text-slate-900">Copy prompt</Button></div></li>)}</ul> : <p className="mb-4 text-sm text-slate-700">No prompts saved for this task yet.</p>}
              <div className="flex flex-col gap-3 border-t border-slate-300 pt-3"><Field label="Prompt text"><textarea rows={3} value={promptText} onChange={(e) => setPromptText(e.target.value)} className="rounded-md border border-slate-400 p-2.5 text-slate-950" placeholder="Paste the prompt used to work on this task..." /></Field><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Field label="AI tool used"><select value={promptTool} onChange={(e) => setPromptTool(e.target.value)} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950">{AI_TOOLS.map((tool) => <option key={tool} value={tool}>{tool}</option>)}</select></Field><Field label="Did it work?"><select value={promptOutcome} onChange={(e) => setPromptOutcome(e.target.value)} className="rounded-md border border-slate-400 bg-white p-2.5 text-slate-950"><option value="worked">Worked</option><option value="failed">Failed</option></select></Field></div><div><Button type="button" onClick={addPrompt} disabled={!promptText.trim()} className="bg-blue-800 text-white hover:bg-blue-900">Save prompt</Button></div></div>
            </section>
            </>}
            <p className="text-xs text-slate-700">Last changed: {editingTask.lastChangedAt ? new Date(editingTask.lastChangedAt).toLocaleString() : 'Not recorded yet'}. Saving changes updates the stalled-task timer.</p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">{tasks.some((t) => t.id === editingTask.id) ? <Button type="button" onClick={deleteTask} className="border border-red-400 bg-white text-red-900 hover:bg-red-50">Delete task</Button> : <span />}
            <div className="ml-auto flex gap-2"><Button type="button" onClick={() => setEditingTask(null)} className="border border-slate-300 bg-white text-slate-900 hover:bg-slate-100">Cancel</Button><Button type="submit" disabled={!editingTask.title.trim() || editingTask.title.trim().length > 100} className="bg-blue-800 text-white hover:bg-blue-900">Save task</Button></div>
          </div>
        </form>
      </section>
    </div>}

    {showTeam && teamMode && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowTeam(false); }}><section role="dialog" aria-modal="true" aria-labelledby="team-title" tabIndex={-1} className="w-full max-w-lg rounded-lg bg-white p-5 shadow-2xl"><div className="mb-4 flex items-center justify-between"><h2 id="team-title" className="text-lg font-bold">Manage team</h2><Button onClick={() => setShowTeam(false)} className="bg-slate-100 text-slate-900">Close</Button></div><p className="mb-4 text-sm text-slate-700">Add or remove team members. You can disable team mode at any time without losing data. “YOU” is the default member and cannot be removed.</p><form onSubmit={addMember} className="mb-4 flex flex-col gap-2 sm:flex-row"><label className="flex-1 text-sm font-semibold text-slate-800">New member name<input value={newMemberName} onChange={(e) => setNewMemberName(e.target.value)} maxLength={60} className="mt-1 w-full rounded-md border border-slate-400 p-2 text-slate-950" placeholder="Enter a name" /></label><Button type="submit" className="self-end bg-blue-800 text-white hover:bg-blue-900">Add member</Button></form><ul className="space-y-2">{members.map((m) => <li key={m.id} className="flex items-center justify-between rounded-md border border-slate-300 p-3"><div><p className="font-semibold">{m.name}</p><p className="text-xs text-slate-700">{openTaskCount(m.id)} open task(s)</p></div>{m.id === 'you' ? <span className="text-xs font-semibold text-slate-700">Default · protected</span> : <Button onClick={() => removeMember(m)} className="border border-red-400 bg-white text-red-900 hover:bg-red-50">Remove</Button>}</li>)}</ul></section></div>}

    {showSummary && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowSummary(false); }}><section role="dialog" aria-modal="true" aria-labelledby="summary-title" tabIndex={-1} className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 p-4"><h2 id="summary-title" className="text-lg font-bold">Progress summary</h2><Button onClick={() => setShowSummary(false)} className="bg-slate-100 text-slate-900">Close</Button></div><div className="overflow-y-auto p-4"><p className="mb-3 text-sm text-slate-700">Copy this summary to share with the project sponsor. The sponsor does not need to use the application.</p><div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">{STAGES.map((s) => <div key={s.id} className="rounded-md border border-slate-300 bg-slate-50 p-3"><p className="text-xs font-semibold text-slate-700">{s.label}</p><p className="text-2xl font-bold">{stageCounts[s.id]}</p></div>)}</div><h3 className="mb-2 font-bold">Deadlines and overdue tasks</h3>{tasks.length ? <ul className="space-y-2">{tasks.map((t) => <li key={t.id} className={`rounded-md border p-3 ${isOverdue(t) ? 'border-red-400 bg-red-50' : 'border-slate-300 bg-white'}`}><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-semibold text-slate-950">{t.title}</span>{isOverdue(t) && <span className="rounded bg-red-700 px-2 py-1 text-xs font-bold text-white">OVERDUE</span>}</div><p className="mt-1 text-sm text-slate-800">Stage: {STAGES.find((s) => s.id === t.status)?.label} · Deadline: {t.dueDate || 'No deadline'}</p></li>)}</ul> : <p className="text-sm text-slate-700">No tasks yet.</p>}</div><div className="flex justify-end border-t border-slate-200 bg-slate-50 p-4"><Button onClick={() => copyText(progressSummary).then(() => announce('Progress summary copied.')).catch(() => announce('Could not copy summary.'))} className="bg-blue-800 text-white hover:bg-blue-900">Copy summary for sponsor</Button></div></section></div>}
    <style>{`button:focus-visible,a:focus-visible,input:focus-visible,textarea:focus-visible,select:focus-visible,[tabindex="0"]:focus-visible{outline:3px solid #1d4ed8;outline-offset:2px}button,a,input,textarea,select{scroll-margin:8px}.theme-dark header,.theme-dark section[aria-label="Deliverable anchors"] > div,.theme-dark section[aria-label="Task overview"],.theme-dark [aria-label="Open tasks by team member"],.theme-dark article,.theme-dark [role="dialog"]{background-color:#111827!important;color:#f8fafc!important;border-color:#475569!important}.theme-dark input,.theme-dark textarea,.theme-dark select{background-color:#1f2937!important;color:#f8fafc!important;border-color:#64748b!important}.theme-dark input::placeholder,.theme-dark textarea::placeholder{color:#cbd5e1!important}.theme-dark .bg-white{background-color:#111827!important}.theme-dark .bg-slate-50,.theme-dark .bg-slate-100{background-color:#1f2937!important}.theme-dark .text-slate-950,.theme-dark .text-slate-900,.theme-dark .text-slate-800,.theme-dark .text-slate-700{color:#e2e8f0!important}.theme-dark .border-slate-200,.theme-dark .border-slate-300{border-color:#475569!important}.theme-dark .bg-blue-50{background-color:#172554!important}.theme-dark .text-blue-900,.theme-dark .text-blue-950{color:#bfdbfe!important}.theme-dark .bg-amber-50{background-color:#422006!important}.theme-dark .text-amber-950{color:#fde68a!important}.theme-dark .bg-red-50{background-color:#450a0a!important}.theme-dark .text-red-950,.theme-dark .text-red-900{color:#fecaca!important}.theme-dark .bg-green-50{background-color:#052e16!important}.theme-dark .text-green-900{color:#bbf7d0!important}`}</style>
  </div>;
}