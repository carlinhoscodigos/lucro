import 'dotenv/config';
import bcrypt from 'bcryptjs';
import pg from 'pg';

const { Pool } = pg;

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} não definido`);
  return value;
}

async function run() {
  const email = required('ADMIN_EMAIL').trim().toLowerCase();
  const password = required('ADMIN_PASSWORD');
  const name = (process.env.ADMIN_NAME || 'Administrador').trim().slice(0, 150);

  if (password.length < 12) {
    throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres.');
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const passwordHash = await bcrypt.hash(password, 12);

  const { rows } = await pool.query(
    `INSERT INTO users (name, email, password_hash, plan, role, is_active)
     VALUES ($1, $2, $3, 'free', 'admin', true)
     ON CONFLICT (email) DO UPDATE
       SET role = 'admin',
           is_active = true
     RETURNING id, email, role`,
    [name, email, passwordHash]
  );

  console.log('Admin provisionado com sucesso:', rows[0]);
  await pool.end();
}

run().catch((err) => {
  console.error('Falha ao provisionar admin:', err.message);
  process.exit(1);
});

