# Implementation Plan: To-Do List Life Dashboard

## Overview

Implement the dashboard as three files: `index.html` at the root, `css/style.css` for all styling, and `js/javascript/app.js` for all JavaScript modules and initialization. Each task builds incrementally on the previous one, ending with full integration.

## Tasks

- [x] 1. Create the HTML skeleton (`index.html`)
  - Create `index.html` at the root with `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title, stylesheet link), and `<body>`
  - Add the `<main class="dashboard">` container
  - Add the Greeting panel: `<section id="greeting-panel" class="panel panel--greeting">` with `#greeting-text`, `#greeting-time`, `#greeting-date` paragraphs
  - Add the Focus Timer panel: `<section id="timer-panel" class="panel panel--timer">` with `#timer-display`, and the three buttons (`#timer-start`, `#timer-stop` with `disabled`, `#timer-reset`)
  - Add the Task Manager panel: `<section id="task-panel" class="panel panel--tasks">` with `#task-form` (text input `#task-input` + submit button) and empty `<ul id="task-list">`
  - Add the Quick Links panel: `<section id="links-panel" class="panel panel--links">` with `#links-form` (text input `#link-label-input`, url input `#link-url-input`, submit button) and empty `<div id="links-list">`
  - Add the `<div id="storage-warning" class="storage-warning" hidden>` element after `<main>`
  - Add `<script src="js/javascript/app.js"></script>` before `</body>`
  - _Requirements: 9.3, 3.1, 6.1, 8.3_

- [x] 2. Create CSS design tokens and base styles (`css/style.css`)
  - Create `css/style.css`
  - Define all CSS custom properties on `:root`: color tokens (`--color-bg`, `--color-surface`, `--color-surface-alt`, `--color-accent`, `--color-text`, `--color-text-muted`, `--color-border`, `--color-success`), typography tokens (`--font-family`, `--font-size-base`, `--font-size-lg`, `--font-size-xl`, `--font-size-timer`), spacing tokens (`--space-xs` through `--space-xl`), and border-radius tokens (`--radius-sm`, `--radius-md`, `--radius-lg`)
  - Apply a CSS reset: `*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }`
  - Style `body` with `background: var(--color-bg)`, `color: var(--color-text)`, `font-family: var(--font-family)`, and `min-height: 100vh`
  - _Requirements: 10.1, 9.1_

- [x] 3. Add dashboard layout and panel card styles (`css/style.css`)
  - Style `.dashboard` as a CSS Grid with `grid-template-columns: 1fr 1fr`, `gap: var(--space-lg)`, `max-width: 1100px`, `margin: 0 auto`, and `padding: var(--space-xl)`
  - Style `.panel` as a card: `background: var(--color-surface)`, `border-radius: var(--radius-lg)`, `padding: var(--space-lg)`, `border: 1px solid var(--color-border)`
  - Style `.panel__title` with appropriate font size and bottom margin
  - Add a responsive media query (e.g., `max-width: 700px`) that switches `.dashboard` to `grid-template-columns: 1fr`
  - Style `#storage-warning` with a visible warning appearance (accent color, padding, centered text)
  - _Requirements: 10.2, 10.4, 8.3_

- [x] 4. Add component-level styles for all panels (`css/style.css`)
  - Style `.greeting__time` with `font-size: var(--font-size-timer)` and bold weight
  - Style `.greeting__text` and `.greeting__date` with `color: var(--color-text-muted)`
  - Style `.timer__display` with `font-size: var(--font-size-timer)`, monospace or tabular-nums, centered
  - Style `.timer__controls` as a flex row with gap
  - Style `.btn` base: `padding`, `border-radius: var(--radius-sm)`, `cursor: pointer`, `font-size: var(--font-size-base)`, `border: none`
  - Style `.btn--primary` with `background: var(--color-accent)` and `color: #fff`
  - Style `.btn--secondary` with a transparent background and `border: 1px solid var(--color-accent)` and `color: var(--color-accent)`
  - Style `.btn--ghost` with transparent background and muted text color
  - Style `button:disabled` with `opacity: 0.4; cursor: not-allowed`
  - Style `:focus-visible` on interactive elements with a 2px solid `var(--color-accent)` outline and 2px offset
  - Style `.input` (text/url inputs): full width, `background: var(--color-surface-alt)`, `color: var(--color-text)`, `border: 1px solid var(--color-border)`, `border-radius: var(--radius-sm)`, `padding`
  - Style `.task__form` and `.links__form` as flex rows with gap
  - Style `.task__list` as a list with no default list-style
  - Style individual task items: flex row, gap, align-center, with task text taking `flex: 1`
  - Style `.task--completed .task__text` with `text-decoration: line-through` and `color: var(--color-text-muted)`
  - Style `.links__list` as a flex wrap row with gap
  - _Requirements: 10.1, 10.3, 5.1, 5.2_

- [x] 5. Implement `StorageModule` in `js/javascript/app.js`
  - Create `js/javascript/app.js`
  - Define `const StorageModule = { ... }` with four methods:
    - `isAvailable()`: attempts `localStorage.setItem` / `removeItem` in a try/catch, returns `true` or `false`
    - `save(key, data)`: calls `localStorage.setItem(key, JSON.stringify(data))` inside a try/catch; silently swallows quota/security errors
    - `load(key, fallback)`: calls `localStorage.getItem(key)`, parses with `JSON.parse` inside a try/catch, returns `fallback` on any error or when the item is `null`
    - `remove(key)`: calls `localStorage.removeItem(key)` inside a try/catch
  - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 6. Implement `GreetingModule` in `js/javascript/app.js`
  - Define `const GreetingModule = { ... }` after `StorageModule`
  - Implement `getGreeting(hour)`: returns `"Good Morning"` for hours 5–11, `"Good Afternoon"` for 12–17, `"Good Evening"` for 18–20, `"Good Night"` for all other values (21–23 and 0–4)
  - Implement `formatTime(date)`: returns a zero-padded `"HH:MM"` string from `date.getHours()` and `date.getMinutes()`
  - Implement `formatDate(date)`: returns a human-readable string such as `"Monday, 5 May 2025"` using `date.toLocaleDateString` with appropriate options or manual construction
  - Implement `render()`: reads `new Date()`, updates `#greeting-text`, `#greeting-time`, and `#greeting-date` text content
  - Implement `init()`: calls `render()` immediately, then calls `setInterval(render, 1000)`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7_

- [x] 7. Implement `TimerModule` in `js/javascript/app.js`
  - Define `const TimerModule = { ... }` after `GreetingModule`
  - Declare module-scoped variables `let remainingSeconds = 1500` and `let intervalId = null`
  - Implement `formatMMSS(seconds)`: returns zero-padded `"MM:SS"` string
  - Implement `renderDisplay()`: sets `#timer-display` text content to `formatMMSS(remainingSeconds)`
  - Implement `updateButtonStates()`: sets `#timer-start.disabled = intervalId !== null` and `#timer-stop.disabled = intervalId === null`
  - Implement `tick()`: decrements `remainingSeconds`, calls `renderDisplay()`, and if `remainingSeconds === 0` calls `stopTimer()`
  - Implement `startTimer()`: sets `intervalId = setInterval(tick, 1000)`, calls `updateButtonStates()`
  - Implement `stopTimer()`: calls `clearInterval(intervalId)`, sets `intervalId = null`, calls `updateButtonStates()`
  - Implement `resetTimer()`: calls `stopTimer()`, sets `remainingSeconds = 1500`, calls `renderDisplay()`, calls `updateButtonStates()`
  - Implement `init()`: calls `renderDisplay()`, calls `updateButtonStates()`, binds click listeners on `#timer-start` → `startTimer`, `#timer-stop` → `stopTimer`, `#timer-reset` → `resetTimer`
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.8_

- [x] 8. Implement `TaskModule` in `js/javascript/app.js`
  - Define `const TaskModule = { ... }` after `TimerModule`
  - Declare module-scoped `let tasks = []`
  - Implement `loadTasks()`: sets `tasks = StorageModule.load("tld_tasks", [])`
  - Implement `saveTasks()`: calls `StorageModule.save("tld_tasks", tasks)`
  - Implement `addTask(description)`: trims `description`; if blank, returns early; otherwise generates an id (`Date.now().toString()`), pushes `{ id, description, completed: false }` to `tasks`, calls `saveTasks()`, calls `renderList()`
  - Implement `deleteTask(id)`: splices the matching task from `tasks`, calls `saveTasks()`, calls `renderList()`
  - Implement `toggleComplete(id)`: finds the task by id, flips its `completed` boolean, calls `saveTasks()`, calls `renderList()`
  - Implement `beginEdit(id)`: finds the task's DOM element, replaces the description `<span>` with a pre-filled `<input>` and confirm/cancel buttons
  - Implement `confirmEdit(id, value)`: trims `value`; if blank, calls `cancelEdit(id)` and returns; otherwise updates `tasks[i].description`, calls `saveTasks()`, calls `renderList()`
  - Implement `cancelEdit(id)`: calls `renderList()` without saving
  - Implement `createTaskElement(task)`: creates and returns a `<li>` element containing a toggle button (or checkbox), a `<span class="task__text">` with the description (add `task--completed` class if completed), an edit button, and a delete button; binds click handlers for each control
  - Implement `renderList()`: clears `#task-list`, iterates `tasks`, appends `createTaskElement(task)` for each
  - Implement `init()`: calls `loadTasks()`, calls `renderList()`, binds `#task-form` submit event to read `#task-input` value, call `addTask()`, and clear the input
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3, 5.4_

- [x] 9. Implement `LinksModule` in `js/javascript/app.js`
  - Define `const LinksModule = { ... }` after `TaskModule`
  - Declare module-scoped `let links = []`
  - Implement `loadLinks()`: sets `links = StorageModule.load("tld_links", [])`
  - Implement `saveLinks()`: calls `StorageModule.save("tld_links", links)`
  - Implement `addLink(label, url)`: trims both; if either is blank, returns early; otherwise generates an id, pushes `{ id, label, url }` to `links`, calls `saveLinks()`, calls `renderLinks()`
  - Implement `deleteLink(id)`: splices the matching link from `links`, calls `saveLinks()`, calls `renderLinks()`
  - Implement `createLinkElement(link)`: creates and returns a `<div>` containing an `<a>` (or `<button>`) that opens `link.url` in a new tab with `link.label` as text, and a delete button that calls `deleteLink(link.id)`; the link button must have `target="_blank"` and `rel="noopener noreferrer"`
  - Implement `renderLinks()`: clears `#links-list`, iterates `links`, appends `createLinkElement(link)` for each
  - Implement `init()`: calls `loadLinks()`, calls `renderLinks()`, binds `#links-form` submit event to read `#link-label-input` and `#link-url-input` values, call `addLink()`, and clear both inputs
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2_

- [x] 10. Wire up initialization in `js/javascript/app.js`
  - Add a `DOMContentLoaded` event listener at the bottom of `app.js`
  - Inside the listener: check `StorageModule.isAvailable()`; if `false`, remove the `hidden` attribute from `#storage-warning`
  - Call `GreetingModule.init()`
  - Call `TimerModule.init()`
  - Call `TaskModule.init()`
  - Call `LinksModule.init()`
  - _Requirements: 8.3, 9.4_

- [x] 11. Final checkpoint
  - Open `index.html` directly in a browser (no server needed) and verify all four panels render correctly
  - Confirm the greeting updates every second and shows the correct time-of-day message
  - Confirm the timer counts down, stops at 00:00, and resets correctly
  - Confirm tasks can be added, edited, toggled, and deleted, and persist after a page reload
  - Confirm links can be added and deleted, open in a new tab, and persist after a page reload
  - Confirm the storage warning appears when localStorage is blocked (e.g., in a private-browsing context with storage disabled)

## Notes

- All three files must be created before the app is functional — `index.html` references both `css/style.css` and `js/javascript/app.js`
- The JS file is a single flat file; modules are plain `const` objects, not ES modules, so no `import`/`export` is needed
- Task and link IDs use `Date.now().toString()` for simplicity; `crypto.randomUUID()` is also acceptable if available
- The `tld_` prefix on localStorage keys avoids collisions with other apps on the same origin
