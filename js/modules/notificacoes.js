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
   * Injeta o ícone do sino na topbar (usado como atalho).
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
    `;

    // Insere ANTES da data
    const dateEl = topbarRight.querySelector('#topbar-date');
    if (dateEl) {
      topbarRight.insertBefore(bell, dateEl);
    } else {
      topbarRight.appendChild(bell);
    }

    // Navega para aba de Notificações ao clicar
    document.getElementById('notif-bell-btn').addEventListener('click', e => {
      e.preventDefault();
      if (window.Dashboard) Dashboard.navigate('notificacoes');
    });
  },

  /**
   * Atualiza badge da navbar e do sino.
   */
  refresh() {
    const notifs = this.getAll();
    const count = notifs.length;
    
    // Badge do sino na topbar
    const badgeTopbar = document.getElementById('notif-badge');
    const bellBtn = document.getElementById('notif-bell-btn');
    if (badgeTopbar) {
      badgeTopbar.textContent = count > 9 ? '9+' : count;
      badgeTopbar.style.display = count > 0 ? 'flex' : 'none';
    }
    if (bellBtn) {
      bellBtn.classList.toggle('notif-bell__btn--active', count > 0);
    }

    // Badge da Aba Lateral (nav__item)
    if (window.UI) {
      UI.setBadge('notificacoes', count);
    }
  },

  /**
   * Renderiza a página completa de Notificações (Aba)
   */
  renderFullPage() {
    const list = this.getAll();
    let html = `
      <div class="page-header">
        <div>
          <h1 class="page-header__title">Notificações e Avisos</h1>
          <p class="page-header__subtitle">Aniversariantes e lembretes de retorno de clientes</p>
        </div>
      </div>
    `;

    if (list.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state__icon">✅</div>
          <p>Tudo tranquilo! Nenhuma notificação pendente no momento.</p>
        </div>
      `;
    } else {
      html += `<div style="display:flex; flex-direction:column; gap:16px; margin-bottom: 24px;">`;
      list.forEach(n => {
        let telefone = n.cliente.telefone ? n.cliente.telefone.replace(/\\D/g, '') : '';
        let whatsappBtn = telefone ? 
          `<button class="btn btn--primary btn--sm" style="margin-top: 10px;" onclick="window.open('https://wa.me/55${telefone}', '_blank')">📱 Enviar WhatsApp</button>` : 
          `<span class="badge badge--inactive" style="margin-top: 10px;">Sem telefone cadastrado</span>`;

        let colorObj = '';
        if (n.urgencia === 'alta') colorObj = 'rgba(220,38,38,0.1)';
        else if (n.urgencia === 'media') colorObj = 'rgba(198,136,219,0.15)';
        else colorObj = 'rgba(37,99,235,0.1)';

        html += `
          <div class="stat-card" style="align-items:flex-start">
            <div class="stat-card__icon" style="background: ${colorObj}; font-size:24px;">
              ${n.icone}
            </div>
            <div style="flex:1">
              <div style="font-size:1rem; color:var(--text); line-height:1.5; margin-bottom: 4px;">
                ${n.texto}
              </div>
              ${n.tipo === 'retorno' ? `
                <div style="font-size:0.85rem; color:var(--subtext); margin-bottom: 10px;">
                  💬 <em>"Oi ${Helpers.sanitize(n.cliente.nome.split(' ')[0])}! Já faz um tempo desde seu último atendimento, que tal agendar novamente? 💆‍♀️"</em>
                </div>
              ` : ''}
              ${whatsappBtn}
            </div>
          </div>
        `;
      });
      html += `</div>`;
    }

    document.getElementById('content-area').innerHTML = html;
  }
};
