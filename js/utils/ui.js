/**
 * ui.js — Utilitários de Interface: modais, toasts, confirmações
 * J'mile Essence Care System
 */

const UI = {
  /**
   * Exibe uma notificação toast temporária.
   * @param {string} message
   * @param {'success'|'error'|'info'|'warning'} type
   */
  toast(message, type = 'success') {
    const container = document.getElementById('toast-container') || this._createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
    toast.innerHTML = `<span class="toast__icon">${icons[type]}</span><span class="toast__msg">${message}</span>`;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast--show'));

    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => toast.remove(), 350);
    }, 3200);
  },

  _createToastContainer() {
    const el = document.createElement('div');
    el.id = 'toast-container';
    document.body.appendChild(el);
    return el;
  },

  /**
   * Abre um modal genérico.
   * @param {string} title
   * @param {string} bodyHTML
   * @param {Object} options { size, footerHTML }
   */
  openModal(title, bodyHTML, options = {}) {
    this.closeModal();

    const overlay = document.createElement('div');
    overlay.id = 'modal-overlay';
    overlay.className = 'modal-overlay';

    const sizeClass = options.size === 'lg' ? 'modal--lg' : options.size === 'sm' ? 'modal--sm' : '';

    overlay.innerHTML = `
      <div class="modal ${sizeClass}" role="dialog" aria-modal="true">
        <div class="modal__header">
          <h3 class="modal__title">${title}</h3>
          <button class="modal__close" id="modal-close-btn" aria-label="Fechar">✕</button>
        </div>
        <div class="modal__body">${bodyHTML}</div>
        ${options.footerHTML ? `<div class="modal__footer">${options.footerHTML}</div>` : ''}
      </div>
    `;

    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('modal-overlay--show'));

    document.getElementById('modal-close-btn').addEventListener('click', () => this.closeModal());
    overlay.addEventListener('click', e => { if (e.target === overlay) this.closeModal(); });

    // Focus trap
    const firstInput = overlay.querySelector('input, select, textarea, button');
    if (firstInput) firstInput.focus();
  },

  closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('modal-overlay--show');
    setTimeout(() => overlay.remove(), 300);
  },

  /**
   * Modal de confirmação.
   * @param {string} message
   * @param {Function} onConfirm
   * @param {string} confirmLabel
   */
  confirm(message, onConfirm, confirmLabel = 'Confirmar', type = 'danger') {
    const body = `<p class="confirm__message">${message}</p>`;
    const footer = `
      <button class="btn btn--outline" id="confirm-cancel">Cancelar</button>
      <button class="btn btn--${type}" id="confirm-ok">${confirmLabel}</button>
    `;
    this.openModal('Confirmação', body, { size: 'sm', footerHTML: footer });

    document.getElementById('confirm-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('confirm-ok').addEventListener('click', () => {
      this.closeModal();
      onConfirm();
    });
  },

  /**
   * Renderiza estado vazio numa tabela.
   */
  emptyState(icon, message, colspan = 6) {
    return `
      <tr>
        <td colspan="${colspan}" class="empty-state">
          <div class="empty-state__icon">${icon}</div>
          <p>${message}</p>
        </td>
      </tr>
    `;
  },

  /**
   * Atualiza o contador de badge do menu.
   */
  setBadge(menuItem, count) {
    const link = document.querySelector(`[data-module="${menuItem}"] .nav__badge`);
    if (!link) return;
    link.textContent = count > 0 ? count : '';
    link.style.display = count > 0 ? 'inline-flex' : 'none';
  },

  /**
   * Loading spinner no conteúdo principal.
   */
  setLoading(show) {
    const area = document.getElementById('content-area');
    if (!area) return;
    if (show) {
      area.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Carregando...</p></div>';
    }
  }
};
