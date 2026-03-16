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
  }
};
