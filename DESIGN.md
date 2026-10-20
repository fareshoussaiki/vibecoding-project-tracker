# Vibecoding Project Tracker — Design

This is my initial commit

**Status:** Hackathon starter design doc · fill in the **`<TODO>`** sections before you tag `design-done`.

**Why this file exists.** This tracker is your tool. It should look like _your_ tool — not a generic Kanban with default Tailwind blue. Twenty minutes of design decisions here will be visible on every screen for the next six weeks of Module 5.

**Who owns this.** Person B, during the same window the rest of the team is reviewing the PRD. By the time the team converges to start M4 (`data-model`), this file should be filled in and the colors should already be in `tailwind.config.js`.

---

## 1. Mood / vibe

One sentence that captures the feeling the tracker should leave you with.

A high-clarity, accessible light UI featuring full-card color tinting (soft green for features, soft red for bugs) with distinct icons and bold dark borders for instant visual recognition and WCAG AA compliance.

Two or three references that capture the vibe (links to dribbble shots, screenshots of apps you admire, Pinterest boards — anything visual):

- `<TODO>`
- `<TODO>`
- `<TODO>`

Anti-references — what we are explicitly **not** trying to look like:

- `<TODO>`

## 2. Color palette

These are the colors the build milestones will reference. Once chosen, paste the hex values into `tailwind.config.js` so the rest of the team can use Tailwind utility classes (e.g. `bg-brand-primary`, `border-due-warning`).

### Brand

| Token           | Hex       | Where it shows up               |
| --------------- | --------- | ------------------------------- |
| `brand-primary` | `#025a9e` | Header, "+" button, focus rings |
| `brand-accent`  | `#003b6f` | Highlights, hover states, links |
| `surface-page`  | `#f4f6f8` | Page background                 |
| `surface-card`  | `#ffffff` | Card background                 |
| `text-primary`  | `#121212` | Body text                       |
| `text-muted`    | `#4a5568` | Captions, dates, counts         |

### Task type (M6 `tag-style`)

| Token                 | Hex       | When used                                     |
| --------------------- | --------- | --------------------------------------------- |
| `type-feature`        | `#e6fcf5` | Cards tagged `feature` (accent stripe + icon) |
| `type-feature-border` | `#0ca678` | Feature card border & accent text             |
| `type-bug`            | `#fff5f5` | Cards tagged `bug` (accent stripe + icon)     |
| `type-bug-border`     | `#e03131` | Bug card border & accent text                 |

### Due-date states (M8 `due-tint`)

| Token         | Hex       | When used             |
| ------------- | --------- | --------------------- |
| `due-safe`    | `#1864ab` | More than 2 days out  |
| `due-warning` | `#f59f00` | Less than 24 hours    |
| `due-overdue` | `#e03131` | Past due              |
| `due-neutral` | `#595959` | Done (overrides date) |

## 3. Typography

| Role                           | Font             | Why                                                     |
| ------------------------------ | ---------------- | ------------------------------------------------------- |
| Heading                        | `Inter`          | `Clean, bold geometric sans that stands out clearly.`   |
| Body                           | `Inter`          | `High x-height ensuring high readability at 14px.`      |
| Monospace (tags, badges, code) | `JetBrains Mono` | `Easily distinguishes O/0 and I/l for IDs and prompts.` |

Suggested sizes (override only if the design demands it):

- Page title: 24 px / semibold
- Section header: 16 px / semibold uppercase
- Card title: 14 px / medium
- Body: 14 px / regular
- Caption: 12 px / regular muted

## 4. Component principles

One short sentence per element. These set the tone for the build phase — Person A's modal and Person B's anchor board should both feel like they came from this doc.

- **Cards:** `Light tinted backgrounds (`#e6fcf5`for features,`#fff5f5` for bugs) bounded by a crisp 1.5px solid colored border (`#0ca678`or`#e03131`). Every card includes a text badge and an icon (`⚙️ Feature`or`🚨 Bug`) so information is never conveyed by color alone.` (e.g. "Light, almost weightless; the only weight is from a 1px border, no shadow except on hover.")
- **Buttons:** `- **Buttons:** Solid `#025a9e` fill, bold white text, strict 4px rounded corners (`rounded-sm`), and visible focus rings.` (e.g. "Solid fill, no gradient, generous padding, rounded-md.")
- **Modal:** `Centered, `max-width-lg`, with a solid `#121212` backdrop at 75% opacity to block out distractions while editing task context.` (e.g. "Centered, max-width-md, slate-900 backdrop at 50% opacity.")
- **Empty states:** `#4a5568` text with a 2px dashed gray border. (e.g. "Dashed border, muted text, never sad.")
- **Drag affordance (if used):** `None - we use a status dropdown` (e.g. "None — we use a status dropdown.")

## 5. Voice / microcopy

Three lines of microcopy that capture the tone of the product. Keep it short — these are the words a stressed user reads at 11pm.

| Where                                | Text                            |
| ------------------------------------ | ------------------------------- |
| "+" button label                     | `+ Add Task`                    |
| Empty column placeholder             | `No tasks in this phase.`       |
| Toast after "Copy as Prompt Context" | `Context copied to clipboard.`  |
| Confirm-delete message               | `Permanently delete this task?` |
| Handoff toast (M7 `task-owner`)      | `Task assigned to {name}.`      |

## 6. Logo / wordmark

The tracker probably doesn't need a logo, but it does need a name and a wordmark style.

- **Product name:** `<TODO>` (match PRD §11 team identity)
- **Wordmark style:** `<TODO>` (e.g. "Just the name in the heading font, brand-primary color, no icon.")

## 7. Out of scope (this hackathon)

To keep design tight, the following are explicitly not part of `design-done`:

- A dark mode toggle. Pick one mode and ship it.
- Multiple themes. One brand, applied consistently.
- Animations beyond a 200 ms fade on toast notifications.
- A custom icon set. Use [Lucide icons](https://lucide.dev) via Tailwind classes if you need any.

---

_DESIGN.md version: hackathon-starter v1_
