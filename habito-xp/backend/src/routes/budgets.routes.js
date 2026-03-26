import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';
import { processRecurringTransactions } from '../recurringProcessor.js';
import { ensureCategoryOwnership } from '../security/ownership.js';
import { z } from 'zod';

const router = express.Router();
router.use(requireAuth);
const budgetSchema = z.object({
  category_id: z.string().uuid(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  limit_amount: z.coerce.number().min(0),
});

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { month, year } = req.query;
  try {
    await processRecurringTransactions(userId);
  } catch (err) {
    console.error('Falha ao processar recorrências (budgets):', err);
  }

  const params = [userId];
  let where = 'WHERE b.user_id = $1';
  if (month) {
    params.push(Number(month));
    where += ` AND b.month = $${params.length}`;
  }
  if (year) {
    params.push(Number(year));
    where += ` AND b.year = $${params.length}`;
  }

  const { rows } = await pool.query(
    `SELECT
        b.id, b.user_id, b.category_id, b.month, b.year, b.limit_amount, b.created_at,
        c.name AS category_name, c.color AS category_color,
        COALESCE((
          SELECT SUM(t.amount)::numeric
          FROM transactions t
          WHERE t.user_id = b.user_id
            AND t.category_id = b.category_id
            AND t.type = 'expense'
            AND t.status <> 'canceled'
            AND EXTRACT(MONTH FROM t.transaction_date) = b.month
            AND EXTRACT(YEAR FROM t.transaction_date) = b.year
        ), 0)::numeric AS used_amount
     FROM budgets b
     JOIN categories c ON c.id = b.category_id
     ${where}
     ORDER BY b.year DESC, b.month DESC, c.name ASC`,
    params
  );

  res.json({ budgets: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, ['category_id', 'month', 'year', 'limit_amount']);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });

  const userId = req.user.sub;
  const valid = budgetSchema.safeParse(req.body);
  if (!valid.success) return res.status(400).json({ error: 'validation', message: 'Payload inválido' });
  const { category_id, month, year, limit_amount } = valid.data;

  if (!(await ensureCategoryOwnership(userId, category_id))) {
    return res.status(403).json({ error: 'forbidden', message: 'Categoria inválida para este usuário' });
  }

  const { rows } = await pool.query(
    `INSERT INTO budgets (user_id, category_id, month, year, limit_amount)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING id, user_id, category_id, month, year, limit_amount, created_at`,
    [userId, category_id, month, year, limit_amount]
  );

  res.status(201).json({ budget: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { limit_amount, month, year, category_id } = req.body;

  if (category_id && !(await ensureCategoryOwnership(userId, category_id))) {
    return res.status(403).json({ error: 'forbidden', message: 'Categoria inválida para este usuário' });
  }

  const { rows } = await pool.query(
    `UPDATE budgets
     SET
       limit_amount = COALESCE($3, limit_amount),
       month = COALESCE($4, month),
       year = COALESCE($5, year),
       category_id = COALESCE($6, category_id)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, category_id, month, year, limit_amount, created_at`,
    [id, userId, limit_amount, month, year, category_id]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ budget: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM budgets WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

