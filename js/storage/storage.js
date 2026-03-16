/**
 * storage.js — Camada de abstração para localStorage
 * J'mile Essence Care System
 */

const Storage = {
  get(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
      return [];
    }
  },

  getObj(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || {};
    } catch {
      return {};
    }
  },

  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  remove(key) {
    localStorage.removeItem(key);
  },

  // ── Clientes ──────────────────────────────────────────────────
  getClientes() { return this.get('clientes'); },
  setClientes(v) { this.set('clientes', v); },

  // ── Procedimentos ────────────────────────────────────────────
  getProcedimentos() { return this.get('procedimentos'); },
  setProcedimentos(v) { this.set('procedimentos', v); },

  // ── Agendamentos ─────────────────────────────────────────────
  getAgendamentos() { return this.get('agendamentos'); },
  setAgendamentos(v) { this.set('agendamentos', v); },

  // ── Financeiro ───────────────────────────────────────────────
  getFinanceiro() { return this.get('financeiro'); },
  setFinanceiro(v) { this.set('financeiro', v); },

  // ── Usuários ─────────────────────────────────────────────────
  getUsuarios() { return this.get('usuarios'); },
  setUsuarios(v) { this.set('usuarios', v); },

  // ── Sessão ───────────────────────────────────────────────────
  getSessao() { return this.getObj('sessao'); },
  setSessao(v) { this.set('sessao', v); },
  clearSessao() { this.remove('sessao'); },

  /**
   * Inicializa dados padrão se ainda não existirem.
   */
  init() {
    if (this.getUsuarios().length === 0) {
      this.setUsuarios([
        {
          id: '1',
          nome: 'Jamile Rigatti',
          usuario: 'jamile rigatti',
          senha: '123456',
          perfil: 'admin',
          ativo: true
        }
      ]);
    }
  }
};
