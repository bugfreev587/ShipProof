CREATE TABLE view_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    referrer TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_view_events_entity ON view_events(entity_type, entity_id);
CREATE INDEX idx_view_events_product ON view_events(product_id);
