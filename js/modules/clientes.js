/**
 * clientes.js — Módulo de Gerenciamento de Clientes
 * J'mile Essence Care System
 */

const ModuleClientes = {

  render() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h2 class="page-header__title">👥 Clientes</h2>
          <p class="page-header__subtitle">Gerencie o cadastro de clientes da clínica</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" id="btn-add-cliente">
            ＋ Novo Cliente
          </button>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid" id="clientes-stats"></div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar__search">
          <span class="toolbar__search-icon">🔍</span>
          <input type="text" id="search-cliente" class="toolbar__search-input" placeholder="Buscar por nome, email ou celular...">
        </div>
        <select id="filter-status" class="toolbar__filter">
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      <!-- Tabela -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table" id="clientes-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Celular</th>
                <th>Email</th>
                <th>Nascimento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="clientes-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderStats();
    this.renderTable();
    this.bindEvents();
  },

  renderStats() {
    const clientes = Storage.getClientes();
    const ativos   = clientes.filter(c => c.ativo !== false).length;
    const inativos = clientes.length - ativos;

    document.getElementById('clientes-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rose">👥</div>
        <div>
          <div class="stat-card__value">${clientes.length}</div>
          <div class="stat-card__label">Total de Clientes</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">✅</div>
        <div>
          <div class="stat-card__value">${ativos}</div>
          <div class="stat-card__label">Ativos</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--gold">⛔</div>
        <div>
          <div class="stat-card__value">${inativos}</div>
          <div class="stat-card__label">Inativos</div>
        </div>
      </div>
    `;
  },

  renderTable(search = '', filterStatus = 'todos') {
    let clientes = Storage.getClientes();

    if (search) {
      const q = search.toLowerCase();
      clientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(q) ||
        (c.email || '').toLowerCase().includes(q) ||
        (c.celular || '').includes(q)
      );
    }

    if (filterStatus === 'ativo')   clientes = clientes.filter(c => c.ativo !== false);
    if (filterStatus === 'inativo') clientes = clientes.filter(c => c.ativo === false);

    const tbody = document.getElementById('clientes-tbody');
    if (!tbody) return;

    if (clientes.length === 0) {
      tbody.innerHTML = UI.emptyState('👥', 'Nenhum cliente encontrado.', 6);
      return;
    }

    tbody.innerHTML = clientes.map((c, idx) => `
      <tr class="${c.ativo === false ? 'row--inactive' : ''}" style="animation-delay:${idx*30}ms">
        <td>
          <div class="cell-client">
            <div class="cell-client__avatar">${c.nome.charAt(0).toUpperCase()}</div>
            <div>
              <div class="cell-client__name">${Helpers.sanitize(c.nome)}</div>
              <div class="cell-client__email">${Helpers.sanitize(c.email || '—')}</div>
            </div>
          </div>
        </td>
        <td>${Helpers.sanitize(c.celular || '—')}</td>
        <td>${Helpers.sanitize(c.email || '—')}</td>
        <td>${Helpers.formatDate(c.nascimento)}</td>
        <td>
          <span class="badge ${c.ativo === false ? 'badge--inactive' : 'badge--active'}">
            ${c.ativo === false ? '⛔ Inativo' : '✅ Ativo'}
          </span>
        </td>
        <td>
          <div class="td-actions">
            <button class="action-btn action-btn--edit" title="Editar" data-id="${c.id}" data-action="edit">✏️</button>
            <button class="action-btn action-btn--inactive" title="${c.ativo === false ? 'Ativar' : 'Inativar'}" data-id="${c.id}" data-action="toggle">
              ${c.ativo === false ? '✅' : '⛔'}
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  bindEvents() {
    document.getElementById('btn-add-cliente').addEventListener('click', () => this.openForm());

    const searchInput = document.getElementById('search-cliente');
    const filterSelect = document.getElementById('filter-status');

    const refresh = () => this.renderTable(searchInput.value, filterSelect.value);
    searchInput.addEventListener('input', refresh);
    filterSelect.addEventListener('change', refresh);

    // Delegação de eventos na tabela
    document.getElementById('clientes-tbody').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { id, action } = btn.dataset;
      if (action === 'edit')   this.openForm(id);
      if (action === 'toggle') this.toggleStatus(id);
    });
  },

  openForm(id = null) {
    const clientes = Storage.getClientes();
    const cliente  = id ? clientes.find(c => c.id === id) : null;
    const title    = cliente ? 'Editar Cliente' : 'Novo Cliente';

    UI.openModal(title, `
      <form id="form-cliente" novalidate>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Nome completo *</label>
            <input type="text" id="fc-nome" class="form-input" value="${Helpers.sanitize(cliente?.nome || '')}" placeholder="Ex: Ana Clara Silva" required>
            <span class="field-error" id="fc-nome-err">Nome é obrigatório.</span>
          </div>
          <div class="form-field">
            <label>Celular</label>
            <input type="tel" id="fc-celular" class="form-input" value="${Helpers.sanitize(cliente?.celular || '')}" placeholder="(00) 00000-0000">
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>E-mail</label>
            <input type="email" id="fc-email" class="form-input" value="${Helpers.sanitize(cliente?.email || '')}" placeholder="email@exemplo.com">
          </div>
          <div class="form-field">
            <label>Data de nascimento</label>
            <input type="date" id="fc-nascimento" class="form-input" value="${cliente?.nascimento || ''}">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Endereço</label>
            <input type="text" id="fc-endereco" class="form-input" value="${Helpers.sanitize(cliente?.endereco || '')}" placeholder="Rua, número, bairro, cidade">
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Observações</label>
            <textarea id="fc-obs" class="form-textarea" placeholder="Informações adicionais sobre o cliente...">${Helpers.sanitize(cliente?.observacoes || '')}</textarea>
          </div>
        </div>
      </form>
    `, {
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-cliente">💾 Salvar</button>
      `
    });

    // Phone mask
    const celularInput = document.getElementById('fc-celular');
    celularInput.addEventListener('input', () => {
      celularInput.value = Helpers.maskPhone(celularInput.value);
    });

    document.getElementById('btn-save-cliente').addEventListener('click', () => this.saveCliente(id));
  },

  saveCliente(id) {
    const nome = document.getElementById('fc-nome').value.trim();
    const celular = document.getElementById('fc-celular').value.trim();
    const email = document.getElementById('fc-email').value.trim();
    const nascimento = document.getElementById('fc-nascimento').value;
    const endereco = document.getElementById('fc-endereco').value.trim();
    const observacoes = document.getElementById('fc-obs').value.trim();

    // Validação
    const nomeErr = document.getElementById('fc-nome-err');
    const nomeInput = document.getElementById('fc-nome');
    nomeErr.classList.remove('visible');
    nomeInput.classList.remove('error');

    if (!nome) {
      nomeErr.classList.add('visible');
      nomeInput.classList.add('error');
      nomeInput.focus();
      return;
    }

    const clientes = Storage.getClientes();

    if (id) {
      const idx = clientes.findIndex(c => c.id === id);
      if (idx !== -1) {
        clientes[idx] = { ...clientes[idx], nome, celular, email, nascimento, endereco, observacoes };
      }
      UI.toast('Cliente atualizado com sucesso!', 'success');
    } else {
      clientes.push({
        id: Helpers.generateId(),
        nome, celular, email, nascimento, endereco, observacoes,
        ativo: true,
        criadoEm: new Date().toISOString()
      });
      UI.toast('Cliente cadastrado com sucesso!', 'success');
    }

    Storage.setClientes(clientes);
    UI.closeModal();
    this.render();
    if (window.Dashboard) Dashboard.updateBadges();
  },

  toggleStatus(id) {
    const clientes = Storage.getClientes();
    const idx = clientes.findIndex(c => c.id === id);
    if (idx === -1) return;

    const isAtivo = clientes[idx].ativo !== false;
    const acao = isAtivo ? 'inativar' : 'ativar';

    UI.confirm(
      `Deseja ${acao} o cliente <b>${Helpers.sanitize(clientes[idx].nome)}</b>?`,
      () => {
        clientes[idx].ativo = isAtivo ? false : true;
        Storage.setClientes(clientes);
        UI.toast(`Cliente ${isAtivo ? 'inativado' : 'ativado'} com sucesso!`, 'info');
        this.render();
        if (window.Dashboard) Dashboard.updateBadges();
      },
      Helpers.titleCase(acao),
      isAtivo ? 'danger' : 'primary'
    );
  }
};
