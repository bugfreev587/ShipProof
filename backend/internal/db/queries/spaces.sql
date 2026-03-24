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
    show_platform_icon = $3,
    border_radius = $4,
    card_spacing = $5,
    show_branding = $6,
    visible_count = $7,
    card_size = $8,
    card_height = $9,
    text_font_size = $10,
    text_font = $11,
    text_bold = $12,
    bg_color = $13,
    bg_opacity = $14,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteSpace :exec
DELETE FROM spaces WHERE id = $1;

-- name: CountSpacesByProductID :one
SELECT COUNT(*) FROM spaces WHERE product_id = $1;
