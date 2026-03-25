ALTER TABLE proofs DROP COLUMN IF EXISTS author_email;
ALTER TABLE proofs DROP COLUMN IF EXISTS author_handle;
ALTER TABLE proofs DROP COLUMN IF EXISTS rating;
ALTER TABLE proofs DROP COLUMN IF EXISTS video_url;
ALTER TABLE proofs DROP COLUMN IF EXISTS video_duration_seconds;
ALTER TABLE proofs DROP COLUMN IF EXISTS submitted_ip_hash;
-- Note: Cannot remove enum values in PostgreSQL
