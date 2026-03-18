/**
 * financeiro.js — Módulo Financeiro com Cálculo de Taxas
 * J'mile Essence Care System
 */

const ModuleFinanceiro = {

  render() {
    const area = document.getElementById('content-area');
    area.innerHTML = `
      <div class="page-header">
        <div class="page-header__info">
          <h2 class="page-header__title">💰 Financeiro</h2>
          <p class="page-header__subtitle">Controle de receitas e formas de pagamento</p>
        </div>
        <div class="page-header__actions">
          <button class="btn btn--primary" id="btn-add-lancamento">＋ Novo Lançamento</button>
        </div>
      </div>

      <!-- Totais por período -->
      <div class="finance-summary" id="fin-summary"></div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar__search">
          <span class="toolbar__search-icon">🔍</span>
          <input type="text" id="search-fin" class="toolbar__search-input" placeholder="Buscar por cliente ou procedimento...">
        </div>
        <input type="date" id="filter-data-inicio" class="toolbar__filter" title="Data inicial">
        <input type="date" id="filter-data-fim" class="toolbar__filter" title="Data final">
        <select id="filter-pagamento" class="toolbar__filter">
          <option value="todos">Todas as formas</option>
          <option value="pix">Pix</option>
          <option value="credito">Maquininha Crédito</option>
          <option value="debito">Maquininha Débito</option>
          <option value="dinheiro">Dinheiro</option>
        </select>
        <button class="btn btn--outline" id="btn-limpar-filtro">Limpar</button>
      </div>

      <!-- Totais por método de pagamento -->
      <div class="stats-grid" id="fin-stats"></div>

      <!-- Tabela -->
      <div class="table-card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Cliente</th>
                <th>Procedimento</th>
                <th>Pagamento</th>
                <th>Valor Bruto</th>
                <th>Valor Líquido</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody id="fin-tbody"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderAll();
    this.bindEvents();
  },

  getFiltered() {
    let financeiro = Storage.getFinanceiro();
    const search   = document.getElementById('search-fin')?.value.toLowerCase() || '';
    const inicio   = document.getElementById('filter-data-inicio')?.value || '';
    const fim      = document.getElementById('filter-data-fim')?.value || '';
    const pagto    = document.getElementById('filter-pagamento')?.value || 'todos';
    const clientes = Storage.getClientes();
    const procs    = Storage.getProcedimentos();

    if (search) {
      financeiro = financeiro.filter(f => {
        const cli  = clientes.find(c => c.id === f.clienteId);
        const proc = procs.find(p => p.id === f.procId);
        return (cli?.nome || '').toLowerCase().includes(search) ||
               (proc?.nome || '').toLowerCase().includes(search);
      });
    }

    if (inicio) financeiro = financeiro.filter(f => f.data >= inicio);
    if (fim)    financeiro = financeiro.filter(f => f.data <= fim);
    if (pagto !== 'todos') financeiro = financeiro.filter(f => f.pagamento === pagto);

    return { financeiro, clientes, procs };
  },

  renderAll() {
    const { financeiro, clientes, procs } = this.getFiltered();
    this.renderSummary(financeiro);
    this.renderStats(financeiro);
    this.renderTable(financeiro, clientes, procs);
  },

  renderSummary(financeiro) {
    const hoje = Helpers.today();
    const mes  = hoje.slice(0, 7);

    // Usa valor líquido quando disponível, senão valor bruto
    const getLiquido = f => Number(f.valorLiquido != null ? f.valorLiquido : f.valor || 0);

    const totalHoje  = financeiro.filter(f => f.data === hoje).reduce((s, f) => s + getLiquido(f), 0);
    const totalMes   = financeiro.filter(f => f.data.startsWith(mes)).reduce((s, f) => s + getLiquido(f), 0);
    const totalGeral = financeiro.reduce((s, f) => s + getLiquido(f), 0);

    document.getElementById('fin-summary').innerHTML = `
      <div class="finance-summary__card">
        <div class="finance-summary__label">Líquido Hoje</div>
        <div class="finance-summary__value">${Helpers.formatCurrency(totalHoje)}</div>
      </div>
      <div class="finance-summary__card">
        <div class="finance-summary__label">Líquido do Mês</div>
        <div class="finance-summary__value">${Helpers.formatCurrency(totalMes)}</div>
      </div>
      <div class="finance-summary__card total">
        <div class="finance-summary__label">Total Líquido (Filtrado)</div>
        <div class="finance-summary__value">${Helpers.formatCurrency(totalGeral)}</div>
      </div>
      <div class="finance-summary__card">
        <div class="finance-summary__label">Qtd. Lançamentos</div>
        <div class="finance-summary__value">${financeiro.length}</div>
      </div>
    `;
  },

  renderStats(financeiro) {
    const totais = { pix: 0, credito: 0, debito: 0, dinheiro: 0 };
    const getLiquido = f => Number(f.valorLiquido != null ? f.valorLiquido : f.valor || 0);
    financeiro.forEach(f => {
      if (totais[f.pagamento] !== undefined) totais[f.pagamento] += getLiquido(f);
    });

    document.getElementById('fin-stats').innerHTML = `
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--green">💚</div>
        <div>
          <div class="stat-card__value">${Helpers.formatCurrency(totais.pix)}</div>
          <div class="stat-card__label">Pix</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--rose">💳</div>
        <div>
          <div class="stat-card__value">${Helpers.formatCurrency(totais.credito)}</div>
          <div class="stat-card__label">Maquininha Crédito</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--blue">💳</div>
        <div>
          <div class="stat-card__value">${Helpers.formatCurrency(totais.debito)}</div>
          <div class="stat-card__label">Maquininha Débito</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-card__icon stat-card__icon--gold">💵</div>
        <div>
          <div class="stat-card__value">${Helpers.formatCurrency(totais.dinheiro)}</div>
          <div class="stat-card__label">Dinheiro</div>
        </div>
      </div>
    `;
  },

  renderTable(financeiro, clientes, procs) {
    const tbody = document.getElementById('fin-tbody');
    if (!tbody) return;

    const sorted = [...financeiro].sort((a, b) => b.data.localeCompare(a.data));

    if (sorted.length === 0) {
      tbody.innerHTML = UI.emptyState('💰', 'Nenhum lançamento encontrado.', 7);
      return;
    }

    const payLabels = {
      pix:      '💚 Pix',
      credito:  '💳 Crédito',
      debito:   '💳 Débito',
      dinheiro: '💵 Dinheiro'
    };
    const payClass = {
      pix:      'pay-pix',
      credito:  'pay-credit',
      debito:   'pay-debit',
      dinheiro: 'badge--gold'
    };

    tbody.innerHTML = sorted.map((f, idx) => {
      const cli  = clientes.find(c => c.id === f.clienteId);
      const proc = procs.find(p => p.id === f.procId);
      const liquido = f.valorLiquido != null ? f.valorLiquido : f.valor;
      const bruto   = f.valorBruto   != null ? f.valorBruto   : f.valor;
      const temTaxa = f.taxaAplicada > 0;
      return `
        <tr style="animation-delay:${idx*25}ms">
          <td>${Helpers.formatDate(f.data)}</td>
          <td>
            <div class="cell-client">
              <div class="cell-client__avatar">${(cli?.nome || '?').charAt(0)}</div>
              <div class="cell-client__name">${Helpers.sanitize(cli?.nome || '—')}</div>
            </div>
          </td>
          <td><span class="proc-tag">${Helpers.sanitize(proc?.nome || '—')}</span></td>
          <td><span class="badge ${payClass[f.pagamento] || ''}">${payLabels[f.pagamento] || f.pagamento}</span></td>
          <td style="color:var(--text-muted);font-weight:600">${Helpers.formatCurrency(bruto)}</td>
          <td style="color:var(--success);font-weight:700">
            ${Helpers.formatCurrency(liquido)}
            ${temTaxa ? `<span class="taxa-badge" title="Taxa ${f.taxaAplicada}%">-${f.taxaAplicada}%</span>` : ''}
          </td>
          <td>
            <div class="td-actions">
              <button class="action-btn action-btn--edit" title="Editar" data-id="${f.id}" data-action="edit">✏️</button>
              <button class="action-btn action-btn--delete" title="Excluir" data-id="${f.id}" data-action="delete">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  },

  bindEvents() {
    document.getElementById('btn-add-lancamento').addEventListener('click', () => this.openForm());

    ['search-fin', 'filter-data-inicio', 'filter-data-fim', 'filter-pagamento'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.renderAll());
      if (el) el.addEventListener('change', () => this.renderAll());
    });

    document.getElementById('btn-limpar-filtro').addEventListener('click', () => {
      document.getElementById('search-fin').value = '';
      document.getElementById('filter-data-inicio').value = '';
      document.getElementById('filter-data-fim').value = '';
      document.getElementById('filter-pagamento').value = 'todos';
      this.renderAll();
    });

    document.getElementById('fin-tbody').addEventListener('click', e => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { id, action } = btn.dataset;
      if (action === 'edit')   this.openForm(id);
      if (action === 'delete') this.deleteLancamento(id);
    });
  },

  openForm(id = null) {
    const financeiro = Storage.getFinanceiro();
    const lance      = id ? financeiro.find(f => f.id === id) : null;
    const title      = lance ? 'Editar Lançamento' : 'Novo Lançamento';
    const clientes   = Storage.getClientes().filter(c => c.ativo !== false);
    const procs      = Storage.getProcedimentos();
    const config     = Storage.getConfig();

    UI.openModal(title, `
      <form id="form-fin" novalidate>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Cliente *</label>
            <select id="ff-cliente" class="form-select">
              <option value="">Selecione...</option>
              ${clientes.map(c => `<option value="${c.id}" ${lance?.clienteId === c.id ? 'selected' : ''}>${Helpers.sanitize(c.nome)}</option>`).join('')}
            </select>
            <span class="field-error" id="ff-cli-err">Selecione um cliente.</span>
          </div>
          <div class="form-field">
            <label>Procedimento</label>
            <select id="ff-proc" class="form-select">
              <option value="">Selecione...</option>
              ${procs.map(p => `<option value="${p.id}" ${lance?.procId === p.id ? 'selected' : ''}>${Helpers.sanitize(p.nome)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-row form-row--2">
          <div class="form-field">
            <label>Data *</label>
            <input type="date" id="ff-data" class="form-input" value="${lance?.data || Helpers.today()}">
          </div>
          <div class="form-field">
            <label>Forma de Pagamento *</label>
            <select id="ff-pagamento" class="form-select">
              <option value="pix"      ${(lance?.pagamento || 'pix') === 'pix'      ? 'selected' : ''}>💚 Pix</option>
              <option value="credito"  ${lance?.pagamento === 'credito'  ? 'selected' : ''}>💳 Maquininha Crédito (${config.taxaCredito}%)</option>
              <option value="debito"   ${lance?.pagamento === 'debito'   ? 'selected' : ''}>💳 Maquininha Débito (${config.taxaDebito}%)</option>
              <option value="dinheiro" ${lance?.pagamento === 'dinheiro' ? 'selected' : ''}>💵 Dinheiro</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <label>Valor Bruto (R$) *</label>
            <input type="number" id="ff-valor" class="form-input" value="${lance?.valorBruto || lance?.valor || ''}" step="0.01" min="0" placeholder="0,00">
            <span class="field-error" id="ff-valor-err">Informe o valor.</span>
          </div>
        </div>

        <!-- Resumo de Cálculo -->
        <div class="calc-summary" id="calc-summary" style="display:none">
          <div class="calc-summary__title">📊 Resumo do Lançamento</div>
          <div class="calc-summary__grid">
            <div class="calc-row">
              <span class="calc-label">Valor bruto</span>
              <span class="calc-value" id="calc-bruto">—</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Desconto <span id="calc-desc-pct">(30%)</span></span>
              <span class="calc-value calc-value--minus" id="calc-desc-val">—</span>
            </div>
            <div class="calc-row">
              <span class="calc-label">Após desconto</span>
              <span class="calc-value" id="calc-apos-desc">—</span>
            </div>
            <div class="calc-row" id="calc-taxa-row" style="display:none">
              <span class="calc-label">Taxa maquininha <span id="calc-taxa-pct"></span></span>
              <span class="calc-value calc-value--minus" id="calc-taxa-val">—</span>
            </div>
            <div class="calc-row calc-row--total">
              <span class="calc-label">💚 Você recebe</span>
              <span class="calc-value calc-value--liquido" id="calc-liquido">—</span>
            </div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Observações</label>
            <textarea id="ff-obs" class="form-textarea" placeholder="Observações...">${Helpers.sanitize(lance?.obs || '')}</textarea>
          </div>
        </div>
      </form>
    `, {
      footerHTML: `
        <button class="btn btn--outline" onclick="UI.closeModal()">Cancelar</button>
        <button class="btn btn--primary" id="btn-save-lancamento">💾 Salvar</button>
      `
    });

    // Auto-preenche valor ao selecionar procedimento
    document.getElementById('ff-proc').addEventListener('change', e => {
      const proc = procs.find(p => p.id === e.target.value);
      if (proc && !document.getElementById('ff-valor').value) {
        document.getElementById('ff-valor').value = proc.valor;
        this._updateCalc();
      }
    });

    // Atualiza cálculo ao mudar valor ou pagamento
    document.getElementById('ff-valor').addEventListener('input', () => this._updateCalc());
    document.getElementById('ff-pagamento').addEventListener('change', () => this._updateCalc());

    // Se editando, exibe cálculo do valor existente
    if (lance) this._updateCalc();

    document.getElementById('btn-save-lancamento').addEventListener('click', () => this.saveLancamento(id));
  },

  /** Atualiza o painel de resumo de cálculo em tempo real */
  _updateCalc() {
    const valorEl = document.getElementById('ff-valor');
    const pagamentoEl = document.getElementById('ff-pagamento');
    const summaryEl = document.getElementById('calc-summary');
    if (!valorEl || !pagamentoEl || !summaryEl) return;

    const bruto = parseFloat(valorEl.value);
    if (!bruto || bruto <= 0) {
      summaryEl.style.display = 'none';
      return;
    }

    const tipoPagamento = pagamentoEl.value;
    const calc = Helpers.calcValorLiquido(bruto, tipoPagamento);

    summaryEl.style.display = 'block';

    document.getElementById('calc-bruto').textContent      = Helpers.formatCurrency(calc.bruto);
    document.getElementById('calc-desc-pct').textContent   = `(${calc.descontoPct}%)`;
    document.getElementById('calc-desc-val').textContent   = '− ' + Helpers.formatCurrency(calc.bruto - calc.comDesconto);
    document.getElementById('calc-apos-desc').textContent  = Helpers.formatCurrency(calc.comDesconto);
    document.getElementById('calc-liquido').textContent    = Helpers.formatCurrency(calc.liquido);

    const taxaRow = document.getElementById('calc-taxa-row');
    if (calc.taxaPct > 0) {
      taxaRow.style.display = '';
      document.getElementById('calc-taxa-pct').textContent = `(${calc.taxaPct}%)`;
      document.getElementById('calc-taxa-val').textContent = '− ' + Helpers.formatCurrency(calc.descontoMaquininha);
    } else {
      taxaRow.style.display = 'none';
    }
  },

  saveLancamento(id) {
    const clienteId = document.getElementById('ff-cliente').value;
    const procId    = document.getElementById('ff-proc').value;
    const data      = document.getElementById('ff-data').value;
    const pagamento = document.getElementById('ff-pagamento').value;
    const valorBruto = parseFloat(document.getElementById('ff-valor').value);
    const obs       = document.getElementById('ff-obs').value.trim();

    // Validação obrigatória: cliente e valor
    let valid = true;
    [['ff-cliente', 'ff-cli-err'], ['ff-valor', 'ff-valor-err']].forEach(([fid, eid]) => {
      const el  = document.getElementById(fid);
      const err = document.getElementById(eid);
      if (!el.value) {
        el.classList.add('error');
        err.classList.add('visible');
        valid = false;
      } else {
        el.classList.remove('error');
        err.classList.remove('visible');
      }
    });
    if (!valid) return;

    // Cálculo
    const calc = Helpers.calcValorLiquido(valorBruto, pagamento);

    const financeiro = Storage.getFinanceiro();

    if (id) {
      const idx = financeiro.findIndex(f => f.id === id);
      if (idx !== -1) {
        financeiro[idx] = {
          ...financeiro[idx],
          clienteId, procId, data, pagamento,
          valorBruto,
          valor: calc.liquido,         // compatibilidade retroativa
          valorLiquido: calc.liquido,
          descontoPct: calc.descontoPct,
          taxaAplicada: calc.taxaPct,
          obs
        };
      }
      UI.toast('Lançamento atualizado!', 'success');
    } else {
      financeiro.push({
        id: Helpers.generateId(),
        clienteId, procId, data, pagamento,
        valorBruto,
        valor: calc.liquido,           // compatibilidade retroativa
        valorLiquido: calc.liquido,
        descontoPct: calc.descontoPct,
        taxaAplicada: calc.taxaPct,
        obs,
        criadoEm: new Date().toISOString()
      });
      UI.toast('Lançamento salvo!', 'success');
    }

    Storage.setFinanceiro(financeiro);
    UI.closeModal();
    this.render();
  },

  deleteLancamento(id) {
    UI.confirm(
      'Deseja excluir este lançamento financeiro?',
      () => {
        const updated = Storage.getFinanceiro().filter(f => f.id !== id);
        Storage.setFinanceiro(updated);
        UI.toast('Lançamento excluído!', 'info');
        this.render();
      },
      'Excluir',
      'danger'
    );
  }
};
