ALTER TABLE walls
    ADD COLUMN theme widget_theme NOT NULL DEFAULT 'dark',
    ADD COLUMN border_radius INTEGER NOT NULL DEFAULT 12,
    ADD COLUMN card_spacing INTEGER NOT NULL DEFAULT 16,
    ADD COLUMN show_platform_icon BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN show_branding BOOLEAN NOT NULL DEFAULT true;
