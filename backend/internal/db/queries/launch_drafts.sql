-- name: GetDraftByProductID :one
SELECT * FROM launch_drafts WHERE product_id = $1;

-- name: UpsertDraft :one
INSERT INTO launch_drafts (product_id, launch_type, platforms, content, launch_notes)
VALUES ($1, $2, $3, $4, $5)
ON CONFLICT (product_id) DO UPDATE
SET launch_type = EXCLUDED.launch_type,
    platforms = EXCLUDED.platforms,
    content = EXCLUDED.content,
    launch_notes = EXCLUDED.launch_notes,
    updated_at = now()
RETURNING *;

-- name: UpdateDraftContent :one
UPDATE launch_drafts
SET content = $2, platforms = $3, updated_at = now()
WHERE product_id = $1
RETURNING *;

-- name: DeleteDraftByProductID :exec
DELETE FROM launch_drafts WHERE product_id = $1;

-- name: CountDraftsThisMonth :one
SELECT COUNT(*) FROM launch_drafts
WHERE product_id IN (SELECT id FROM products WHERE user_id = $1)
AND created_at >= date_trunc('month', now());
