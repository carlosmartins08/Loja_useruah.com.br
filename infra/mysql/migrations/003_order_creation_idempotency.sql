CREATE TABLE IF NOT EXISTS order_creation_idempotency (
  customer_id VARCHAR(128) NOT NULL,
  idempotency_key VARCHAR(128) NOT NULL,
  order_id VARCHAR(64) NOT NULL,
  payload_hash CHAR(64) NOT NULL,
  created_at DATETIME(3) NOT NULL,
  PRIMARY KEY (customer_id, idempotency_key),
  UNIQUE KEY uq_order_creation_idempotency_order (order_id),
  CONSTRAINT fk_order_creation_idempotency_order
    FOREIGN KEY (order_id) REFERENCES orders(order_id)
    ON DELETE CASCADE
);
