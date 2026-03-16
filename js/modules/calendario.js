/**
 * calendario.js — Módulo de Calendário e Agendamentos
 * J'mile Essence Care System
 */

const ModuleCalendario = {
  currentDate: new Date(),
  selectedDate: null,

  render() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h2 class="page-header__title">📅 Calendário</h2>
          <p class="page-header__subtitle">Visualize e gerencie os agendamentos da clínica</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" id="btn-add-agend">＋ Novo Agendamento</button>
        </div>
      </div>

      <div class="stats-grid" id="cal-stats"></div>

      <div class="cal-layout">
        <!-- Calendário -->
        <div class="table-card cal-grid-card">
          <div class="calendar-nav">
            <button class="btn btn--outline btn--sm" id="cal-prev">◀ Anterior</button>
            <div class="calendar-nav__title" id="cal-title"></div>
            <button class="btn btn--outline btn--sm" id="cal-next">Próximo ▶</button>
          </div>
          <div class="calendar-grid" id="cal-grid"></div>
        </div>

        <!-- Painel lateral do dia -->
        <div class="cal-panel-wrap">
          <div class="day-schedule" id="day-panel">
            <div class="day-schedule__header">
              <span id="day-panel-title">Selecione um dia</span>
              <button class="btn btn--primary btn--sm" id="btn-add-day" style="display:none">＋</button>
            </div>
            <div id="day-panel-content">
              <div style="padding:24px; text-align:center; color:var(--subtext); font-size:0.85rem">
                Clique em um dia no calendário
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.renderStats();
    this.buildCalendar();
    this.bindEvents();
  },

  renderStats() {
    const agendamentos = Storage.getAgendamentos();
    const hoje = Helpers.today();
    const hoje_count = agendamentos.filter(a => a.data === hoje).length;
    const mes = hoje.slice(0, 7);
    const mes_count = agendamentos.filter(a => a.data.startsWith(mes)).length;
    const clientes_uniq = new Set(agendamentos.filter(a => a.data.startsWith(mes)).map(a => a.clienteId)).size;

    document.getElementById('cal-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rose">📅</div>
        <div>
          <div class="stat-card__value">${hoje_count}</div>
          <div class="stat-card__label">Agendamentos Hoje</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--gold">📆</div>
        <div>
          <div class="stat-card__value">${mes_count}</div>
          <div class="stat-card__label">No Mês</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">👥</div>
        <div>
          <div class="stat-card__value">${clientes_uniq}</div>
          <div class="stat-card__label">Clientes Atendidos</div>
        </div>
      </div>
    `;
  },

  buildCalendar() {
    const date   = this.currentDate;
    const year   = date.getFullYear();
    const month  = date.getMonth();

    document.getElementById('cal-title').textContent =
      new Date(year, month, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    const agendamentos = Storage.getAgendamentos();
    const clientes     = Storage.getClientes();
    const procs        = Storage.getProcedimentos();

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = Helpers.today();

    const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    let html = DAY_NAMES.map(d => `<div class="calendar-grid__header">${d}</div>`).join('');

    // Dias vazios antes do início do mês
    for (let i = 0; i < firstDay; i++) {
      html += `<div class="calendar-day other-month"></div>`;
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = dateStr === today;
      const dayAgends = agendamentos
        .filter(a => a.data === dateStr)
        .sort((a, b) => a.hora.localeCompare(b.hora));

      const eventsHtml = dayAgends.slice(0, 3).map(a => {
        const cli  = clientes.find(c => c.id === a.clienteId);
        const proc = procs.find(p => p.id === a.procId);
        return `
          <div class="cal-event" data-id="${a.id}">
            <span class="cal-event__time">${Helpers.formatTime(a.hora)}</span>
            ${Helpers.sanitize(cli?.nome?.split(' ')[0] || '—')}
          </div>
        `;
      }).join('');

      const moreCount = dayAgends.length > 3 ? `<small style="color:var(--subtext);font-size:0.65rem">+${dayAgends.length - 3} mais</small>` : '';

      html += `
        <div class="calendar-day${isToday ? ' today' : ''}" data-date="${dateStr}">
          <div class="calendar-day__num">
            ${day}
            ${isToday ? '<span class="calendar-day__today-dot"></span>' : ''}
          </div>
          ${eventsHtml}
          ${moreCount}
        </div>
      `;
    }

    document.getElementById('cal-grid').innerHTML = html;

    // Eventos do calendário
    document.querySelectorAll('.calendar-day:not(.other-month)').forEach(el => {
      el.addEventListener('click', e => {
        if (e.target.closest('.cal-event')) {
          const agId = e.target.closest('.cal-event').dataset.id;
          this.openDayAgendamento(null, agId);
          return;
        }
        this.selectDay(el.dataset.date);
      });
    });
  },

  selectDay(dateStr) {
    this.selectedDate = dateStr;

    document.querySelectorAll('.calendar-day').forEach(el => el.style.outline = '');
    const dayEl = document.querySelector(`.calendar-day[data-date="${dateStr}"]`);
    if (dayEl) dayEl.style.outline = '2px solid var(--rose)';

    const formatted = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long'
    });
    document.getElementById('day-panel-title').textContent = formatted;
    document.getElementById('btn-add-day').style.display = 'inline-flex';

    this.renderDayPanel(dateStr);
  },

  renderDayPanel(dateStr) {
    const agendamentos = Storage.getAgendamentos().filter(a => a.data === dateStr)
      .sort((a, b) => a.hora.localeCompare(b.hora));
    const clientes = Storage.getClientes();
    const procs    = Storage.getProcedimentos();

    const container = document.getElementById('day-panel-content');
    if (agendamentos.length === 0) {
      container.innerHTML = `
        <div style="padding:24px;text-align:center;color:var(--subtext);font-size:0.85rem">
          Nenhum agendamento neste dia.<br>
          <button class="btn btn--primary btn--sm" style="margin-top:12px" onclick="ModuleCalendario.openDayAgendamento('${dateStr}')">
            ＋ Agendar
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = agendamentos.map(a => {
      const cli  = clientes.find(c => c.id === a.clienteId);
      const proc = procs.find(p => p.id === a.procId);
      const fim  = proc ? Helpers.addMinutes(a.hora, proc.duracao || 60) : '—';
      return `
        <div class="schedule-slot">
          <div class="schedule-slot__time">${Helpers.formatTime(a.hora)}</div>
          <div class="schedule-slot__content">
            <div class="schedule-slot__client">${Helpers.sanitize(cli?.nome || '—')}</div>
            <div class="schedule-slot__proc">
              <span class="proc-tag">${Helpers.sanitize(proc?.nome || '—')}</span>
              <small style="margin-left:6px;color:var(--subtext)">até ${fim}</small>
            </div>
            ${a.obs ? `<small style="color:var(--subtext)">${Helpers.sanitize(a.obs)}</small>` : ''}
          </div>
          <div class="schedule-slot__actions">
            <button class="action-btn action-btn--edit" title="Editar" onclick="ModuleCalendario.openDayAgendamento(null,'${a.id}')">✏️</button>
            <button class="action-btn action-btn--delete" title="Excluir" onclick="ModuleCalendario.deleteAgendamento('${a.id}')">🗑️</button>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    document.getElementById('cal-prev').addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
      this.buildCalendar();
    });
    document.getElementById('cal-next').addEventListener('click', () => {
      this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
      this.buildCalendar();
    });
    document.getElementById('btn-add-agend').addEventListener('click', () => this.openDayAgendamento(this.selectedDate || Helpers.today()));
    document.getElementById('btn-add-day').addEventListener('click', () => this.openDayAgendamento(this.selectedDate));
  },

  openDayAgendamento(dateStr, editId = null) {
    const agendamentos = Storage.getAgendamentos();
    const clientes     = Storage.getClientes().filter(c => c.ativo !== false);
    const procs        = Storage.getProcedimentos();
    const agend        = editId ? agendamentos.find(a => a.id === editId) : null;
    const title        = agend ? 'Editar Agendamento' : 'Novo Agendamento';
    const preDate      = agend?.data || dateStr || Helpers.today();

    const slots = Helpers.getTimeSlots();
    const slotOptions = slots.map(s => `<option value="${s}" ${agend?.hora === s ? 'selected' : ''}>${s}</option>`).join('');

    UI.openModal(title, `
      <form id="form-agend" novalidate>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Cliente *</label>
            <select id="fa-cliente" class="form-select">
              <option value="">Selecione...</option>
              ${clientes.map(c => `<option value="${c.id}" ${agend?.clienteId === c.id ? 'selected' : ''}>${Helpers.sanitize(c.nome)}</option>`).join('')}
            </select>
            <span class="field-error" id="fa-cli-err">Selecione um cliente.</span>
          </div>
          <div class="form-field">
            <label>Procedimento *</label>
            <select id="fa-proc" class="form-select">
              <option value="">Selecione...</option>
              ${procs.map(p => `<option value="${p.id}" ${agend?.procId === p.id ? 'selected' : ''}>${Helpers.sanitize(p.nome)} (${p.duracao || 60}min)</option>`).join('')}
            </select>
            <span class="field-error" id="fa-proc-err">Selecione um procedimento.</span>
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Data *</label>
            <input type="date" id="fa-data" class="form-input" value="${preDate}" required>
          </div>
          <div class="form-field">
            <label>Horário *</label>
            <select id="fa-hora" class="form-select">${slotOptions}</select>
          </div>
        </div>
        <div id="fa-conflict" style="display:none; background:rgba(250,204,21,0.12); border:1px solid rgba(250,204,21,0.3); border-radius:8px; padding:10px 14px; font-size:0.82rem; color:var(--warning); margin-bottom:12px">
          ⚠ Conflito de horário detectado. Escolha outro horário.
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Observações</label>
            <textarea id="fa-obs" class="form-textarea" placeholder="Observações sobre o agendamento...">${Helpers.sanitize(agend?.obs || '')}</textarea>
          </div>
        </div>
      </form>
    `, {
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-agend">💾 Salvar</button>
      `
    });

    document.getElementById('btn-save-agend').addEventListener('click', () => this.saveAgendamento(editId));
  },

  saveAgendamento(editId) {
    const clienteId = document.getElementById('fa-cliente').value;
    const procId    = document.getElementById('fa-proc').value;
    const data      = document.getElementById('fa-data').value;
    const hora      = document.getElementById('fa-hora').value;
    const obs       = document.getElementById('fa-obs').value.trim();

    let valid = true;
    if (!clienteId) {
      document.getElementById('fa-cli-err').classList.add('visible');
      document.getElementById('fa-cliente').classList.add('error');
      valid = false;
    }
    if (!procId) {
      document.getElementById('fa-proc-err').classList.add('visible');
      document.getElementById('fa-proc').classList.add('error');
      valid = false;
    }
    if (!valid) return;

    const procs = Storage.getProcedimentos();
    const proc  = procs.find(p => p.id === procId);
    const duracao = proc?.duracao || 60;
    const horaFim = Helpers.addMinutes(hora, duracao);

    // Verifica conflito de horário
    const agendamentos = Storage.getAgendamentos();
    const conflito = agendamentos.some(a => {
      if (a.id === editId) return false;
      if (a.data !== data) return false;
      const p = procs.find(pp => pp.id === a.procId);
      const aFim = Helpers.addMinutes(a.hora, p?.duracao || 60);
      return Helpers.timesOverlap(hora, horaFim, a.hora, aFim);
    });

    if (conflito) {
      document.getElementById('fa-conflict').style.display = 'block';
      return;
    }

    if (editId) {
      const idx = agendamentos.findIndex(a => a.id === editId);
      if (idx !== -1) {
        agendamentos[idx] = { ...agendamentos[idx], clienteId, procId, data, hora, obs };
      }
      UI.toast('Agendamento atualizado!', 'success');
    } else {
      agendamentos.push({
        id: Helpers.generateId(),
        clienteId, procId, data, hora, obs,
        criadoEm: new Date().toISOString()
      });
      UI.toast('Agendamento criado!', 'success');
    }

    Storage.setAgendamentos(agendamentos);
    UI.closeModal();
    this.render();
    if (window.Dashboard) Dashboard.updateBadges();
  },

  deleteAgendamento(id) {
    UI.confirm(
      'Deseja excluir este agendamento?',
      () => {
        const updated = Storage.getAgendamentos().filter(a => a.id !== id);
        Storage.setAgendamentos(updated);
        UI.toast('Agendamento excluído!', 'info');
        this.render();
        if (window.Dashboard) Dashboard.updateBadges();
      },
      'Excluir',
      'danger'
    );
  }
};
