/**
 * notificacoes.js — Sistema de Notificações com Sino
 * J'mile Essence Care System
 *
 * Funcionalidades:
 *  - Avisa aniversários do dia / próximos 7 dias
 *  - Lembrete de retorno para clientes sem atendimento há > 30 dias
 *  - Ícone de sino na topbar com badge contador
 *  - Dropdown de notificações ao clicar no sino
 */

const Notificacoes = {

  // ── Configurações ─────────────────────────────────────────
  DIAS_SEM_RETORNO: 30,   // dias sem atendimento para disparar lembrete

  // ── Coleta de Notificações ────────────────────────────────

  /**
   * Retorna lista de clientes com aniversário hoje ou nos próximos 7 dias.
   */
  getAniversariantes() {
    const clientes = Storage.getClientes().filter(c => c.ativo !== false && c.nascimento);
    const hoje = new Date();
    const result = [];

    clientes.forEach(c => {
      const [ano, mes, dia] = c.nascimento.split('-').map(Number);
      const aniversario = new Date(hoje.getFullYear(), mes - 1, dia);

      // Se já passou esse ano, verifica no próximo
      if (aniversario < new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate())) {
        aniversario.setFullYear(hoje.getFullYear() + 1);
      }

      const diffDias = Math.round((aniversario - hoje) / (1000 * 60 * 60 * 24));

      if (diffDias === 0) {
        result.push({ tipo: 'aniversario', urgencia: 'alta', icone: '🎂', cliente: c, diffDias: 0,
          texto: `Aniversário de <b>${Helpers.sanitize(c.nome)}</b> é <b>HOJE!</b> 🎉` });
      } else if (diffDias > 0 && diffDias <= 7) {
        result.push({ tipo: 'aniversario', urgencia: 'media', icone: '🎁', cliente: c, diffDias,
          texto: `Aniversário de <b>${Helpers.sanitize(c.nome)}</b> em <b>${diffDias} dia${diffDias > 1 ? 's' : ''}</b>` });
      }
    });

    return result.sort((a, b) => a.diffDias - b.diffDias);
  },

  /**
   * Retorna clientes sem atendimento há mais de DIAS_SEM_RETORNO dias.
   */
  getLembretesRetorno() {
    const clientes  = Storage.getClientes().filter(c => c.ativo !== false);
    const financeiro = Storage.getFinanceiro();
    const agendamentos = Storage.getAgendamentos();
    const hoje = new Date();
    const limiteMs = this.DIAS_SEM_RETORNO * 24 * 60 * 60 * 1000;
    const result = [];

    clientes.forEach(c => {
      // Pega datas de atendimento (lançamentos financeiros + agendamentos passados)
      const datasFinanceiro = financeiro
        .filter(f => f.clienteId === c.id)
        .map(f => new Date(f.data));
      const datasAgendamento = agendamentos
        .filter(a => a.clienteId === c.id && a.data <= Helpers.today())
        .map(a => new Date(a.data));

      const todasDatas = [...datasFinanceiro, ...datasAgendamento];

      if (todasDatas.length === 0) {
        // Cliente nunca atendido — só notifica se foi cadastrado há mais de 30 dias
        const criado = new Date(c.criadoEm || 0);
        if ((hoje - criado) > limiteMs) {
          result.push({
            tipo: 'retorno', urgencia: 'baixa', icone: '🔁', cliente: c,
            texto: `<b>${Helpers.sanitize(c.nome)}</b> ainda não teve atendimento registrado.`,
            diasSemAtend: null
          });
        }
        return;
      }

      const ultimaData = new Date(Math.max(...todasDatas));
      const diasSem = Math.round((hoje - ultimaData) / (1000 * 60 * 60 * 24));

      if (diasSem >= this.DIAS_SEM_RETORNO) {
        result.push({
          tipo: 'retorno', urgencia: 'baixa', icone: '🔁', cliente: c,
          diasSemAtend: diasSem,
          texto: `<b>${Helpers.sanitize(c.nome)}</b> não é atendida há <b>${diasSem} dias</b>. Hora de um lembrete!`
        });
      }
    });

    return result.sort((a, b) => (b.diasSemAtend || 999) - (a.diasSemAtend || 999));
  },

  /**
   * Retorna todas as notificações combinadas.
   */
  getAll() {
    return [
      ...this.getAniversariantes(),
      ...this.getLembretesRetorno()
    ];
  },

  // ── Renderização do Sino ──────────────────────────────────

  /**
   * Inicializa o sistema: injeta sino na topbar e configura eventos.
   */
  init() {
    this._injectBell();
    this.refresh();

    // Atualiza a cada 5 minutos
    setInterval(() => this.refresh(), 5 * 60 * 1000);
  },

  /**
   * Injeta o ícone do sino na topbar.
   */
  _injectBell() {
    const topbarRight = document.querySelector('.topbar__right');
    if (!topbarRight || document.getElementById('notif-bell')) return;

    const bell = document.createElement('div');
    bell.className = 'notif-bell';
    bell.id = 'notif-bell';
    bell.innerHTML = `
      <button class="notif-bell__btn" id="notif-bell-btn" title="Notificações" aria-label="Notificações">
        <span class="notif-bell__icon">🔔</span>
        <span class="notif-bell__badge" id="notif-badge" style="display:none">0</span>
      </button>
      <div class="notif-dropdown" id="notif-dropdown" style="display:none">
        <div class="notif-dropdown__header">
          <span class="notif-dropdown__title">🔔 Notificações</span>
          <button class="notif-dropdown__close" id="notif-close">✕</button>
        </div>
        <div class="notif-dropdown__list" id="notif-list">
          <div class="notif-empty">Nenhuma notificação no momento</div>
        </div>
      </div>
    `;

    // Insere ANTES da data
    const dateEl = topbarRight.querySelector('#topbar-date');
    topbarRight.insertBefore(bell, dateEl);

    // Eventos
    document.getElementById('notif-bell-btn').addEventListener('click', e => {
      e.stopPropagation();
      this._toggleDropdown();
    });

    document.getElementById('notif-close').addEventListener('click', e => {
      e.stopPropagation();
      this._closeDropdown();
    });

    // Fecha ao clicar fora
    document.addEventListener('click', e => {
      const dropdown = document.getElementById('notif-dropdown');
      const bell = document.getElementById('notif-bell');
      if (dropdown && bell && !bell.contains(e.target)) {
        this._closeDropdown();
      }
    });
  },

  /**
   * Atualiza badge e lista de notificações.
   */
  refresh() {
    const notifs = this.getAll();
    const badge  = document.getElementById('notif-badge');
    const list   = document.getElementById('notif-list');
    const bellBtn = document.getElementById('notif-bell-btn');

    if (!badge) return;

    // Badge
    const count = notifs.length;
    badge.textContent = count > 9 ? '9+' : count;
    badge.style.display = count > 0 ? 'flex' : 'none';
    if (bellBtn) {
      bellBtn.classList.toggle('notif-bell__btn--active', count > 0);
    }

    if (!list) return;

    if (count === 0) {
      list.innerHTML = '<div class="notif-empty">✅ Nenhuma notificação no momento</div>';
      return;
    }

    list.innerHTML = notifs.map(n => `
      <div class="notif-item notif-item--${n.urgencia}" data-tipo="${n.tipo}">
        <div class="notif-item__icon">${n.icone}</div>
        <div class="notif-item__body">
          <div class="notif-item__text">${n.texto}</div>
          ${n.tipo === 'retorno' ? `
            <div class="notif-item__action">
              💬 <em>"Oi ${Helpers.sanitize(n.cliente.nome.split(' ')[0])}! Já faz um tempo desde seu último atendimento, que tal agendar novamente? 💆‍♀️"</em>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  },

  _toggleDropdown() {
    const dd = document.getElementById('notif-dropdown');
    if (!dd) return;
    const isOpen = dd.style.display !== 'none';
    if (isOpen) {
      this._closeDropdown();
    } else {
      dd.style.display = 'block';
      requestAnimationFrame(() => dd.classList.add('notif-dropdown--show'));
    }
  },

  _closeDropdown() {
    const dd = document.getElementById('notif-dropdown');
    if (!dd) return;
    dd.classList.remove('notif-dropdown--show');
    setTimeout(() => { if (dd) dd.style.display = 'none'; }, 220);
  }
};
