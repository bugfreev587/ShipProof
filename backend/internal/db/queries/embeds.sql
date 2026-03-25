-- name: CreateEmbed :one
INSERT INTO embeds (product_id, name, slug, layout)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetEmbedByID :one
SELECT * FROM embeds WHERE id = $1;

-- name: GetEmbedBySlug :one
SELECT * FROM embeds WHERE slug = $1;

-- name: ListEmbedsByProductID :many
SELECT * FROM embeds WHERE product_id = $1 ORDER BY created_at DESC;

-- name: UpdateEmbed :one
UPDATE embeds SET name = $2, updated_at = now()
WHERE id = $1
RETURNING *;

-- name: UpdateEmbedConfig :one
UPDATE embeds SET
    layout = $2,
    theme = $3,
    border_radius = $4,
    card_spacing = $5,
    show_platform_icon = $6,
    show_branding = $7,
    bg_color = $8,
    transparent_bg = $9,
    show_header = $10,
    header_text_color = $11,
    subtitle = $12,
    max_items = $13,
    visible_count = $14,
    card_size = $15,
    card_height = $16,
    text_font_size = $17,
    text_font = $18,
    text_bold = $19,
    bg_opacity = $20,
    rows = $21,
    width_percent = $22,
    auto_scroll = $23,
    scroll_direction = $24,
    updated_at = now()
WHERE id = $1
RETURNING *;

-- name: DeleteEmbed :exec
DELETE FROM embeds WHERE id = $1;

-- name: CountEmbedsByProductID :one
SELECT COUNT(*) FROM embeds WHERE product_id = $1;
