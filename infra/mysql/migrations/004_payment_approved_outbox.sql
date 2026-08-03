CREATE TABLE IF NOT EXISTS payment_approved_outbox (
  outbox_id VARCHAR(64) PRIMARY KEY,
  event_type VARCHAR(64) NOT NULL,
  payment_id VARCHAR(64) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  payload_json JSON NOT NULL,
  status VARCHAR(24) NOT NULL,
  attempt_count INT NOT NULL DEFAULT 0,
  available_at DATETIME(3) NOT NULL,
  last_error TEXT NULL,
  created_at DATETIME(3) NOT NULL,
  updated_at DATETIME(3) NOT NULL,
  processed_at DATETIME(3) NULL,
  UNIQUE KEY uq_payment_approved_outbox_event_payment (event_type, payment_id),
  CONSTRAINT fk_payment_approved_outbox_payment
    FOREIGN KEY (payment_id) REFERENCES payments(payment_id)
    ON DELETE CASCADE,
  CONSTRAINT fk_payment_approved_outbox_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_payment_approved_outbox_status_available
  ON payment_approved_outbox(status, available_at);
