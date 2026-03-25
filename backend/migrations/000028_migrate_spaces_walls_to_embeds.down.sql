-- Reverse migration: remove migrated data from embeds
-- (Old spaces/walls tables are preserved, so just clean embed tables)
DELETE FROM embed_proofs;
DELETE FROM embeds;
DELETE FROM proof_page_proofs;
