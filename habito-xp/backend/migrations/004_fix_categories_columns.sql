-- Compatibilidade para bases antigas onde categories não tinha colunas novas

ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS color VARCHAR(20),
  ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
  ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

CREATE UNIQUE INDEX IF NOT EXISTS ux_categories_user_name_type
ON categories(user_id, name, type);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

