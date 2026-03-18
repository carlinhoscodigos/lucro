-- Garante compatibilidade com bases já existentes (schema antigo)
-- e evita crash no deploy ao fazer SELECT de colunas inexistentes.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS plan VARCHAR(30) NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

-- Se existir usuário sem password_hash, mantém null; o login vai retornar erro explícito.

