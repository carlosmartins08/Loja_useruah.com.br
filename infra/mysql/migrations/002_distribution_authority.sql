CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id VARCHAR(128) PRIMARY KEY,
  organization_id VARCHAR(128) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(12, 2) NOT NULL,
  progressive_price_rule TEXT NOT NULL,
  starts_at DATETIME(3) NULL,
  ends_at DATETIME(3) NULL,
  status VARCHAR(24) NOT NULL,
  created_by VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS campaign_products (
  campaign_product_id VARCHAR(128) PRIMARY KEY,
  campaign_id VARCHAR(128) NOT NULL,
  catalog_item_id VARCHAR(128) NOT NULL,
  linked_by VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_campaign_product_catalog (campaign_id, catalog_item_id),
  CONSTRAINT fk_campaign_products_campaign
    FOREIGN KEY (campaign_id) REFERENCES campaigns(campaign_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_campaigns_status_created ON campaigns(status, created_at);
CREATE INDEX idx_campaigns_organization_status ON campaigns(organization_id, status);
CREATE INDEX idx_campaigns_created_by_status ON campaigns(created_by, status);
CREATE INDEX idx_campaign_products_catalog ON campaign_products(catalog_item_id);

CREATE TABLE IF NOT EXISTS referral_links (
  referral_link_id VARCHAR(128) PRIMARY KEY,
  owner_id VARCHAR(128) NOT NULL,
  slug VARCHAR(128) NOT NULL UNIQUE,
  label VARCHAR(255) NOT NULL,
  channel VARCHAR(64) NOT NULL,
  target_path VARCHAR(512) NOT NULL,
  status VARCHAR(16) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS referral_events (
  referral_event_id VARCHAR(128) PRIMARY KEY,
  referral_link_id VARCHAR(128) NOT NULL,
  owner_id VARCHAR(128) NOT NULL,
  event_type VARCHAR(16) NOT NULL,
  occurred_at DATETIME(3) NOT NULL,
  order_id VARCHAR(128) NULL,
  revenue_amount DECIMAL(12, 2) NULL,
  UNIQUE KEY uq_referral_event_order (referral_link_id, event_type, order_id),
  CONSTRAINT fk_referral_events_link
    FOREIGN KEY (referral_link_id) REFERENCES referral_links(referral_link_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_referral_links_owner_created ON referral_links(owner_id, created_at);
CREATE INDEX idx_referral_links_status ON referral_links(status);
CREATE INDEX idx_referral_events_link_occurred ON referral_events(referral_link_id, occurred_at);
CREATE INDEX idx_referral_events_owner_type ON referral_events(owner_id, event_type);
