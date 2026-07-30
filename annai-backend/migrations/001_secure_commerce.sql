-- Annai Jewellery secure commerce baseline.
-- Apply to a backed-up database before production deployment.
ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS attempts INT NOT NULL DEFAULT 0;
ALTER TABLE auth_otps ADD COLUMN IF NOT EXISTS request_ip VARCHAR(80) NOT NULL DEFAULT '';
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until DATETIME NULL;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS password_changed_at DATETIME NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_proof_url TEXT NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reviewed_at DATETIME NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_reviewed_by BIGINT UNSIGNED NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_rejection_reason VARCHAR(500) NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(100) NULL;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS inventory_reserved TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at DATETIME NULL;
ALTER TABLE orders MODIFY payment_status ENUM(
  'Pending','Awaiting Verification','Paid','Rejected','Failed','Refunded'
) NOT NULL DEFAULT 'Pending';
CREATE TABLE IF NOT EXISTS admin_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  admin_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  ip_address VARCHAR(80) NOT NULL DEFAULT '',
  user_agent VARCHAR(500) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_admin_sessions_admin (admin_id),
  INDEX idx_admin_sessions_expiry (expires_at),
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  ip_address VARCHAR(80) NOT NULL DEFAULT '',
  user_agent VARCHAR(500) NOT NULL DEFAULT '',
  expires_at DATETIME NOT NULL,
  last_used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_sessions_user (user_id),
  INDEX idx_user_sessions_expiry (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NULL,
  variant_id VARCHAR(120) NOT NULL DEFAULT '',
  product_name VARCHAR(190) NOT NULL,
  sku VARCHAR(120) NOT NULL DEFAULT '',
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT NOT NULL,
  line_total DECIMAL(10,2) NOT NULL,
  product_snapshot JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_order_items_order (order_id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE RESTRICT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);
