import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

router.get('/summary', async (req, res) => {
  const userId = req.user.sub;
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'validation', message: 'from e to são obrigatórios' });

  const totals = await pool.query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
     FROM transactions
     WHERE user_id = $1 AND status <> 'canceled' AND transaction_date BETWEEN $2 AND $3`,
    [userId, from, to]
  );

  const byCategoryExpense = await pool.query(
    `SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#94a3b8') AS color,
      SUM(t.amount)::numeric AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.type = 'expense' AND t.status <> 'canceled'
       AND t.transaction_date BETWEEN $2 AND $3
     GROUP BY 1,2
     ORDER BY total DESC
     LIMIT 12`,
    [userId, from, to]
  );

  const byCategoryIncome = await pool.query(
    `SELECT
      COALESCE(c.name, 'Sem categoria') AS name,
      COALESCE(c.color, '#94a3b8') AS color,
      SUM(t.amount)::numeric AS total
     FROM transactions t
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.type = 'income' AND t.status <> 'canceled'
       AND t.transaction_date BETWEEN $2 AND $3
     GROUP BY 1,2
     ORDER BY total DESC
     LIMIT 12`,
    [userId, from, to]
  );

  const series = await pool.query(
    `SELECT
      to_char(date_trunc('month', transaction_date), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0)::numeric AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)::numeric AS expense
     FROM transactions
     WHERE user_id = $1 AND status <> 'canceled'
       AND transaction_date BETWEEN $2 AND $3
     GROUP BY 1
     ORDER BY 1`,
    [userId, from, to]
  );

  res.json({
    from,
    to,
    totals: totals.rows[0],
    by_category_expense: byCategoryExpense.rows,
    by_category_income: byCategoryIncome.rows,
    series: series.rows,
  });
});

router.get('/export/csv', async (req, res) => {
  const userId = req.user.sub;
  const { from, to } = req.query;
  if (!from || !to) return res.status(400).json({ error: 'validation', message: 'from e to são obrigatórios' });

  const { rows } = await pool.query(
    `SELECT
      t.transaction_date,
      t.type,
      t.amount,
      t.status,
      COALESCE(t.description, '') AS description,
      a.name AS account,
      COALESCE(c.name, '') AS category
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.user_id = $1 AND t.transaction_date BETWEEN $2 AND $3
     ORDER BY t.transaction_date DESC, t.created_at DESC`,
    [userId, from, to]
  );

  const header = 'date,type,amount,status,description,account,category';
  const lines = rows.map((r) =>
    [
      r.transaction_date,
      r.type,
      r.amount,
      r.status,
      `"${String(r.description).replaceAll('"', '""')}"`,
      `"${String(r.account).replaceAll('"', '""')}"`,
      `"${String(r.category).replaceAll('"', '""')}"`,
    ].join(',')
  );

  const csv = [header, ...lines].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="relatorio_${from}_a_${to}.csv"`);
  res.send(csv);
});

export default router;

