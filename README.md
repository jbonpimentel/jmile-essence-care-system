# J'mile Essence Care — Sistema de Gestão

Sistema web educacional (EP) 100% front-end para gestão de clínica de estética.  
Sem backend, sem banco de dados — todos os dados são armazenados via **localStorage**.

---

## 🚀 Como Usar

1. Abra `pages/login.html` no navegador
2. Faça login com as credenciais:
   - **Usuário:** `Jamile Rigatti`
   - **Senha:** `123456`
3. Navegue pelos módulos no menu lateral

---

## 📁 Estrutura de Pastas

```
jmile-essence-care-system/
├── assets/
│   ├── images/
│   └── icons/
├── css/
│   ├── login.css         # Estilos da tela de login
│   ├── dashboard.css     # Layout do dashboard
│   ├── components.css    # Botões, modais, formulários
│   └── tables.css        # Tabelas e calendário
├── js/
│   ├── login.js          # Lógica de autenticação
│   ├── dashboard.js      # Roteamento de módulos
│   ├── storage/
│   │   └── storage.js    # Camada de abstração do localStorage
│   ├── modules/
│   │   ├── clientes.js       # Módulo de clientes
│   │   ├── procedimentos.js  # Módulo de procedimentos
│   │   ├── calendario.js     # Módulo de calendário
│   │   ├── financeiro.js     # Módulo financeiro
│   │   └── contas.js         # Módulo de usuários
│   └── utils/
│       ├── helpers.js    # Funções utilitárias
│       └── ui.js         # UI: modais, toasts
├── pages/
│   ├── login.html        # Tela de login
│   └── index.html        # Dashboard principal
└── README.md
```

---

## 💾 Estruturas de Dados (localStorage)

| Chave           | Descrição                        |
|-----------------|----------------------------------|
| `clientes`      | Lista de clientes cadastrados    |
| `procedimentos` | Lista de procedimentos           |
| `agendamentos`  | Agendamentos no calendário       |
| `financeiro`    | Lançamentos financeiros          |
| `usuarios`      | Usuários do sistema              |
| `sessao`        | Sessão do usuário logado         |

---

## ✨ Módulos

### 👥 Clientes
- CRUD completo
- Busca por nome, email, celular
- Filtro por status (ativo/inativo)
- Inativação de cliente (não exclui)

### ✨ Procedimentos
- CRUD completo
- Suporte a procedimentos combinados
- Desconto automático para combinados

### 📅 Calendário
- Visualização mensal com grade interativa
- Painel lateral com agendamentos do dia
- Detecção automática de conflito de horário
- Horários disponíveis: 08:00–17:00

### 💰 Financeiro
- Lançamentos por cliente e procedimento
- Formas de pagamento: Pix, Crédito, Débito, Dinheiro
- Totais por dia, mês e forma de pagamento
- Filtros por data e forma de pagamento

### ⚙️ Gerenciamento de Conta
- CRUD de usuários
- Alterar senha
- Perfis: Administrador e Operador

---

## 🛠 Tecnologias

- HTML5 semântico
- CSS3 com variáveis e animações
- JavaScript ES6+ modular
- localStorage para persistência
- Google Fonts (Inter + Playfair Display)

---

*Projeto Educacional — J'mile Essence Care © 2025*
