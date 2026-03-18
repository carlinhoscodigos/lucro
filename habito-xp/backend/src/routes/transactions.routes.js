import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
router.use(requireAuth);

function buildFilters(query) {
  const where = [];
  const params = [];

  // user_id always first
  params.push(query.userId);
  where.push(`t.user_id = $${params.length}`);

  if (query.type) {
    params.push(query.type);
    where.push(`t.type = $${params.length}`);
  }
  if (query.account_id) {
    params.push(query.account_id);
    where.push(`t.account_id = $${params.length}`);
  }
  if (query.category_id) {
    params.push(query.category_id);
    where.push(`t.category_id = $${params.length}`);
  }
  if (query.status) {
    params.push(query.status);
    where.push(`t.status = $${params.length}`);
  }
  if (query.from) {
    params.push(query.from);
    where.push(`t.transaction_date >= $${params.length}`);
  }
  if (query.to) {
    params.push(query.to);
    where.push(`t.transaction_date <= $${params.length}`);
  }

  return { whereSql: where.length ? `WHERE ${where.join(' AND ')}` : '', params };
}

router.get('/', async (req, res) => {
  const userId = req.user.sub;
  const {
    from,
    to,
    type,
    category_id,
    account_id,
    status,
    page = '1',
    pageSize = '20',
  } = req.query;

  const p = Math.max(1, Number(page) || 1);
  const ps = Math.min(100, Math.max(1, Number(pageSize) || 20));
  const offset = (p - 1) * ps;

  const { whereSql, params } = buildFilters({
    userId,
    from,
    to,
    type,
    category_id,
    account_id,
    status,
  });

  const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM transactions t ${whereSql}`, params);
  const total = countResult.rows[0]?.total ?? 0;

  params.push(ps);
  params.push(offset);
  const limitParam = params.length - 1;
  const offsetParam = params.length;

  const { rows } = await pool.query(
    `SELECT
        t.id, t.type, t.amount, t.description, t.transaction_date, t.status,
        t.category_id, c.name AS category_name, c.color AS category_color,
        t.account_id, a.name AS account_name,
        t.is_recurring, t.recurring_id, t.created_at, t.updated_at
     FROM transactions t
     JOIN accounts a ON a.id = t.account_id
     LEFT JOIN categories c ON c.id = t.category_id
     ${whereSql}
     ORDER BY t.transaction_date DESC, t.created_at DESC
     LIMIT $${limitParam} OFFSET $${offsetParam}`,
    params
  );

  res.json({ transactions: rows, page: p, pageSize: ps, total });
});

router.post('/', async (req, res) => {
  const missing = requireBodyFields(req.body, [
    'type',
    'amount',
    'account_id',
    'transaction_date',
    'status',
  ]);
  if (missing.length) return res.status(400).json({ error: 'validation', missing });

  const userId = req.user.sub;
  const {
    type,
    amount,
    description = null,
    category_id = null,
    account_id,
    transaction_date,
    status,
    is_recurring = false,
    recurring_id = null,
  } = req.body;

  const { rows } = await pool.query(
    `INSERT INTO transactions
      (user_id, type, amount, description, category_id, account_id, transaction_date, status, is_recurring, recurring_id)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING id, type, amount, description, category_id, account_id, transaction_date, status, is_recurring, recurring_id, created_at, updated_at`,
    [userId, type, amount, description, category_id, account_id, transaction_date, status, is_recurring, recurring_id]
  );

  res.status(201).json({ transaction: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const {
    type,
    amount,
    description,
    category_id,
    account_id,
    transaction_date,
    status,
    is_recurring,
    recurring_id,
  } = req.body;

  const { rows } = await pool.query(
    `UPDATE transactions
     SET
       type = COALESCE($3, type),
       amount = COALESCE($4, amount),
       description = COALESCE($5, description),
       category_id = COALESCE($6, category_id),
       account_id = COALESCE($7, account_id),
       transaction_date = COALESCE($8, transaction_date),
       status = COALESCE($9, status),
       is_recurring = COALESCE($10, is_recurring),
       recurring_id = COALESCE($11, recurring_id),
       updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING id, type, amount, description, category_id, account_id, transaction_date, status, is_recurring, recurring_id, created_at, updated_at`,
    [id, userId, type, amount, description, category_id, account_id, transaction_date, status, is_recurring, recurring_id]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });
  res.json({ transaction: updated });
});

router.delete('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const result = await pool.query('DELETE FROM transactions WHERE id = $1 AND user_id = $2', [id, userId]);
  if (!result.rowCount) return res.status(404).json({ error: 'not_found' });
  res.status(204).send();
});

export default router;

