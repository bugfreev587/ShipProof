-- Migrate Spaces to Embeds (layout='inline_strip')
INSERT INTO embeds (id, product_id, name, slug, layout, theme, border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color,
  max_items, visible_count, card_size, card_height, text_font_size, text_font, text_bold,
  bg_opacity, rows, width_percent, created_at, updated_at)
SELECT id, product_id, name, slug, 'inline_strip', theme::varchar(10), border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color,
  max_items, visible_count, card_size, card_height, text_font_size, text_font, text_bold,
  bg_opacity, rows, width_percent, created_at, updated_at
FROM spaces
ON CONFLICT (id) DO NOTHING;

-- Migrate Space Proofs to Embed Proofs
INSERT INTO embed_proofs (id, embed_id, proof_id, display_order)
SELECT id, space_id, proof_id, display_order FROM space_proofs
ON CONFLICT (id) DO NOTHING;

-- Migrate Walls to Embeds (layout='wall_grid')
-- Use gen_random_uuid() for any wall whose ID conflicts with a space ID
INSERT INTO embeds (id, product_id, name, slug, layout, theme, border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color, transparent_bg,
  show_header, header_text_color, subtitle, created_at, updated_at)
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM spaces WHERE spaces.id = walls.id) THEN gen_random_uuid() ELSE walls.id END,
  product_id, name, slug, 'wall_grid', theme::varchar(10), border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color, transparent_bg,
  show_header, header_text_color, subtitle, created_at, updated_at
FROM walls
ON CONFLICT (id) DO NOTHING;

-- Migrate Wall Proofs to Embed Proofs
-- For walls with conflicting IDs, look up the new embed ID by slug
INSERT INTO embed_proofs (embed_id, proof_id, display_order)
SELECT e.id, wp.proof_id, wp.display_order
FROM wall_proofs wp
JOIN walls w ON w.id = wp.wall_id
JOIN embeds e ON e.slug = w.slug
ON CONFLICT (embed_id, proof_id) DO NOTHING;

-- Populate proof_page_proofs from the first wall of each product
INSERT INTO proof_page_proofs (product_id, proof_id, display_order)
SELECT DISTINCT ON (w.product_id, wp.proof_id)
  w.product_id, wp.proof_id, wp.display_order
FROM wall_proofs wp
JOIN walls w ON w.id = wp.wall_id
WHERE w.id = (
  SELECT id FROM walls w2 WHERE w2.product_id = w.product_id ORDER BY w2.created_at LIMIT 1
)
ON CONFLICT (product_id, proof_id) DO NOTHING;
