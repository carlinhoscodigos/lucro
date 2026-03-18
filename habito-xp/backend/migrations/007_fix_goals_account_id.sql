-- Metas podem ser vinculadas a uma conta específica do usuário.
-- Assim o progresso é calculado com base no saldo/lançamentos daquela conta.

ALTER TABLE goals
  ADD COLUMN IF NOT EXISTS account_id UUID;

CREATE INDEX IF NOT EXISTS idx_goals_user_account_id
  ON goals(user_id, account_id);

