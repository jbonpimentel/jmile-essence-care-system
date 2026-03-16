/**
 * login.js — Lógica da tela de login
 * J'mile Essence Care System
 */

document.addEventListener('DOMContentLoaded', () => {
  // Inicializa dados padrão
  Storage.init();

  // Se já existe sessão ativa, redireciona
  const sessao = Storage.getSessao();
  if (sessao && sessao.usuario) {
    window.location.href = 'index.html';
    return;
  }

  // ── Partículas decorativas ────────────────────────────────
  const container = document.getElementById('particles');
  for (let i = 0; i < 20; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 2;
    p.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      bottom: -${size}px;
      animation-duration: ${Math.random() * 8 + 6}s;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(p);
  }

  // ── Toggle senha ────────────────────────────────────────
  const passInput  = document.getElementById('login-pass');
  const toggleBtn  = document.getElementById('toggle-pass');
  toggleBtn.addEventListener('click', () => {
    const isPass = passInput.type === 'password';
    passInput.type = isPass ? 'text' : 'password';
    toggleBtn.textContent = isPass ? '🙈' : '👁';
  });

  // ── Formulário ───────────────────────────────────────────
  const form      = document.getElementById('login-form');
  const userInput = document.getElementById('login-user');
  const btnLogin  = document.getElementById('btn-login');
  const errorBox  = document.getElementById('login-error');
  const errorMsg  = document.getElementById('login-error-msg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const usuario = userInput.value.trim().toLowerCase();
    const senha   = passInput.value.trim();

    // Limpa erro anterior
    errorBox.classList.remove('visible');
    userInput.classList.remove('is-error');
    passInput.classList.remove('is-error');

    // Validação básica
    if (!usuario || !senha) {
      showError('Preencha todos os campos.');
      if (!usuario) userInput.classList.add('is-error');
      if (!senha)   passInput.classList.add('is-error');
      return;
    }

    // Loading
    btnLogin.classList.add('loading');
    btnLogin.disabled = true;

    // Simula delay de autenticação (UX)
    setTimeout(() => {
      const usuarios = Storage.getUsuarios();
      const match = usuarios.find(u =>
        u.usuario.toLowerCase() === usuario &&
        u.senha === senha &&
        u.ativo !== false
      );

      if (match) {
        Storage.setSessao({ usuario: match.usuario, nome: match.nome, perfil: match.perfil, id: match.id });
        window.location.href = 'index.html';
      } else {
        btnLogin.classList.remove('loading');
        btnLogin.disabled = false;
        showError('Usuário ou senha incorretos. Tente novamente.');
        userInput.classList.add('is-error');
        passInput.classList.add('is-error');
        passInput.value = '';
        passInput.focus();
      }
    }, 800);
  });

  function showError(msg) {
    errorMsg.textContent = msg;
    errorBox.classList.add('visible');
  }

  // Limpa erro ao digitar
  [userInput, passInput].forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-error');
      errorBox.classList.remove('visible');
    });
  });
});
