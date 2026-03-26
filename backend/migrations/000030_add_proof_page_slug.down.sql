DROP INDEX IF EXISTS idx_products_proof_page_slug;
ALTER TABLE products DROP COLUMN IF EXISTS proof_page_slug;
