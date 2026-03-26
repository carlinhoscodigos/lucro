import express from 'express';
import pool from '../db.js';
import { requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';
import { processRecurringTransactions } from '../recurringProcessor.js';
import { ensureAccountOwnership } from '../security/ownership.js';
import { z } from 'zod';

const router = express.Router();
router.use(requireAuth);
const createGoalSchema = z.object({
  name: z.string().trim().min(1).max(150),
  target_amount: z.coerce.number().positive(),
  current_amount: z.coerce.number().min(0).optional(),
  target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  status: z.enum(['active', 'completed', 'canceled']).optional(),
  account_type: z.string().max(30).nullable().optional(),
  account_id: z.string().uuid().nullable().optional(),
});

async function syncGoalsProgress(userId) {
  // Preferimos account_id (conta específica) quando existir.
  // Se não existir, caímos para account_type (tipo).

  // 1) metas por account_id
  await pool.query(
    `
    UPDATE goals g
    SET
      current_amount = computed.current_amount,
      status = CASE
        WHEN g.status = 'canceled' THEN 'canceled'
        WHEN computed.current_amount >= g.target_amount THEN 'completed'
        ELSE g.status
      END
    FROM (
      SELECT
        g2.id AS goal_id,
        (
          COALESCE(a.initial_balance, 0)
          + COALESCE(
              SUM(
                CASE
                  WHEN t.type = 'income' THEN COALESCE(t.amount, 0)
                  ELSE -COALESCE(t.amount, 0)
                END
              ),
              0
            )
        )::numeric AS current_amount
      FROM goals g2
      LEFT JOIN accounts a
        ON a.user_id = $1
       AND a.id = g2.account_id
      LEFT JOIN transactions t
        ON t.user_id = $1
       AND t.account_id = g2.account_id
       AND t.status <> 'canceled'
       AND t.transaction_date <= CURRENT_DATE
      WHERE g2.user_id = $1
        AND g2.account_id IS NOT NULL
      GROUP BY g2.id, a.initial_balance
    ) computed
    WHERE g.id = computed.goal_id
      AND g.user_id = $1
      AND g.account_id IS NOT NULL
    `,
    [userId]
  );

  // 2) metas por account_type (fallback)
  await pool.query(
    `
    UPDATE goals g
    SET
      current_amount = computed.current_amount,
      status = CASE
        WHEN g.status = 'canceled' THEN 'canceled'
        WHEN computed.current_amount >= g.target_amount THEN 'completed'
        ELSE g.status
      END
    FROM (
      SELECT
        g2.id AS goal_id,
        (
          COALESCE(SUM(a.initial_balance), 0)
          + COALESCE(
              SUM(
                CASE
                  WHEN t.type = 'income' THEN COALESCE(t.amount, 0)
                  ELSE -COALESCE(t.amount, 0)
                END
              ),
              0
            )
        )::numeric AS current_amount
      FROM goals g2
      LEFT JOIN accounts a
        ON a.user_id = $1
       AND a.type = g2.account_type
      LEFT JOIN transactions t
        ON t.user_id = $1
       AND t.account_id = a.id
       AND t.status <> 'canceled'
       AND t.transaction_date <= CURRENT_DATE
      WHERE g2.user_id = $1
        AND g2.account_type IS NOT NULL
        AND g2.account_id IS NULL
      GROUP BY g2.id
    ) computed
    WHERE g.id = computed.goal_id
      AND g.user_id = $1
      AND g.account_type IS NOT NULL
      AND g.account_id IS NULL
    `,
    [userId]
  );
}

router.get('/', async (req, res) => {
  const userId = req.user.sub;

  // Garante consistência caso existam recorrências vencidas
  // sem travar a página: segue o mesmo padrão do dashboard.
  try {
    await Promise.race([
      processRecurringTransactions(userId),
      new Promise((resolve) => setTimeout(resolve, 900)),
    ]);
  } catch (err) {
    console.error('Falha ao processar recorrências (goals):', err);
  }

  await syncGoalsProgress(userId);
  const { rows } = await pool.query(
    `SELECT
      id,
      user_id,
      name,
      account_type,
      account_id,
      target_amount,
      current_amount,
      target_date,
      status,
      created_at
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
  const valid = createGoalSchema.safeParse(req.body);
  if (!valid.success) return res.status(400).json({ error: 'validation', message: 'Payload inválido' });
  const { name, target_amount, current_amount = 0, target_date = null, status = 'active', account_type = null, account_id = null } = valid.data;

  if (!(await ensureAccountOwnership(userId, account_id))) {
    return res.status(403).json({ error: 'forbidden', message: 'Conta inválida para este usuário' });
  }

  const { rows } = await pool.query(
    `INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, status, account_type, account_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING id, user_id, name, account_type, account_id, target_amount, current_amount, target_date, status, created_at`,
    [userId, name, target_amount, current_amount, target_date, status, account_type, account_id]
  );

  // Se account_type foi passado, sincroniza current_amount/status para ficar automático.
  try {
    await syncGoalsProgress(userId);
  } catch (err) {
    console.error('Falha ao sincronizar progresso (goals POST):', err);
  }

  res.status(201).json({ goal: rows[0] });
});

router.patch('/:id', async (req, res) => {
  const userId = req.user.sub;
  const { id } = req.params;
  const { name, target_amount, current_amount, target_date, status, account_type, account_id } = req.body;

  if (account_id && !(await ensureAccountOwnership(userId, account_id))) {
    return res.status(403).json({ error: 'forbidden', message: 'Conta inválida para este usuário' });
  }

  const existing = await pool.query(
    'SELECT target_date FROM goals WHERE id = $1 AND user_id = $2 LIMIT 1',
    [id, userId]
  );
  const row = existing.rows[0];
  if (!row) return res.status(404).json({ error: 'not_found' });

  if (row.target_date) {
    const todayISO = new Date().toISOString().slice(0, 10);
    const goalDateISO = String(row.target_date).slice(0, 10);
    if (goalDateISO < todayISO) {
      return res.status(409).json({ error: 'goal_expired', message: 'Meta expirada não pode ser editada' });
    }
  }

  const { rows } = await pool.query(
    `UPDATE goals
     SET
       name = COALESCE($3, name),
       target_amount = COALESCE($4, target_amount),
       current_amount = COALESCE($5, current_amount),
       target_date = COALESCE($6, target_date),
       status = COALESCE($7, status),
       account_type = COALESCE($8, account_type),
       account_id = COALESCE($9, account_id)
     WHERE id = $1 AND user_id = $2
     RETURNING id, user_id, name, account_type, account_id, target_amount, current_amount, target_date, status, created_at`,
    [id, userId, name, target_amount, current_amount, target_date, status, account_type, account_id]
  );

  const updated = rows[0];
  if (!updated) return res.status(404).json({ error: 'not_found' });

  // Mantém progresso automático quando houver account_type.
  try {
    await syncGoalsProgress(userId);
  } catch (err) {
    console.error('Falha ao sincronizar progresso (goals PATCH):', err);
  }

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

