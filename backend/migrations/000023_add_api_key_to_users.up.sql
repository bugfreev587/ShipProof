ALTER TABLE users ADD COLUMN api_key TEXT UNIQUE;
CREATE INDEX idx_users_api_key ON users(api_key);
ALTER TYPE collection_method ADD VALUE IF NOT EXISTS 'extension';
