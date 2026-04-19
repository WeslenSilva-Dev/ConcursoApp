/**
 * ConcursoApp Auto-Pomodoro Timer
 * Handles Pomodoro-style timer (Focus / Break) intelligently.
 * Persists state in localStorage.
 */

const STORAGE_KEY = 'concursoapp_focus_v2';

// State
let timerInterval = null;
let isRunning = false;
let isPaused = false;

let currentMode = 'focus'; // 'focus' | 'break'
let pomodoroLength = 25 * 60; // 25 min default
let breakLength = 5 * 60; // 5 min default

let globalRemainingSeconds = 0; // Total study time left for this subject
let modeRemainingSeconds = 0;   // Time left in the current block (focus or break)
let totalSessionSeconds = 0;

let sessionId = null;

// DOM
const display = document.getElementById('timerDisplay');
const statusEl = document.getElementById('timerStatus');
const circleEl = document.getElementById('timerCircle');
const btnPlay = document.getElementById('iconPlay');
const btnPauseIcon = document.getElementById('iconPause');
const focusData = document.getElementById('focusData');

// Request Notifications
if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
  Notification.requestPermission();
}

if (focusData) initFocusPage();

function initFocusPage() {
  const durationMinutes = parseInt(focusData.dataset.duration) || 25;
  totalSessionSeconds = durationMinutes * 60;
  sessionId = focusData.dataset.sessionId || null;
  const sessionStart = focusData.dataset.sessionStart ? parseInt(focusData.dataset.sessionStart) : null;

  const saved = loadState();
  if (saved && saved.cycleId === focusData.dataset.cycleId && saved.subject === focusData.dataset.subject) {
    // Restore
    sessionId = saved.sessionId || sessionId;
    currentMode = saved.currentMode || 'focus';
    globalRemainingSeconds = saved.globalRemainingSeconds;
    modeRemainingSeconds = saved.modeRemainingSeconds;
    isRunning = saved.isRunning;
    isPaused = saved.isPaused;

    if (isRunning && !isPaused) {
      const wallElapsed = Math.floor((Date.now() - saved.savedAt) / 1000);
      if (currentMode === 'focus') {
        const actualTick = Math.min(wallElapsed, modeRemainingSeconds);
        modeRemainingSeconds -= actualTick;
        globalRemainingSeconds -= actualTick;
      } else {
        const actualTick = Math.min(wallElapsed, modeRemainingSeconds);
        modeRemainingSeconds -= actualTick;
      }
    }

    updateUI();

    if (isRunning && !isPaused && globalRemainingSeconds > 0) {
      statusEl.textContent = 'Retomando...';
      setTimeout(() => startTimer(), 500);
    } else if (isPaused) {
      isPaused = true;
      statusEl.textContent = currentMode === 'focus' ? 'Foco (Pausado)' : 'Pausa (Pausado)';
      updatePlayPauseIcon();
    }
  } else if (sessionId && sessionStart) {
    // Backend session active
    const wallElapsed = Math.floor((Date.now() - sessionStart) / 1000);
    globalRemainingSeconds = Math.max(0, totalSessionSeconds - wallElapsed);
    currentMode = 'focus';
    modeRemainingSeconds = Math.min(pomodoroLength, globalRemainingSeconds);

    updateUI();
    statusEl.textContent = 'Retomando...';
    setTimeout(() => startTimer(), 500);
  } else {
    // New
    globalRemainingSeconds = totalSessionSeconds;
    currentMode = 'focus';
    modeRemainingSeconds = Math.min(pomodoroLength, globalRemainingSeconds);
    updateUI();
  }

  if (globalRemainingSeconds <= 0) {
    onSessionComplete();
  } else if (modeRemainingSeconds <= 0) {
    handleModeTransition();
  }
}

async function toggleTimer() {
  if (!isRunning && !isPaused) {
    await startBackendSession();
    startTimer();
  } else if (isRunning) {
    pauseTimer();
  } else if (isPaused) {
    resumeTimer();
  }
}

async function startBackendSession() {
  if (sessionId) return;
  try {
    const data = focusData.dataset;
    const res = await fetch('/sessions/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cycleId: data.cycleId, subject: data.subject, scheduledDuration: data.duration })
    });
    const json = await res.json();
    if (json.success) {
      sessionId = json.sessionId;
      saveState();
    }
  } catch (e) { console.error('Erro ao iniciar sessao:', e); }
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = true;
  isPaused = false;

  document.querySelector('.focus-page')?.classList.add('timer-running');
  updateUI();
  saveState();

  timerInterval = setInterval(() => {
    if (currentMode === 'focus') {
      modeRemainingSeconds--;
      globalRemainingSeconds--;
      if (globalRemainingSeconds <= 0) {
        clearInterval(timerInterval);
        onSessionComplete();
        return;
      }
    } else {
      modeRemainingSeconds--;
    }

    if (modeRemainingSeconds <= 0) {
      handleModeTransition();
    } else {
      updateUI();
      saveState();
    }
  }, 1000);
}

function pauseTimer() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  isPaused = true;

  document.querySelector('.focus-page')?.classList.remove('timer-running');
  statusEl.textContent = currentMode === 'focus' ? 'Foco (Pausado)' : 'Pausa (Pausado)';
  updatePlayPauseIcon();
  saveState();
}

function resumeTimer() {
  startTimer();
}

function setPomodoroPreset(fMins, bMins) {
  if (isRunning && !confirm('A sessao esta em andamento. Deseja alterar as regras e reiniciar o bloco atual?')) return;
  pomodoroLength = fMins * 60;
  breakLength = bMins * 60;

  if (currentMode === 'focus') {
    modeRemainingSeconds = Math.min(pomodoroLength, globalRemainingSeconds);
  } else {
    modeRemainingSeconds = breakLength;
  }

  updateUI();
  saveState();
}

function handleModeTransition() {
  if (timerInterval) clearInterval(timerInterval);

  if (currentMode === 'focus') {
    currentMode = 'break';
    modeRemainingSeconds = breakLength;
    playAlertSound('break');
    showNotification('Hora da Pausa!', 'Descanse um pouco e relaxe sua mente.');
  } else {
    currentMode = 'focus';
    modeRemainingSeconds = Math.min(pomodoroLength, globalRemainingSeconds);
    playAlertSound('focus');
    showNotification('De volta ao Foco!', 'Sua pausa acabou, vamos continuar!');
  }

  updateUI();
  startTimer();
}

async function onSessionComplete() {
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;
  isPaused = false;

  document.querySelector('.focus-page')?.classList.remove('timer-running');
  statusEl.textContent = 'Concluido!';

  if (display) display.textContent = '00:00';
  if (circleEl) {
    circleEl.style.strokeDashoffset = '628.3';
    circleEl.style.stroke = 'var(--success)';
  }

  playAlertSound('complete');
  showNotification('Sessao Concluida!', 'Voce finalizou esta disciplina do ciclo!');

  await saveSessionToServer(parseInt(focusData?.dataset.duration) || 25);
}

async function finishSession() {
  if (!confirm('Deseja finalizar esta sessao de estudo agora?')) return;
  if (timerInterval) clearInterval(timerInterval);
  isRunning = false;

  const elapsedFocus = totalSessionSeconds - globalRemainingSeconds;
  const actualMinutes = Math.max(1, Math.ceil(elapsedFocus / 60));
  await saveSessionToServer(actualMinutes);
}

async function abandonSession() {
  if (!confirm('Deseja abandonar o estudo atual e voltar ao dashboard?')) return;
  if (timerInterval) clearInterval(timerInterval);
  clearState();
  try { await fetch('/sessions/abandon', { method: 'POST' }); } catch (e) { }
  window.location.href = '/dashboard';
}

async function saveSessionToServer(minutes) {
  if (!sessionId) {
    clearState();
    window.location.href = '/dashboard';
    return;
  }
  try {
    statusEl.textContent = 'Salvando...';
    const res = await fetch('/sessions/finish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, actualDuration: minutes })
    });
    const data = await res.json();
    clearState();
    if (data.success) {
      showCompletionMessage(minutes, data.nextSubject);
    } else {
      window.location.href = '/dashboard';
    }
  } catch (e) { window.location.href = '/dashboard'; }
}

function showCompletionMessage(minutes, nextSubject) {
  const focus = document.querySelector('.focus-main');
  if (!focus) return;
  focus.innerHTML = `
    <div style="text-align:center; animation: fadeIn 0.5s ease;">
      <div style="font-size: 1.5rem; font-weight: 800; margin-bottom: 0.5rem;">Sessao concluida!</div>
      <div style="font-size: 1rem; color: var(--text-secondary); margin-bottom: 2rem;">
        Voce estudou por ${Math.floor(minutes / 60)}h ${minutes % 60}m.
      </div>
      ${nextSubject ? `<div style="background: var(--accent-dim); border: 1px solid rgba(108,99,255,0.2); border-radius: 12px; padding: 1rem 1.5rem; margin-bottom: 2rem; display:inline-block;">
        <div style="font-size: 0.75rem; color: var(--accent-light); font-weight: 600; text-transform: uppercase;">Proxima disciplina</div>
        <div style="font-size: 1.1rem; font-weight: 700;">${nextSubject.name}</div>
      </div>` : ''}
      <div style="display: flex; gap: 1rem; justify-content: center;">
        ${nextSubject ? `<a href="/sessions/focus" class="btn btn--primary">Proxima disciplina</a>` : ''}
        <a href="/dashboard" class="btn btn--secondary">Ir ao Dashboard</a>
      </div>
    </div>
  `;
}

function updateUI() {
  if (!display) return;

  const m = Math.floor(modeRemainingSeconds / 60);
  const s = modeRemainingSeconds % 60;
  display.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

  if (currentMode === 'focus') {
    statusEl.textContent = isRunning ? 'Modo Foco' : 'Foco (Pronto)';
  } else {
    statusEl.textContent = isRunning ? 'Pausa (Relaxando)' : 'Pausa (Pronto)';
  }

  if (circleEl) {
    const circumference = 2 * Math.PI * 100;
    const totalBlock = currentMode === 'focus' ? pomodoroLength : breakLength;
    const boundedModeRemaining = Math.min(modeRemainingSeconds, totalBlock);
    const progress = Math.min(1, Math.max(0, boundedModeRemaining / totalBlock));
    const offset = circumference * (1 - progress);

    circleEl.style.strokeDasharray = circumference;
    circleEl.style.strokeDashoffset = offset || 0;

    if (currentMode === 'break') {
      circleEl.style.stroke = 'var(--teal)';
    } else {
      if (progress > 0.5) circleEl.style.stroke = 'var(--accent)';
      else if (progress > 0.2) circleEl.style.stroke = 'var(--warning)';
      else circleEl.style.stroke = 'var(--orange)';
    }
  }

  const totalLeftLabel = document.getElementById('totalSessionTimeLeft');
  if (totalLeftLabel) {
    const totalM = Math.ceil(globalRemainingSeconds / 60);
    totalLeftLabel.textContent = `Total restante: ${totalM}m`;
  }

  updatePlayPauseIcon();
}

function updatePlayPauseIcon() {
  if (!btnPlay || !btnPauseIcon) return;
  if (isRunning) {
    btnPlay.style.display = 'none';
    btnPauseIcon.style.display = 'block';
  } else {
    btnPlay.style.display = 'block';
    btnPauseIcon.style.display = 'none';
  }
}

function showNotification(title, body) {
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

function playAlertSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playNote = (freq, delay, vol = 0.3) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.3);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.3);
    };

    if (type === 'break') {
      playNote(659, 0, 0.2);
      playNote(523, 0.2, 0.2);
    } else if (type === 'focus') {
      playNote(523, 0, 0.3);
      playNote(659, 0.15, 0.3);
    } else if (type === 'complete') {
      [523, 659, 784, 1047].forEach((f, i) => playNote(f, i * 0.15, 0.3));
    }
  } catch (e) { }
}

function saveState() {
  if (!focusData) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    cycleId: focusData.dataset.cycleId,
    subject: focusData.dataset.subject,
    sessionId,
    currentMode,
    globalRemainingSeconds,
    modeRemainingSeconds,
    isRunning,
    isPaused,
    savedAt: Date.now()
  }));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearState() {
  localStorage.removeItem(STORAGE_KEY);
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && isRunning && focusData) {
    const saved = loadState();
    if (saved && saved.isRunning && !saved.isPaused) {
      const wallElapsed = Math.floor((Date.now() - saved.savedAt) / 1000);

      if (currentMode === 'focus') {
        const actualTick = Math.min(wallElapsed, modeRemainingSeconds);
        modeRemainingSeconds -= actualTick;
        globalRemainingSeconds -= actualTick;
      } else {
        const actualTick = Math.min(wallElapsed, modeRemainingSeconds);
        modeRemainingSeconds -= actualTick;
      }

      if (globalRemainingSeconds <= 0) onSessionComplete();
      else if (modeRemainingSeconds <= 0) handleModeTransition();
      else updateUI();
    }
  }
});
