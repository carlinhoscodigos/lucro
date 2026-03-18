-- Compatibilidade para bases antigas onde accounts não tinha colunas novas

ALTER TABLE accounts
  ADD COLUMN IF NOT EXISTS initial_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);

