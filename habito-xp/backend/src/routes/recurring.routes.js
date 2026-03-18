import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `SELECT
      id, user_id, account_id, category_id, type, amount, description,
      frequency, day_of_month, next_run_date, is_active, created_at
     FROM recurring_transactions
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  res.json({ recurring_transactions: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, [
    'account_id',
    'type',
    'amount',
    'frequency',
    'next_run_date',
  ]);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });

  const userId = req.user.sub;
  const {
    account_id,
    category_id = null,
    type,
    amount,
    description = null,
    frequency,
    day_of_month = null,
    next_run_date,
    is_active = true,
  } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO recurring_transactions
      (user_id, account_id, category_id, type, amount, description, frequency, day_of_month, next_run_date, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, user_id, account_id, category_id, type, amount, description, frequency, day_of_month, next_run_date, is_active, created_at`,
    [userId, account_id, category_id, type, amount, description, frequency, day_of_month, next_run_date, is_active]
  );

  res.status(201).json({ recurring_transaction: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const {
    account_id,
    category_id,
    type,
    amount,
    description,
    frequency,
    day_of_month,
    next_run_date,
    is_active,
  } = req.body;

  const { rows } = await pool.query(
    `UPDATE recurring_transactions
     SET
       account_id = COALESCE($3, account_id),
       category_id = COALESCE($4, category_id),
       type = COALESCE($5, type),
       amount = COALESCE($6, amount),
       description = COALESCE($7, description),
       frequency = COALESCE($8, frequency),
       day_of_month = COALESCE($9, day_of_month),
       next_run_date = COALESCE($10, next_run_date),
       is_active = COALESCE($11, is_active)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, account_id, category_id, type, amount, description, frequency, day_of_month, next_run_date, is_active, created_at`,
    [id, userId, account_id, category_id, type, amount, description, frequency, day_of_month, next_run_date, is_active]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ recurring_transaction: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM recurring_transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

