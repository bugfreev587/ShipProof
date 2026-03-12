-- name: CreateProof :one
INSERT INTO proofs (product_id, status, collection_method, source_platform, source_url, content_type, content_text, content_image_url, author_name, author_title, author_avatar_url, linked_version_id, is_featured, display_order)
VALUES ($1, 'approved', 'manual', $2, $3, $4, $5, $6, $7, $8, $9, $10, false, 0)
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

-- name: GetProductBySlug :one
SELECT * FROM products WHERE slug = $1;

-- name: ListApprovedProofsByProductID :many
SELECT * FROM proofs
WHERE product_id = $1 AND status = 'approved'
ORDER BY is_featured DESC, display_order ASC, created_at DESC;
