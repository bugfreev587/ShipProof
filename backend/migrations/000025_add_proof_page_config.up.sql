ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_title TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_subtitle TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_theme VARCHAR(10) DEFAULT 'dark';
ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_show_form BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_form_heading TEXT DEFAULT '';
ALTER TABLE products ADD COLUMN IF NOT EXISTS proof_page_show_branding BOOLEAN DEFAULT true;
