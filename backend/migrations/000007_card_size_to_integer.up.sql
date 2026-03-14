ALTER TABLE spaces ALTER COLUMN card_size DROP DEFAULT;
ALTER TABLE spaces ALTER COLUMN card_size TYPE INTEGER USING
  CASE
    WHEN card_size::text = 'small' THEN 220
    WHEN card_size::text = 'large' THEN 390
    ELSE 280
  END;
ALTER TABLE spaces ALTER COLUMN card_size SET DEFAULT 280;
