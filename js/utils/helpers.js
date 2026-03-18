/**
 * helpers.js — Funções utilitárias gerais
 * J'mile Essence Care System
 */

const Helpers = {
  /**
   * Gera ID único baseado em timestamp + random.
   */
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  },

  /**
   * Formata data para exibição dd/mm/aaaa.
   */
  formatDate(isoString) {
    if (!isoString) return '—';
    const [y, m, d] = isoString.split('-');
    return `${d}/${m}/${y}`;
  },

  /**
   * Formata valor monetário em BRL.
   */
  formatCurrency(value) {
    return Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  },

  /**
   * Retorna a data atual no formato yyyy-mm-dd.
   */
  today() {
    return new Date().toISOString().split('T')[0];
  },

  /**
   * Formata hora HH:MM.
   */
  formatTime(str) {
    return str ? str.slice(0, 5) : '—';
  },

  /**
   * Adiciona minutos a um horário "HH:MM" e retorna "HH:MM".
   */
  addMinutes(time, mins) {
    const [h, m] = time.split(':').map(Number);
    const total = h * 60 + m + Number(mins);
    const hh = String(Math.floor(total / 60) % 24).padStart(2, '0');
    const mm = String(total % 60).padStart(2, '0');
    return `${hh}:${mm}`;
  },

  /**
   * Verifica sobreposição de intervalos de tempo.
   */
  timesOverlap(start1, end1, start2, end2) {
    return start1 < end2 && end1 > start2;
  },

  /**
   * Sanitiza string de input HTML.
   */
  sanitize(str) {
    const el = document.createElement('div');
    el.textContent = str;
    return el.innerHTML;
  },

  /**
   * Capitaliza primeira letra de cada palavra.
   */
  titleCase(str) {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  },

  /**
   * Retorna array de horários disponíveis (09:00-17:00 a cada 30min).
   */
  getTimeSlots() {
    const slots = [];
    for (let h = 8; h < 17; h++) {
      slots.push(`${String(h).padStart(2, '0')}:00`);
      slots.push(`${String(h).padStart(2, '0')}:30`);
    }
    slots.push('17:00');
    return slots;
  },

  /**
   * Converte "HH:MM" em minutos totais para comparação.
   */
  timeToMinutes(time) {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  },

  /**
   * Máscara de telefone brasileiro.
   */
  maskPhone(value) {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/g, '($1) $2')
      .replace(/(\d)(\d{4})$/, '$1-$2');
  },

  // ─── Cálculos Financeiros ─────────────────────────────────

  /**
   * Aplica desconto percentual sobre o valor bruto.
   * @param {number} valor - Valor bruto
   * @param {number} pct   - Percentual de desconto (default 30)
   * @returns {number} Valor após desconto
   */
  calcDesconto(valor, pct = 30) {
    return valor * (1 - pct / 100);
  },

  /**
   * Calcula o valor descontado pela taxa da maquininha.
   * Aplica SOMENTE para 'credito' e 'debito'.
   * @param {number} valor          - Valor base (já com desconto)
   * @param {string} tipoPagamento  - 'credito' | 'debito' | 'pix' | 'dinheiro'
   * @returns {{ taxa: number, desconto: number, valorFinal: number }}
   */
  calcTaxaMaquininha(valor, tipoPagamento) {
    const config = (typeof Storage !== 'undefined' && Storage.getConfig) ? Storage.getConfig() : { taxaCredito: 4.49, taxaDebito: 1.99 };
    let taxa = 0;
    if (tipoPagamento === 'credito') taxa = config.taxaCredito;
    else if (tipoPagamento === 'debito') taxa = config.taxaDebito;
    const desconto = valor * (taxa / 100);
    return { taxa, desconto, valorFinal: valor - desconto };
  },

  /**
   * Calcula o resumo financeiro completo de um lançamento.
   * @param {number} valorBruto     - Valor bruto do serviço
   * @param {string} tipoPagamento  - 'credito' | 'debito' | 'pix' | 'dinheiro'
   * @returns {{ bruto, comDesconto, taxaMaquininha, descontoMaquininha, liquido, taxaPct, descontoPct }}
   */
  calcValorLiquido(valorBruto, tipoPagamento) {
    const config = (typeof Storage !== 'undefined' && Storage.getConfig) ? Storage.getConfig() : { descontoPadrao: 30 };
    const comDesconto = this.calcDesconto(valorBruto, config.descontoPadrao);
    const { taxa, desconto: descontoMaquininha, valorFinal: liquido } = this.calcTaxaMaquininha(comDesconto, tipoPagamento);
    return {
      bruto: valorBruto,
      descontoPct: config.descontoPadrao,
      comDesconto,
      taxaPct: taxa,
      descontoMaquininha,
      liquido
    };
  }
};
