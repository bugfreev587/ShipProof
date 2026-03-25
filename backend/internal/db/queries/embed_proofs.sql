-- name: AddProofToEmbed :one
INSERT INTO embed_proofs (embed_id, proof_id, display_order)
VALUES ($1, $2, $3)
ON CONFLICT (embed_id, proof_id) DO NOTHING
RETURNING *;

-- name: RemoveProofFromEmbed :exec
DELETE FROM embed_proofs WHERE embed_id = $1 AND proof_id = $2;

-- name: ListProofsByEmbedID :many
SELECT p.*, ep.display_order as embed_display_order FROM embed_proofs ep
JOIN proofs p ON p.id = ep.proof_id
WHERE ep.embed_id = $1
ORDER BY ep.display_order ASC, p.created_at DESC;

-- name: UpdateEmbedProofOrder :exec
UPDATE embed_proofs SET display_order = $3
WHERE embed_id = $1 AND proof_id = $2;
