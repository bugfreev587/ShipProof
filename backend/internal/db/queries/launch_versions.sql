-- name: CreateVersion :one
INSERT INTO launch_versions (product_id, version_number, version_label, title, launch_type, platforms, content, launch_notes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
RETURNING *;

-- name: ListVersionsByProductID :many
SELECT id, product_id, version_number, version_label, title, launch_type, platforms, launch_notes, created_at
FROM launch_versions
WHERE product_id = $1
ORDER BY created_at DESC;

-- name: GetVersionByID :one
SELECT * FROM launch_versions WHERE id = $1;

-- name: GetMaxVersionNumber :one
SELECT COALESCE(MAX(version_number), 0)::integer AS max_version_number
FROM launch_versions
WHERE product_id = $1;

-- name: CountVersionsByProductID :one
SELECT COUNT(*) FROM launch_versions WHERE product_id = $1;
