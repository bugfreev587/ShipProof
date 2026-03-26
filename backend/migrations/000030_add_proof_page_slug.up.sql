ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_slug VARCHAR(20) UNIQUE;

-- Backfill existing products with 6-char random slugs
-- Using substring of gen_random_uuid for simplicity
UPDATE products SET proof_page_slug = LOWER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 6))
WHERE proof_page_slug IS NULL;

-- Handle any collisions by appending extra chars
UPDATE products p1 SET proof_page_slug = LOWER(SUBSTRING(REPLACE(gen_random_uuid()::text, '-', '') FROM 1 FOR 8))
WHERE proof_page_slug IN (
  SELECT proof_page_slug FROM products GROUP BY proof_page_slug HAVING COUNT(*) > 1
);

-- Make it NOT NULL after backfill
ALTER TABLE products ALTER COLUMN proof_page_slug SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_proof_page_slug ON products(proof_page_slug);
