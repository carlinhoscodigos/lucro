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

---

*Última atualização: 17/03/2026*

---

## Base de dados (Neon Postgres)

Tabelas: **users**, **accounts**, **categories**, **transactions**.

Para criar as tabelas no Postgres: `cd backend` e `npm run migrate`.
