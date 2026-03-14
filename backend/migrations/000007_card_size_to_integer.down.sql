ALTER TABLE spaces ALTER COLUMN card_size TYPE TEXT USING
  CASE
    WHEN card_size <= 240 THEN 'small'
    WHEN card_size >= 360 THEN 'large'
    ELSE 'medium'
  END;
ALTER TABLE spaces ALTER COLUMN card_size SET DEFAULT 'medium';
