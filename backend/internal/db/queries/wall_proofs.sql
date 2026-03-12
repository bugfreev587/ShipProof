-- name: AddProofToWall :one
INSERT INTO wall_proofs (wall_id, proof_id, display_order)
VALUES ($1, $2, $3)
ON CONFLICT (wall_id, proof_id) DO NOTHING
RETURNING *;

-- name: RemoveProofFromWall :exec
DELETE FROM wall_proofs WHERE wall_id = $1 AND proof_id = $2;

-- name: ListProofsByWallID :many
SELECT p.*, wp.display_order as wall_display_order FROM wall_proofs wp
JOIN proofs p ON p.id = wp.proof_id
WHERE wp.wall_id = $1
ORDER BY wp.display_order ASC, p.created_at DESC;

-- name: UpdateWallProofOrder :exec
UPDATE wall_proofs SET display_order = $3
WHERE wall_id = $1 AND proof_id = $2;
