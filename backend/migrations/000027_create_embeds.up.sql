CREATE TABLE IF NOT EXISTS embeds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  layout VARCHAR(20) NOT NULL DEFAULT 'wall_grid',
  theme VARCHAR(10) DEFAULT 'dark',
  border_radius INTEGER DEFAULT 12,
  card_spacing INTEGER DEFAULT 16,
  show_platform_icon BOOLEAN DEFAULT true,
  show_branding BOOLEAN DEFAULT true,
  bg_color TEXT DEFAULT '',
  transparent_bg BOOLEAN DEFAULT false,
  show_header BOOLEAN DEFAULT true,
  header_text_color TEXT DEFAULT '',
  subtitle TEXT DEFAULT '',
  max_items INTEGER DEFAULT 6,
  visible_count INTEGER DEFAULT 3,
  card_size INTEGER DEFAULT 280,
  card_height INTEGER DEFAULT 0,
  text_font_size INTEGER DEFAULT 13,
  text_font TEXT DEFAULT 'Inter',
  text_bold BOOLEAN DEFAULT false,
  bg_opacity INTEGER DEFAULT 100,
  rows INTEGER DEFAULT 1,
  width_percent INTEGER DEFAULT 100,
  auto_scroll BOOLEAN DEFAULT true,
  scroll_direction VARCHAR(20) DEFAULT 'left',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS embed_proofs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embed_id UUID NOT NULL REFERENCES embeds(id) ON DELETE CASCADE,
  proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,
  UNIQUE(embed_id, proof_id)
);

CREATE INDEX IF NOT EXISTS idx_embeds_product ON embeds(product_id);
CREATE INDEX IF NOT EXISTS idx_embeds_slug ON embeds(slug);
CREATE INDEX IF NOT EXISTS idx_embed_proofs_embed ON embed_proofs(embed_id);
