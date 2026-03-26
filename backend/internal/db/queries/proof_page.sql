-- name: GetProofPageConfig :one
SELECT id, name, slug, url, description, logo_url,
       proof_page_title, proof_page_subtitle, proof_page_theme,
       proof_page_show_form, proof_page_form_heading, proof_page_show_branding,
       proof_page_cta_text, proof_page_cta_url, proof_page_slug
FROM products WHERE id = $1;

-- name: UpdateProofPageConfig :exec
UPDATE products SET
  proof_page_title = $2,
  proof_page_subtitle = $3,
  proof_page_theme = $4,
  proof_page_show_form = $5,
  proof_page_form_heading = $6,
  proof_page_show_branding = $7,
  proof_page_cta_text = $8,
  proof_page_cta_url = $9,
  updated_at = NOW()
WHERE id = $1;

-- name: ListProofPageProofs :many
SELECT p.*, pp.display_order as page_display_order FROM proofs p
JOIN proof_page_proofs pp ON p.id = pp.proof_id
WHERE pp.product_id = $1 AND p.status = 'approved'
ORDER BY pp.display_order ASC, p.created_at DESC;

-- name: AddProofToProofPage :exec
INSERT INTO proof_page_proofs (product_id, proof_id, display_order)
VALUES ($1, $2, $3)
ON CONFLICT (product_id, proof_id) DO NOTHING;

-- name: RemoveProofFromProofPage :exec
DELETE FROM proof_page_proofs WHERE product_id = $1 AND proof_id = $2;

-- name: UpdateProofPageProofOrder :exec
UPDATE proof_page_proofs SET display_order = $3
WHERE product_id = $1 AND proof_id = $2;

-- name: GetPublicProofPageData :one
SELECT id, name, slug, url, description, logo_url,
       proof_page_title, proof_page_subtitle, proof_page_theme,
       proof_page_show_form, proof_page_form_heading, proof_page_show_branding,
       proof_page_cta_text, proof_page_cta_url, proof_page_slug
FROM products WHERE proof_page_slug = $1;

-- name: ListPublicProofPageProofs :many
SELECT p.* FROM proofs p
JOIN proof_page_proofs pp ON p.id = pp.proof_id
WHERE pp.product_id = $1 AND p.status = 'approved'
ORDER BY pp.display_order ASC, p.created_at DESC;
