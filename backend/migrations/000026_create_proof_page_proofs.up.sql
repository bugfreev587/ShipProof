CREATE TABLE IF NOT EXISTS proof_page_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(product_id, proof_id)
);

CREATE INDEX IF NOT EXISTS idx_proof_page_proofs_product ON proof_page_proofs(product_id);
