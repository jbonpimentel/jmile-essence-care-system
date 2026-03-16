/**
 * contas.js — Módulo de Gerenciamento de Contas
 * J'mile Essence Care System
 */

const ModuleContas = {

  render() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h2 class="page-header__title">⚙️ Gerenciamento de Conta</h2>
          <p class="page-header__subtitle">Administre os usuários do sistema</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" id="btn-add-usuario">＋ Novo Usuário</button>
        </div>
      </div>

      <div class="stats-grid" id="contas-stats"></div>

      <!-- Perfil do usuário logado -->
      <div class="table-card" style="padding:24px; margin-bottom:20px" id="minha-conta-card">
        <h3 style="font-size:1rem; margin-bottom:16px; color:var(--text)">🔑 Minha Conta</h3>
        <div id="minha-conta-content"></div>
      </div>

      <!-- Tabela de usuários -->
      <h3 style="font-size:1rem; margin-bottom:12px; color:var(--text-2)">Todos os Usuários</h3>
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Login</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="contas-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderStats();
    this.renderMinhaConta();
    this.renderTable();
    this.bindEvents();
  },

  renderStats() {
    const usuarios = Storage.getUsuarios();
    const ativos   = usuarios.filter(u => u.ativo !== false).length;

    document.getElementById('contas-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rose">👤</div>
        <div>
          <div class="stat-card__value">${usuarios.length}</div>
          <div class="stat-card__label">Total de Usuários</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">✅</div>
        <div>
          <div class="stat-card__value">${ativos}</div>
          <div class="stat-card__label">Usuários Ativos</div>
        </div>
      </div>
    `;
  },

  renderMinhaConta() {
    const sessao = Storage.getSessao();
    const usuarios = Storage.getUsuarios();
    const eu = usuarios.find(u => u.id === sessao.id);

    document.getElementById('minha-conta-content').innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; align-items:center">
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--subtext); margin-bottom:4px">Nome</div>
          <div style="font-weight:600">${Helpers.sanitize(eu?.nome || sessao.nome)}</div>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--subtext); margin-bottom:4px">Login</div>
          <div>${Helpers.sanitize(eu?.usuario || sessao.usuario)}</div>
        </div>
        <div>
          <div style="font-size:0.72rem; text-transform:uppercase; letter-spacing:0.08em; color:var(--subtext); margin-bottom:4px">Perfil</div>
          <div><span class="badge badge--rose">${eu?.perfil === 'admin' ? '🛡 Administrador' : '👤 Operador'}</span></div>
        </div>
      </div>
      <div style="margin-top:16px">
        <button class="btn btn--outline btn--sm" id="btn-alterar-senha">🔑 Alterar Senha</button>
      </div>
    `;

    document.getElementById('btn-alterar-senha').addEventListener('click', () => {
      this.openAlterarSenha(sessao.id);
    });
  },

  renderTable() {
    const tbody    = document.getElementById('contas-tbody');
    const sessao   = Storage.getSessao();
    const usuarios = Storage.getUsuarios();

    if (usuarios.length === 0) {
      tbody.innerHTML = UI.emptyState('👤', 'Nenhum usuário encontrado.', 5);
      return;
    }

    tbody.innerHTML = usuarios.map((u, idx) => `
      <tr class="${u.ativo === false ? 'row--inactive' : ''}" style="animation-delay:${idx*30}ms">
        <td>
          <div class="cell-client">
            <div class="cell-client__avatar">${u.nome.charAt(0).toUpperCase()}</div>
            <div class="cell-client__name">${Helpers.sanitize(u.nome)}</div>
          </div>
        </td>
        <td>${Helpers.sanitize(u.usuario)}</td>
        <td>
          <span class="badge ${u.perfil === 'admin' ? 'badge--rose' : 'badge--blue'}">
            ${u.perfil === 'admin' ? '🛡 Admin' : '👤 Operador'}
          </span>
        </td>
        <td>
          <span class="badge ${u.ativo === false ? 'badge--inactive' : 'badge--active'}">
            ${u.ativo === false ? '⛔ Inativo' : '✅ Ativo'}
          </span>
        </td>
        <td>
          <div class="td-actions">
            <button class="action-btn action-btn--edit" title="Editar" data-id="${u.id}" data-action="edit">✏️</button>
            ${u.id !== sessao.id ? `
              <button class="action-btn action-btn--inactive" title="${u.ativo === false ? 'Ativar' : 'Inativar'}" data-id="${u.id}" data-action="toggle">
                ${u.ativo === false ? '✅' : '⛔'}
              </button>
              <button class="action-btn action-btn--delete" title="Excluir" data-id="${u.id}" data-action="delete">🗑️</button>
            ` : ''}
          </div>
        </td>
      </tr>
    `).join('');
  },

  bindEvents() {
    document.getElementById('btn-add-usuario').addEventListener('click', () => this.openForm());
    document.getElementById('contas-tbody').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { id, action } = btn.dataset;
      if (action === 'edit')   this.openForm(id);
      if (action === 'toggle') this.toggleStatus(id);
      if (action === 'delete') this.deleteUsuario(id);
    });
  },

  openForm(id = null) {
    const usuarios = Storage.getUsuarios();
    const u        = id ? usuarios.find(u => u.id === id) : null;
    const title    = u ? 'Editar Usuário' : 'Novo Usuário';

    UI.openModal(title, `
      <form id="form-conta" novalidate>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Nome completo *</label>
            <input type="text" id="fu-nome" class="form-input" value="${Helpers.sanitize(u?.nome || '')}" placeholder="Nome do usuário" required>
            <span class="field-error" id="fu-nome-err">Nome é obrigatório.</span>
          </div>
          <div class="form-field">
            <label>Perfil</label>
            <select id="fu-perfil" class="form-select">
              <option value="admin"    ${u?.perfil === 'admin'    ? 'selected' : ''}>🛡 Administrador</option>
              <option value="operador" ${u?.perfil === 'operador' ? 'selected' : ''}>👤 Operador</option>
            </select>
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Usuário (login) *</label>
            <input type="text" id="fu-usuario" class="form-input" value="${Helpers.sanitize(u?.usuario || '')}" placeholder="nome.usuario" required autocomplete="off">
            <span class="field-error" id="fu-usuario-err">Login é obrigatório.</span>
          </div>
          <div class="form-field">
            <label>${id ? 'Nova senha (deixe em branco para manter)' : 'Senha *'}</label>
            <input type="password" id="fu-senha" class="form-input" placeholder="••••••••" autocomplete="new-password">
            <span class="field-error" id="fu-senha-err">Senha é obrigatória.</span>
          </div>
        </div>
      </form>
    `, {
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-usuario">💾 Salvar</button>
      `
    });

    document.getElementById('btn-save-usuario').addEventListener('click', () => this.saveUsuario(id));
  },

  saveUsuario(id) {
    const nome    = document.getElementById('fu-nome').value.trim();
    const usuario = document.getElementById('fu-usuario').value.trim().toLowerCase();
    const senha   = document.getElementById('fu-senha').value;
    const perfil  = document.getElementById('fu-perfil').value;

    let valid = true;
    if (!nome) {
      document.getElementById('fu-nome').classList.add('error');
      document.getElementById('fu-nome-err').classList.add('visible');
      valid = false;
    }
    if (!usuario) {
      document.getElementById('fu-usuario').classList.add('error');
      document.getElementById('fu-usuario-err').classList.add('visible');
      valid = false;
    }
    if (!id && !senha) {
      document.getElementById('fu-senha').classList.add('error');
      document.getElementById('fu-senha-err').classList.add('visible');
      valid = false;
    }
    if (!valid) return;

    const usuarios = Storage.getUsuarios();

    if (id) {
      const idx = usuarios.findIndex(u => u.id === id);
      if (idx !== -1) {
        usuarios[idx].nome    = nome;
        usuarios[idx].usuario = usuario;
        usuarios[idx].perfil  = perfil;
        if (senha) usuarios[idx].senha = senha;
      }
      UI.toast('Usuário atualizado!', 'success');
    } else {
      // Verifica duplicidade de login
      if (usuarios.find(u => u.usuario === usuario)) {
        UI.toast('Já existe um usuário com este login!', 'error');
        return;
      }
      usuarios.push({
        id: Helpers.generateId(),
        nome, usuario, senha, perfil, ativo: true,
        criadoEm: new Date().toISOString()
      });
      UI.toast('Usuário criado!', 'success');
    }

    Storage.setUsuarios(usuarios);
    UI.closeModal();
    this.render();
  },

  openAlterarSenha(id) {
    UI.openModal('Alterar Senha', `
      <form id="form-senha" novalidate>
        <div class="form-field" style="margin-bottom:16px">
          <label>Senha atual *</label>
          <input type="password" id="fs-atual" class="form-input" placeholder="••••••••">
          <span class="field-error" id="fs-atual-err">Senha atual incorreta.</span>
        </div>
        <div class="form-field" style="margin-bottom:16px">
          <label>Nova senha *</label>
          <input type="password" id="fs-nova" class="form-input" placeholder="••••••••">
          <span class="field-error" id="fs-nova-err">Nova senha é obrigatória.</span>
        </div>
        <div class="form-field">
          <label>Confirmar nova senha *</label>
          <input type="password" id="fs-confirma" class="form-input" placeholder="••••••••">
          <span class="field-error" id="fs-confirma-err">As senhas não coincidem.</span>
        </div>
      </form>
    `, {
      size: 'sm',
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-senha">🔑 Alterar</button>
      `
    });

    document.getElementById('btn-save-senha').addEventListener('click', () => {
      const atual    = document.getElementById('fs-atual').value;
      const nova     = document.getElementById('fs-nova').value;
      const confirma = document.getElementById('fs-confirma').value;

      const usuarios = Storage.getUsuarios();
      const u = usuarios.find(u => u.id === id);

      let valid = true;
      if (!u || u.senha !== atual) {
        document.getElementById('fs-atual').classList.add('error');
        document.getElementById('fs-atual-err').classList.add('visible');
        valid = false;
      }
      if (!nova) {
        document.getElementById('fs-nova').classList.add('error');
        document.getElementById('fs-nova-err').classList.add('visible');
        valid = false;
      }
      if (nova !== confirma) {
        document.getElementById('fs-confirma').classList.add('error');
        document.getElementById('fs-confirma-err').classList.add('visible');
        valid = false;
      }
      if (!valid) return;

      const idx = usuarios.findIndex(u => u.id === id);
      usuarios[idx].senha = nova;
      Storage.setUsuarios(usuarios);
      UI.closeModal();
      UI.toast('Senha alterada com sucesso!', 'success');
    });
  },

  toggleStatus(id) {
    const usuarios = Storage.getUsuarios();
    const u = usuarios.find(u => u.id === id);
    if (!u) return;
    const isAtivo = u.ativo !== false;

    UI.confirm(
      `Deseja ${isAtivo ? 'inativar' : 'ativar'} o usuário <b>${Helpers.sanitize(u.nome)}</b>?`,
      () => {
        u.ativo = !isAtivo;
        Storage.setUsuarios(usuarios);
        UI.toast(`Usuário ${isAtivo ? 'inativado' : 'ativado'}!`, 'info');
        this.render();
      },
      isAtivo ? 'Inativar' : 'Ativar',
      isAtivo ? 'danger' : 'primary'
    );
  },

  deleteUsuario(id) {
    const usuarios = Storage.getUsuarios();
    const u = usuarios.find(u => u.id === id);
    if (!u) return;

    UI.confirm(
      `Deseja excluir o usuário <b>${Helpers.sanitize(u.nome)}</b>? Esta ação não pode ser desfeita.`,
      () => {
        Storage.setUsuarios(usuarios.filter(u => u.id !== id));
        UI.toast('Usuário excluído!', 'info');
        this.render();
      },
      'Excluir',
      'danger'
    );
  }
};
