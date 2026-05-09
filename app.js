// ============================================================
// StorageModule — safe localStorage wrapper
// ============================================================
const StorageModule = {
  isAvailable() {
    try {
      const k = '__tld_test__';
      localStorage.setItem(k, '1');
      localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  },
  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch (e) {}
  },
  load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  },
};

// ============================================================
// ThemeModule — light / dark mode toggle
// ============================================================
const ThemeModule = {
  KEY: 'tld_theme',

  apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.textContent = theme === 'dark' ? '🌙' : '☀️';
    StorageModule.save(ThemeModule.KEY, theme);
  },

  toggle() {
    const cur = document.documentElement.getAttribute('data-theme') || 'dark';
    ThemeModule.apply(cur === 'dark' ? 'light' : 'dark');
  },

  init() {
    const saved = StorageModule.load(ThemeModule.KEY, 'dark');
    ThemeModule.apply(saved);
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', ThemeModule.toggle);
  },
};

// ============================================================
// GreetingModule — live clock + custom name
// ============================================================
const GreetingModule = {
  KEY: 'tld_username',

  getGreeting(hour) {
    if (hour >= 5  && hour <= 11) return 'Good Morning';
    if (hour >= 12 && hour <= 17) return 'Good Afternoon';
    if (hour >= 18 && hour <= 20) return 'Good Evening';
    return 'Good Night';
  },

  formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  },

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  },

  getName() {
    return StorageModule.load(GreetingModule.KEY, null);
  },

  saveName(name) {
    const t = name.trim();
    if (t) StorageModule.save(GreetingModule.KEY, t);
    else   StorageModule.remove(GreetingModule.KEY);
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
      const label    = name || 'add your name';
      textEl.innerHTML =
        `${greeting}${name ? ', ' : ' — '}<span class="greeting__name" id="greeting-name-btn" title="Click to ${name ? 'change' : 'set'} your name" tabindex="0" role="button">${label}</span>`;

      const btn = document.getElementById('greeting-name-btn');
      if (btn) {
        btn.addEventListener('click', GreetingModule.openEditor);
        btn.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') GreetingModule.openEditor();
        });
      }
    }
  },

  openEditor() {
    const editor = document.getElementById('name-editor');
    const input  = document.getElementById('name-input');
    const textEl = document.getElementById('greeting-text');
    if (!editor || !input) return;
    input.value = GreetingModule.getName() || '';
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

    if (saveBtn) saveBtn.addEventListener('click', () => {
      GreetingModule.saveName(input ? input.value : '');
      GreetingModule.closeEditor();
    });

    if (cancelBtn) cancelBtn.addEventListener('click', GreetingModule.closeEditor);

    if (input) input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  { GreetingModule.saveName(input.value); GreetingModule.closeEditor(); }
      if (e.key === 'Escape') GreetingModule.closeEditor();
    });
  },
};

// ============================================================
// TimerModule — countdown with custom duration
// ============================================================
let remainingSeconds = 1500;
let timerDuration    = 1500;
let intervalId       = null;

const TimerModule = {
  formatMMSS(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  },

  renderDisplay() {
    const el = document.getElementById('timer-display');
    if (el) el.textContent = TimerModule.formatMMSS(remainingSeconds);
  },

  updateButtonStates() {
    const running  = intervalId !== null;
    const startBtn = document.getElementById('timer-start');
    const stopBtn  = document.getElementById('timer-stop');
    const setBtn   = document.getElementById('timer-set-duration');
    const durInput = document.getElementById('timer-duration-input');
    if (startBtn)  startBtn.disabled  = running;
    if (stopBtn)   stopBtn.disabled   = !running;
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

  setDuration() {
    const input = document.getElementById('timer-duration-input');
    if (!input) return;
    let min = parseInt(input.value, 10);
    if (isNaN(min) || min < 1) min = 1;
    if (min > 120)             min = 120;
    input.value      = min;
    timerDuration    = min * 60;
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
    if (durInput) durInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') TimerModule.setDuration();
    });
  },
};

// ============================================================
// TaskModule — add / edit / complete / delete tasks
// ============================================================
let tasks = [];

const TaskModule = {
  loadTasks()  { tasks = StorageModule.load('tld_tasks', []); },
  saveTasks()  { StorageModule.save('tld_tasks', tasks); },

  addTask(description) {
    const t = description.trim();
    if (!t) return;
    tasks.push({ id: Date.now().toString(), description: t, completed: false });
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
    input.type = 'text'; input.className = 'input task__edit-input'; input.value = task.description;

    const ok = document.createElement('button');
    ok.type = 'button'; ok.className = 'btn btn--primary task__edit-confirm'; ok.textContent = '✓';
    ok.addEventListener('click', () => TaskModule.confirmEdit(id, input.value));

    const cancel = document.createElement('button');
    cancel.type = 'button'; cancel.className = 'btn btn--ghost task__edit-cancel'; cancel.textContent = '✕';
    cancel.addEventListener('click', () => TaskModule.cancelEdit(id));

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter')  TaskModule.confirmEdit(id, input.value);
      if (e.key === 'Escape') TaskModule.cancelEdit(id);
    });

    span.replaceWith(input, ok, cancel);
    input.focus(); input.select();
  },

  confirmEdit(id, value) {
    const t = value.trim();
    if (!t) { TaskModule.cancelEdit(id); return; }
    const i = tasks.findIndex(t => t.id === id);
    if (i !== -1) tasks[i].description = t;
    TaskModule.saveTasks();
    TaskModule.renderList();
  },

  cancelEdit() { TaskModule.renderList(); },

  createTaskElement(task) {
    const li = document.createElement('li');
    li.className = 'task__item' + (task.completed ? ' task--completed' : '');
    li.setAttribute('data-id', task.id);

    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'btn btn--ghost task__toggle';
    toggle.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
    toggle.textContent = task.completed ? '✓' : '';
    toggle.addEventListener('click', () => TaskModule.toggleComplete(task.id));

    const span = document.createElement('span');
    span.className = 'task__text'; span.textContent = task.description;

    const editBtn = document.createElement('button');
    editBtn.type = 'button'; editBtn.className = 'btn btn--ghost task__edit';
    editBtn.setAttribute('aria-label', 'Edit task'); editBtn.textContent = '✎';
    editBtn.addEventListener('click', () => TaskModule.beginEdit(task.id));

    const delBtn = document.createElement('button');
    delBtn.type = 'button'; delBtn.className = 'btn btn--danger task__delete';
    delBtn.setAttribute('aria-label', 'Delete task'); delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => TaskModule.deleteTask(task.id));

    li.append(toggle, span, editBtn, delBtn);
    return li;
  },

  renderList() {
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';
    tasks.forEach(t => list.appendChild(TaskModule.createTaskElement(t)));
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
// LinksModule — add / delete quick-access links
// ============================================================
let links = [];

const LinksModule = {
  loadLinks()  { links = StorageModule.load('tld_links', []); },
  saveLinks()  { StorageModule.save('tld_links', links); },

  addLink(label, url) {
    const l = label.trim(), u = url.trim();
    if (!l || !u) return;
    links.push({ id: Date.now().toString(), label: l, url: u });
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
    div.className = 'link__item'; div.setAttribute('data-id', link.id);

    const a = document.createElement('a');
    a.href = link.url; a.textContent = link.label;
    a.target = '_blank'; a.rel = 'noopener noreferrer';
    a.className = 'btn btn--primary link__button';

    const del = document.createElement('button');
    del.type = 'button'; del.className = 'btn link__delete';
    del.setAttribute('aria-label', `Delete ${link.label}`); del.textContent = '✕';
    del.addEventListener('click', () => LinksModule.deleteLink(link.id));

    div.append(a, del);
    return div;
  },

  renderLinks() {
    const list = document.getElementById('links-list');
    if (!list) return;
    list.innerHTML = '';
    links.forEach(l => list.appendChild(LinksModule.createLinkElement(l)));
  },

  init() {
    LinksModule.loadLinks();
    LinksModule.renderLinks();
    const form  = document.getElementById('links-form');
    const label = document.getElementById('link-label-input');
    const url   = document.getElementById('link-url-input');
    if (form && label && url) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        LinksModule.addLink(label.value, url.value);
        label.value = ''; url.value = '';
      });
    }
  },
};

// ============================================================
// Bootstrap
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  if (!StorageModule.isAvailable()) {
    const w = document.getElementById('storage-warning');
    if (w) w.removeAttribute('hidden');
  }

  ThemeModule.init();
  GreetingModule.init();
  TimerModule.init();
  TaskModule.init();
  LinksModule.init();
});
