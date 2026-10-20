import { useState, useEffect } from 'react';

/**
 * Vibecoding Project Tracker — starter scaffold.
 *
 * This file is intentionally almost empty. The boilerplate (Vite, React,
 * Tailwind) is configured for you, plus a few shared constants and a
 * localStorage helper. Everything visible on screen, you build.
 *
 * Where to start (build sequence in Phase 3):
 *   - M4  data-model    : render the four columns and the task cards below.
 *   - M5  crud-modal    : add the "+" button modal and the edit-on-click modal.
 *   - M6  tag-style     : feature vs. bug color coding (uses DESIGN.md §2 colors).
 *   - M7  task-owner    : assignee badge + "Hand off to..." dropdown.
 *   - M8  due-tint      : color cards by due date (uses DESIGN.md §2 due-state colors).
 *   - M9  context       : a curated Context briefing field on the modal.
 *   - M10 copy-prompt   : a "Copy as Prompt Context" button that serializes the task + context.
 *   - M11 anchors       : the Anchor Board above the Kanban.
 *   - M12 secret-sauce  : the one open-ended thing that makes your tracker yours.
 *
 * Search the file for `TODO M<n>` to find the right hook for each milestone.
 */

/**
 * @typedef {Object} Task
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {'feature'|'bug'} type
 * @property {'todo'|'in-progress'|'review'|'done'} status
 * @property {string} assignee
 * @property {string|null} dueDate     ISO 'YYYY-MM-DD'
 * @property {string} createdDate      ISO 'YYYY-MM-DD'
 * @property {string} [context]        Markdown AI briefing context
 * @property {string} [contextTool]    Target AI Tool (Claude, Cursor, etc.)
 * @property {string} [contextUpdatedAt] ISO string timestamp
 */

/**
 * @typedef {Object} Anchor
 * @property {string} id
 * @property {string} label
 * @property {string} url
 */

// The four columns of the board, in render order.
// Use these IDs everywhere — do not invent new ones.
export const STAGES = [
  { id: 'todo',        label: 'To Do' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'review',      label: 'Review' },
  { id: 'done',        label: 'Done' },
];

// Replace these placeholders with the three names from PRD §8 before M4.
// They become the only valid values for `Task.assignee`.
export const TEAM = ['Teammate A', 'Teammate B', 'Teammate C'];

// M9 AI Tool choices
export const AI_TOOLS = ['Claude', 'ChatGPT', 'Cursor', 'Lovable', 'Replit', 'Other'];

// M11 Deliverable Anchor Default State
export const DEFAULT_ANCHORS = [
  { id: 'presentation', label: 'Presentation', url: '' },
  { id: 'demo',         label: 'Demo',         url: '' },
  { id: 'report',       label: 'Report',       url: '' },
  { id: 'documentation',label: 'Documentation',url: '' },
];

// M9 Default Context Template
const DEFAULT_CONTEXT_TEMPLATE = `## Background
Briefly explain what this task is about and why we are building it.

## Constraints
- Keep dependencies minimal.
- Ensure strict WCAG accessibility compliance.

## Tried so far
- Initial scaffold created.

## Pick up
Next immediate step for the AI / developer to execute.`;

// M12 Web Audio Synthesizer Sound Effects (No external files needed)
function playAudioFeedback(type) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    if (type === 'drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (type === 'done') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.08);
        osc.stop(ctx.currentTime + idx * 0.08 + 0.25);
      });
    }
  } catch {
    /* Ignore audio context restrictions */
  }
}

/**
 * A tiny localStorage hook — survives reloads, no library needed.
 *
 * Usage:
 *   const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', []);
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw != null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or private-mode error — silently ignore for hackathon */
    }
  }, [key, value]);

  return [value, setValue];
}

// Data
const initialSeedTasks = [
  {
    id: '101',
    title: 'Implement User Authentication',
    description: 'Set up login and signup flow.',
    type: 'feature',
    status: 'todo',
    assignee: TEAM[0],
    dueDate: '2026-11-01',
    createdDate: '2026-10-20',
    context: DEFAULT_CONTEXT_TEMPLATE,
    contextTool: 'Claude',
    contextUpdatedAt: new Date().toISOString(),
  },
  {
    id: '102',
    title: 'Design Database Schema',
    description: 'Create ERD and SQL scripts.',
    type: 'bug',
    status: 'in-progress',
    assignee: TEAM[1],
    dueDate: '2026-10-20',
    createdDate: '2026-10-20',
    context: `## Background\nDatabase queries are missing proper indexes.\n\n## Constraints\nMust maintain relational integrity.\n\n## Tried so far\nIdentified slow queries.\n\n## Pick up\nAdd index to foreign keys.`,
    contextTool: 'Cursor',
    contextUpdatedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
  },
  {
    id: '103',
    title: 'Refactor Backend Code',
    description: 'Clean up technical debt in the API.',
    type: 'feature',
    status: 'review',
    assignee: TEAM[2],
    dueDate: '2026-10-15',
    createdDate: '2026-10-20',
    context: DEFAULT_CONTEXT_TEMPLATE,
    contextTool: 'ChatGPT',
    contextUpdatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  }
];

// M8 Helper: Calculate Time-Based Urgency
function getDueUrgency(task) {
  if (task.status === 'done') return 'done';
  if (!task.dueDate) return 'calm';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(task.dueDate);
  due.setHours(0, 0, 0, 0);

  const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'alarm';
  if (diffDays <= 1) return 'warning';
  return 'calm';
}

// M9 Helper: Relative Time Ago Format
function formatTimeAgo(isoString) {
  if (!isoString) return 'never';
  const date = new Date(isoString);
  const now = new Date();
  const diffMins = Math.floor((now - date) / (1000 * 60));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// M10 Helper: Serializes task into clean AI prompt context
function formatTaskPrompt(task) {
  return `# Task Briefing: ${task.title} (ID-${task.id})
**Type:** ${task.type === 'feature' ? 'Feature ⚙️' : 'Bug 🚨'}
**Status:** ${task.status.toUpperCase()}
**Assignee:** ${task.assignee}
${task.dueDate ? `**Due Date:** ${task.dueDate}` : ''}

## Description
${task.description || 'No description provided.'}

${task.context || ''}`;
}

export default function App() {
  // TODO M4 data-model:
  const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', initialSeedTasks);

  // TODO M5 crud-modal:
  const [editingTask, setEditingTask] = useState(null);

  // TODO M11 anchors:
  const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', DEFAULT_ANCHORS);

  // TODO M12 secret-sauce: Drag-and-Drop state
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);

  // M7 & M10 Toast Message State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // M11 Anchor Handler
  const handleAnchorChange = (id, newUrl) => {
    setAnchors((prev) =>
      prev.map((a) => (a.id === id ? { ...a, url: newUrl } : a))
    );
  };

  // M10 Clipboard Copy Handler
  const handleCopyContext = (task, e) => {
    if (e) e.stopPropagation();
    const formattedText = formatTaskPrompt(task);
    navigator.clipboard.writeText(formattedText).then(() => {
      showToast('Copied to clipboard!');
    }).catch(() => {
      showToast('Failed to copy to clipboard.');
    });
  };

  // M12 Secret Sauce: Master Sprint Export (Formatting Fixed)
  const handleExportSprintPrompt = () => {
    const summary = `# Vibecoding Sprint Overview
**Total Tasks:** ${tasks.length}
**Completed:** ${tasks.filter((t) => t.status === 'done').length}
**In Progress:** ${tasks.filter((t) => t.status === 'in-progress').length}

## Active Deliverables
${anchors.map((a) => `- **${a.label}:**${a.url && a.url.trim() ? a.url.trim() : 'Not set'}`).join('\n')}

## Tasks Detail
${tasks.map((t) => `### [ID-${t.id}] ${t.title} (${t.status.toUpperCase()})
- Assignee: ${t.assignee}
- Type: ${t.type}${t.context && t.context.trim() ? `\n\n${t.context.trim()}` : ''}`).join('\n\n')}`;

    navigator.clipboard.writeText(summary).then(() => {
      showToast('⚡ Master Sprint Prompt Copied!');
    });
  };

  // M12 Drag & Drop Handlers
  const handleDragStart = (taskId, e) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (stageId, e) => {
    e.preventDefault();
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleDrop = (stageId, e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: stageId } : t))
      );
      playAudioFeedback(stageId === 'done' ? 'done' : 'drop');
      showToast(`Task moved to ${STAGES.find((s) => s.id === stageId)?.label}`);
    }
    setDraggedTaskId(null);
    setDragOverStage(null);
  };

  const handleOpenNewModal = (defaultStatus = 'todo') => {
    const nowIso = new Date().toISOString();
    setEditingTask({
      id: '',
      title: '',
      description: '',
      type: 'feature',
      status: defaultStatus,
      assignee: TEAM[0],
      dueDate: new Date().toISOString().split('T')[0],
      createdDate: new Date().toISOString().split('T')[0],
      context: DEFAULT_CONTEXT_TEMPLATE,
      contextTool: 'Claude',
      contextUpdatedAt: nowIso,
    });
  };

  const handleOpenEditModal = (task) => {
    setEditingTask({
      ...task,
      context: task.context ?? DEFAULT_CONTEXT_TEMPLATE,
      contextTool: task.contextTool ?? 'Claude',
      contextUpdatedAt: task.contextUpdatedAt ?? new Date().toISOString(),
    });
  };

  const handleQuickHandoff = (taskId, newAssignee) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee: newAssignee } : t))
    );
    showToast(`${newAssignee} has the helm.`);
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!editingTask.title.trim()) return;

    if (!editingTask.id) {
      const newTask = {
        ...editingTask,
        id: String(Math.floor(104 + Math.random() * 896)),
      };
      setTasks((prev) => [...prev, newTask]);
    } else {
      const oldTask = tasks.find((t) => t.id === editingTask.id);
      if (oldTask && oldTask.assignee !== editingTask.assignee) {
        showToast(`${editingTask.assignee} has the helm.`);
      }
      setTasks((prev) =>
        prev.map((t) => (t.id === editingTask.id ? editingTask : t))
      );
    }
    setEditingTask(null);
  };

  const handleDeleteTask = () => {
    if (window.confirm('Permanently delete this task?')) {
      setTasks((prev) => prev.filter((t) => t.id !== editingTask.id));
      setEditingTask(null);
    }
  };

  // M12 Metrics Calculations
  const completedCount = tasks.filter((t) => t.status === 'done').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const bugCount = tasks.filter((t) => t.type === 'bug').length;

  return (
    <div className="min-h-screen flex flex-col p-6 overflow-y-auto bg-slate-100 text-slate-900 font-sans relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-sm shadow-xl border border-slate-700 text-sm font-semibold flex items-center gap-2 transition-all">
          <span>📋</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <header className="mb-4 flex items-end justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Vibecoding Project Tracker
          </h1>
          <p className="text-sm text-slate-500">
            {/* Replace this line with your team name from PRD §11. */}
            BaseTracker · Team starter
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* M12 Master Prompt Export Button */}
          <button
            onClick={handleExportSprintPrompt}
            className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-2 rounded-sm font-bold text-xs transition-colors shadow-sm cursor-pointer flex items-center gap-1"
            title="Copy full sprint context for AI tools"
          >
            <span>⚡</span>
            <span>Export Sprint Prompt</span>
          </button>

          {/* M5 Add Task Button */}
          <button
            onClick={() => handleOpenNewModal('todo')}
            className="bg-[#025a9e] hover:bg-[#003b6f] text-white px-4 py-2 rounded-sm font-bold text-sm transition-colors shadow-sm cursor-pointer"
          >
            + Add Task
          </button>
        </div>
      </header>

      {/* TODO M11 anchors: Deliverable Anchor Board */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-4 gap-4 flex-shrink-0">
        {anchors.map((anchor) => {
          const hasUrl = Boolean(anchor.url && anchor.url.trim());
          return (
            <div
              key={anchor.id}
              className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex flex-col gap-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  {anchor.label}
                </span>
                <div className="flex items-center gap-1.5">
                  {hasUrl && (
                    <a
                      href={anchor.url.startsWith('http') ? anchor.url : `https://${anchor.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-[#025a9e] hover:underline font-semibold"
                      title="Open link"
                    >
                      ↗ Open
                    </a>
                  )}
                  <span
                    className={`w-3 h-3 rounded-full border transition-colors ${
                      hasUrl
                        ? 'bg-[#025a9e] border-[#025a9e]'
                        : 'bg-white border-slate-300'
                    }`}
                    title={hasUrl ? 'Deliverable Linked' : 'Deliverable Empty'}
                  />
                </div>
              </div>

              <input
                type="text"
                value={anchor.url || ''}
                onChange={(e) => handleAnchorChange(anchor.id, e.target.value)}
                placeholder="Enter URL..."
                className="text-xs p-1.5 border border-slate-300 rounded text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#025a9e]"
              />
            </div>
          );
        })}
      </div>

      {/* M7 Active Drivers & M8 Legend & M12 Secret Sauce Pulse Bar */}
      <div className="mb-4 flex items-center justify-between gap-3 bg-white p-3 rounded-md border border-slate-200 shadow-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mr-1">
            Drivers:
          </span>
          {TEAM.map((member) => {
            const activeTask = tasks.find(
              (t) => t.assignee === member && t.status === 'in-progress'
            ) || tasks.find((t) => t.assignee === member && t.status !== 'done');

            return (
              <div key={member} className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded border border-slate-200 text-xs">
                <div className="w-4 h-4 rounded-full bg-[#025a9e] flex items-center justify-center text-white font-bold text-[9px]">
                  {member.charAt(member.length - 1)}
                </div>
                <span className="font-bold text-slate-800">{member}:</span>
                <span className="text-slate-600 truncate max-w-[120px]">
                  {activeTask ? activeTask.title : 'Idle'}
                </span>
              </div>
            );
          })}
        </div>

        {/* M12 Secret Sauce Sprint Pulse Analytics */}
        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 border-l border-slate-200 pl-4">
          <span className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">Sprint Velocity:</span>
          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
            {progressPct}% Done
          </span>
          <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-mono font-bold">
            {bugCount} Bugs
          </span>
        </div>
      </div>

      {/*
        TODO M4 data-model:
          Render a Kanban board with the four columns from STAGES.
          Each column should display the tasks whose status matches its id.
          Pre-populate 3-4 mock tasks so the board isn't empty on first load.

        TODO M5 crud-modal:
          Add a "+" button that opens a modal with every Task field.
          Clicking a card should open the same modal in edit mode.
      */}
      <main className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
        {STAGES.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);
          const isOver = dragOverStage === stage.id;

          return (
            <div
              key={stage.id}
              onDragOver={(e) => handleDragOver(stage.id, e)}
              onDrop={(e) => handleDrop(stage.id, e)}
              className={`flex flex-col gap-4 p-4 rounded-md border shadow-sm min-h-[400px] transition-colors ${
                isOver ? 'bg-blue-50/80 border-[#025a9e] ring-2 ring-[#025a9e]/20' : 'bg-white border-slate-200'
              }`}
            >
              
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  {stage.label}
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono font-bold">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex flex-col gap-3 flex-1">
                {columnTasks.map((task) => {
                  const urgency = getDueUrgency(task);

                  let cardStyle = '';
                  if (urgency === 'done') {
                    cardStyle = 'bg-slate-50 border-slate-200 opacity-60 grayscale';
                  } else if (urgency === 'alarm') {
                    cardStyle = 'bg-red-50 border-red-500 shadow-red-100';
                  } else if (urgency === 'warning') {
                    cardStyle = 'bg-amber-50 border-amber-500 shadow-amber-100';
                  } else {
                    cardStyle = task.type === 'feature'
                      ? 'border-[#0ca678] bg-[#e6fcf5]'
                      : 'border-[#e03131] bg-[#fff5f5]';
                  }

                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(task.id, e)}
                      onClick={() => handleOpenEditModal(task)}
                      className={`p-4 rounded-sm border-[1.5px] shadow-sm flex flex-col gap-2 transition-all cursor-grab active:cursor-grabbing hover:shadow-md hover:-translate-y-0.5 ${cardStyle}`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600 font-mono font-semibold">ID-{task.id}</span>
                        
                        <div className="flex items-center gap-1">
                          {urgency === 'alarm' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-red-600 text-white">
                              🚨 PAST DUE
                            </span>
                          )}
                          {urgency === 'warning' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold bg-amber-500 text-white">
                              ⚠️ DUE SOON
                            </span>
                          )}

                          <span className={`text-xs px-2 py-0.5 rounded-sm font-mono font-bold flex items-center gap-1
                            ${task.type === 'feature' ? 'bg-[#0ca678] text-white' : 'bg-[#e03131] text-white'}
                          `}>
                            {task.type === 'feature' ? '⚙️ Feature' : '🚨 Bug'}
                          </span>
                        </div>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        {task.title}
                      </h3>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-[#025a9e] flex items-center justify-center text-white text-[10px] font-bold">
                            {task.assignee.charAt(task.assignee.length - 1)}
                          </div>
                          <span className="text-xs text-slate-700 font-medium">{task.assignee}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          {/* M10 Copy Context Compact Button */}
                          <button
                            type="button"
                            onClick={(e) => handleCopyContext(task, e)}
                            className="inline-flex items-center gap-1 text-[11px] bg-white hover:bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-300 font-medium transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                            title="Copy prompt context to clipboard"
                          >
                            <span>📋</span>
                            <span>Copy</span>
                          </button>

                          {/* M7 Handoff Dropdown */}
                          <select
                            value={task.assignee}
                            onClick={(e) => e.stopPropagation()}
                            onChange={(e) => handleQuickHandoff(task.id, e.target.value)}
                            className="text-[11px] bg-white border border-slate-300 rounded px-1.5 py-0.5 text-slate-700 font-medium focus:outline-none hover:border-slate-400 cursor-pointer"
                            title="Hand off to..."
                          >
                            {TEAM.map((m) => (
                              <option key={m} value={m}>
                                Hand off to {m}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Empty column state */}
                {columnTasks.length === 0 && (
                  <div className="border-2 border-dashed border-slate-200 p-6 text-center rounded-sm my-auto">
                    <span className="text-xs text-slate-400">No tasks in this phase.</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </main>

      {/* M5 / M6 / M9 / M10 CRUD & Context Modal Overlay */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-md max-w-2xl w-full p-6 shadow-2xl border border-slate-300 flex flex-col gap-4 max-h-[90vh] overflow-y-auto my-auto">
            
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  {editingTask.id ? `Edit Task (ID-${editingTask.id})` : 'New Task'}
                </h2>
                
                {/* M6 Badge */}
                <span className={`text-xs px-2 py-0.5 rounded-sm font-mono font-bold flex items-center gap-1 text-white ${
                  editingTask.type === 'feature' ? 'bg-[#0ca678]' : 'bg-[#e03131]'
                }`}>
                  {editingTask.type === 'feature' ? '⚙️ Feature' : '🚨 Bug'}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="text-slate-400 hover:text-slate-700 font-bold text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="flex flex-col gap-4">
              
              {/* Title */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="e.g. Implement User Authentication"
                  className="p-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#025a9e]"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  placeholder="Provide brief context or instructions..."
                  className="p-2 border border-slate-300 rounded-sm text-sm focus:outline-none focus:ring-2 focus:ring-[#025a9e] resize-none"
                />
              </div>

              {/* TODO M9 context: Task Context Section */}
              <div className="flex flex-col gap-1 bg-slate-50 p-3 rounded border border-slate-200">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                    <span>🤖 Task Context Briefing</span>
                  </label>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-500 font-mono">
                      Last updated {formatTimeAgo(editingTask.contextUpdatedAt)}
                    </span>
                    
                    {/* M10 Copy Context Button Inside Modal */}
                    <button
                      type="button"
                      onClick={() => handleCopyContext(editingTask)}
                      className="inline-flex items-center gap-1 text-xs bg-[#025a9e] hover:bg-[#003b6f] text-white px-2.5 py-1 rounded font-bold transition-colors cursor-pointer shadow-sm"
                    >
                      <span>📋</span>
                      <span>Copy Context</span>
                    </button>
                  </div>
                </div>

                <textarea
                  rows={6}
                  value={editingTask.context}
                  onChange={(e) =>
                    setEditingTask({
                      ...editingTask,
                      context: e.target.value,
                      contextUpdatedAt: new Date().toISOString(),
                    })
                  }
                  placeholder="Provide detailed AI context (Background, Constraints, Tried so far, Pick up)..."
                  className="p-2.5 border border-slate-300 rounded-sm text-xs font-mono bg-white focus:outline-none focus:ring-2 focus:ring-[#025a9e] leading-relaxed resize-y"
                />

                {/* M9 AI Tool Select */}
                <div className="flex items-center gap-2 mt-2">
                  <label className="text-xs text-slate-600 font-semibold">
                    Optional AI Tool:
                  </label>
                  <select
                    value={editingTask.contextTool || 'Claude'}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, contextTool: e.target.value })
                    }
                    className="p-1 border border-slate-300 rounded text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#025a9e]"
                  >
                    {AI_TOOLS.map((tool) => (
                      <option key={tool} value={tool}>
                        {tool}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type & Status Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Type
                  </label>
                  <select
                    value={editingTask.type}
                    onChange={(e) => setEditingTask({ ...editingTask, type: e.target.value })}
                    className="p-2 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025a9e]"
                  >
                    <option value="feature">⚙️ Feature</option>
                    <option value="bug">🚨 Bug</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Status
                  </label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="p-2 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025a9e]"
                  >
                    {STAGES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignee & Due Date Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Hand off to...
                  </label>
                  <select
                    value={editingTask.assignee}
                    onChange={(e) => setEditingTask({ ...editingTask, assignee: e.target.value })}
                    className="p-2 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025a9e]"
                  >
                    {TEAM.map((member) => (
                      <option key={member} value={member}>
                        {member}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editingTask.dueDate || ''}
                    onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value || null })}
                    className="p-2 border border-slate-300 rounded-sm text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#025a9e]"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-200">
                {editingTask.id ? (
                  <button
                    type="button"
                    onClick={handleDeleteTask}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-sm text-sm font-bold transition-colors cursor-pointer"
                  >
                    Delete Task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="px-4 py-1.5 text-slate-700 hover:text-slate-900 text-sm font-bold cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#025a9e] hover:bg-[#003b6f] text-white rounded-sm text-sm font-bold transition-colors shadow-sm cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
}