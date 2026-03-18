import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  const from = monthStart.toISOString().slice(0, 10);
  const to = monthEnd.toISOString().slice(0, 10);

  const summaryResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income_month,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense_month
     FROM transactions
     WHERE user_id = $1 AND transaction_date BETWEEN $2 AND $3 AND status <> 'canceled'`,
    [userId, from, to]
  );

  const { income_month, expense_month } = summaryResult.rows[0];

  const balanceResult = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0)::numeric AS balance
     FROM transactions
     WHERE user_id = $1 AND status <> 'canceled'`,
    [userId]
  );

  const lastTx = await pool.query(
    `SELECT id, type, amount, description, transaction_date, status, account_id, category_id
     FROM transactions
     WHERE user_id = $1
     ORDER BY transaction_date DESC, created_at DESC
     LIMIT 8`,
    [userId]
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
       AND t.status <> 'canceled'
     GROUP BY 1,2
     ORDER BY total DESC
     LIMIT 8`,
    [userId, from, to]
  );

  const monthlySeries = await pool.query(
    `SELECT
      to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
     FROM transactions
     WHERE user_id = $1 AND status <> 'canceled'
       AND transaction_date >= (CURRENT_DATE - INTERVAL '11 months')
     GROUP BY 1
     ORDER BY 1`,
    [userId]
  );

  res.json({
    summary: {
      balance: balanceResult.rows[0].balance,
      income_month,
      expense_month,
      projected_balance: Number(balanceResult.rows[0].balance) + Number(income_month) - Number(expense_month),
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

