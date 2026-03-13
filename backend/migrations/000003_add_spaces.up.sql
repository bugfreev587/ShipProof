-- Spaces: named, embeddable collections of selected proofs
CREATE TABLE spaces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    theme widget_theme NOT NULL DEFAULT 'dark',
    max_items INTEGER NOT NULL DEFAULT 6,
    show_platform_icon BOOLEAN NOT NULL DEFAULT true,
    border_radius INTEGER NOT NULL DEFAULT 12,
    card_spacing INTEGER NOT NULL DEFAULT 16,
    show_branding BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE space_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    space_id UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
    proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(space_id, proof_id)
);

CREATE INDEX idx_spaces_product_id ON spaces(product_id);
CREATE INDEX idx_spaces_slug ON spaces(slug);
CREATE INDEX idx_space_proofs_space_id ON space_proofs(space_id);
