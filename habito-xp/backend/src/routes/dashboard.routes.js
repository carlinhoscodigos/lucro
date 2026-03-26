import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { processRecurringTransactions } from '../recurringProcessor.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  // Garante que lançamentos de recorrência vencidos já foram materializados.
  // Nunca bloquear o dashboard se a recorrência estiver com algum dado inconsistente.
  try {
    // Não pode travar o endpoint. Se demorar demais, renderiza o dashboard mesmo assim.
    await Promise.race([
      processRecurringTransactions(userId),
      new Promise((resolve) => setTimeout(resolve, 1200)),
    ]);
  } catch (err) {
    console.error('Falha ao processar recorrências (dashboard):', err);
  }
  const accountId = req.query.account_id ? String(req.query.account_id) : null;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const from = monthStart.toISOString().slice(0, 10);
  const to = monthEnd.toISOString().slice(0, 10);

  // Helpers de parâmetros para filtros opcionais por conta
  const accountsInitial = await pool.query(
    `SELECT COALESCE(SUM(initial_balance), 0)::numeric AS accounts_initial
     FROM accounts
     WHERE user_id = $1${accountId ? ' AND id = $2' : ''}`,
    accountId ? [userId, accountId] : [userId]
  );

  const summaryResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income_month,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense_month
     FROM transactions
     WHERE user_id = $1
       AND transaction_date BETWEEN $2 AND $3
       AND transaction_date <= CURRENT_DATE
       AND status <> 'canceled'${accountId ? ' AND account_id = $4' : ''}`,
    accountId ? [userId, from, to, accountId] : [userId, from, to]
  );

  const { income_month, expense_month } = summaryResult.rows[0];

  const txNetCurrentResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::numeric AS tx_net_current
     FROM transactions
     WHERE user_id = $1
       AND status <> 'canceled'
       AND transaction_date <= CURRENT_DATE${accountId ? ' AND account_id = $2' : ''}`,
    accountId ? [userId, accountId] : [userId]
  );

  const txNetBeforeMonthResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::numeric AS tx_net_before_month
     FROM transactions
     WHERE user_id = $1
       AND status <> 'canceled'
       AND transaction_date < $2${accountId ? ' AND account_id = $3' : ''}`,
    accountId ? [userId, from, accountId] : [userId, from]
  );

  const accountsInitialValue = accountsInitial.rows[0].accounts_initial ?? 0;
  const txNetCurrent = txNetCurrentResult.rows[0].tx_net_current ?? 0;
  const txNetBeforeMonth = txNetBeforeMonthResult.rows[0].tx_net_before_month ?? 0;

  const currentBalance = Number(accountsInitialValue) + Number(txNetCurrent);
  const projectedBalance = Number(accountsInitialValue) + Number(txNetBeforeMonth) + Number(income_month) - Number(expense_month);

  const lastTx = await pool.query(
    `SELECT
      t.id,
      t.type,
      t.amount,
      t.description,
      t.transaction_date,
      t.status,
      t.account_id,
      a.name AS account_name,
      t.category_id,
      c.name AS category_name
     FROM transactions t
     LEFT JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.transaction_date <= CURRENT_DATE${accountId ? ' AND t.account_id = $2' : ''}
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT 8`,
    accountId ? [userId, accountId] : [userId]
  );

  const expensesByCategory = await pool.query(
    `SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#94a3b8') AS color,
      SUM(t.amount)::numeric AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.type = 'expense'
       AND t.transaction_date BETWEEN $2 AND $3
       AND t.transaction_date <= CURRENT_DATE
       AND t.status <> 'canceled'
       ${accountId ? ' AND t.account_id = $4' : ''}
     GROUP BY 1,2
     ORDER BY total DESC
     LIMIT 8`,
    accountId ? [userId, from, to, accountId] : [userId, from, to]
  );

  // Base de renda/salário do mês:
  // 1) tenta categoria "Salário"
  // 2) fallback para total de receitas do mês
  const salaryResult = await pool.query(
    `SELECT COALESCE(SUM(t.amount), 0)::numeric AS salary_income
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1
       AND t.type = 'income'
       AND t.status <> 'canceled'
       AND t.transaction_date BETWEEN $2 AND $3
       AND t.transaction_date <= CURRENT_DATE
       AND lower(COALESCE(c.name, '')) = 'salário'
       ${accountId ? ' AND t.account_id = $4' : ''}`,
    accountId ? [userId, from, to, accountId] : [userId, from, to]
  );

  const salaryBase = Math.max(
    Number(salaryResult.rows[0]?.salary_income ?? 0),
    Number(income_month ?? 0)
  );
  const expenseBase = Number(expense_month ?? 0);
  const alerts = [];

  if (salaryBase > 0) {
    const ratio = expenseBase / salaryBase;
    if (ratio >= 1) {
      alerts.push({
        title: 'Atenção máxima',
        message: `Você já gastou ${Math.round(ratio * 100)}% da sua renda do mês.`,
        level: 'danger',
      });
    } else if (ratio >= 0.85) {
      alerts.push({
        title: 'Gastos elevados',
        message: `Suas despesas estão em ${Math.round(ratio * 100)}% da sua renda mensal.`,
        level: 'warning',
      });
    } else if (ratio <= 0.4) {
      alerts.push({
        title: 'Boa gestão',
        message: `Você gastou ${Math.round(ratio * 100)}% da renda mensal até agora.`,
        level: 'info',
      });
    }
  }

  const monthlySeries = await pool.query(
    `SELECT
      to_char(m.month_date, 'YYYY-MM') AS month,
      COALESCE(a.income, 0)::numeric AS income,
      COALESCE(a.expense, 0)::numeric AS expense
     FROM (
       SELECT generate_series(
         date_trunc('month', CURRENT_DATE) - INTERVAL '11 months',
         date_trunc('month', CURRENT_DATE),
         INTERVAL '1 month'
       )::date AS month_date
     ) m
     LEFT JOIN (
       SELECT
         date_trunc('month', transaction_date)::date AS month_date,
         COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
         COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
       FROM transactions
       WHERE user_id = $1
         AND status <> 'canceled'
         AND transaction_date >= (CURRENT_DATE - INTERVAL '11 months')
         AND transaction_date <= CURRENT_DATE
         ${accountId ? ' AND account_id = $2' : ''}
       GROUP BY 1
     ) a ON a.month_date = m.month_date
     ORDER BY m.month_date`,
    accountId ? [userId, accountId] : [userId]
  );

  res.json({
    summary: {
      balance: currentBalance,
      income_month,
      expense_month,
      projected_balance: projectedBalance,
      month: { from, to },
    },
    charts: {
      monthly: monthlySeries.rows,
      expenses_by_category: expensesByCategory.rows,
    },
    last_transactions: lastTx.rows,
    alerts,
  });
});

export default router;

