import pool from '../db.js';

export async function ensureAccountOwnership(userId, accountId) {
  if (!accountId) return true;
  const { rowCount } = await pool.query(
    'SELECT 1 FROM accounts WHERE id = $1 AND user_id = $2 LIMIT 1',
    [accountId, userId]
  );
  return rowCount > 0;
}

export async function ensureCategoryOwnership(userId, categoryId) {
  if (!categoryId) return true;
  const { rowCount } = await pool.query(
    'SELECT 1 FROM categories WHERE id = $1 AND user_id = $2 LIMIT 1',
    [categoryId, userId]
  );
  return rowCount > 0;
}

export async function ensureRecurringOwnership(userId, recurringId) {
  if (!recurringId) return true;
  const { rowCount } = await pool.query(
    'SELECT 1 FROM recurring_transactions WHERE id = $1 AND user_id = $2 LIMIT 1',
    [recurringId, userId]
  );
  return rowCount > 0;
}

