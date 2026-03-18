import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();

async function ensureDefaultCategories(userId) {
  const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM categories WHERE user_id = $1', [userId]);
  if ((rows[0]?.count ?? 0) > 0) return;

  // Defaults apenas para "configurar" a conta logo no primeiro login.
  // Não é mock de transações; o usuário pode editar/remover depois.
  const defaults = [
    // incomes
    { name: 'Salário', type: 'income', color: '#10b981', icon: 'wallet', is_default: true },
    { name: 'Vendas', type: 'income', color: '#34d399', icon: 'shopping-cart', is_default: false },

    // expenses
    { name: 'Alimentação', type: 'expense', color: '#22c55e', icon: 'utensils', is_default: true },
    { name: 'Moradia', type: 'expense', color: '#16a34a', icon: 'home', is_default: true },
    { name: 'Transporte', type: 'expense', color: '#84cc16', icon: 'car', is_default: false },
    { name: 'Lazer', type: 'expense', color: '#f97316', icon: 'smile', is_default: false },
    { name: 'Saúde', type: 'expense', color: '#06b6d4', icon: 'heart', is_default: false },
  ];

  for (const c of defaults) {
    await pool.query(
      `INSERT INTO categories (user_id, name, type, color, icon, is_default)
       SELECT $1, $2, $3, $4, $5, $6
       WHERE NOT EXISTS (
         SELECT 1 FROM categories
         WHERE user_id = $1 AND name = $2 AND type = $3
       )`,
      [userId, c.name, c.type, c.color, c.icon, c.is_default]
    );
  }
}

router.post('/login', async (req, res) => {
  try {
    const missing = requireBodyFields(req.body, ['email', 'password']);
    if (missing.length) return res.status(400).json({ error: 'validation', missing });

    const { email, password } = req.body;

    const { rows } = await pool.query(
      'SELECT id, email, name, password_hash, is_active, plan FROM users WHERE email = $1 LIMIT 1',
      [email]
    );

    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid_credentials', message: 'Credenciais inválidas' });
    if (!user.is_active) return res.status(403).json({ error: 'inactive', message: 'Usuário inativo' });
    if (!user.password_hash) {
      return res.status(500).json({ error: 'server_error', message: 'Usuário sem senha configurada' });
    }

    const ok = await bcrypt.compare(String(password), String(user.password_hash));
    if (!ok) return res.status(401).json({ error: 'invalid_credentials', message: 'Credenciais inválidas' });

    await ensureDefaultCategories(user.id);

    const token = signToken({ sub: user.id });
    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan },
    });
  } catch (err) {
    console.error('Erro no /auth/login:', err);
    return res.status(500).json({ error: 'server_error', message: 'Erro interno no login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query('SELECT id, email, name, plan, is_active FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json({ user });
});

export default router;

