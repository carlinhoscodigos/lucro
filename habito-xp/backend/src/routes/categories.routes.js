import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const { type } = req.query;
  const params = [userId];
  let where = 'WHERE user_id = $1';
  if (type) {
    params.push(type);
    where += ` AND type = $${params.length}`;
  }
  const { rows } = await pool.query(
    `SELECT id, name, type, color, icon, is_default, created_at
     FROM categories
     ${where}
     ORDER BY is_default DESC, name ASC`,
    params
  );
  res.json({ categories: rows });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, ['name', 'type']);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });
  const userId = req.user.sub;
  const { name, type, color = null, icon = null, is_default = false } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO categories (user_id, name, type, color, icon, is_default)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, name, type, color, icon, is_default, created_at`,
    [userId, name, type, color, icon, is_default]
  );
  res.status(201).json({ category: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { name, type, color, icon, is_default } = req.body;
  const { rows } = await pool.query(
    `UPDATE categories
     SET
       name = COALESCE($3, name),
       type = COALESCE($4, type),
       color = COALESCE($5, color),
       icon = COALESCE($6, icon),
       is_default = COALESCE($7, is_default)
     WHERE id = $1 AND user_id = $2
     RETURNING id, name, type, color, icon, is_default, created_at`,
    [id, userId, name, type, color, icon, is_default]
  );
  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ category: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM categories WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

