CREATE TABLE IF NOT EXISTS orders (
  order_id VARCHAR(64) PRIMARY KEY,
  customer_id VARCHAR(64) NOT NULL,
  items_json JSON NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  paid_at DATETIME(3) NULL
);

CREATE TABLE IF NOT EXISTS production_jobs (
  production_job_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_production_jobs_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  tracking_code VARCHAR(128) NOT NULL,
  carrier VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_shipments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tickets (
  ticket_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  messages_json JSON NOT NULL,
  CONSTRAINT fk_tickets_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commissions (
  commission_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  owner_id VARCHAR(64) NOT NULL,
  owner_role VARCHAR(32) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(24) NOT NULL,
  source_key VARCHAR(128) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_commissions_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payouts (
  payout_id VARCHAR(64) PRIMARY KEY,
  owner_id VARCHAR(64) NOT NULL,
  owner_role VARCHAR(32) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(24) NOT NULL,
  commission_ids_json JSON NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS payments (
  payment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  method VARCHAR(24) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(24) NOT NULL,
  provider_reference VARCHAR(128) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL,
  approved_at DATETIME(3) NULL,
  CONSTRAINT fk_payments_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_idempotency (
  idempotency_key VARCHAR(128) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  CONSTRAINT fk_payment_idempotency_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payment_events (
  event_id VARCHAR(64) PRIMARY KEY,
  payment_id VARCHAR(64) NOT NULL,
  event_name VARCHAR(80) NOT NULL,
  from_status VARCHAR(24) NOT NULL,
  to_status VARCHAR(24) NOT NULL,
  meta JSON NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_payment_events_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id VARCHAR(128) PRIMARY KEY,
  processed_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS provider_recipients (
  id VARCHAR(64) PRIMARY KEY,
  entity_type VARCHAR(24) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_recipient_id VARCHAR(128) NOT NULL,
  status VARCHAR(24) NOT NULL,
  document VARCHAR(64) NULL,
  bank_account_reference VARCHAR(128) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_provider_recipient_entity (entity_type, entity_id, provider)
);

CREATE TABLE IF NOT EXISTS provider_webhook_events (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  event_type VARCHAR(64) NOT NULL,
  provider_event_id VARCHAR(128) NOT NULL,
  provider_reference VARCHAR(128) NULL,
  payload_json JSON NOT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  processed_at DATETIME(3) NULL,
  error_message TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  UNIQUE KEY uq_provider_event (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL,
  action VARCHAR(80) NOT NULL,
  request_payload_json JSON NULL,
  response_payload_json JSON NULL,
  status_code INT NULL,
  success TINYINT(1) NOT NULL,
  error_message TEXT NULL,
  created_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS payment_connector_configs (
  id VARCHAR(64) PRIMARY KEY,
  provider VARCHAR(32) NOT NULL UNIQUE,
  enabled TINYINT(1) NOT NULL DEFAULT 0,
  encrypted_config TEXT NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  updated_by VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS refunds (
  refund_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  payment_id VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  reason TEXT NOT NULL,
  requested_by VARCHAR(64) NOT NULL,
  approved_by VARCHAR(64) NULL,
  rejected_by VARCHAR(64) NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL UNIQUE,
  CONSTRAINT fk_refunds_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_refunds_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chargeback_events (
  chargeback_id VARCHAR(64) PRIMARY KEY,
  event_id VARCHAR(128) NOT NULL UNIQUE,
  payment_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  reason TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_chargebacks_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_chargebacks_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS terms_acceptances (
  acceptance_id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  entity_type VARCHAR(32) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  term_type VARCHAR(64) NOT NULL,
  term_version VARCHAR(32) NOT NULL,
  accepted_at DATETIME(3) NOT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent TEXT NULL
);

CREATE TABLE IF NOT EXISTS payment_splits (
  split_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  order_item_id VARCHAR(64) NOT NULL,
  payment_id VARCHAR(64) NOT NULL,
  recipient_type VARCHAR(32) NOT NULL,
  recipient_id VARCHAR(64) NOT NULL,
  provider_recipient_id VARCHAR(128) NULL,
  gross_amount DECIMAL(12, 2) NOT NULL,
  split_amount DECIMAL(12, 2) NOT NULL,
  split_percentage DECIMAL(8, 4) NOT NULL,
  net_amount DECIMAL(12, 2) NOT NULL,
  liable TINYINT(1) NOT NULL DEFAULT 0,
  charge_processing_fee TINYINT(1) NOT NULL DEFAULT 0,
  status VARCHAR(24) NOT NULL,
  provider_reference VARCHAR(128) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  CONSTRAINT fk_splits_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_splits_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS license_events (
  license_event_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  order_item_id VARCHAR(64) NOT NULL,
  artist_id VARCHAR(64) NOT NULL,
  artwork_id VARCHAR(64) NOT NULL,
  supplier_id VARCHAR(64) NOT NULL,
  product_id VARCHAR(64) NOT NULL,
  buyer_id VARCHAR(64) NOT NULL,
  license_type VARCHAR(64) NOT NULL,
  quantity INT NOT NULL,
  gross_sale_amount DECIMAL(12, 2) NOT NULL,
  artist_percentage DECIMAL(8, 4) NOT NULL,
  artist_license_amount DECIMAL(12, 2) NOT NULL,
  platform_commission_amount DECIMAL(12, 2) NOT NULL,
  supplier_amount DECIMAL(12, 2) NOT NULL,
  payment_status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  paid_at DATETIME(3) NULL,
  canceled_at DATETIME(3) NULL,
  refunded_at DATETIME(3) NULL,
  CONSTRAINT fk_license_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS catalog_items (
  catalog_item_id VARCHAR(64) PRIMARY KEY,
  artwork_id VARCHAR(64) NOT NULL,
  product_base_id VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  image TEXT NOT NULL,
  color_images_json JSON NOT NULL,
  fit VARCHAR(24) NOT NULL,
  fabric TEXT NOT NULL,
  print_type_description TEXT NOT NULL,
  wash_guide TEXT NOT NULL,
  installment_count INT NOT NULL,
  detail_images_json JSON NOT NULL,
  model_mockups_json JSON NOT NULL,
  variants_json JSON NOT NULL,
  category VARCHAR(32) NULL,
  segment VARCHAR(32) NULL,
  tags_json JSON NULL,
  publication_status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  published_at DATETIME(3) NULL,
  unpublished_at DATETIME(3) NULL,
  publication_reason TEXT NULL
);

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_reference ON payments(provider_reference);
CREATE INDEX idx_payment_events_payment_id_created_at ON payment_events(payment_id, created_at);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_production_status ON production_jobs(status);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_order_status ON tickets(order_id, status);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_commissions_owner_id ON commissions(owner_id);
CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_payouts_owner_id ON payouts(owner_id);
CREATE INDEX idx_provider_reference ON provider_webhook_events(provider_reference);
CREATE INDEX idx_integration_provider_action ON integration_logs(provider, action);
CREATE INDEX idx_refunds_order ON refunds(order_id);
CREATE INDEX idx_refunds_payment ON refunds(payment_id);
CREATE INDEX idx_chargebacks_payment ON chargeback_events(payment_id);
CREATE INDEX idx_chargebacks_order ON chargeback_events(order_id);
CREATE INDEX idx_terms_user ON terms_acceptances(user_id);
CREATE INDEX idx_terms_type_version ON terms_acceptances(term_type, term_version);
CREATE INDEX idx_splits_payment ON payment_splits(payment_id);
CREATE INDEX idx_splits_order ON payment_splits(order_id);
CREATE INDEX idx_splits_provider_status ON payment_splits(provider_reference, status);
CREATE INDEX idx_license_order ON license_events(order_id);
CREATE INDEX idx_license_artist ON license_events(artist_id);
CREATE INDEX idx_license_payment_status ON license_events(payment_status);
CREATE INDEX idx_catalog_publication_status ON catalog_items(publication_status);
CREATE INDEX idx_catalog_artwork_id ON catalog_items(artwork_id);
