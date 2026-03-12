-- name: AddTagToProof :one
INSERT INTO proof_tags (proof_id, tag)
VALUES ($1, $2)
ON CONFLICT (proof_id, tag) DO NOTHING
RETURNING *;

-- name: RemoveTagFromProof :exec
DELETE FROM proof_tags WHERE proof_id = $1 AND tag = $2;

-- name: ListTagsByProofID :many
SELECT * FROM proof_tags WHERE proof_id = $1 ORDER BY tag;

-- name: ListDistinctTagsByProductID :many
SELECT DISTINCT pt.tag FROM proof_tags pt
JOIN proofs p ON p.id = pt.proof_id
WHERE p.product_id = $1
ORDER BY pt.tag;
