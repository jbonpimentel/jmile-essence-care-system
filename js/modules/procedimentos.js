/**
 * procedimentos.js — Módulo de Procedimentos
 * J'mile Essence Care System
 */

const ModuleProcedimentos = {

  render() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h2 class="page-header__title">✨ Procedimentos</h2>
          <p class="page-header__subtitle">Gerencie os serviços oferecidos pela clínica</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" id="btn-add-proc">＋ Novo Procedimento</button>
        </div>
      </div>

      <div class="stats-grid" id="proc-stats"></div>

      <div class="toolbar">
        <div class="toolbar__search">
          <span class="toolbar__search-icon">🔍</span>
          <input type="text" id="search-proc" class="toolbar__search-input" placeholder="Buscar procedimento...">
        </div>
      </div>

      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table" id="proc-table">
            <thead>
              <tr>
                <th>Procedimento</th>
                <th>Duração</th>
                <th>Valor</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="proc-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderStats();
    this.renderTable();
    this.bindEvents();
  },

  renderStats() {
    const procs = Storage.getProcedimentos();
    const simples   = procs.filter(p => !p.combinado).length;
    const combinados = procs.filter(p => p.combinado).length;
    const media = procs.length > 0
      ? procs.reduce((s, p) => s + Number(p.valor || 0), 0) / procs.length
      : 0;

    document.getElementById('proc-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rose">✨</div>
        <div>
          <div class="stat-card__value">${procs.length}</div>
          <div class="stat-card__label">Total de Procedimentos</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--gold">💆</div>
        <div>
          <div class="stat-card__value">${simples}</div>
          <div class="stat-card__label">Simples</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">🎁</div>
        <div>
          <div class="stat-card__value">${combinados}</div>
          <div class="stat-card__label">Combinados</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">💵</div>
        <div>
          <div class="stat-card__value">${Helpers.formatCurrency(media)}</div>
          <div class="stat-card__label">Ticket Médio</div>
        </div>
      </div>
    `;
  },

  renderTable(search = '') {
    let procs = Storage.getProcedimentos();
    if (search) {
      const q = search.toLowerCase();
      procs = procs.filter(p => p.nome.toLowerCase().includes(q));
    }

    const tbody = document.getElementById('proc-tbody');
    if (!tbody) return;

    if (procs.length === 0) {
      tbody.innerHTML = UI.emptyState('✨', 'Nenhum procedimento cadastrado.', 5);
      return;
    }

    tbody.innerHTML = procs.map((p, idx) => `
      <tr style="animation-delay:${idx*30}ms">
        <td>
          <span style="font-weight:600">${Helpers.sanitize(p.nome)}</span>
          ${p.desconto ? `<br><small style="color:var(--gold)">🏷 Desconto combinado: ${p.desconto}%</small>` : ''}
        </td>
        <td>${p.duracao ? `${p.duracao} min` : '—'}</td>
        <td style="color:var(--success); font-weight:600">${Helpers.formatCurrency(p.valor)}</td>
        <td>
          <span class="badge ${p.combinado ? 'badge--blue' : 'badge--rose'}">
            ${p.combinado ? '🔗 Combinado' : '💆 Simples'}
          </span>
        </td>
        <td>
          <div class="td-actions">
            <button class="action-btn action-btn--edit" title="Editar" data-id="${p.id}" data-action="edit">✏️</button>
            <button class="action-btn action-btn--delete" title="Excluir" data-id="${p.id}" data-action="delete">🗑️</button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  bindEvents() {
    document.getElementById('btn-add-proc').addEventListener('click', () => this.openForm());
    const searchInput = document.getElementById('search-proc');
    searchInput.addEventListener('input', () => this.renderTable(searchInput.value));

    document.getElementById('proc-tbody').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { id, action } = btn.dataset;
      if (action === 'edit')   this.openForm(id);
      if (action === 'delete') this.deleteProc(id);
    });
  },

  openForm(id = null) {
    const procs = Storage.getProcedimentos();
    const proc  = id ? procs.find(p => p.id === id) : null;
    const title = proc ? 'Editar Procedimento' : 'Novo Procedimento';
    const isCombinado = proc?.combinado || false;

    // Opções de procedimentos simples para combinar
    const simplesProcs = procs.filter(p => !p.combinado && p.id !== id);

    UI.openModal(title, `
      <form id="form-proc" novalidate>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Nome do Procedimento *</label>
            <input type="text" id="fp-nome" class="form-input" value="${Helpers.sanitize(proc?.nome || '')}" placeholder="Ex: Sobrancelha Design" required>
            <span class="field-error" id="fp-nome-err">Nome é obrigatório.</span>
          </div>
          <div class="form-field">
            <label>Duração (minutos)</label>
            <input type="number" id="fp-duracao" class="form-input" value="${proc?.duracao || ''}" placeholder="60" min="5" step="5">
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Valor (R$) *</label>
            <input type="number" id="fp-valor" class="form-input" value="${proc?.valor || ''}" placeholder="0,00" min="0" step="0.01" required>
            <span class="field-error" id="fp-valor-err">Valor é obrigatório.</span>
          </div>
          <div class="form-field">
            <label>Tipo</label>
            <select id="fp-tipo" class="form-select">
              <option value="simples" ${!isCombinado ? 'selected' : ''}>💆 Simples</option>
              <option value="combinado" ${isCombinado ? 'selected' : ''}>🔗 Combinado</option>
            </select>
          </div>
        </div>

        <!-- Seção combinado (mostrada/escondida via JS) -->
        <div id="combinado-section" style="display:${isCombinado ? 'block' : 'none'}">
          <div class="form-row form-row--2">
            <div class="form-field">
              <label>Procedimento 1 *</label>
              <select id="fp-proc1" class="form-select">
                <option value="">Selecione...</option>
                ${simplesProcs.map(p => `<option value="${p.id}" ${proc?.proc1 === p.id ? 'selected' : ''}>${Helpers.sanitize(p.nome)}</option>`).join('')}
              </select>
            </div>
            <div class="form-field">
              <label>Procedimento 2 *</label>
              <select id="fp-proc2" class="form-select">
                <option value="">Selecione...</option>
                ${simplesProcs.map(p => `<option value="${p.id}" ${proc?.proc2 === p.id ? 'selected' : ''}>${Helpers.sanitize(p.nome)}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Desconto para combinado (%)</label>
              <input type="number" id="fp-desconto" class="form-input" value="${proc?.desconto || ''}" placeholder="10" min="0" max="100">
              <span class="field-hint">O desconto é aplicado automaticamente no financeiro</span>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Descrição</label>
            <textarea id="fp-desc" class="form-textarea" placeholder="Descrição do procedimento...">${Helpers.sanitize(proc?.descricao || '')}</textarea>
          </div>
        </div>
      </form>
    `, {
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-proc">💾 Salvar</button>
      `
    });

    // Toggle seção combinado
    document.getElementById('fp-tipo').addEventListener('change', e => {
      document.getElementById('combinado-section').style.display =
        e.target.value === 'combinado' ? 'block' : 'none';
    });

    // Auto-calcula valor para combinado
    const calcCombinado = () => {
      const p1id = document.getElementById('fp-proc1')?.value;
      const p2id = document.getElementById('fp-proc2')?.value;
      const desconto = Number(document.getElementById('fp-desconto')?.value || 0);
      if (!p1id || !p2id) return;
      const p1 = procs.find(p => p.id === p1id);
      const p2 = procs.find(p => p.id === p2id);
      if (!p1 || !p2) return;
      const total = (Number(p1.valor) + Number(p2.valor)) * (1 - desconto / 100);
      document.getElementById('fp-valor').value = total.toFixed(2);

      // Duração total
      const dur = (Number(p1.duracao || 0) + Number(p2.duracao || 0));
      document.getElementById('fp-duracao').value = dur;
    };

    ['fp-proc1', 'fp-proc2', 'fp-desconto'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', calcCombinado);
    });

    document.getElementById('btn-save-proc').addEventListener('click', () => this.saveProc(id));
  },

  saveProc(id) {
    const nome     = document.getElementById('fp-nome').value.trim();
    const duracao  = document.getElementById('fp-duracao').value;
    const valor    = document.getElementById('fp-valor').value;
    const tipo     = document.getElementById('fp-tipo').value;
    const descricao = document.getElementById('fp-desc').value.trim();
    const proc1    = document.getElementById('fp-proc1')?.value || null;
    const proc2    = document.getElementById('fp-proc2')?.value || null;
    const desconto = document.getElementById('fp-desconto')?.value || 0;

    // Validação
    let valid = true;
    ['fp-nome', 'fp-valor'].forEach(fid => {
      const el = document.getElementById(fid);
      const errEl = document.getElementById(fid + '-err');
      if (!el.value.trim()) {
        el.classList.add('error');
        errEl.classList.add('visible');
        valid = false;
      } else {
        el.classList.remove('error');
        errEl.classList.remove('visible');
      }
    });
    if (!valid) return;

    const procs = Storage.getProcedimentos();
    const combinado = tipo === 'combinado';

    if (id) {
      const idx = procs.findIndex(p => p.id === id);
      if (idx !== -1) {
        procs[idx] = { ...procs[idx], nome, duracao: Number(duracao), valor: Number(valor), combinado, proc1, proc2, desconto: Number(desconto), descricao };
      }
      UI.toast('Procedimento atualizado!', 'success');
    } else {
      procs.push({
        id: Helpers.generateId(),
        nome, duracao: Number(duracao), valor: Number(valor),
        combinado, proc1, proc2, desconto: Number(desconto), descricao,
        criadoEm: new Date().toISOString()
      });
      UI.toast('Procedimento cadastrado!', 'success');
    }

    Storage.setProcedimentos(procs);
    UI.closeModal();
    this.render();
  },

  deleteProc(id) {
    const procs = Storage.getProcedimentos();
    const proc  = procs.find(p => p.id === id);
    if (!proc) return;

    UI.confirm(
      `Deseja excluir o procedimento <b>${Helpers.sanitize(proc.nome)}</b>? Esta ação não pode ser desfeita.`,
      () => {
        const updated = procs.filter(p => p.id !== id);
        Storage.setProcedimentos(updated);
        UI.toast('Procedimento excluído!', 'info');
        this.render();
      },
      'Excluir',
      'danger'
    );
  }
};
