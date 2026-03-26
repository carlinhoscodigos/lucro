ALTER TABLE users
  ADD COLUMN IF NOT EXISTS expires_on DATE;

-- Usuários antigos sem expiração: deixa em aberto (sem autoexclusão)
-- Admin principal: garante acesso contínuo.
UPDATE users
SET expires_on = DATE '2099-12-31'
WHERE lower(email) = 'carlitodopalito@gmail.com';

CREATE INDEX IF NOT EXISTS idx_users_expires_on ON users(expires_on);

