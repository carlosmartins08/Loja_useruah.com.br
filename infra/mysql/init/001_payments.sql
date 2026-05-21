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
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS shipments (
  shipment_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL UNIQUE,
  tracking_code VARCHAR(128) NOT NULL,
  carrier VARCHAR(64) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL
);

CREATE TABLE IF NOT EXISTS tickets (
  ticket_id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL,
  customer_id VARCHAR(64) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  status VARCHAR(24) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  messages_json JSON NOT NULL
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
  updated_at DATETIME(3) NOT NULL
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
  method VARCHAR(24) NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency VARCHAR(8) NOT NULL,
  status VARCHAR(24) NOT NULL,
  provider_reference VARCHAR(128) NOT NULL UNIQUE,
  created_at DATETIME(3) NOT NULL,
  approved_at DATETIME(3) NULL
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

CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_provider_reference ON payments(provider_reference);
CREATE INDEX idx_payment_events_payment_id_created_at ON payment_events(payment_id, created_at);
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_tickets_order_id ON tickets(order_id);
CREATE INDEX idx_tickets_customer_id ON tickets(customer_id);
CREATE INDEX idx_commissions_owner_id ON commissions(owner_id);
CREATE INDEX idx_commissions_order_id ON commissions(order_id);
CREATE INDEX idx_payouts_owner_id ON payouts(owner_id);
