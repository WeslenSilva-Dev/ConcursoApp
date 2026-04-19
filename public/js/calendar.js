/**
 * ConcursoApp Calendar
 * Renders a 30-day activity calendar in the dashboard.
 */

function renderCalendar(container, studiedDays) {
  if (!container) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build last 35 days (5 weeks) grid
  const days = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  container.innerHTML = '';

  // Weekday labels
  ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].forEach(label => {
    const el = document.createElement('div');
    el.className = 'calendar-day-label';
    el.textContent = label;
    el.style.cssText = 'text-align:center; font-size:0.65rem; color:var(--text-muted); font-weight:600; margin-bottom:2px;';
    container.appendChild(el);
  });

  days.forEach(d => {
    const dateStr = d.toISOString().split('T')[0];
    const isStudied = studiedDays.includes(dateStr);
    const isToday = d.getTime() === today.getTime();

    const el = document.createElement('div');
    el.className = 'calendar-day';
    el.title = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    el.textContent = d.getDate();

    if (isStudied) el.classList.add('calendar-day--studied');
    if (isToday) el.classList.add('calendar-day--today');

    container.appendChild(el);
  });
}
