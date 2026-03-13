ALTER TABLE walls
    DROP COLUMN IF EXISTS theme,
    DROP COLUMN IF EXISTS border_radius,
    DROP COLUMN IF EXISTS card_spacing,
    DROP COLUMN IF EXISTS show_platform_icon,
    DROP COLUMN IF EXISTS show_branding;
