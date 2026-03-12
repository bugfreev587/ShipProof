-- name: ListProductsByUserID :many
SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC;

-- name: GetProductByID :one
SELECT * FROM products WHERE id = $1;

-- name: CreateProduct :one
INSERT INTO products (user_id, name, slug, url, description)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: UpdateProduct :one
UPDATE products
SET name = $2, url = $3, description = $4, description_long = $5, target_audience = $6, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteProduct :exec
DELETE FROM products WHERE id = $1;
