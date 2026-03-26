CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'user';

-- Garante valor válido em bases antigas
UPDATE users
SET role = 'user'
WHERE role IS NULL OR role NOT IN ('admin', 'user');

