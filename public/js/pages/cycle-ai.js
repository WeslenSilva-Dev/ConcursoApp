(function initCycleAiPanel() {
  const alertBox = document.getElementById('aiCycleAlert');
  const editalList = document.getElementById('aiEditalList');
  const btnGenerate = document.getElementById('btnGenerateAi');
  const btnAddEdital = document.getElementById('aiAddEditalRow');
  const formAi = document.getElementById('aiCycleForm');

  if (!editalList || !btnGenerate || !formAi) return;

  let editalRowCount = 0;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function showAlert(type, message) {
    if (!alertBox) return;
    alertBox.className = `alert alert--${type}`;
    alertBox.textContent = message;
    alertBox.hidden = false;
  }

  function hideAlert() {
    if (!alertBox) return;
    alertBox.hidden = true;
    alertBox.textContent = '';
  }

  function reindexEditalRows() {
    document.querySelectorAll('.ai-edital-row').forEach((row, index) => {
      const num = row.querySelector('.subject-row-num');
      if (num) num.textContent = index + 1;
    });
  }

  function addEditalRow(nome = '', peso = '') {
    const idx = editalRowCount;
    const row = document.createElement('div');
    row.className = 'subject-row ai-edital-row';
    row.id = `ai-er-${idx}`;
    row.innerHTML = `
      <div class="subject-row-num">${editalList.children.length + 1}</div>
      <input
        class="form-input"
        type="text"
        name="aiEditalNome"
        placeholder="Disciplina"
        value="${escapeHtml(nome)}"
        maxlength="100"
        style="flex:1;"
      >
      <div class="subject-row-time">
        <input
          class="form-input form-input--sm"
          type="number"
          name="aiEditalPeso"
          placeholder="Peso"
          value="${escapeHtml(peso)}"
          min="1"
          max="5"
          step="1"
        >
      </div>
      <button type="button" class="btn btn--ghost btn--xs btn--icon" data-remove-ai-edital="${idx}" title="Remover">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    `;
    editalList.appendChild(row);
    editalRowCount += 1;
    reindexEditalRows();
  }

  function removeEditalRow(id) {
    const rows = document.querySelectorAll('.ai-edital-row');
    if (rows.length <= 1) return;
    document.getElementById(id)?.remove();
    reindexEditalRows();
  }

  editalList.addEventListener('click', (event) => {
    const button = event.target.closest('[data-remove-ai-edital]');
    if (!button) return;
    removeEditalRow(`ai-er-${button.getAttribute('data-remove-ai-edital')}`);
  });

  btnAddEdital?.addEventListener('click', () => addEditalRow());

  function collectEdital() {
    const rows = [...document.querySelectorAll('.ai-edital-row')];
    return rows
      .map((row) => {
        const nome = row.querySelector('input[name="aiEditalNome"]')?.value.trim() || '';
        let peso = Number(row.querySelector('input[name="aiEditalPeso"]')?.value);
        if (Number.isFinite(peso)) {
          peso = Math.min(5, Math.max(1, Math.round(peso)));
        }
        return { nome, peso };
      })
      .filter((item) => item.nome && Number.isFinite(item.peso) && item.peso >= 1 && item.peso <= 5);
  }

  formAi.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideAlert();

    const edital = collectEdital();
    const editalText = document.getElementById('aiEditalText')?.value.trim() || '';
    const instrucoesUsuario = document.getElementById('aiInstrucoesUsuario')?.value.trim() || '';
    const fileInput = document.getElementById('aiEditalFile');
    const file = fileInput && fileInput.files && fileInput.files[0] ? fileInput.files[0] : null;

    if (!edital.length && !editalText && !file) {
      showAlert('danger', 'Informe disciplinas com peso, cole texto do edital ou envie um arquivo PDF/TXT.');
      return;
    }

    const horasPorDia = Number(document.getElementById('aiHorasPorDia')?.value);
    const diasPorSemana = Number(document.getElementById('aiDiasPorSemana')?.value);
    const nivel = document.getElementById('aiNivel')?.value || 'intermediario';
    const cycleName = document.getElementById('aiCycleName')?.value.trim() || '';

    const payload = {
      cycleName: cycleName || undefined,
      edital,
      editalText: editalText || undefined,
      instrucoesUsuario: instrucoesUsuario || undefined,
      userConfig: {
        horasPorDia,
        diasPorSemana,
        nivel
      }
    };

    const originalHtml = btnGenerate.innerHTML;
    btnGenerate.disabled = true;
    btnGenerate.innerHTML = '<span class="ai-btn-loading">Gerando...</span>';

    try {
      let res;
      if (file) {
        const fd = new FormData();
        fd.append('cycleName', cycleName);
        fd.append('edital', JSON.stringify(edital));
        fd.append('editalText', editalText);
        fd.append('instrucoesUsuario', instrucoesUsuario);
        fd.append('horasPorDia', String(horasPorDia));
        fd.append('diasPorSemana', String(diasPorSemana));
        fd.append('nivel', nivel);
        fd.append('editalFile', file);
        res = await fetch('/cycles/generate-with-ai', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          body: fd
        });
      } else {
        res = await fetch('/cycles/generate-with-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify(payload)
        });
      }

      if (res.redirected && res.url && res.url.includes('/auth/login')) {
        window.location.href = '/auth/login';
        return;
      }

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = data.error || data.message || 'Nao foi possivel gerar o ciclo.';
        showAlert('danger', typeof msg === 'string' ? msg : 'Erro ao gerar o ciclo.');
        return;
      }

      if (data.success) {
        const id = data.cycle && (data.cycle._id || data.cycle.id);
        showAlert('success', 'Ciclo criado com sucesso. Redirecionando...');
        window.location.href = id ? `/cycles/${id}` : '/cycles';
        return;
      }

      showAlert('danger', 'Resposta inesperada do servidor.');
    } catch (err) {
      console.error(err);
      showAlert('danger', 'Falha de rede. Tente novamente.');
    } finally {
      btnGenerate.disabled = false;
      btnGenerate.innerHTML = originalHtml;
    }
  });

  if (editalList.children.length === 0) {
    addEditalRow();
    addEditalRow();
    addEditalRow();
  }
})();
