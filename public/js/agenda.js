window.agendaManager = (() => {
  let currentDate = new Date();

  const typesConfig = {
    estudo: { color: '#3B82F6' },
    simulado: { color: '#EF4444' },
    descanso: { color: '#10B981' },
    revisao: { color: '#F59E0B' },
    edital: { color: '#8B5CF6' },
    outro: { color: '#6B7280' }
  };

  function toLocalISO(date) {
    const timeZoneOffset = date.getTimezoneOffset() * 60000;
    return new Date(date - timeZoneOffset).toISOString().split('T')[0];
  }

  async function loadMonth() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const label = document.getElementById('agendaMonthLabel');
    if (label) {
      label.textContent = new Intl.DateTimeFormat('pt-BR', {
        month: 'long',
        year: 'numeric'
      }).format(currentDate);
    }

    try {
      const response = await fetch(`/events?year=${year}&month=${month}`);
      const data = await response.json();
      renderGrid(year, month - 1, data.events || []);
    } catch (error) {
      console.error(error);
      renderGrid(year, month - 1, []);
    }
  }

  function renderGrid(year, month, events) {
    const grid = document.getElementById('agendaGrid');
    if (!grid) return;

    grid.innerHTML = '';
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayString = toLocalISO(new Date());

    for (let index = 0; index < firstDay; index += 1) {
      const empty = document.createElement('div');
      empty.className = 'agenda-day agenda-day--empty';
      grid.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      const dayString = toLocalISO(date);
      const dayEvents = events.filter((event) => event.date === dayString);
      const element = document.createElement('div');

      element.className = `agenda-day ${dayString === todayString ? 'agenda-day--today' : ''}`;
      element.onclick = () => openModal(dayString, dayEvents);
      element.innerHTML = `
        <div class="agenda-day-num">${day}</div>
        <div class="agenda-slots">
          ${dayEvents.slice(0, 3).map((event) => {
            const type = typesConfig[event.type] || typesConfig.outro;
            return `<div class="agenda-event-dot" style="background:${type.color}" title="${event.title}"></div>`;
          }).join('')}
          ${dayEvents.length > 3 ? '<div class="agenda-event-dot" style="background:#999">+</div>' : ''}
        </div>
      `;

      grid.appendChild(element);
    }
  }

  function openModal(date, events) {
    document.getElementById('agendaDate').value = date;
    const [year, month, day] = date.split('-');
    document.getElementById('agendaModalTitle').textContent = `Agenda - ${day}/${month}/${year}`;

    const list = document.getElementById('agendaEventList');
    if (events.length === 0) {
      list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem">Nenhum evento agendado.</p>';
    } else {
      list.innerHTML = events.map((event) => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px; background:var(--bg-secondary); border-radius:6px; margin-bottom:6px;">
          <div style="display:flex; align-items:center;">
            <div style="width:10px; height:10px; border-radius:50%; background:${typesConfig[event.type]?.color || '#999'}; margin-right:8px;"></div>
            <span style="font-size:0.9rem; font-weight:500;">${event.title}</span>
          </div>
          <button type="button" class="btn btn--ghost btn--xs btn--icon btn--danger-hover" onclick="agendaManager.deleteEvent('${event._id}')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      `).join('');
    }

    document.getElementById('agendaForm').reset();
    document.getElementById('agendaDate').value = date;
    document.getElementById('agendaModal').classList.add('modal--open');
  }

  async function saveEvent(event) {
    event.preventDefault();
    const button = event.target.querySelector('button[type="submit"]');
    const payload = {
      date: document.getElementById('agendaDate').value,
      type: document.getElementById('agendaType').value,
      title: document.getElementById('agendaTitle').value
    };

    button.disabled = true;
    try {
      await fetch('/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      document.getElementById('agendaModal').classList.remove('modal--open');
      loadMonth();
    } catch (error) {
      console.error(error);
    } finally {
      button.disabled = false;
    }
  }

  async function deleteEvent(id) {
    if (!confirm('Apagar este evento?')) return;

    try {
      await fetch(`/events/${id}`, { method: 'DELETE' });
      document.getElementById('agendaModal').classList.remove('modal--open');
      loadMonth();
    } catch (error) {
      console.error(error);
    }
  }

  document.addEventListener('DOMContentLoaded', loadMonth);

  return {
    deleteEvent,
    nextMonth: () => {
      currentDate.setMonth(currentDate.getMonth() + 1);
      loadMonth();
    },
    prevMonth: () => {
      currentDate.setMonth(currentDate.getMonth() - 1);
      loadMonth();
    },
    saveEvent
  };
})();
