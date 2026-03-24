-- name: GetWidgetConfigByProductID :one
SELECT * FROM widget_configs WHERE product_id = $1;

-- name: CreateDefaultWidgetConfig :one
INSERT INTO widget_configs (product_id)
VALUES ($1)
RETURNING *;

-- name: UpdateWidgetConfig :one
UPDATE widget_configs
SET theme = $2, max_items = $3, show_platform_icon = $4, border_radius = $5, card_spacing = $6, show_branding = $7, layout = $8, updated_at = now()
WHERE product_id = $1
RETURNING *;
