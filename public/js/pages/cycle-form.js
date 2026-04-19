(function initCycleFormPage() {
  const form = document.getElementById('cycleForm');
  const subjectsList = document.getElementById('subjectsList');
  if (!form || !subjectsList) return;

  let count = Number(subjectsList.dataset.initialCount || subjectsList.children.length || 0);

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function reIndex() {
    document.querySelectorAll('.subject-row').forEach((row, index) => {
      const indicator = row.querySelector('.subject-row-num');
      if (indicator) indicator.textContent = index + 1;
    });
  }

  function removeSubject(id) {
    const rows = document.querySelectorAll('.subject-row');
    if (rows.length <= 1) return;

    document.getElementById(id)?.remove();
    reIndex();
  }

  function addSubject(name = '', duration = '') {
    const idx = count;
    const row = document.createElement('div');
    row.className = 'subject-row';
    row.id = `sr-${idx}`;
    row.innerHTML = `
      <div class="subject-row-num">${subjectsList.children.length + 1}</div>
      <input
        class="form-input"
        type="text"
        name="subjects[name]"
        placeholder="Nome da disciplina"
        value="${escapeHtml(name)}"
        minlength="2"
        maxlength="100"
        required
        style="flex:1;"
      >
      <div class="subject-row-time">
        <input
          class="form-input form-input--sm"
          type="number"
          name="subjects[duration]"
          placeholder="Min"
          value="${escapeHtml(duration)}"
          min="1"
          max="480"
          step="1"
          required
        >
        <span class="form-input-suffix">min</span>
      </div>
      <button type="button" class="btn btn--ghost btn--xs btn--icon" data-remove-subject="${idx}" title="Remover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;

    subjectsList.appendChild(row);
    count += 1;
    reIndex();
  }

  subjectsList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-subject]');
    if (!button) return;
    removeSubject(`sr-${button.getAttribute('data-remove-subject')}`);
  });

  document.querySelector('[data-add-subject]')?.addEventListener('click', () => addSubject());

  form.addEventListener('submit', (event) => {
    const rows = [...document.querySelectorAll('.subject-row')];
    const validRows = rows.filter((row) => {
      const name = row.querySelector('input[name="subjects[name]"]')?.value.trim();
      const duration = Number(row.querySelector('input[name="subjects[duration]"]')?.value);
      return name && duration >= 1 && duration <= 480;
    });

    if (!form.name.value.trim() || validRows.length === 0) {
      event.preventDefault();
      window.alert('Preencha o nome do ciclo e pelo menos uma disciplina valida.');
    }
  });

  window.addSubject = addSubject;
  window.removeSubject = removeSubject;

  if (subjectsList.children.length === 0) {
    addSubject();
  } else {
    reIndex();
  }
})();
