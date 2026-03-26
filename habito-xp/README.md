# Habito XP — Leia-me

Registo de pedidos e tarefas. Cada item fica com um check-in: quando for feito, o check fica marcado; quando não for feito, peço para re-ler o leia-me. Novos pedidos são sempre adicionados aqui.

---

## Pedidos e tarefas

- [x] Criar este leia-me com check-ins para registar pedidos e marcar quando forem feitos
- [x] Estruturar o projeto com pastas `frontend/` e `backend/`
- [x] Backend local: Postgres, rota /health, CORS, PORT por env. Frontend React+Vite com VITE_API_URL
- [x] Criar .env com DATABASE_URL (Neon), PORT, JWT_SECRET e tabelas users, accounts, categories, transactions
- [x] Configurar CORS com localhost:5173, lucro.onrender.com e credentials: true
- [x] Corrigir URL da API: VITE_API_URL=https://lucro.onrender.com (sem https duplicado)
- [x] Schema completo: users, accounts, categories, recurring_transactions, transactions, budgets, goals, notifications, subscriptions, transaction_imports, shared_access, audit_logs
- [x] Tela de login (Lucrô.) sem "Acesso restrito aos administradores"
- [x] Ajustar design do login para ficar igual ao layout enviado (sem texto de admins)
- [x] Área interna SaaS: layout autenticado + 9 páginas (dashboard, lançamentos, contas, categorias, orçamentos, metas, recorrências, relatórios, configurações) com design premium e componentes reutilizáveis
- [x] Corrigir CORS/preflight para remover "Failed to fetch" no login (produção)
- [x] Corrigir 404 no Vercel em rotas (SPA rewrite para /login)
- [x] Corrigir 500 no /auth/login (troca bcrypt -> bcryptjs + errors em JSON)
- [x] Corrigir deploy no Render: migração incremental adiciona colunas faltantes em `users` (is_active/plan/password_hash)
- [x] Opção B: `npm start` roda migrações automaticamente (Render free)
- [x] Migrações incrementais: corrigir colunas faltantes em accounts/categories/transactions para evitar 502/503 no Render
- [x] Performance UX: cache/prefetch React Query para navegação mais rápida (dashboard/lançamentos/contas)
- [x] Dashboard: melhorar visual/legibilidade dos gráficos (Recharts + tooltip PT-BR)
- [x] Dashboard: saldo atual reflete alterações sem recarregar a página
- [x] Backend: saldo atual inclui `accounts.initial_balance` (e conta selecionada)
- [x] Backend: semear categorias padrão no primeiro login
- [x] UI: traduzir `income/expense` e frequências para português nas telas (Categorias/Recorrências)
- [x] Menu mobile: corrigir “Bem-vindo” cortado no topbar
- [x] Categorias: “Cor” e “Ícone” via dropdown pré-definido (sem inglês)
- [x] Dashboard: reduzir poluição (menos legendas/listas laterais)
- [x] Seção no README: “Como usar”
- [x] Metas: selecionar “Tipo de conta” e sincronizar progresso automaticamente
- [x] Remover dependência de Clerk no fluxo e criar painel próprio de cadastro de usuários
- [x] Controle de `role` (admin/user) e painel de usuários visível apenas para admin
- [x] Metas: ao passar do prazo ficam cinza e não podem ser editadas (somente excluir)
- [x] Remover aba "Orçamentos" do menu lateral e rotas do frontend
- [x] Painel admin: definir data de término no cadastro e excluir contas automaticamente após vencimento
- [x] Alertas no dashboard baseados em percentual de gastos sobre renda/salário mensal
- [x] Landing page pública em `/` + rotas `/login` e `/register` separadas, mantendo `/app/*` protegido
- [x] Ajuste: remover cadastro público e manter criação de usuário apenas no painel admin

---

*Última atualização: 18/03/2026*

---

## Base de dados (Neon Postgres)

Tabelas: **users**, **accounts**, **categories**, **recurring_transactions**, **transactions**, **budgets**, **goals**, **notifications**, **subscriptions**, **transaction_imports**, **shared_access**, **audit_logs**.

Para criar as tabelas no Postgres: `cd backend` e `npm run migrate`.

---

## Como usar

1. Backend
   - Crie `backend/.env` com `DATABASE_URL`, `PORT` e `JWT_SECRET`
   - No diretório `backend`, rode as migrações: `npm run migrate`
   - Inicie o backend: `npm start`
2. Frontend
   - Ajuste `frontend/.env` com `VITE_API_URL` apontando para seu backend
   - Inicie o frontend em `frontend` com `npm run dev`
3. Uso do app
   - Faça login
   - Crie suas contas em `Contas` (defina `Saldo inicial`)
   - Ajuste/edite categorias em `Categorias` (Cor e Ícone via dropdown pré-definido)
   - Cadastre lançamentos em `Lançamentos` e acompanhe os totais no `Dashboard`
