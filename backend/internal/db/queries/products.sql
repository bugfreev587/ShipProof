-- name: ListProductsByUserID :many
SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: CreateProduct :one
INSERT INTO products (user_id, name, slug, url, description, logo_url, proof_page_slug)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET name = $2, url = $3, description = $4, description_long = $5, target_audience = $6, logo_url = $7, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;

-- name: GetProductByProofPageSlug :one
SELECT * FROM products WHERE proof_page_slug = $1;

-- name: UpdateProofPageSlug :exec
UPDATE products SET proof_page_slug = $2, updated_at = NOW()
WHERE id = $1;

-- name: CheckProofPageSlugAvailable :one
SELECT COUNT(*) FROM products WHERE proof_page_slug = $1 AND id != $2;
