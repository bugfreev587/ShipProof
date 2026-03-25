-- Migrate Spaces to Embeds (layout='inline_strip')
-- Note: spaces.max_items was removed in migration 017, so we use default (6)
-- Note: spaces.theme is widget_theme enum, cast to varchar
INSERT INTO embeds (id, product_id, name, slug, layout, theme, border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color,
  visible_count, card_size, card_height, text_font_size, text_font, text_bold,
  bg_opacity, rows, width_percent, created_at, updated_at)
SELECT s.id, s.product_id, s.name, s.slug, 'inline_strip', s.theme::text::varchar(10), s.border_radius,
  s.card_spacing, s.show_platform_icon, s.show_branding, s.bg_color,
  s.visible_count, s.card_size, s.card_height, s.text_font_size, s.text_font, s.text_bold,
  s.bg_opacity, s.rows, s.width_percent, s.created_at, s.updated_at
FROM spaces s
ON CONFLICT (id) DO NOTHING;

-- Migrate Space Proofs to Embed Proofs
INSERT INTO embed_proofs (id, embed_id, proof_id, display_order)
SELECT sp.id, sp.space_id, sp.proof_id, sp.display_order FROM space_proofs sp
ON CONFLICT (id) DO NOTHING;

-- Migrate Walls to Embeds (layout='wall_grid')
-- Note: walls.theme is widget_theme enum, cast to varchar
-- Use gen_random_uuid() for any wall whose ID conflicts with a space ID
INSERT INTO embeds (id, product_id, name, slug, layout, theme, border_radius,
  card_spacing, show_platform_icon, show_branding, bg_color, transparent_bg,
  show_header, header_text_color, subtitle, created_at, updated_at)
SELECT
  CASE WHEN EXISTS (SELECT 1 FROM spaces WHERE spaces.id = w.id) THEN gen_random_uuid() ELSE w.id END,
  w.product_id, w.name, w.slug, 'wall_grid', w.theme::text::varchar(10), w.border_radius,
  w.card_spacing, w.show_platform_icon, w.show_branding, w.bg_color, w.transparent_bg,
  w.show_header, w.header_text_color, w.subtitle, w.created_at, w.updated_at
FROM walls w
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
  SELECT w2.id FROM walls w2 WHERE w2.product_id = w.product_id ORDER BY w2.created_at LIMIT 1
)
ON CONFLICT (product_id, proof_id) DO NOTHING;
