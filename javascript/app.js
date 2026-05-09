// ============================================================
// StorageModule
// Thin, safe wrapper around localStorage with JSON
// serialization, deserialization, and availability detection.
// ============================================================

const StorageModule = {
  isAvailable() {
    try {
      const testKey = '__tld_storage_test__';
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  },

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      // Quota exceeded or security error — fail silently.
    }
  },

  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Security error — fail silently.
    }
  },
};

// ============================================================
// ThemeModule
// Manages light/dark mode toggle, persists preference.
// ============================================================

const ThemeModule = {
  STORAGE_KEY: 'tld_theme',

  /**
   * Applies the given theme ('light' or 'dark') to the document.
   * Updates the toggle button icon and saves the preference.
   *
   * @param {'light'|'dark'} theme
   */
  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    StorageModule.save(ThemeModule.STORAGE_KEY, theme);
  },

  toggle() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    ThemeModule.apply(current === 'dark' ? 'light' : 'dark');
  },

  init() {
    const saved = StorageModule.load(ThemeModule.STORAGE_KEY, 'dark');
    ThemeModule.apply(saved);

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', ThemeModule.toggle);
  },
};

// ============================================================
// GreetingModule
// Displays the current time (HH:MM:SS), date, and a greeting.
// Supports a custom user name stored in localStorage.
// ============================================================

const GreetingModule = {
  STORAGE_KEY: 'tld_username',

  getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night';
  },

  /**
   * Returns "HH:MM:SS" — includes seconds for the live clock.
   *
   * @param {Date} date
   * @returns {string}
   */
  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month:   'long',
      day:     'numeric',
      year:    'numeric',
    });
  },

  /**
   * Returns the stored user name, or null if none set.
   * @returns {string|null}
   */
  getName() {
    return StorageModule.load(GreetingModule.STORAGE_KEY, null);
  },

  /**
   * Saves the user name and re-renders.
   * @param {string} name
   */
  saveName(name) {
    const trimmed = name.trim();
    if (trimmed) {
      StorageModule.save(GreetingModule.STORAGE_KEY, trimmed);
    } else {
      StorageModule.remove(GreetingModule.STORAGE_KEY);
    }
    GreetingModule.render();
  },

  render() {
    const now  = new Date();
    const name = GreetingModule.getName();

    const timeEl = document.getElementById('greeting-time');
    const dateEl = document.getElementById('greeting-date');
    const textEl = document.getElementById('greeting-text');

    if (timeEl) timeEl.textContent = GreetingModule.formatTime(now);
    if (dateEl) dateEl.textContent = GreetingModule.formatDate(now);

    if (textEl) {
      const greeting = GreetingModule.getGreeting(now.getHours());
      if (name) {
        // Render greeting with a clickable name span
        textEl.innerHTML = `${greeting}, <span class="greeting__name" id="greeting-name-btn" title="Click to change name" tabindex="0" role="button">${name}</span>`;
        const nameBtn = document.getElementById('greeting-name-btn');
        if (nameBtn) {
          nameBtn.addEventListener('click', GreetingModule.openEditor);
          nameBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') GreetingModule.openEditor();
          });
        }
      } else {
        // No name set — show greeting with a prompt to add name
        textEl.innerHTML = `${greeting} — <span class="greeting__name" id="greeting-name-btn" title="Click to add your name" tabindex="0" role="button">add your name</span>`;
        const nameBtn = document.getElementById('greeting-name-btn');
        if (nameBtn) {
          nameBtn.addEventListener('click', GreetingModule.openEditor);
          nameBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') GreetingModule.openEditor();
          });
        }
      }
    }
  },

  openEditor() {
    const editor   = document.getElementById('name-editor');
    const input    = document.getElementById('name-input');
    const textEl   = document.getElementById('greeting-text');
    if (!editor || !input) return;

    const current = GreetingModule.getName();
    input.value = current || '';
    editor.removeAttribute('hidden');
    if (textEl) textEl.style.display = 'none';
    input.focus();
    input.select();
  },

  closeEditor() {
    const editor = document.getElementById('name-editor');
    const textEl = document.getElementById('greeting-text');
    if (editor) editor.setAttribute('hidden', '');
    if (textEl) textEl.style.display = '';
  },

  init() {
    GreetingModule.render();
    setInterval(GreetingModule.render, 1000);

    const saveBtn   = document.getElementById('name-save');
    const cancelBtn = document.getElementById('name-cancel');
    const input     = document.getElementById('name-input');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        GreetingModule.saveName(input ? input.value : '');
        GreetingModule.closeEditor();
      });
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', GreetingModule.closeEditor);
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          GreetingModule.saveName(input.value);
          GreetingModule.closeEditor();
        }
        if (e.key === 'Escape') GreetingModule.closeEditor();
      });
    }
  },
};

// ============================================================
// TimerModule
// 25-minute countdown with start/stop/reset and custom duration.
// ============================================================

// Module-scoped timer state
let remainingSeconds = 1500; // 25 * 60
let timerDuration    = 1500; // tracks the set duration for reset
let intervalId       = null;

const TimerModule = {
  formatMMSS(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  },

  renderDisplay() {
    const display = document.getElementById('timer-display');
    if (display) display.textContent = TimerModule.formatMMSS(remainingSeconds);
  },

  updateButtonStates() {
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const setBtn   = document.getElementById('timer-set-duration');
    const durInput = document.getElementById('timer-duration-input');
    const running  = intervalId !== null;

    if (startBtn)  startBtn.disabled  = running;
    if (stopBtn)   stopBtn.disabled   = !running;
    // Disable duration controls while timer is running
    if (setBtn)    setBtn.disabled    = running;
    if (durInput)  durInput.disabled  = running;
  },

  tick() {
    remainingSeconds -= 1;
    TimerModule.renderDisplay();
    if (remainingSeconds === 0) TimerModule.stopTimer();
  },

  startTimer() {
    intervalId = setInterval(TimerModule.tick, 1000);
    TimerModule.updateButtonStates();
  },

  stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    TimerModule.updateButtonStates();
  },

  resetTimer() {
    TimerModule.stopTimer();
    remainingSeconds = timerDuration;
    TimerModule.renderDisplay();
    TimerModule.updateButtonStates();
  },

  /**
   * Reads the duration input, validates it (1–120 min), updates
   * timerDuration and remainingSeconds, and re-renders.
   */
  setDuration() {
    const input = document.getElementById('timer-duration-input');
    if (!input) return;

    let minutes = parseInt(input.value, 10);
    if (isNaN(minutes) || minutes < 1)   minutes = 1;
    if (minutes > 120)                   minutes = 120;

    input.value      = minutes;
    timerDuration    = minutes * 60;
    remainingSeconds = timerDuration;
    TimerModule.renderDisplay();
    TimerModule.updateButtonStates();
  },

  init() {
    TimerModule.renderDisplay();
    TimerModule.updateButtonStates();

    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const resetBtn = document.getElementById('timer-reset');
    const setBtn   = document.getElementById('timer-set-duration');
    const durInput = document.getElementById('timer-duration-input');

    if (startBtn) startBtn.addEventListener('click', TimerModule.startTimer);
    if (stopBtn)  stopBtn.addEventListener('click',  TimerModule.stopTimer);
    if (resetBtn) resetBtn.addEventListener('click', TimerModule.resetTimer);
    if (setBtn)   setBtn.addEventListener('click',   TimerModule.setDuration);

    // Also allow pressing Enter in the duration input
    if (durInput) {
      durInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') TimerModule.setDuration();
      });
    }
  },
};

// ============================================================
// TaskModule
// Add, display, edit, complete, and delete tasks.
// ============================================================

let tasks = [];

const TaskModule = {
  loadTasks()  { tasks = StorageModule.load('tld_tasks', []); },
  saveTasks()  { StorageModule.save('tld_tasks', tasks); },

  addTask(description) {
    const trimmed = description.trim();
    if (!trimmed) return;
    tasks.push({ id: Date.now().toString(), description: trimmed, completed: false });
    TaskModule.saveTasks();
    TaskModule.renderList();
  },

  deleteTask(id) {
    const i = tasks.findIndex(t => t.id === id);
    if (i !== -1) tasks.splice(i, 1);
    TaskModule.saveTasks();
    TaskModule.renderList();
  },

  toggleComplete(id) {
    const task = tasks.find(t => t.id === id);
    if (task) task.completed = !task.completed;
    TaskModule.saveTasks();
    TaskModule.renderList();
  },

  beginEdit(id) {
    const li   = document.querySelector(`#task-list li[data-id="${id}"]`);
    const task = tasks.find(t => t.id === id);
    if (!li || !task) return;

    const span = li.querySelector('.task__text');
    if (!span) return;

    const input = document.createElement('input');
    input.type      = 'text';
    input.className = 'input task__edit-input';
    input.value     = task.description;

    const confirmBtn = document.createElement('button');
    confirmBtn.type      = 'button';
    confirmBtn.className = 'btn btn--primary task__edit-confirm';
    confirmBtn.textContent = '✓';
    confirmBtn.addEventListener('click', () => TaskModule.confirmEdit(id, input.value));

    const cancelBtn = document.createElement('button');
    cancelBtn.type      = 'button';
    cancelBtn.className = 'btn btn--ghost task__edit-cancel';
    cancelBtn.textContent = '✕';
    cancelBtn.addEventListener('click', () => TaskModule.cancelEdit(id));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  TaskModule.confirmEdit(id, input.value);
      if (e.key === 'Escape') TaskModule.cancelEdit(id);
    });

    span.replaceWith(input, confirmBtn, cancelBtn);
    input.focus();
    input.select();
  },

  confirmEdit(id, value) {
    const trimmed = value.trim();
    if (!trimmed) { TaskModule.cancelEdit(id); return; }
    const i = tasks.findIndex(t => t.id === id);
    if (i !== -1) tasks[i].description = trimmed;
    TaskModule.saveTasks();
    TaskModule.renderList();
  },

  cancelEdit(id) { TaskModule.renderList(); },

  createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task__item' + (task.completed ? ' task--completed' : '');
    li.setAttribute('data-id', task.id);

    // Checkbox-style toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.type      = 'button';
    toggleBtn.className = 'btn btn--ghost task__toggle';
    toggleBtn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    toggleBtn.textContent = task.completed ? '✓' : '';
    toggleBtn.addEventListener('click', () => TaskModule.toggleComplete(task.id));

    const span = document.createElement('span');
    span.className   = 'task__text';
    span.textContent = task.description;

    const editBtn = document.createElement('button');
    editBtn.type      = 'button';
    editBtn.className = 'btn btn--ghost task__edit';
    editBtn.setAttribute('aria-label', 'Edit task');
    editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => TaskModule.beginEdit(task.id));

    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'btn btn--danger task__delete';
    deleteBtn.setAttribute('aria-label', 'Delete task');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', () => TaskModule.deleteTask(task.id));

    li.append(toggleBtn, span, editBtn, deleteBtn);
    return li;
  },

  renderList() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';
    tasks.forEach(task => list.appendChild(TaskModule.createTaskElement(task)));
  },

  init() {
    TaskModule.loadTasks();
    TaskModule.renderList();

    const form  = document.getElementById('task-form');
    const input = document.getElementById('task-input');
    if (form && input) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        TaskModule.addTask(input.value);
        input.value = '';
      });
    }
  },
};

// ============================================================
// LinksModule
// Add, display, and delete quick-access URL buttons.
// ============================================================

let links = [];

const LinksModule = {
  loadLinks()  { links = StorageModule.load('tld_links', []); },
  saveLinks()  { StorageModule.save('tld_links', links); },

  addLink(label, url) {
    const trimmedLabel = label.trim();
    const trimmedUrl   = url.trim();
    if (!trimmedLabel || !trimmedUrl) return;
    links.push({ id: Date.now().toString(), label: trimmedLabel, url: trimmedUrl });
    LinksModule.saveLinks();
    LinksModule.renderLinks();
  },

  deleteLink(id) {
    const i = links.findIndex(l => l.id === id);
    if (i !== -1) links.splice(i, 1);
    LinksModule.saveLinks();
    LinksModule.renderLinks();
  },

  createLinkElement(link) {
    const div = document.createElement('div');
    div.className = 'link__item';
    div.setAttribute('data-id', link.id);

    const anchor = document.createElement('a');
    anchor.href      = link.url;
    anchor.textContent = link.label;
    anchor.target    = '_blank';
    anchor.rel       = 'noopener noreferrer';
    anchor.className = 'btn btn--primary link__button';

    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'btn link__delete';
    deleteBtn.setAttribute('aria-label', `Delete link: ${link.label}`);
    deleteBtn.textContent = '✕';
    deleteBtn.addEventListener('click', () => LinksModule.deleteLink(link.id));

    div.append(anchor, deleteBtn);
    return div;
  },

  renderLinks() {
    const list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = '';
    links.forEach(link => list.appendChild(LinksModule.createLinkElement(link)));
  },

  init() {
    LinksModule.loadLinks();
    LinksModule.renderLinks();

    const form       = document.getElementById('links-form');
    const labelInput = document.getElementById('link-label-input');
    const urlInput   = document.getElementById('link-url-input');

    if (form && labelInput && urlInput) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        LinksModule.addLink(labelInput.value, urlInput.value);
        labelInput.value = '';
        urlInput.value   = '';
      });
    }
  },
};

// ============================================================
// Initialization
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
  if (!StorageModule.isAvailable()) {
    const warning = document.getElementById('storage-warning');
    if (warning) warning.removeAttribute('hidden');
  }

  ThemeModule.init();
  GreetingModule.init();
  TimerModule.init();
  TaskModule.init();
  LinksModule.init();
});
