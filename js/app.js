/**
 * To-Do List Life Dashboard
 * Vanilla JavaScript implementation conforming to assignment requirements:
 * - Real-time clock & dynamic greeting based on time of day
 * - Focus Timer (Pomodoro) with start, stop, reset, sound chime & custom duration
 * - To-Do List with add, edit, toggle done, delete & localStorage persistence
 * - Quick Links launcher with add, delete & localStorage persistence
 * - Challenges: Light/Dark mode, Custom Name, Change Pomodoro Time, Prevent Duplicate Tasks, Sort Tasks
 */

(function () {
  'use strict';

  // ==========================================
  // STORAGE KEYS & CONSTANTS
  // ==========================================
  const STORAGE_KEYS = {
    THEME: 'dashboard_theme',
    USER_NAME: 'dashboard_user_name',
    TASKS: 'dashboard_tasks',
    QUICK_LINKS: 'dashboard_quick_links',
    POMODORO_MINS: 'dashboard_pomodoro_mins',
    SESSIONS_COUNT: 'dashboard_focus_sessions_count',
    TASK_SORT: 'dashboard_task_sort',
    TIME_FORMAT_24: 'dashboard_time_format_24'
  };

  const DEFAULT_LINKS = [
    { id: '1', name: 'Google', url: 'https://www.google.com' },
    { id: '2', name: 'Gmail', url: 'https://mail.google.com' },
    { id: '3', name: 'Calendar', url: 'https://calendar.google.com' },
    { id: '4', name: 'GitHub', url: 'https://github.com' },
    { id: '5', name: 'YouTube', url: 'https://www.youtube.com' }
  ];

  const DEFAULT_TASKS = [
    { id: '1', text: 'belanja', completed: false, createdAt: Date.now() - 3600000 },
    { id: '2', text: 'belajar', completed: false, createdAt: Date.now() - 1800000 }
  ];

  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  let tasks = loadFromStorage(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  let quickLinks = loadFromStorage(STORAGE_KEYS.QUICK_LINKS, DEFAULT_LINKS);
  let userName = loadFromStorage(STORAGE_KEYS.USER_NAME, 'Alex');
  let currentFilter = 'all';
  let currentSort = loadFromStorage(STORAGE_KEYS.TASK_SORT, 'newest');
  let is24Hour = loadFromStorage(STORAGE_KEYS.TIME_FORMAT_24, true);

  // Timer State
  let timerMinutes = parseInt(loadFromStorage(STORAGE_KEYS.POMODORO_MINS, 25), 10) || 25;
  let timerTotalSeconds = timerMinutes * 60;
  let timerRemainingSeconds = timerTotalSeconds;
  let timerInterval = null;
  let timerState = 'stopped'; // 'running', 'paused', 'stopped'
  let completedSessions = parseInt(loadFromStorage(STORAGE_KEYS.SESSIONS_COUNT, 0), 10) || 0;

  // Audio Context for Chimes (Web Audio API - 100% offline & zero dependencies)
  let audioCtx = null;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  function playChime() {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + index * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + index * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + index * 0.12 + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + index * 0.12);
        osc.stop(ctx.currentTime + index * 0.12 + 0.65);
      });
    } catch (e) {
      console.warn('Audio chime failed:', e);
    }
  }

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================
  function loadFromStorage(key, fallback) {
    try {
      const item = localStorage.getItem(key);
      return item !== null ? JSON.parse(item) : fallback;
    } catch (e) {
      console.warn(`Could not load ${key} from localStorage:`, e);
      return fallback;
    }
  }

  function saveToStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Could not save ${key} to localStorage:`, e);
    }
  }

  function showToast(message, icon = '✨') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ==========================================
  // 1. CLOCK & GREETING
  // ==========================================
  function updateClockAndGreeting() {
    const now = new Date();

    // Time
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    let timeString = '';

    if (is24Hour) {
      timeString = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    } else {
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      timeString = `${String(displayHours).padStart(2, '0')}:${minutes}:${seconds} ${period}`;
    }

    const clockEl = document.getElementById('live-clock');
    if (clockEl && clockEl.textContent !== timeString) {
      clockEl.textContent = timeString;
    }

    // Date: "Tuesday, January 27, 2026"
    const dateOptions = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    const dateString = now.toLocaleDateString('en-US', dateOptions);
    const dateEl = document.getElementById('live-date');
    if (dateEl && dateEl.textContent !== dateString) {
      dateEl.textContent = dateString;
    }

    // Greeting based on time of day
    let greetingPrefix = 'Good Morning';
    if (hours >= 12 && hours < 17) {
      greetingPrefix = 'Good Afternoon';
    } else if (hours >= 17 && hours < 22) {
      greetingPrefix = 'Good Evening';
    } else if (hours >= 22 || hours < 5) {
      greetingPrefix = 'Good Night';
    }

    const greetingPrefixEl = document.getElementById('greeting-prefix');
    if (greetingPrefixEl && greetingPrefixEl.textContent !== greetingPrefix) {
      greetingPrefixEl.textContent = greetingPrefix;
    }

    const nameDisplayEl = document.getElementById('greeting-name');
    if (nameDisplayEl) {
      nameDisplayEl.textContent = userName ? `, ${userName}` : '';
    }

    // Update greeting name in top bar as well
    const topUserNameEl = document.getElementById('top-user-name');
    if (topUserNameEl) {
      topUserNameEl.textContent = userName || 'Set Name';
    }
  }

  // ==========================================
  // 2. FOCUS TIMER (POMODORO)
  // ==========================================
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function updateTimerDisplay() {
    const displayEl = document.getElementById('timer-display');
    const progressBar = document.getElementById('timer-progress-bar');
    const statusEl = document.getElementById('timer-status');
    const startBtn = document.getElementById('btn-timer-start');

    if (displayEl) {
      displayEl.textContent = formatTime(timerRemainingSeconds);
    }

    // Progress bar calculation
    if (progressBar && timerTotalSeconds > 0) {
      const percentage = (timerRemainingSeconds / timerTotalSeconds) * 100;
      progressBar.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }

    // Status label
    if (statusEl) {
      if (timerState === 'running') {
        statusEl.textContent = 'Focus Session Active';
        statusEl.style.color = 'var(--primary-color)';
      } else if (timerState === 'paused') {
        statusEl.textContent = 'Session Paused';
        statusEl.style.color = 'var(--warning-color)';
      } else {
        statusEl.textContent = 'Ready to Focus';
        statusEl.style.color = 'var(--text-muted)';
      }
    }

    // Button states
    if (startBtn) {
      if (timerState === 'running') {
        startBtn.textContent = 'Running';
        startBtn.disabled = true;
        startBtn.style.opacity = '0.7';
      } else {
        startBtn.textContent = timerState === 'paused' ? 'Resume' : 'Start';
        startBtn.disabled = false;
        startBtn.style.opacity = '1';
      }
    }

    // Sessions count indicator
    const sessionsEl = document.getElementById('completed-sessions-count');
    if (sessionsEl) {
      sessionsEl.textContent = `${completedSessions} ${completedSessions === 1 ? 'session' : 'sessions'}`;
    }
  }

  function startTimer() {
    if (timerState === 'running') return;
    getAudioContext(); // Initialize audio on user interaction
    timerState = 'running';
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      if (timerRemainingSeconds > 0) {
        timerRemainingSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        timerState = 'stopped';
        completedSessions++;
        saveToStorage(STORAGE_KEYS.SESSIONS_COUNT, completedSessions);
        playChime();
        showToast('Pomodoro completed! Great job focusing.', '🎉');
        timerRemainingSeconds = timerTotalSeconds;
        updateTimerDisplay();
      }
    }, 1000);
  }

  function stopTimer() {
    if (timerState !== 'running') return;
    clearInterval(timerInterval);
    timerState = 'paused';
    updateTimerDisplay();
  }

  function resetTimer() {
    clearInterval(timerInterval);
    timerState = 'stopped';
    timerRemainingSeconds = timerTotalSeconds;
    updateTimerDisplay();
  }

  function setPomodoroDuration(minutes) {
    const mins = parseInt(minutes, 10);
    if (isNaN(mins) || mins <= 0) return;
    timerMinutes = mins;
    timerTotalSeconds = timerMinutes * 60;
    saveToStorage(STORAGE_KEYS.POMODORO_MINS, timerMinutes);

    // Update active preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      const btnMins = parseInt(btn.getAttribute('data-mins'), 10);
      if (btnMins === mins) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    resetTimer();
    showToast(`Timer set to ${mins} minutes`, '⏱️');
  }

  // ==========================================
  // 3. TO-DO LIST
  // ==========================================
  function renderTasks() {
    const taskListEl = document.getElementById('task-list');
    const taskCountEl = document.getElementById('task-count-badge');
    if (!taskListEl) return;

    // Filter tasks
    let filteredTasks = tasks.slice();
    if (currentFilter === 'active') {
      filteredTasks = filteredTasks.filter((t) => !t.completed);
    } else if (currentFilter === 'completed') {
      filteredTasks = filteredTasks.filter((t) => t.completed);
    }

    // Sort tasks (Challenge: Sort Tasks)
    filteredTasks.sort((a, b) => {
      if (currentSort === 'newest') {
        return (b.createdAt || 0) - (a.createdAt || 0);
      } else if (currentSort === 'oldest') {
        return (a.createdAt || 0) - (b.createdAt || 0);
      } else if (currentSort === 'alphabetical') {
        return a.text.localeCompare(b.text, undefined, { sensitivity: 'base' });
      } else if (currentSort === 'incomplete-first') {
        if (a.completed === b.completed) {
          return (b.createdAt || 0) - (a.createdAt || 0);
        }
        return a.completed ? 1 : -1;
      }
      return 0;
    });

    // Update count badge
    const activeCount = tasks.filter((t) => !t.completed).length;
    if (taskCountEl) {
      taskCountEl.textContent = `${activeCount} left`;
    }

    if (filteredTasks.length === 0) {
      taskListEl.innerHTML = `
        <li class="empty-state">
          ${currentFilter === 'completed' ? 'No completed tasks yet.' : 'No tasks here. Add one above!'}
        </li>
      `;
      return;
    }

    taskListEl.innerHTML = '';
    filteredTasks.forEach((task) => {
      const li = document.createElement('li');
      li.className = `task-item ${task.completed ? 'completed' : ''}`;
      li.dataset.id = task.id;

      li.innerHTML = `
        <div class="task-left">
          <input 
            type="checkbox" 
            class="task-checkbox" 
            ${task.completed ? 'checked' : ''} 
            aria-label="Mark task as complete"
          />
          <span class="task-text">${escapeHtml(task.text)}</span>
        </div>
        <div class="task-actions">
          <button class="task-btn task-btn-edit" aria-label="Edit task">Edit</button>
          <button class="task-btn task-btn-delete" aria-label="Delete task">Delete</button>
        </div>
      `;

      // Checkbox event
      const checkbox = li.querySelector('.task-checkbox');
      checkbox.addEventListener('change', () => {
        toggleTask(task.id);
      });

      // Edit event
      const editBtn = li.querySelector('.task-btn-edit');
      editBtn.addEventListener('click', () => {
        startEditTask(li, task);
      });

      // Delete event
      const deleteBtn = li.querySelector('.task-btn-delete');
      deleteBtn.addEventListener('click', () => {
        deleteTask(task.id);
      });

      taskListEl.appendChild(li);
    });
  }

  function addTask(text) {
    const trimmed = text.trim();
    if (!trimmed) return false;

    // Challenge: Prevent Duplicate Tasks (case-insensitive)
    const isDuplicate = tasks.some(
      (t) => t.text.trim().toLowerCase() === trimmed.toLowerCase()
    );

    const duplicateAlert = document.getElementById('duplicate-alert');
    if (isDuplicate) {
      if (duplicateAlert) {
        duplicateAlert.style.display = 'flex';
      }
      const inputEl = document.getElementById('task-input');
      if (inputEl) {
        inputEl.style.borderColor = 'var(--danger-color)';
      }
      showToast('Task already exists in your list!', '⚠️');
      return false;
    }

    if (duplicateAlert) {
      duplicateAlert.style.display = 'none';
    }

    const newTask = {
      id: String(Date.now()),
      text: trimmed,
      completed: false,
      createdAt: Date.now()
    };

    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
    showToast('Task added successfully', '✓');
    return true;
  }

  function toggleTask(id) {
    tasks = tasks.map((t) => {
      if (t.id === id) {
        return { ...t, completed: !t.completed };
      }
      return t;
    });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    renderTasks();
    showToast('Task deleted', '🗑️');
  }

  function startEditTask(taskElement, task) {
    const taskLeft = taskElement.querySelector('.task-left');
    const taskActions = taskElement.querySelector('.task-actions');
    if (!taskLeft || !taskActions) return;

    // Hide original actions
    taskLeft.style.display = 'none';
    taskActions.style.display = 'none';

    // Create inline edit view
    const editContainer = document.createElement('div');
    editContainer.className = 'task-edit-row';
    editContainer.innerHTML = `
      <input type="text" class="task-edit-input" value="${escapeHtml(task.text)}" />
      <button class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.825rem;">Save</button>
      <button class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.825rem;">Cancel</button>
    `;

    taskElement.appendChild(editContainer);

    const editInput = editContainer.querySelector('.task-edit-input');
    const saveBtn = editContainer.querySelector('.btn-primary');
    const cancelBtn = editContainer.querySelector('.btn-secondary');

    editInput.focus();
    editInput.select();

    function saveChanges() {
      const newText = editInput.value.trim();
      if (!newText) {
        showToast('Task cannot be empty', '⚠️');
        return;
      }
      // Check if duplicate of OTHER tasks
      const isDuplicate = tasks.some(
        (t) => t.id !== task.id && t.text.trim().toLowerCase() === newText.toLowerCase()
      );
      if (isDuplicate) {
        showToast('Another task already has this name', '⚠️');
        return;
      }

      tasks = tasks.map((t) => (t.id === task.id ? { ...t, text: newText } : t));
      saveToStorage(STORAGE_KEYS.TASKS, tasks);
      renderTasks();
      showToast('Task updated', '✏️');
    }

    saveBtn.addEventListener('click', saveChanges);
    cancelBtn.addEventListener('click', renderTasks);
    editInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') saveChanges();
      if (e.key === 'Escape') renderTasks();
    });
  }

  // ==========================================
  // 4. QUICK LINKS
  // ==========================================
  function renderQuickLinks() {
    const container = document.getElementById('quick-links-container');
    if (!container) return;

    if (quickLinks.length === 0) {
      container.innerHTML = `<span style="font-size: 0.875rem; color: var(--text-muted);">No links saved yet. Add your favorite sites above!</span>`;
      return;
    }

    container.innerHTML = '';
    quickLinks.forEach((link) => {
      const chip = document.createElement('div');
      chip.className = 'quick-link-chip';

      // Favicon fallback or globe icon
      chip.innerHTML = `
        <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" style="color: inherit; text-decoration: none; display: inline-flex; align-items: center; gap: 0.4rem;">
          <span class="quick-link-icon">🌐</span>
          <span>${escapeHtml(link.name)}</span>
        </a>
        <button class="delete-link-btn" aria-label="Delete link ${escapeHtml(link.name)}" title="Remove link">×</button>
      `;

      const deleteBtn = chip.querySelector('.delete-link-btn');
      deleteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        deleteQuickLink(link.id);
      });

      container.appendChild(chip);
    });
  }

  function addQuickLink(name, url) {
    const trimmedName = name.trim();
    let trimmedUrl = url.trim();

    if (!trimmedName || !trimmedUrl) {
      showToast('Please provide both a link name and URL', '⚠️');
      return false;
    }

    // Auto-prefix http/https if missing
    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = 'https://' + trimmedUrl;
    }

    const newLink = {
      id: String(Date.now()),
      name: trimmedName,
      url: trimmedUrl
    };

    quickLinks.push(newLink);
    saveToStorage(STORAGE_KEYS.QUICK_LINKS, quickLinks);
    renderQuickLinks();
    showToast(`Added shortcut for ${trimmedName}`, '🔗');
    return true;
  }

  function deleteQuickLink(id) {
    quickLinks = quickLinks.filter((link) => link.id !== id);
    saveToStorage(STORAGE_KEYS.QUICK_LINKS, quickLinks);
    renderQuickLinks();
    showToast('Link removed', '🗑️');
  }

  // ==========================================
  // 5. CHALLENGES & MODALS
  // ==========================================
  // Light / Dark Mode Toggle
  function initTheme() {
    const savedTheme = loadFromStorage(STORAGE_KEYS.THEME, null);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initialTheme = savedTheme || (prefersDark ? 'dark' : 'light');

    applyTheme(initialTheme);

    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(nextTheme);
        saveToStorage(STORAGE_KEYS.THEME, nextTheme);
        showToast(`Switched to ${nextTheme} mode`, nextTheme === 'dark' ? '🌙' : '☀️');
      });
    }
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon) {
      themeIcon.textContent = theme === 'dark' ? '☀️' : '🌙';
    }
    if (themeText) {
      themeText.textContent = theme === 'dark' ? 'Light' : 'Dark';
    }
  }

  // Custom Name in Greeting Modal
  function setupCustomNameModal() {
    const modal = document.getElementById('name-modal');
    const openBtn = document.getElementById('btn-open-name-modal');
    const greetingWrapper = document.getElementById('custom-name-wrapper');
    const input = document.getElementById('name-input');
    const saveBtn = document.getElementById('btn-save-name');
    const cancelBtn = document.getElementById('btn-cancel-name');

    function openModal() {
      if (input) input.value = userName;
      if (modal) modal.classList.add('active');
      if (input) input.focus();
    }

    function closeModal() {
      if (modal) modal.classList.remove('active');
    }

    function saveName() {
      const val = input.value.trim();
      userName = val || 'Friend';
      saveToStorage(STORAGE_KEYS.USER_NAME, userName);
      updateClockAndGreeting();
      closeModal();
      showToast(`Greeting updated for ${userName}`, '👋');
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (greetingWrapper) greetingWrapper.addEventListener('click', openModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (saveBtn) saveBtn.addEventListener('click', saveName);

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveName();
        if (e.key === 'Escape') closeModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  // Custom Pomodoro Time Modal
  function setupCustomPomodoroModal() {
    const modal = document.getElementById('timer-custom-modal');
    const openBtn = document.getElementById('btn-custom-timer');
    const input = document.getElementById('custom-timer-input');
    const saveBtn = document.getElementById('btn-save-custom-timer');
    const cancelBtn = document.getElementById('btn-cancel-custom-timer');

    function openModal() {
      if (input) input.value = timerMinutes;
      if (modal) modal.classList.add('active');
      if (input) input.focus();
    }

    function closeModal() {
      if (modal) modal.classList.remove('active');
    }

    function saveTime() {
      const val = parseInt(input.value, 10);
      if (isNaN(val) || val < 1 || val > 180) {
        showToast('Please enter a duration between 1 and 180 minutes', '⚠️');
        return;
      }
      setPomodoroDuration(val);
      closeModal();
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if (saveBtn) saveBtn.addEventListener('click', saveTime);

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveTime();
        if (e.key === 'Escape') closeModal();
      });
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });
    }
  }

  // ==========================================
  // INITIALIZATION ON DOM READY
  // ==========================================
  document.addEventListener('DOMContentLoaded', () => {
    // 1. Theme
    initTheme();

    // 2. Modals
    setupCustomNameModal();
    setupCustomPomodoroModal();

    // 3. Clock & Greeting
    updateClockAndGreeting();
    setInterval(updateClockAndGreeting, 1000);

    const clockEl = document.getElementById('live-clock');
    if (clockEl) {
      clockEl.addEventListener('click', () => {
        is24Hour = !is24Hour;
        saveToStorage(STORAGE_KEYS.TIME_FORMAT_24, is24Hour);
        updateClockAndGreeting();
        showToast(`Clock format: ${is24Hour ? '24-Hour' : '12-Hour AM/PM'}`, '⏰');
      });
    }

    // 4. Timer Controls
    const startBtn = document.getElementById('btn-timer-start');
    const stopBtn = document.getElementById('btn-timer-stop');
    const resetBtn = document.getElementById('btn-timer-reset');

    if (startBtn) startBtn.addEventListener('click', startTimer);
    if (stopBtn) stopBtn.addEventListener('click', stopTimer);
    if (resetBtn) resetBtn.addEventListener('click', resetTimer);

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const mins = btn.getAttribute('data-mins');
        if (mins) {
          setPomodoroDuration(mins);
        }
      });
    });

    updateTimerDisplay();

    // 5. Tasks Setup
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const duplicateAlert = document.getElementById('duplicate-alert');

    if (taskForm && taskInput) {
      taskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (addTask(taskInput.value)) {
          taskInput.value = '';
          taskInput.style.borderColor = '';
          taskInput.focus();
        }
      });

      taskInput.addEventListener('input', () => {
        if (duplicateAlert) duplicateAlert.style.display = 'none';
        taskInput.style.borderColor = '';
      });
    }

    // Filter Buttons
    document.querySelectorAll('.filter-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.getAttribute('data-filter') || 'all';
        renderTasks();
      });
    });

    // Sort Dropdown
    const sortSelect = document.getElementById('task-sort-select');
    if (sortSelect) {
      sortSelect.value = currentSort;
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        saveToStorage(STORAGE_KEYS.TASK_SORT, currentSort);
        renderTasks();
      });
    }

    renderTasks();

    // 6. Quick Links Setup
    const linkForm = document.getElementById('link-form');
    const linkNameInput = document.getElementById('link-name-input');
    const linkUrlInput = document.getElementById('link-url-input');

    if (linkForm && linkNameInput && linkUrlInput) {
      linkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if (addQuickLink(linkNameInput.value, linkUrlInput.value)) {
          linkNameInput.value = '';
          linkUrlInput.value = '';
          linkNameInput.focus();
        }
      });
    }

    renderQuickLinks();
  });
})();
