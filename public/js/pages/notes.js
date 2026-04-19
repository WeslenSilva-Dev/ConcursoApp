(function initNotesPage() {
  const noteModal = document.getElementById('noteModal');
  const editModal = document.getElementById('editNoteModal');
  if (!noteModal && !editModal) return;

  async function editNote(id) {
    try {
      const response = await fetch(`/notes/${id}/edit`);
      const data = await response.json();
      if (!data.success) return;

      const form = document.getElementById('editNoteForm');
      form.action = `/notes/${id}?_method=PUT`;
      document.getElementById('editSubject').value = data.note.subject;
      document.getElementById('editTitle').value = data.note.title;
      document.getElementById('editContent').value = data.note.content;

      const dateValue = data.note.date || data.note.createdAt;
      if (dateValue) {
        document.getElementById('editDate').value = new Date(dateValue).toISOString().split('T')[0];
      }

      editModal.classList.add('modal--open');
    } catch (error) {
      console.error(error);
    }
  }

  function runFilters() {
    const textQuery = document.getElementById('noteSearchFilter')?.value.toLowerCase() || '';
    const dateQuery = document.getElementById('noteDateFilter')?.value || '';

    document.querySelectorAll('.note-card').forEach((card) => {
      const title = card.querySelector('.note-title').textContent.toLowerCase();
      const content = card.querySelector('.note-content').textContent.toLowerCase();
      const subject = card.querySelector('.note-subject-tag').textContent.toLowerCase();
      const rawDate = card.querySelector('.note-date').getAttribute('data-raw-date');
      const matchesText = title.includes(textQuery) || content.includes(textQuery) || subject.includes(textQuery);
      const matchesDate = !dateQuery || rawDate === dateQuery;

      card.style.display = matchesText && matchesDate ? 'block' : 'none';
    });
  }

  function setupDateLimits() {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const todayString = today.toISOString().split('T')[0];

    const createDateInput = document.getElementById('noteDate');
    const editDateInput = document.getElementById('editDate');

    if (createDateInput) {
      createDateInput.value = todayString;
      createDateInput.max = todayString;
    }

    if (editDateInput) {
      editDateInput.max = todayString;
    }
  }

  window.editNote = editNote;
  window.runFilters = runFilters;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDateLimits);
  } else {
    setupDateLimits();
  }
})();
