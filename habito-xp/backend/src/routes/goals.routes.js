import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `SELECT id, user_id, name, target_amount, current_amount, target_date, status, created_at
     FROM goals
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );
  res.json({ goals: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, ['name', 'target_amount']);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });

  const userId = req.user.sub;
  const { name, target_amount, current_amount = 0, target_date = null, status = 'active' } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, status)
     VALUES ($1,$2,$3,$4,$5,$6)
     RETURNING id, user_id, name, target_amount, current_amount, target_date, status, created_at`,
    [userId, name, target_amount, current_amount, target_date, status]
  );

  res.status(201).json({ goal: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { name, target_amount, current_amount, target_date, status } = req.body;

  const { rows } = await pool.query(
    `UPDATE goals
     SET
       name = COALESCE($3, name),
       target_amount = COALESCE($4, target_amount),
       current_amount = COALESCE($5, current_amount),
       target_date = COALESCE($6, target_date),
       status = COALESCE($7, status)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, name, target_amount, current_amount, target_date, status, created_at`,
    [id, userId, name, target_amount, current_amount, target_date, status]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ goal: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM goals WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

