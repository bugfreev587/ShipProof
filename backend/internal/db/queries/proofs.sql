-- name: CreateProof :one
INSERT INTO proofs (product_id, status, collection_method, source_platform, source_url, content_type, content_text, content_image_url, author_name, author_title, author_avatar_url, linked_version_id, is_featured, display_order)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, false, 0)
RETURNING *;

-- name: ListProofsByProductID :many
SELECT * FROM proofs
WHERE product_id = $1
ORDER BY is_featured DESC, display_order ASC, created_at DESC;

-- name: GetProofByID :one
SELECT * FROM proofs WHERE id = $1;

-- name: UpdateProof :one
UPDATE proofs
SET content_text = $2, content_image_url = $3, author_name = $4, author_title = $5, author_avatar_url = $6, source_platform = $7, source_url = $8, linked_version_id = $9, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: ApproveProof :one
UPDATE proofs SET status = 'approved', updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteProof :exec
DELETE FROM proofs WHERE id = $1;

-- name: ToggleProofFeatured :one
UPDATE proofs SET is_featured = NOT is_featured, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateProofOrder :exec
UPDATE proofs SET display_order = $2, updated_at = now()
WHERE id = $1;

-- name: CountProofsByProductID :one
SELECT COUNT(*) FROM proofs WHERE product_id = $1;

-- name: UpdateProofExtractedContent :exec
UPDATE proofs
SET content_text = CASE WHEN content_text IS NULL OR content_text = '' THEN $2 ELSE content_text END,
    author_name = CASE WHEN author_name IN ('', 'Screenshot', 'Anonymous') THEN $3 ELSE author_name END,
    author_title = CASE WHEN author_title IS NULL OR author_title = '' THEN $4 ELSE author_title END,
    source_platform = CASE WHEN source_platform = 'other' THEN $5 ELSE source_platform END,
    content_type = 'text',
    content_image_url = NULL,
    updated_at = NOW()
WHERE id = $1;

-- name: GetProductBySlug :one
SELECT * FROM products WHERE slug = $1;

-- name: ListApprovedProofsByProductID :many
SELECT * FROM proofs
WHERE product_id = $1 AND status = 'approved'
ORDER BY is_featured DESC, display_order ASC, created_at DESC;

-- name: RejectProof :one
UPDATE proofs SET status = 'rejected', updated_at = now()
WHERE id = $1
RETURNING *;

-- name: CreatePublicProof :one
INSERT INTO proofs (
  product_id, status, collection_method, source_platform,
  content_type, content_text, content_image_url,
  author_name, author_email, author_handle, author_title,
  rating, submitted_ip_hash
) VALUES (
  $1, 'pending', 'submission', $2,
  'text', $3, $4,
  $5, $6, $7, $8,
  $9, $10
) RETURNING *;

-- name: CountPendingProofsByProduct :one
SELECT COUNT(*) FROM proofs WHERE product_id = $1 AND status = 'pending';
