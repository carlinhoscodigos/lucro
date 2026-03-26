import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../db.js';
import { signToken, requireAuth } from '../auth.js';
import { requireBodyFields } from '../utils.js';

const router = express.Router();
const AUTH_DEBUG = String(process.env.AUTH_DEBUG || '').toLowerCase() === 'true';
const AUTH_AUTO_REGISTER = String(process.env.AUTH_AUTO_REGISTER || 'false').toLowerCase() === 'true';

function maskEmail(email) {
  const e = String(email || '');
  const [local, domain] = e.split('@');
  if (!domain) return 'email-invalido';
  if (!local) return `***@${domain}`;
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

function guessNameFromEmail(email) {
  const local = String(email || '').split('@')[0] || 'Usuário';
  const cleaned = local.replace(/[._-]+/g, ' ').trim();
  if (!cleaned) return 'Usuário';
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
    .slice(0, 150);
}

router.get('/login', (_req, res) => {
  return res.status(405).json({
    error: 'method_not_allowed',
    message: 'Use POST /auth/login com { email, password }',
  });
});

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
    // Limpeza automática de contas expiradas
    await pool.query(
      `DELETE FROM users
       WHERE expires_on IS NOT NULL
         AND expires_on < CURRENT_DATE`
    );

    const missing = requireBodyFields(req.body, ['email', 'password']);
    if (missing.length) return res.status(400).json({ error: 'validation', missing });

    const rawEmail = String(req.body.email || '');
    const rawPassword = String(req.body.password || '');
    const email = rawEmail.trim().toLowerCase();
    const password = rawPassword;
    const masked = maskEmail(email);

    if (AUTH_DEBUG) {
      console.log('[AUTH_DEBUG] login:start', {
        email: masked,
        emailLen: email.length,
        passwordLen: password.length,
      });
    }

    const { rows } = await pool.query(
      'SELECT id, email, name, password_hash, is_active, plan, role, expires_on FROM users WHERE lower(email) = $1 LIMIT 1',
      [email]
    );

    let user = rows[0];
    if (!user) {
      if (AUTH_DEBUG) console.log('[AUTH_DEBUG] login:fail_user_not_found', { email: masked });

      if (!AUTH_AUTO_REGISTER) {
        return res.status(401).json({ error: 'invalid_credentials', message: 'Credenciais inválidas' });
      }

      // Auto cadastro local no primeiro login (útil quando o usuário existe no Clerk
      // mas ainda não foi provisionado na tabela users desta API).
      const passwordHash = await bcrypt.hash(password, 10);
      const guessedName = guessNameFromEmail(email);

      try {
        const created = await pool.query(
          `INSERT INTO users (email, name, password_hash, plan, is_active, role)
           VALUES ($1, $2, $3, 'free', true, 'user')
           RETURNING id, email, name, password_hash, is_active, plan, role`,
          [email, guessedName, passwordHash]
        );
        user = created.rows[0];
        if (AUTH_DEBUG) {
          console.log('[AUTH_DEBUG] login:auto_register_created', {
            userId: user.id,
            email: masked,
          });
        }
      } catch (err) {
        // Se outra requisição criou ao mesmo tempo, buscamos de novo.
        if (err?.code === '23505') {
          const retry = await pool.query(
            'SELECT id, email, name, password_hash, is_active, plan, role FROM users WHERE lower(email) = $1 LIMIT 1',
            [email]
          );
          user = retry.rows[0];
          if (AUTH_DEBUG) {
            console.log('[AUTH_DEBUG] login:auto_register_race_retry', {
              found: Boolean(user),
              email: masked,
            });
          }
        } else {
          throw err;
        }
      }

      if (!user) {
        return res.status(401).json({ error: 'invalid_credentials', message: 'Credenciais inválidas' });
      }
    }
    if (!user.is_active) {
      if (AUTH_DEBUG) console.log('[AUTH_DEBUG] login:fail_user_inactive', { userId: user.id, email: masked });
      return res.status(403).json({ error: 'inactive', message: 'Usuário inativo' });
    }
    if (!user.password_hash) {
      if (AUTH_DEBUG) console.log('[AUTH_DEBUG] login:fail_no_password_hash', { userId: user.id, email: masked });
      return res.status(500).json({ error: 'server_error', message: 'Usuário sem senha configurada' });
    }

    const stored = String(user.password_hash).trim();
    let ok = false;

    // Fluxo normal: senha hash bcrypt.
    try {
      ok = await bcrypt.compare(password, stored);
      if (AUTH_DEBUG) {
        console.log('[AUTH_DEBUG] login:bcrypt_compare', {
          userId: user.id,
          email: masked,
          hashPrefix: stored.slice(0, 4),
          hashLen: stored.length,
          bcryptOk: ok,
        });
      }
    } catch {
      ok = false;
      if (AUTH_DEBUG) {
        console.log('[AUTH_DEBUG] login:bcrypt_compare_exception', {
          userId: user.id,
          email: masked,
          hashPrefix: stored.slice(0, 4),
          hashLen: stored.length,
        });
      }
    }

    // Fallback para bases legadas onde senha pode ter ficado em texto puro.
    // Se bater, migra imediatamente para hash seguro.
    if (!ok && stored === password) {
      ok = true;
      const newHash = await bcrypt.hash(password, 10);
      await pool.query('UPDATE users SET password_hash = $2 WHERE id = $1', [user.id, newHash]);
      if (AUTH_DEBUG) {
        console.log('[AUTH_DEBUG] login:legacy_plaintext_migrated', {
          userId: user.id,
          email: masked,
        });
      }
    }

    if (!ok) {
      if (AUTH_DEBUG) {
        console.log('[AUTH_DEBUG] login:fail_invalid_credentials', {
          userId: user.id,
          email: masked,
        });
      }
      return res.status(401).json({ error: 'invalid_credentials', message: 'Credenciais inválidas' });
    }

    await ensureDefaultCategories(user.id);

    const token = signToken({ sub: user.id, role: user.role || 'user' });
    if (AUTH_DEBUG) {
      console.log('[AUTH_DEBUG] login:success', {
        userId: user.id,
        email: masked,
      });
    }
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        role: user.role || 'user',
        expires_on: user.expires_on ?? null,
      },
    });
  } catch (err) {
    console.error('Erro no /auth/login:', err);
    if (AUTH_DEBUG) {
      console.log('[AUTH_DEBUG] login:exception', {
        message: err?.message,
        code: err?.code,
      });
    }
    return res.status(500).json({ error: 'server_error', message: 'Erro interno no login' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  const userId = req.user.sub;
  const { rows } = await pool.query('SELECT id, email, name, plan, role, is_active, expires_on FROM users WHERE id = $1', [userId]);
  const user = rows[0];
  if (!user) return res.status(404).json({ error: 'not_found' });
  return res.json({ user });
});

export default router;

