/**
 * dashboard.js — Roteamento e Bootstrap do Dashboard
 * J'mile Essence Care System
 */

document.addEventListener('DOMContentLoaded', () => {

  // ── Auth Guard ───────────────────────────────────────────
  const sessao = Storage.getSessao();
  if (!sessao || !sessao.usuario) {
    window.location.href = 'login.html';
    return;
  }

  // ── Preenche dados do usuário na sidebar ─────────────────
  document.getElementById('sidebar-username').textContent = sessao.nome || sessao.usuario;
  document.getElementById('sidebar-userrole').textContent = sessao.perfil === 'admin' ? 'Administrador' : 'Operador';

  const avatarEl = document.getElementById('sidebar-avatar');
  avatarEl.textContent = (sessao.nome || sessao.usuario).charAt(0).toUpperCase();

  // ── Data no topbar ────────────────────────────────────────
  const dateEl = document.getElementById('topbar-date');
  const updateDate = () => {
    dateEl.textContent = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
    });
  };
  updateDate();
  setInterval(updateDate, 60000);

  // ── Módulos registrados ──────────────────────────────────
  const modules = {
    clientes:      { title: 'Clientes',                render: () => ModuleClientes.render() },
    procedimentos: { title: 'Procedimentos',           render: () => ModuleProcedimentos.render() },
    calendario:    { title: 'Calendário',              render: () => ModuleCalendario.render() },
    financeiro:    { title: 'Financeiro',              render: () => ModuleFinanceiro.render() },
    contas:        { title: 'Gerenciamento de Conta',  render: () => ModuleContas.render() }
  };

  // ── Router ───────────────────────────────────────────────
  let currentModule = null;

  function navigate(moduleKey) {
    if (!modules[moduleKey]) return;
    currentModule = moduleKey;

    // Atualiza nav ativo
    document.querySelectorAll('.nav__item').forEach(el => {
      el.classList.toggle('active', el.dataset.module === moduleKey);
    });

    // Atualiza topbar
    const title = modules[moduleKey].title;
    document.getElementById('topbar-title').textContent = title;
    document.getElementById('topbar-breadcrumb').textContent = title;

    // Renderiza módulo
    UI.setLoading(true);
    setTimeout(() => {
      try {
        modules[moduleKey].render();
      } catch (err) {
        document.getElementById('content-area').innerHTML =
          `<div class="loading"><p>⚠ Erro ao carregar módulo: ${err.message}</p></div>`;
        console.error(err);
      }
    }, 80);
  }

  // ── Eventos de navegação ─────────────────────────────────
  document.querySelectorAll('.nav__item[data-module]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigate(el.dataset.module);
    });
  });

  // ── Logout ────────────────────────────────────────────────
  document.getElementById('btn-logout').addEventListener('click', () => {
    UI.confirm(
      'Deseja sair do sistema?',
      () => {
        Storage.clearSessao();
        window.location.href = 'login.html';
      },
      'Sair',
      'danger'
    );
  });

  // ── Atualiza badges da sidebar ───────────────────────────
  function updateBadges() {
    const clientes_ativos = Storage.getClientes().filter(c => c.ativo !== false).length;
    UI.setBadge('clientes', clientes_ativos);

    const hoje = Helpers.today();
    const agendamentos_hoje = Storage.getAgendamentos().filter(a => a.data === hoje).length;
    UI.setBadge('calendario', agendamentos_hoje);
  }
  updateBadges();

  // Re-atualiza badges quando localStorage mudar (ex: outra aba)
  window.addEventListener('storage', updateBadges);

  // Permite que módulos atualizem badges externamente
  window.Dashboard = { navigate, updateBadges };

  // ── Navega para o módulo inicial ─────────────────────────
  navigate('clientes');
});
