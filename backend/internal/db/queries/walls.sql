-- name: CreateWall :one
INSERT INTO walls (product_id, name, slug)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListWallsByProductID :many
SELECT * FROM walls WHERE product_id = $1 ORDER BY created_at DESC;

-- name: GetWallByID :one
SELECT * FROM walls WHERE id = $1;

-- name: GetWallBySlug :one
SELECT * FROM walls WHERE slug = $1;

-- name: UpdateWall :one
UPDATE walls SET name = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateWallConfig :one
UPDATE walls SET
    theme = $2,
    border_radius = $3,
    card_spacing = $4,
    show_platform_icon = $5,
    show_branding = $6,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteWall :exec
DELETE FROM walls WHERE id = $1;

-- name: CountWallsByProductID :one
SELECT COUNT(*) FROM walls WHERE product_id = $1;
