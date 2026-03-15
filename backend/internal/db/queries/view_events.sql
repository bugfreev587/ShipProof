-- name: RecordView :exec
INSERT INTO view_events (entity_type, entity_id, product_id, referrer)
VALUES ($1, $2, $3, $4);

-- name: CountViewsByProduct :many
SELECT entity_type, COUNT(*) AS view_count
FROM view_events
WHERE product_id = $1
GROUP BY entity_type;

-- name: CountViewsByEntity :one
SELECT COUNT(*) AS view_count
FROM view_events
WHERE entity_type = $1 AND entity_id = $2;

-- name: CountViewsByProductGrouped :many
SELECT entity_type, entity_id, COUNT(*) AS view_count
FROM view_events
WHERE product_id = $1
GROUP BY entity_type, entity_id;
