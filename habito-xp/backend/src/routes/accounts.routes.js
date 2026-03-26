import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';
import { z } from 'zod';

const router = express.Router();
router.use(requireAuth);
const accountSchema = z.object({
  name: z.string().trim().min(1).max(100),
  type: z.enum(['checking', 'savings', 'wallet', 'credit_card', 'investment']),
  initial_balance: z.coerce.number().optional(),
});

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    'SELECT id, name, type, initial_balance, is_active, created_at FROM accounts WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  res.json({ accounts: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, ['name', 'type']);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });
  const userId = req.user.sub;
  const valid = accountSchema.safeParse(req.body);
  if (!valid.success) return res.status(400).json({ error: 'validation', message: 'Payload inválido' });
  const { name, type, initial_balance = 0 } = valid.data;
  const { rows } = await pool.query(
    `INSERT INTO accounts (user_id, name, type, initial_balance)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, type, initial_balance, is_active, created_at`,
    [userId, name, type, initial_balance]
  );
  res.status(201).json({ account: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { name, type, initial_balance, is_active } = req.body;

  const { rows } = await pool.query(
    `UPDATE accounts
     SET
       name = COALESCE($3, name),
       type = COALESCE($4, type),
       initial_balance = COALESCE($5, initial_balance),
       is_active = COALESCE($6, is_active)
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, type, initial_balance, is_active, created_at`,
    [id, userId, name, type, initial_balance, is_active]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ account: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM accounts WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

