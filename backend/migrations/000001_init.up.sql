-- Enum types
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'business');
CREATE TYPE launch_type AS ENUM ('initial', 'feature_update', 'major_update');
CREATE TYPE proof_status AS ENUM ('approved', 'pending', 'rejected');
CREATE TYPE collection_method AS ENUM ('manual', 'form');
CREATE TYPE source_platform AS ENUM ('product_hunt', 'reddit', 'twitter', 'hackernews', 'indiehackers', 'direct', 'other');
CREATE TYPE content_type AS ENUM ('text', 'image');
CREATE TYPE widget_theme AS ENUM ('dark', 'light');

-- Users (synced from Clerk)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_id TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    plan user_plan NOT NULL DEFAULT 'free',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_clerk_id ON users(clerk_id);

-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    url TEXT,
    description TEXT,
    description_long TEXT,
    target_audience TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_slug ON products(slug);

-- Launch Drafts (one per product)
CREATE TABLE launch_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    launch_type launch_type NOT NULL DEFAULT 'initial',
    platforms JSONB NOT NULL DEFAULT '[]',
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Launch Versions (immutable)
CREATE TABLE launch_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    version_label TEXT NOT NULL,
    title TEXT NOT NULL,
    launch_type launch_type NOT NULL,
    platforms JSONB NOT NULL DEFAULT '[]',
    content JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(product_id, version_number)
);

CREATE INDEX idx_launch_versions_product_id ON launch_versions(product_id);

-- Proofs
CREATE TABLE proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    status proof_status NOT NULL DEFAULT 'approved',
    collection_method collection_method NOT NULL DEFAULT 'manual',
    source_platform source_platform NOT NULL DEFAULT 'other',
    source_url TEXT,
    content_type content_type NOT NULL DEFAULT 'text',
    content_text TEXT,
    content_image_url TEXT,
    author_name TEXT NOT NULL,
    author_title TEXT,
    author_avatar_url TEXT,
    proof_date DATE NOT NULL DEFAULT CURRENT_DATE,
    linked_version_id UUID REFERENCES launch_versions(id) ON DELETE SET NULL,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_proofs_product_id ON proofs(product_id);
CREATE INDEX idx_proofs_linked_version_id ON proofs(linked_version_id);

-- Proof Tags (many-to-many)
CREATE TABLE proof_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
    tag TEXT NOT NULL,
    UNIQUE(proof_id, tag)
);

CREATE INDEX idx_proof_tags_proof_id ON proof_tags(proof_id);
CREATE INDEX idx_proof_tags_tag ON proof_tags(tag);

-- Walls
CREATE TABLE walls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_walls_product_id ON walls(product_id);
CREATE INDEX idx_walls_slug ON walls(slug);

-- Wall Proofs (many-to-many with ordering)
CREATE TABLE wall_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wall_id UUID NOT NULL REFERENCES walls(id) ON DELETE CASCADE,
    proof_id UUID NOT NULL REFERENCES proofs(id) ON DELETE CASCADE,
    display_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(wall_id, proof_id)
);

CREATE INDEX idx_wall_proofs_wall_id ON wall_proofs(wall_id);

-- Widget Configs (one per product)
CREATE TABLE widget_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    theme widget_theme NOT NULL DEFAULT 'dark',
    max_items INTEGER NOT NULL DEFAULT 6,
    show_platform_icon BOOLEAN NOT NULL DEFAULT true,
    border_radius INTEGER NOT NULL DEFAULT 12,
    card_spacing INTEGER NOT NULL DEFAULT 16,
    show_branding BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
