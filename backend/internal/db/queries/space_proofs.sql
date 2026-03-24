-- name: AddProofToSpace :one
INSERT INTO space_proofs (space_id, proof_id, display_order)
VALUES ($1, $2, $3)
ON CONFLICT (space_id, proof_id) DO UPDATE SET display_order = EXCLUDED.display_order
RETURNING *;

-- name: RemoveProofFromSpace :exec
DELETE FROM space_proofs WHERE space_id = $1 AND proof_id = $2;

-- name: ListProofsBySpaceID :many
SELECT p.*, sp.display_order as space_display_order FROM space_proofs sp
JOIN proofs p ON p.id = sp.proof_id
WHERE sp.space_id = $1
ORDER BY sp.display_order ASC, p.created_at DESC;

-- name: UpdateSpaceProofOrder :exec
UPDATE space_proofs SET display_order = $3
WHERE space_id = $1 AND proof_id = $2;
