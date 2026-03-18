import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query(
    `SELECT id, user_id, type, title, message, is_read, created_at
     FROM notifications
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 50`,
    [userId]
  );
  res.json({ notifications: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, ['type', 'title', 'message']);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });
  const userId = req.user.sub;
  const { type, title, message } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO notifications (user_id, type, title, message)
     VALUES ($1,$2,$3,$4)
     RETURNING id, user_id, type, title, message, is_read, created_at`,
    [userId, type, title, message]
  );
  res.status(201).json({ notification: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { is_read } = req.body;
  const { rows } = await pool.query(
    `UPDATE notifications
     SET is_read = COALESCE($3, is_read)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, type, title, message, is_read, created_at`,
    [id, userId, is_read]
  );
  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ notification: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

