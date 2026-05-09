# Design Document: To-Do List Life Dashboard

## Overview

The To-Do List Life Dashboard is a single-page, client-side web application built with plain HTML, CSS, and Vanilla JavaScript. It provides four functional panels on one screen: a live Greeting panel showing the current time, date, and a time-based greeting; a Pomodoro-style Focus Timer; a persistent To-Do List; and a Quick Links panel for user-defined URL shortcuts. All data is stored in `localStorage` with no backend or build step required.

The application is intentionally minimal in its dependency footprint — one HTML file, one CSS file, and one JavaScript file — making it trivially deployable as a static page or browser extension.

---

## Architecture

The application follows a **module-based vanilla JS architecture** where each panel is managed by a dedicated module (a plain JS object or set of functions in a single file). A thin `app.js`-style initialization block at the bottom of the JS file bootstraps all modules on `DOMContentLoaded`.

```
index.html          ← single HTML file at root
css/
  style.css         ← all styles, CSS custom properties, layout
js/
  javascript/
    app.js          ← single JS file: all modules + init
```

Data flow is unidirectional within each module:

```
User Event → Handler → Update State → Persist to localStorage → Re-render DOM
```

There is no shared global state object. Each module owns its slice of `localStorage` and its section of the DOM.

### High-Level Module Map

```
┌─────────────────────────────────────────────────────────┐
│                        index.html                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Greeting    │  │ Focus Timer  │  │  Task Manager│  │
│  │  Module      │  │  Module      │  │  Module      │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                    ┌──────────────┐                     │
│                    │ Quick Links  │                     │
│                    │  Module      │                     │
│                    └──────────────┘                     │
│                    ┌──────────────┐                     │
│                    │  Storage     │                     │
│                    │  Module      │                     │
│                    └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
```

---

## Components and Interfaces

### 1. Greeting Module

**Responsibility**: Display current time (HH:MM), current date (human-readable), and a time-based greeting. Update every second via `setInterval`.

**DOM target**: `#greeting-panel`

**Public interface**:
```js
GreetingModule.init()   // starts the interval, renders immediately
```

**Internal functions**:
```js
getGreeting(hour)       // returns greeting string based on hour (0–23)
formatTime(date)        // returns "HH:MM" string
formatDate(date)        // returns "Weekday, D Month YYYY" string
render()                // updates DOM elements with current values
```

**Greeting logic**:
| Hour range | Greeting       |
|------------|----------------|
| 05–11      | Good Morning   |
| 12–17      | Good Afternoon |
| 18–20      | Good Evening   |
| 21–04      | Good Night     |

---

### 2. Focus Timer Module

**Responsibility**: Manage a 25-minute countdown timer with start, stop, and reset controls. Enforce button state rules (start disabled while running; stop disabled while paused/reset).

**DOM target**: `#timer-panel`

**Public interface**:
```js
TimerModule.init()      // binds event listeners, renders initial state
```

**Internal state** (module-scoped variables):
```js
let remainingSeconds = 1500   // 25 * 60
let intervalId = null         // null when not running
```

**Internal functions**:
```js
startTimer()            // starts setInterval, updates button states
stopTimer()             // clears interval, updates button states
resetTimer()            // clears interval, resets remainingSeconds, re-renders
tick()                  // decrements remainingSeconds, checks for 00:00, renders
formatMMSS(seconds)     // returns "MM:SS" string
updateButtonStates()    // enables/disables start and stop buttons
renderDisplay()         // updates the timer display element
```

---

### 3. Task Manager Module

**Responsibility**: Add, display, edit, complete, and delete tasks. Persist all changes to `localStorage` immediately.

**DOM target**: `#task-panel`

**Public interface**:
```js
TaskModule.init()       // loads from storage, renders list, binds form listener
```

**Internal state**:
```js
let tasks = []          // array of Task objects (loaded from localStorage)
```

**Internal functions**:
```js
loadTasks()             // reads and deserializes from localStorage
saveTasks()             // serializes tasks array and writes to localStorage
renderList()            // clears and re-renders the full task list DOM
addTask(description)    // validates, creates Task, pushes to array, saves, renders
deleteTask(id)          // removes task by id, saves, renders
toggleComplete(id)      // flips completed flag, saves, renders
beginEdit(id)           // replaces task text with an input field in the DOM
confirmEdit(id, value)  // validates, updates task text, saves, renders
cancelEdit(id)          // re-renders without saving
createTaskElement(task) // returns a DOM element for a single task
```

---

### 4. Quick Links Module

**Responsibility**: Add, display, and delete user-defined URL shortcut buttons. Persist to `localStorage`.

**DOM target**: `#links-panel`

**Public interface**:
```js
LinksModule.init()      // loads from storage, renders buttons, binds form listener
```

**Internal state**:
```js
let links = []          // array of Link objects
```

**Internal functions**:
```js
loadLinks()             // reads and deserializes from localStorage
saveLinks()             // serializes links array and writes to localStorage
renderLinks()           // clears and re-renders all link buttons
addLink(label, url)     // validates, creates Link, pushes, saves, renders
deleteLink(id)          // removes link by id, saves, renders
createLinkElement(link) // returns a DOM element (button + delete control)
```

---

### 5. Storage Module

**Responsibility**: Provide a thin, safe wrapper around `localStorage` with JSON serialization, deserialization, and availability detection.

**Public interface**:
```js
StorageModule.isAvailable()         // returns boolean
StorageModule.save(key, data)       // JSON.stringify and setItem
StorageModule.load(key, fallback)   // getItem, JSON.parse, returns fallback on error
StorageModule.remove(key)           // removeItem
```

This module is called by TaskModule and LinksModule. It catches `JSON.parse` errors and `localStorage` quota/security exceptions, returning the fallback value on failure.

---

## Data Models

### Task

Stored in `localStorage` under the key `"tld_tasks"` as a JSON array.

```js
{
  id: string,          // crypto.randomUUID() or Date.now().toString()
  description: string, // non-empty task text
  completed: boolean   // false = incomplete, true = complete
}
```

**Example**:
```json
[
  { "id": "1746432000000", "description": "Write design doc", "completed": false },
  { "id": "1746432001000", "description": "Review PR",        "completed": true  }
]
```

---

### Link

Stored in `localStorage` under the key `"tld_links"` as a JSON array.

```js
{
  id: string,    // crypto.randomUUID() or Date.now().toString()
  label: string, // non-empty display label for the button
  url: string    // non-empty URL string (opened in new tab)
}
```

**Example**:
```json
[
  { "id": "1746432002000", "label": "GitHub",  "url": "https://github.com" },
  { "id": "1746432003000", "label": "MDN Docs", "url": "https://developer.mozilla.org" }
]
```

---

### localStorage Key Namespace

| Key          | Content          |
|--------------|------------------|
| `tld_tasks`  | JSON array of Task objects |
| `tld_links`  | JSON array of Link objects |

The `tld_` prefix namespaces the keys to avoid collisions with other apps sharing the same origin.

---

## HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Life Dashboard</title>
  <link rel="stylesheet" href="css/style.css" />
</head>
<body>
  <main class="dashboard">

    <!-- Panel 1: Greeting -->
    <section id="greeting-panel" class="panel panel--greeting">
      <p id="greeting-text" class="greeting__text"></p>
      <p id="greeting-time" class="greeting__time"></p>
      <p id="greeting-date" class="greeting__date"></p>
    </section>

    <!-- Panel 2: Focus Timer -->
    <section id="timer-panel" class="panel panel--timer">
      <h2 class="panel__title">Focus Timer</h2>
      <p id="timer-display" class="timer__display">25:00</p>
      <div class="timer__controls">
        <button id="timer-start" class="btn btn--primary">Start</button>
        <button id="timer-stop"  class="btn btn--secondary" disabled>Stop</button>
        <button id="timer-reset" class="btn btn--ghost">Reset</button>
      </div>
    </section>

    <!-- Panel 3: Task Manager -->
    <section id="task-panel" class="panel panel--tasks">
      <h2 class="panel__title">To-Do List</h2>
      <form id="task-form" class="task__form">
        <input id="task-input" type="text" class="input" placeholder="Add a task…" autocomplete="off" />
        <button type="submit" class="btn btn--primary">Add</button>
      </form>
      <ul id="task-list" class="task__list"></ul>
    </section>

    <!-- Panel 4: Quick Links -->
    <section id="links-panel" class="panel panel--links">
      <h2 class="panel__title">Quick Links</h2>
      <form id="links-form" class="links__form">
        <input id="link-label-input" type="text"  class="input" placeholder="Label"  autocomplete="off" />
        <input id="link-url-input"   type="url"   class="input" placeholder="URL"    autocomplete="off" />
        <button type="submit" class="btn btn--primary">Add</button>
      </form>
      <div id="links-list" class="links__list"></div>
    </section>

  </main>

  <!-- localStorage unavailability warning (hidden by default) -->
  <div id="storage-warning" class="storage-warning" hidden>
    ⚠️ Local Storage is unavailable. Data will not be saved.
  </div>

  <script src="js/javascript/app.js"></script>
</body>
</html>
```

---

## CSS Design Approach

### Custom Properties (Design Tokens)

All colors, spacing, and typography values are defined as CSS custom properties on `:root`:

```css
:root {
  /* Colors */
  --color-bg:          #1a1a2e;
  --color-surface:     #16213e;
  --color-surface-alt: #0f3460;
  --color-accent:      #e94560;
  --color-text:        #eaeaea;
  --color-text-muted:  #a0a0b0;
  --color-border:      #2a2a4a;
  --color-success:     #4caf50;

  /* Typography */
  --font-family:       'Segoe UI', system-ui, sans-serif;
  --font-size-base:    1rem;
  --font-size-lg:      1.25rem;
  --font-size-xl:      2rem;
  --font-size-timer:   3.5rem;

  /* Spacing */
  --space-xs:  0.25rem;
  --space-sm:  0.5rem;
  --space-md:  1rem;
  --space-lg:  1.5rem;
  --space-xl:  2rem;

  /* Borders */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Layout

The `.dashboard` container uses CSS Grid with a two-column layout on desktop:

```
┌──────────────────┬──────────────────┐
│  Greeting Panel  │  Focus Timer     │
├──────────────────┼──────────────────┤
│  Task Manager    │  Quick Links     │
└──────────────────┴──────────────────┘
```

```css
.dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr;
  gap: var(--space-lg);
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-xl);
}
```

Each `.panel` has a consistent card style: background `--color-surface`, rounded corners, padding, and a subtle border.

### Interactive States

- Focus indicators: `:focus-visible` outline using `--color-accent` (2px solid, 2px offset)
- Completed tasks: `text-decoration: line-through` + `color: --color-text-muted`
- Disabled buttons: `opacity: 0.4; cursor: not-allowed`
- Button variants: `.btn--primary` (accent fill), `.btn--secondary` (outline), `.btn--ghost` (transparent)

---

## Component Interactions and Event Flow

### Initialization Sequence

```
DOMContentLoaded
  → StorageModule: check availability, show warning if unavailable
  → GreetingModule.init(): render immediately, start 1s interval
  → TimerModule.init(): render 25:00, bind button listeners
  → TaskModule.init(): load from storage, render list, bind form
  → LinksModule.init(): load from storage, render buttons, bind form
```

### Task Add Flow

```
User types in #task-input → submits #task-form
  → TaskModule: read input value, trim whitespace
  → IF empty → do nothing (no DOM change)
  → ELSE → addTask(description)
      → generate id
      → push to tasks array
      → saveTasks() → StorageModule.save("tld_tasks", tasks)
      → renderList() → rebuild #task-list DOM
      → clear input field
```

### Task Edit Flow

```
User clicks Edit button on a task item
  → beginEdit(id): replace <span> with <input> pre-filled with current text
User confirms (Enter or confirm button)
  → confirmEdit(id, value): validate non-empty, update tasks[i].description
      → saveTasks() → renderList()
User cancels (Escape or cancel button)
  → cancelEdit(id): renderList() without saving
```

### Task Toggle / Delete Flow

```
User clicks toggle → toggleComplete(id) → flip .completed → saveTasks() → renderList()
User clicks delete → deleteTask(id) → splice from array → saveTasks() → renderList()
```

### Timer Flow

```
User clicks Start
  → startTimer(): intervalId = setInterval(tick, 1000)
  → updateButtonStates(): start.disabled=true, stop.disabled=false

tick():
  → remainingSeconds--
  → renderDisplay()
  → IF remainingSeconds === 0 → stopTimer()

User clicks Stop → stopTimer(): clearInterval, updateButtonStates()
User clicks Reset → resetTimer(): clearInterval, remainingSeconds=1500, renderDisplay(), updateButtonStates()
```

### Link Add / Delete Flow

```
User submits #links-form
  → LinksModule: read label + url, trim
  → IF either empty → do nothing
  → ELSE → addLink(label, url) → save → renderLinks()

User clicks delete on a link
  → deleteLink(id) → splice → saveLinks() → renderLinks()
```

---

## Error Handling

| Scenario | Handling |
|---|---|
| `localStorage` unavailable (private mode, quota exceeded, security policy) | `StorageModule.isAvailable()` returns false; `#storage-warning` element is shown; app continues to function in-memory for the session |
| Malformed JSON in `localStorage` | `StorageModule.load()` catches `JSON.parse` exceptions and returns the provided fallback (empty array `[]`) |
| Empty task submission | Input is trimmed; if blank, the form submission is ignored with no DOM or storage change |
| Empty link submission | Both label and URL are trimmed; if either is blank, the form submission is ignored |
| Timer reaching 00:00 | `tick()` detects `remainingSeconds === 0`, calls `stopTimer()` to clear the interval and update button states |
| Edit confirmed with empty value | `confirmEdit()` trims the value; if blank, discards the edit and restores original text (same as cancel) |

---

## Testing Strategy

This feature is a client-side vanilla JS application. The testing approach uses:

- **Unit tests** for pure logic functions (greeting selection, time formatting, input validation, data serialization)
- **Property-based tests** for universal correctness properties (see Correctness Properties section)
- **Example-based integration tests** for DOM interaction flows (add task, toggle, delete, timer controls)

### Unit Test Targets

- `getGreeting(hour)` — all 24 hour values map to the correct greeting string
- `formatTime(date)` — produces correct HH:MM output
- `formatDate(date)` — produces correct human-readable date string
- `formatMMSS(seconds)` — correct MM:SS output for boundary values (0, 1, 59, 60, 1499, 1500)
- `StorageModule.load()` — returns fallback on malformed JSON, returns parsed data on valid JSON
- Task/Link validation — empty string, whitespace-only string, valid string

### Property-Based Test Library

Use **fast-check** (JavaScript) for property-based tests. Each property test runs a minimum of 100 iterations.

Tag format for each test: `// Feature: todo-life-dashboard, Property N: <property text>`


---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

---

### Property 1: Greeting selection is correct for all hours

*For any* integer hour value in [0, 23], `getGreeting(hour)` SHALL return exactly one of the four greeting strings, and the returned string SHALL match the correct time-of-day range: "Good Morning" for [5,11], "Good Afternoon" for [12,17], "Good Evening" for [18,20], and "Good Night" for [21,23] ∪ [0,4].

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Time formatting always produces valid HH:MM output

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM` where HH is the zero-padded hours (00–23) and MM is the zero-padded minutes (00–59), and the values SHALL match the date's actual hours and minutes.

**Validates: Requirements 1.1**

---

### Property 3: Date formatting always includes all required components

*For any* `Date` object, `formatDate(date)` SHALL return a string that contains the correct weekday name, the day-of-month number, the month name, and the four-digit year corresponding to that date.

**Validates: Requirements 1.2**

---

### Property 4: Timer display formatting is always valid MM:SS

*For any* integer seconds value in [0, 1500], `formatMMSS(seconds)` SHALL return a string matching the pattern `MM:SS` where MM is the zero-padded minutes and SS is the zero-padded remaining seconds, and the values SHALL correctly represent the total seconds.

**Validates: Requirements 2.3**

---

### Property 5: Timer countdown decrements correctly

*For any* integer N in [1, 1500], after N calls to `tick()` on a freshly initialized timer, `remainingSeconds` SHALL equal `1500 - N`.

**Validates: Requirements 2.2**

---

### Property 6: Timer reset always restores initial state

*For any* timer state (any value of `remainingSeconds` in [0, 1500], running or stopped), calling `resetTimer()` SHALL set `remainingSeconds` to 1500 and the display SHALL show "25:00".

**Validates: Requirements 2.5**

---

### Property 7: Adding a valid task always grows the task list and persists it

*For any* non-empty, non-whitespace-only string `description`, calling `addTask(description)` on a task list of length N SHALL result in a task list of length N+1, and the new task SHALL be present in the data retrieved from `localStorage` under key `"tld_tasks"`.

**Validates: Requirements 3.2**

---

### Property 8: Whitespace-only task descriptions are always rejected

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), calling `addTask(description)` SHALL leave the task list unchanged and SHALL NOT write a new task to `localStorage`.

**Validates: Requirements 3.3**

---

### Property 9: Task serialization round-trip preserves all data

*For any* array of Task objects, calling `StorageModule.save("tld_tasks", tasks)` followed by `StorageModule.load("tld_tasks", [])` SHALL return an array that is deeply equal to the original array, with all `id`, `description`, and `completed` fields intact.

**Validates: Requirements 8.4, 3.4**

---

### Property 10: Link serialization round-trip preserves all data

*For any* array of Link objects, calling `StorageModule.save("tld_links", links)` followed by `StorageModule.load("tld_links", [])` SHALL return an array that is deeply equal to the original array, with all `id`, `label`, and `url` fields intact.

**Validates: Requirements 8.4, 6.4**

---

### Property 11: Malformed localStorage data always falls back to empty list

*For any* string that is not valid JSON, when that string is stored in `localStorage` and `StorageModule.load(key, [])` is called, the result SHALL be `[]` (the fallback), and no exception SHALL propagate to the caller.

**Validates: Requirements 8.5**

---

### Property 12: Task rendering always includes all required controls

*For any* Task object, `createTaskElement(task)` SHALL return a DOM element that contains the task's description text, a completion toggle control, an edit control, and a delete control.

**Validates: Requirements 3.5**

---

### Property 13: Editing a task with a valid value always updates and persists

*For any* Task in the list and any non-empty, non-whitespace-only string `newValue`, calling `confirmEdit(id, newValue)` SHALL update `task.description` to `newValue` and the updated task SHALL be present in `localStorage` under key `"tld_tasks"`.

**Validates: Requirements 4.2**

---

### Property 14: Editing a task with a whitespace-only value always rejects the change

*For any* Task in the list and any string composed entirely of whitespace characters, calling `confirmEdit(id, value)` SHALL leave `task.description` unchanged and SHALL NOT write the whitespace value to `localStorage`.

**Validates: Requirements 4.3**

---

### Property 15: Toggling completion is a round-trip (double-toggle restores original state)

*For any* Task object with any `completed` value, calling `toggleComplete(id)` twice SHALL restore `task.completed` to its original value, and the final state SHALL be persisted to `localStorage`.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 16: Deleting a task always removes it from the list and storage

*For any* non-empty task list and any task `t` in that list, calling `deleteTask(t.id)` SHALL result in a task list that does not contain `t`, and `localStorage` under key `"tld_tasks"` SHALL NOT contain a task with `t.id`.

**Validates: Requirements 5.4**

---

### Property 17: Adding a valid link always grows the links list and persists it

*For any* non-empty, non-whitespace-only `label` and non-empty, non-whitespace-only `url`, calling `addLink(label, url)` on a links list of length N SHALL result in a links list of length N+1, and the new link SHALL be present in `localStorage` under key `"tld_links"`.

**Validates: Requirements 6.2**

---

### Property 18: Link submissions with empty label or URL are always rejected

*For any* input pair where at least one of `label` or `url` is empty or whitespace-only, calling `addLink(label, url)` SHALL leave the links list unchanged and SHALL NOT write a new link to `localStorage`.

**Validates: Requirements 6.3**

---

### Property 19: Link rendering always includes a delete control

*For any* Link object, `createLinkElement(link)` SHALL return a DOM element that contains a clickable link button with the link's label and a delete control.

**Validates: Requirements 7.1**

---

### Property 20: Deleting a link always removes it from the list and storage

*For any* non-empty links list and any link `l` in that list, calling `deleteLink(l.id)` SHALL result in a links list that does not contain `l`, and `localStorage` under key `"tld_links"` SHALL NOT contain a link with `l.id`.

**Validates: Requirements 7.2**
