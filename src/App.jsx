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
  },
  {
    id: '102',
    title: 'Design Database Schema',
    description: 'Create ERD and SQL scripts.',
    type: 'bug',
    status: 'in-progress',
    assignee: TEAM[1],
    dueDate: '2026-10-25',
    createdDate: '2026-10-20',
  },
  {
    id: '103',
    title: 'Refactor Backend Code',
    description: 'Clean up technical debt in the API.',
    type: 'feature',
    status: 'review',
    assignee: TEAM[2],
    dueDate: '2026-10-22',
    createdDate: '2026-10-20',
  }
];

export default function App() {
  // TODO M4 data-model:
     const [tasks, setTasks] = useLocalStorage('vibetracker.tasks', initialSeedTasks);
  //
  // TODO M5 crud-modal:
  //   const [editing, setEditing] = useState(null);
  //
  // TODO M11 anchors:
  //   const [anchors, setAnchors] = useLocalStorage('vibetracker.anchors', [...]);

  return (
    <div className="h-screen flex flex-col p-6 overflow-hidden">
      <header className="mb-6 flex items-end justify-between flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Vibecoding Project Tracker
          </h1>
          <p className="text-sm text-slate-500">
            {/* Replace this line with your team name from PRD §11. */}
            Team starter
          </p>
        </div>
      </header>

      {/* TODO M11 anchors: render the Anchor Board (Presentation / Demo / Report / Documentation) above the board. */}

      {/*
        TODO M4 data-model:
          Render a Kanban board with the four columns from STAGES.
          Each column should display the tasks whose status matches its id.
          Pre-populate 3-4 mock tasks so the board isn't empty on first load.

        TODO M5 crud-modal:
          Add a "+" button that opens a modal with every Task field.
          Clicking a card should open the same modal in edit mode.
      */}
      <main className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1 min-h-0">
        {STAGES.map((stage) => {
          const columnTasks = tasks.filter((task) => task.status === stage.id);

          return (
            <div key={stage.id} className="flex flex-col gap-4 bg-surface-card p-4 rounded-md border border-slate-200 shadow-sm h-full">
              
              {/* Column Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-700">
                  {stage.label}
                </h2>
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-mono">
                  {columnTasks.length}
                </span>
              </div>

              {/* Task Cards Container */}
              <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
                {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`p-4 rounded-sm border-[1.5px] shadow-sm flex flex-col gap-2 transition-all
                      ${task.type === 'feature'
                        ? 'border-type-feature-border bg-type-feature'
                        : 'border-type-bug-border bg-type-bug'
                      }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-text-muted font-mono">ID-{task.id}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-sm font-mono font-bold flex items-center gap-1
                        ${task.type === 'feature' ? 'bg-[#0ca678] text-white' : 'bg-[#e03131] text-white'}
                      `}>
                        {task.type === 'feature' ? '⚙️ Feature' : '🚨 Bug'}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-text-primary leading-snug">
                      {task.title}
                    </h3>

                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-black/5">
                      <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center text-white text-[10px] font-bold">
                        {task.assignee.charAt(task.assignee.length - 1)}
                      </div>
                      <span className="text-xs text-text-muted">{task.assignee}</span>
                    </div>
                  </div>
                ))}

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
    </div>
  );
}
