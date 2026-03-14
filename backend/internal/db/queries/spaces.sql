-- name: CreateSpace :one
INSERT INTO spaces (product_id, name, slug)
VALUES ($1, $2, $3)
RETURNING *;

-- name: ListSpacesByProductID :many
SELECT * FROM spaces WHERE product_id = $1 ORDER BY created_at DESC;

-- name: GetSpaceByID :one
SELECT * FROM spaces WHERE id = $1;

-- name: GetSpaceBySlug :one
SELECT * FROM spaces WHERE slug = $1;

-- name: UpdateSpace :one
UPDATE spaces SET name = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateSpaceConfig :one
UPDATE spaces SET
    theme = $2,
    max_items = $3,
    show_platform_icon = $4,
    border_radius = $5,
    card_spacing = $6,
    show_branding = $7,
    visible_count = $8,
    card_size = $9,
    card_height = $10,
    text_font_size = $11,
    text_font = $12,
    text_bold = $13,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteSpace :exec
DELETE FROM spaces WHERE id = $1;

-- name: CountSpacesByProductID :one
SELECT COUNT(*) FROM spaces WHERE product_id = $1;
