import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
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
    `SELECT id, type, amount, description, transaction_date, status, account_id, category_id
     FROM transactions
     WHERE user_id = $1
       AND transaction_date <= CURRENT_DATE${accountId ? ' AND account_id = $2' : ''}
     ORDER BY transaction_date DESC, created_at DESC
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

  const monthlySeries = await pool.query(
    `SELECT
      to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
     FROM transactions
     WHERE user_id = $1 AND status <> 'canceled'
       AND transaction_date >= (CURRENT_DATE - INTERVAL '11 months')
       AND transaction_date <= CURRENT_DATE
       ${accountId ? ' AND account_id = $2' : ''}
     GROUP BY 1
     ORDER BY 1`,
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
    alerts: [],
  });
});

export default router;

