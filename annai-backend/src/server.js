import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import QRCode from "qrcode";
import sharp from "sharp";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { createHash, randomBytes, randomInt, randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { ensureBaseSchema, query, pool, transaction } from "./db.js";

dotenv.config();

const app = express();
const apiPrefix = process.env.API_PREFIX || "/api";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");
const uploadUrlPath = "/uploads";
const certificateAssetsDir = path.resolve(__dirname, "../../src/assets/certificate");
const certificateBackgroundImagePath = path.join(certificateAssetsDir, "Background-img.png");
const certificateLogoImagePath = path.join(certificateAssetsDir, "logo.png");
const certificateDefaultStudentPhotoPath = path.join(certificateAssetsDir, "student.png");
const frontendUrl = process.env.FRONTEND_URL || "http://127.0.0.1:5173";
const configuredCorsOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedCorsOrigins = new Set(configuredCorsOrigins);

function validateProductionConfiguration() {
  if (process.env.NODE_ENV !== "production") return;
  const missing = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "CORS_ORIGIN", "FRONTEND_URL", "GMAIL_USER", "GMAIL_APP_PASSWORD"]
    .filter((name) => !clean(process.env[name]));
  if (missing.length) throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  if (configuredCorsOrigins.some((origin) => !origin.startsWith("https://"))) {
    throw new Error("Production CORS_ORIGIN entries must use HTTPS");
  }
  if (!String(process.env.FRONTEND_URL).startsWith("https://")) {
    throw new Error("Production FRONTEND_URL must use HTTPS");
  }
  if (["root", "admin"].includes(String(process.env.DB_USER).toLowerCase())) {
    throw new Error("Use a least-privilege database account in production");
  }
}
const isLocalDevOrigin = (origin) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i.test(origin);
const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedCorsOrigins.has(origin) || (process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))) {
      callback(null, true);
      return;
    }
    callback(null, false);
  },
  credentials: true,
};

const gallerySeeds = [
  {
    title: "Annai Jewellery Collection",
    category: "Jewellery",
    mediaType: "image",
    imageUrl: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85",
    description: "Annai Silver Jewellery collection and showroom.",
    sortOrder: 1,
  },
  {
    title: "Jewellery Craftsmanship",
    category: "Craftsmanship",
    mediaType: "image",
    imageUrl: "https://images.unsplash.com/photo-1637666062717-1c6bcfa4a4df?auto=format&fit=crop&w=700&q=85",
    description: "Details from the Annai Jewellery collection.",
    sortOrder: 2,
  },
  {
    title: "Jewellery Care",
    category: "Jewellery Care",
    mediaType: "video",
    imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?auto=format&fit=crop&w=700&q=85",
    description: "Helpful guidance for cleaning, storing and caring for plated silver jewellery.",
    sortOrder: 3,
  },
  {
    title: "Facility Tour",
    category: "Store",
    mediaType: "image",
    imageUrl: "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=700&q=85",
    description: "A glimpse of the Annai jewellery shopping experience.",
    sortOrder: 4,
  },
];

async function ensureGallerySchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS gallery_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      category VARCHAR(80) NOT NULL DEFAULT 'Jewellery',
      media_type ENUM('image','video','tour') NOT NULL DEFAULT 'image',
      image_url LONGTEXT NOT NULL,
      video_url TEXT,
      description TEXT,
      sort_order INT NOT NULL DEFAULT 0,
      is_visible TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  try {
    await query("ALTER TABLE gallery_items MODIFY image_url LONGTEXT NOT NULL");
  } catch (error) {
    console.warn("Gallery image schema check skipped:", error.message);
  }
  const [{ total }] = await query("SELECT COUNT(*) total FROM gallery_items");
  if (Number(total || 0) > 0) return;
  for (const item of gallerySeeds) {
    await query(
      "INSERT INTO gallery_items (title, category, media_type, image_url, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, 1)",
      [item.title, item.category, item.mediaType, item.imageUrl, item.description, item.sortOrder],
    );
  }
}

async function ensureProductImageSchema() {
  try {
    await query("ALTER TABLE products MODIFY image_url LONGTEXT NULL");
  } catch (error) {
    console.warn("Product image schema check skipped:", error.message);
  }
  if (!(await columnExists("product_categories", "image_url"))) {
    await query("ALTER TABLE product_categories ADD COLUMN image_url LONGTEXT NULL AFTER name");
  }
  await query(`
    UPDATE products
    SET variants = JSON_ARRAY(JSON_OBJECT(
      'id', 'standard',
      'label', 'Standard',
      'sku', CONCAT('ASJ-', UPPER(LEFT(slug, 32))),
      'price', price,
      'originalPrice', COALESCE(NULLIF(compare_price, 0), price),
      'stock', stock
    ))
    WHERE variants IS NULL OR JSON_LENGTH(variants) = 0
  `);
}

async function ensureReviewSchema() {
  const rows = await query(
    `SELECT COUNT(*) total FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = 'product_id'`,
  );
  if (!Number(rows[0]?.total || 0)) {
    await query("ALTER TABLE testimonials ADD COLUMN product_id BIGINT UNSIGNED NULL AFTER id");
    await query("CREATE INDEX idx_testimonials_product_id ON testimonials(product_id)");
  }
}

async function ensurePerformanceIndexes() {
  const indexes = [
    ["products", "idx_products_store_listing", "(is_active, category, is_featured, created_at)"],
    ["products", "idx_products_stock_listing", "(is_active, in_stock, stock)"],
    ["orders", "idx_orders_admin_listing", "(deleted_at, created_at)"],
    ["orders", "idx_orders_customer_listing", "(user_id, created_at)"],
    ["users", "idx_users_admin_listing", "(is_active, created_at)"],
    ["testimonials", "idx_testimonials_store_listing", "(is_visible, product_id, created_at)"],
  ];
  for (const [table, name, columns] of indexes) {
    const rows = await query(
      `SELECT COUNT(*) total FROM INFORMATION_SCHEMA.STATISTICS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND INDEX_NAME = ?`,
      [table, name],
    );
    if (!Number(rows[0]?.total || 0)) await query(`CREATE INDEX ${name} ON ${table} ${columns}`);
  }
}

async function ensurePaymentSchema() {
  const columns = [
    ["payment_transaction_id", "VARCHAR(120) NULL"],
    ["payment_gateway_response", "MEDIUMTEXT NULL"],
  ];
  for (const [column, definition] of columns) {
    const rows = await query(
      `SELECT COUNT(*) total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = ?`,
      [column],
    );
    if (!Number(rows[0]?.total || 0)) {
      await query(`ALTER TABLE orders ADD COLUMN ${column} ${definition}`);
    }
  }
}

async function ensureCouponSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(40) NOT NULL UNIQUE,
      title VARCHAR(120) NOT NULL DEFAULT '',
      discount_type ENUM('percentage','flat') NOT NULL DEFAULT 'percentage',
      discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
      min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
      max_discount DECIMAL(10,2) NOT NULL DEFAULT 0,
      valid_from DATETIME NULL,
      valid_to DATETIME NULL,
      usage_limit INT NOT NULL DEFAULT 0,
      per_user_limit INT NOT NULL DEFAULT 0,
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_coupons_code (code),
      INDEX idx_coupons_active (is_active)
    )
  `);
  await query("UPDATE coupons SET max_discount = 0 WHERE max_discount <> 0");
}

async function ensureBlogSchema() {
  const rows = await query(
    `SELECT COUNT(*) total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'category'`,
  );
  if (!Number(rows[0]?.total || 0)) {
    await query("ALTER TABLE blogs ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'Jewellery Guide' AFTER slug");
  }
}

async function ensureAuthSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS auth_otps (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(180) NOT NULL,
      otp_hash VARCHAR(255) NOT NULL,
      purpose VARCHAR(40) NOT NULL DEFAULT 'login',
      expires_at DATETIME NOT NULL,
      used_at DATETIME NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_otps_email (email),
      INDEX idx_auth_otps_expires (expires_at)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS auth_events (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NULL,
      name VARCHAR(120) NOT NULL DEFAULT '',
      email VARCHAR(180) NOT NULL DEFAULT '',
      phone VARCHAR(20) NOT NULL DEFAULT '',
      event_type ENUM('register','login','otp_request','otp_login','password_reset_request','password_reset','profile_update','wishlist_update') NOT NULL,
      method VARCHAR(40) NOT NULL DEFAULT '',
      ip_address VARCHAR(80) NOT NULL DEFAULT '',
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_auth_events_created (created_at),
      INDEX idx_auth_events_type (event_type)
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS wishlists (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_user_product (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY unique_cart_product (user_id, product_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);
  await query(`
    CREATE TABLE IF NOT EXISTS user_addresses (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id BIGINT UNSIGNED NOT NULL,
      label VARCHAR(40) NOT NULL DEFAULT 'Delivery address',
      address VARCHAR(300) NOT NULL,
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_user_addresses_user (user_id),
      INDEX idx_user_addresses_default (user_id, is_default),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  await query(`
    INSERT INTO user_addresses (user_id, label, address, is_default)
    SELECT u.id, 'Default address', TRIM(u.address), 1
    FROM users u
    WHERE TRIM(COALESCE(u.address, '')) <> ''
      AND NOT EXISTS (
        SELECT 1 FROM user_addresses ua WHERE ua.user_id = u.id
      )
  `);
  try {
    await query("ALTER TABLE auth_events MODIFY event_type ENUM('register','login','otp_request','otp_login','password_reset_request','password_reset','profile_update','wishlist_update') NOT NULL");
  } catch {
    // Older MySQL modes may already match this enum.
  }
}

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) total FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column],
  );
  return Number(rows[0]?.total || 0) > 0;
}

async function ensureSecurityCommerceSchema() {
  const otpColumns = [
    ["attempts", "INT NOT NULL DEFAULT 0"],
    ["request_ip", "VARCHAR(80) NOT NULL DEFAULT ''"],
  ];
  for (const [name, definition] of otpColumns) {
    if (!(await columnExists("auth_otps", name))) await query(`ALTER TABLE auth_otps ADD COLUMN ${name} ${definition}`);
  }

  const adminColumns = [
    ["token_version", "INT NOT NULL DEFAULT 1"],
    ["failed_login_attempts", "INT NOT NULL DEFAULT 0"],
    ["locked_until", "DATETIME NULL"],
    ["password_changed_at", "DATETIME NULL"],
  ];
  for (const [name, definition] of adminColumns) {
    if (!(await columnExists("admin_users", name))) await query(`ALTER TABLE admin_users ADD COLUMN ${name} ${definition}`);
  }

  const orderColumns = [
    ["payment_proof_url", "TEXT NULL"],
    ["payment_reviewed_at", "DATETIME NULL"],
    ["payment_reviewed_by", "BIGINT UNSIGNED NULL"],
    ["payment_rejection_reason", "VARCHAR(500) NULL"],
    ["idempotency_key", "VARCHAR(100) NULL"],
    ["inventory_reserved", "TINYINT(1) NOT NULL DEFAULT 0"],
    ["deleted_at", "DATETIME NULL"],
  ];
  for (const [name, definition] of orderColumns) {
    if (!(await columnExists("orders", name))) await query(`ALTER TABLE orders ADD COLUMN ${name} ${definition}`);
  }
  await query(
    "ALTER TABLE orders MODIFY payment_status ENUM('Pending','Awaiting Verification','Paid','Rejected','Failed','Refunded') NOT NULL DEFAULT 'Pending'",
  );
  const idempotencyIndex = await query(
    `SELECT COUNT(*) total FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND INDEX_NAME = 'uq_orders_idempotency'`,
  );
  if (!Number(idempotencyIndex[0]?.total || 0)) {
    await query("CREATE UNIQUE INDEX uq_orders_idempotency ON orders(idempotency_key)");
  }

  await query(`
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
    )
  `);
  await query(`
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
    )
  `);
  await query(`
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
    )
  `);
}

async function ensureConfiguredAdminIdentity() {
  const configuredEmail = clean(process.env.ADMIN_RECOVERY_EMAIL || process.env.SEED_ADMIN_EMAIL).toLowerCase();
  if (!configuredEmail || !isEmail(configuredEmail, true)) return;
  const configured = await query("SELECT id FROM admin_users WHERE LOWER(email) = ? LIMIT 1", [configuredEmail]);
  if (configured[0]) return;
  const owners = await query(
    "SELECT id FROM admin_users WHERE active = 1 ORDER BY (role = 'owner') DESC, id ASC LIMIT 1",
  );
  if (!owners[0]) return;
  await query("UPDATE admin_users SET email = ? WHERE id = ?", [configuredEmail, owners[0].id]);
  console.log(`Admin identity updated to configured email: ${configuredEmail}`);
}

async function ensureCertificateSchema() {
  await query(`
    CREATE TABLE IF NOT EXISTS certificate_templates (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(140) NOT NULL,
      background_image LONGTEXT NULL,
      logo_image LONGTEXT NULL,
      signature_image LONGTEXT NULL,
      base_pdf_url LONGTEXT NULL,
      accent_color VARCHAR(20) NOT NULL DEFAULT '#dd0b5b',
      navy_color VARCHAR(20) NOT NULL DEFAULT '#142348',
      gold_color VARCHAR(20) NOT NULL DEFAULT '#bd8a2e',
      logo_top DECIMAL(5,2) NOT NULL DEFAULT 8.55,
      logo_left DECIMAL(5,2) NOT NULL DEFAULT 30.50,
      logo_width DECIMAL(5,2) NOT NULL DEFAULT 39.00,
      name_top DECIMAL(5,2) NOT NULL DEFAULT 42.05,
      name_left DECIMAL(5,2) NOT NULL DEFAULT 16.00,
      name_width DECIMAL(5,2) NOT NULL DEFAULT 68.00,
      name_font_size DECIMAL(5,2) NOT NULL DEFAULT 3.55,
      name_font VARCHAR(120) NOT NULL DEFAULT 'Georgia',
      name_font_weight INT NOT NULL DEFAULT 800,
      name_letter_spacing DECIMAL(5,2) NOT NULL DEFAULT 0.00,
      name_align ENUM('left','center','right') NOT NULL DEFAULT 'center',
      course_top DECIMAL(5,2) NOT NULL DEFAULT 47.90,
      qr_top DECIMAL(5,2) NOT NULL DEFAULT 4.30,
      qr_right DECIMAL(5,2) NOT NULL DEFAULT 5.20,
      qr_size DECIMAL(5,2) NOT NULL DEFAULT 10.20,
      show_qr TINYINT(1) NOT NULL DEFAULT 1,
      signature_top DECIMAL(5,2) NOT NULL DEFAULT 75.65,
      signature_left DECIMAL(5,2) NOT NULL DEFAULT 30.70,
      signature_width DECIMAL(5,2) NOT NULL DEFAULT 38.60,
      photo_left DECIMAL(5,2) NOT NULL DEFAULT 43.70,
      photo_bottom DECIMAL(5,2) NOT NULL DEFAULT 5.55,
      photo_size DECIMAL(5,2) NOT NULL DEFAULT 12.60,
      status ENUM('Active','Hidden') NOT NULL DEFAULT 'Active',
      is_default TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_certificate_templates_status (status)
    )
  `);
  try {
    await query("ALTER TABLE certificate_templates MODIFY name_font VARCHAR(120) NOT NULL DEFAULT 'Georgia'");
  } catch (error) {
    console.warn("Certificate template font schema check skipped:", error.message);
  }
  const templateColumns = [
    ["logo_image", "LONGTEXT NULL"],
    ["signature_image", "LONGTEXT NULL"],
    ["logo_top", "DECIMAL(5,2) NOT NULL DEFAULT 8.55"],
    ["logo_left", "DECIMAL(5,2) NOT NULL DEFAULT 30.50"],
    ["logo_width", "DECIMAL(5,2) NOT NULL DEFAULT 39.00"],
    ["tagline_top", "DECIMAL(5,2) NOT NULL DEFAULT 21.05"],
    ["tagline_left", "DECIMAL(5,2) NOT NULL DEFAULT 23.50"],
    ["tagline_width", "DECIMAL(5,2) NOT NULL DEFAULT 53.00"],
    ["tagline_font_size", "DECIMAL(5,2) NOT NULL DEFAULT 0.68"],
    ["tagline_letter_spacing", "DECIMAL(5,2) NOT NULL DEFAULT 0.52"],
    ["name_font_weight", "INT NOT NULL DEFAULT 800"],
    ["name_letter_spacing", "DECIMAL(5,2) NOT NULL DEFAULT 0.00"],
    ["name_align", "ENUM('left','center','right') NOT NULL DEFAULT 'center'"],
    ["signature_left", "DECIMAL(5,2) NOT NULL DEFAULT 30.70"],
    ["signature_width", "DECIMAL(5,2) NOT NULL DEFAULT 38.60"],
    ["photo_left", "DECIMAL(5,2) NOT NULL DEFAULT 43.70"],
    ["photo_bottom", "DECIMAL(5,2) NOT NULL DEFAULT 5.55"],
    ["photo_size", "DECIMAL(5,2) NOT NULL DEFAULT 12.60"],
    ["base_pdf_url", "LONGTEXT NULL"],
    ["layout_json", "LONGTEXT NULL"],
  ];
  for (const [column, definition] of templateColumns) {
    const rows = await query(
      `SELECT COUNT(*) total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificate_templates' AND COLUMN_NAME = ?`,
      [column],
    );
    if (!Number(rows[0]?.total || 0)) await query(`ALTER TABLE certificate_templates ADD COLUMN ${column} ${definition}`);
  }
  const existingTemplates = await query("SELECT COUNT(*) total FROM certificate_templates");
  if (!Number(existingTemplates[0]?.total || 0)) {
    await query(
      `INSERT INTO certificate_templates
       (name, accent_color, navy_color, gold_color, name_top, name_left, name_width, name_font_size, course_top, qr_top, qr_right, qr_size, signature_top, is_default)
       VALUES ('Annai Jewellery Authenticity', '#d6aa2f', '#29231b', '#bd8a2e', 42.05, 16.00, 68.00, 3.55, 47.90, 4.30, 5.20, 10.20, 75.65, 1)`,
    );
  }
  await query(
    `UPDATE certificate_templates
     SET accent_color = '#dd0b5b',
         navy_color = '#142348',
         gold_color = '#bd8a2e',
         logo_top = 8.55,
         logo_left = 30.50,
         logo_width = 39.00,
         tagline_top = 21.05,
         tagline_left = 23.50,
         tagline_width = 53.00,
         tagline_font_size = 0.68,
         tagline_letter_spacing = 0.52,
         name_top = 42.05,
         name_left = 16.00,
         name_width = 68.00,
         name_font_size = 3.55,
         name_font = 'Georgia',
         name_font_weight = 800,
         name_letter_spacing = 0.00,
         name_align = 'center',
         course_top = 47.90,
         qr_top = 4.30,
         qr_right = 5.20,
         qr_size = 10.20,
         signature_top = 75.65,
         signature_left = 30.70,
         signature_width = 38.60,
         photo_left = 43.70,
         photo_bottom = 5.55,
         photo_size = 12.60,
         layout_json = NULL
     WHERE is_default = 1 AND name = 'Annai Jewellery Authenticity'`,
  );
  await query(`
    CREATE TABLE IF NOT EXISTS certificates (
      id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      template_id BIGINT UNSIGNED NULL,
      student_name VARCHAR(160) NOT NULL,
      student_id VARCHAR(60) NOT NULL UNIQUE,
      certificate_no VARCHAR(80) NOT NULL UNIQUE,
      verification_token VARCHAR(120) NOT NULL UNIQUE,
      course_name VARCHAR(160) NOT NULL DEFAULT 'Annai Silver Jewellery',
      course_level VARCHAR(160) NOT NULL DEFAULT 'Jewellery Authenticity and Care',
      batch_name VARCHAR(120) NOT NULL DEFAULT '',
      duration VARCHAR(80) NOT NULL DEFAULT '',
      enrollment_date DATE NULL,
      completion_date DATE NULL,
      issue_date DATE NULL,
      instructor_name VARCHAR(120) NOT NULL DEFAULT 'Annai Silver Jewellery',
      director_name VARCHAR(120) NOT NULL DEFAULT 'Annai Silver Jewellery',
      student_photo LONGTEXT NULL,
      signature_url LONGTEXT NULL,
      certificate_pdf_url LONGTEXT NULL,
      status ENUM('Valid','Revoked','Expired') NOT NULL DEFAULT 'Valid',
      notes TEXT,
      template_json LONGTEXT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_certificates_student_name (student_name),
      INDEX idx_certificates_status (status),
      INDEX idx_certificates_issue_date (issue_date)
    )
  `);
  try {
    await query("ALTER TABLE certificates ADD COLUMN template_id BIGINT UNSIGNED NULL AFTER id");
  } catch {
    // Existing installations may already have the template column.
  }
  const certificateColumns = [
    ["certificate_pdf_url", "LONGTEXT NULL"],
  ];
  for (const [column, definition] of certificateColumns) {
    const rows = await query(
      `SELECT COUNT(*) total
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'certificates' AND COLUMN_NAME = ?`,
      [column],
    );
    if (!Number(rows[0]?.total || 0)) await query(`ALTER TABLE certificates ADD COLUMN ${column} ${definition}`);
  }
  await query("ALTER TABLE certificates MODIFY instructor_name VARCHAR(120) NOT NULL DEFAULT 'Annai Silver Jewellery'");
  await query("ALTER TABLE certificates MODIFY director_name VARCHAR(120) NOT NULL DEFAULT 'Annai Silver Jewellery'");
}

app.set("etag", false);
app.set("trust proxy", Math.min(Math.max(Number(process.env.TRUST_PROXY_HOPS || 0), 0), 3));
app.use(helmet());
app.use(cors(corsOptions));
app.use(uploadUrlPath, (_req, res, next) => {
  res.set("Cross-Origin-Resource-Policy", "cross-origin");
  next();
});
app.use(`${uploadUrlPath}/payment-proofs`, (_req, res) => {
  res.status(404).end();
});
app.use(uploadUrlPath, express.static(uploadsDir, {
  immutable: true,
  maxAge: "30d",
}));
app.use(apiPrefix, (_req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});
app.use(express.json({ limit: "10mb" }));
app.use(apiPrefix, (req, res, next) => {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
  const hasSessionCookie = Boolean(cookieValue(req, adminSessionCookie) || cookieValue(req, userSessionCookie));
  const origin = clean(req.get("origin"));
  if (hasSessionCookie && origin && !allowedCorsOrigins.has(origin) && !(process.env.NODE_ENV !== "production" && isLocalDevOrigin(origin))) {
    return res.status(403).json({ message: "Untrusted request origin" });
  }
  return next();
});
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: Number(process.env.RATE_LIMIT || 600),
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
const adminAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many admin authentication attempts. Try again in 15 minutes." },
});
const publicOrderLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many order attempts. Please wait before trying again." },
});

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const adminSessionCookie = "annai_admin_session";
const userSessionCookie = "annai_user_session";
const adminSessionHours = Math.min(Math.max(Number(process.env.ADMIN_SESSION_HOURS || 12), 1), 24);
const userSessionHours = Math.min(Math.max(Number(process.env.USER_SESSION_HOURS || 168), 1), 720);
const crossSiteCookies = String(process.env.CROSS_SITE_COOKIES || "").toLowerCase() === "true";
const cookieValue = (req, name) => {
  const cookies = String(req.headers.cookie || "").split(";");
  for (const item of cookies) {
    const [key, ...parts] = item.trim().split("=");
    if (key === name) return decodeURIComponent(parts.join("="));
  }
  return "";
};
const sessionHash = (token) => createHash("sha256").update(token).digest("hex");
const adminCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: crossSiteCookies ? "none" : "lax",
  path: apiPrefix,
  maxAge: adminSessionHours * 60 * 60 * 1000,
});
const userCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: crossSiteCookies ? "none" : "lax",
  path: apiPrefix,
  maxAge: userSessionHours * 60 * 60 * 1000,
});

async function issueAdminSession(req, res, admin) {
  const token = randomBytes(48).toString("base64url");
  await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [admin.id, sessionHash(token), clientIp(req), clean(req.headers["user-agent"]).slice(0, 500), adminSessionHours],
  );
  res.cookie(adminSessionCookie, token, adminCookieOptions());
}

async function revokeAdminSession(req, res) {
  const token = cookieValue(req, adminSessionCookie);
  if (token) await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE token_hash = ?", [sessionHash(token)]);
  res.clearCookie(adminSessionCookie, adminCookieOptions());
}

async function issueUserSession(req, res, user) {
  const token = randomBytes(48).toString("base64url");
  await query(
    `INSERT INTO user_sessions (user_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? HOUR))`,
    [user.id, sessionHash(token), clientIp(req), clean(req.headers["user-agent"]).slice(0, 500), userSessionHours],
  );
  res.cookie(userSessionCookie, token, userCookieOptions());
}

async function revokeUserSession(req, res) {
  const token = cookieValue(req, userSessionCookie);
  if (token) await query("UPDATE user_sessions SET revoked_at = NOW() WHERE token_hash = ?", [sessionHash(token)]);
  res.clearCookie(userSessionCookie, userCookieOptions());
}

function normalizeBoolean(value) {
  if (value === undefined || value === null) return undefined;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number") return value ? 1 : 0;
  return ["true", "1", "yes", "active"].includes(String(value).toLowerCase()) ? 1 : 0;
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function safeJson(value, fallback = []) {
  if (value === undefined) return fallback;
  if (value === null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return value ? [value] : fallback;
    }
  }
  return value;
}

function clean(value) {
  return String(value || "").trim();
}

function phoneDigits(value) {
  return clean(value).replace(/\D/g, "");
}

function isPhone(value) {
  return /^[6-9]\d{9}$/.test(phoneDigits(value));
}

function isName(value) {
  return /^[A-Za-z][A-Za-z .'-]{1,79}$/.test(clean(value));
}

function hasMax(value, max) {
  return clean(value).length <= max;
}

function isStrongAdminPassword(value) {
  const text = String(value || "");
  return text.length >= 12
    && text.length <= 72
    && /[a-z]/.test(text)
    && /[A-Z]/.test(text)
    && /\d/.test(text)
    && /[^A-Za-z0-9]/.test(text);
}

function isEmail(value, required = false) {
  const text = clean(value);
  if (!text) return !required;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
}

function isUrl(value) {
  const text = clean(value);
  if (!text) return true;
  if (/^data:image\/(png|jpe?g|webp);base64,/i.test(text)) return true;
  if (/^\/uploads\/[A-Za-z0-9._/-]+$/i.test(text)) return true;
  try {
    const url = new URL(text);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function bad(res, message) {
  return res.status(400).json({ message });
}

function isSafeDestination(value, { allowEmpty = true } = {}) {
  const text = clean(value);
  if (!text) return allowEmpty;
  if (/^\/(?!\/)[A-Za-z0-9/_#?&=.%+-]*$/.test(text)) return true;
  if (/^tel:\+?[0-9 ()-]{7,20}$/i.test(text)) return true;
  if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(text)) return true;
  try {
    return new URL(text).protocol === "https:";
  } catch {
    return false;
  }
}

function isManagedUpload(value, folder = "") {
  const text = clean(value);
  const prefix = folder ? `/uploads/${folder}/` : "/uploads/";
  return text.startsWith(prefix) && /^\/uploads\/[A-Za-z0-9._/-]+$/.test(text) && !text.includes("..");
}

async function audit(req, action, entityType, entityId, payload = {}) {
  try {
    await query(
      "INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, payload) VALUES (?, ?, ?, ?, ?, ?)",
      [req.admin?.id || null, req.admin?.name || null, action, entityType, String(entityId || ""), JSON.stringify(payload)],
    );
  } catch {
    // Audit logging must never block the business action.
  }
}

function clientIp(req) {
  return String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
}

async function recordAuthEvent(req, user, eventType, method = "") {
  try {
    await query(
      "INSERT INTO auth_events (user_id, name, email, phone, event_type, method, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        user?.id || null,
        clean(user?.name),
        clean(user?.email),
        phoneDigits(user?.phone),
        eventType,
        method,
        clientIp(req),
        clean(req.headers["user-agent"]),
      ],
    );
  } catch {
    // Auth activity should never block the user action.
  }
}

function toAuthEvent(row) {
  return {
    _id: String(row.id),
    id: Number(row.id),
    userId: row.user_id ? Number(row.user_id) : null,
    name: row.name || "",
    email: row.email || "",
    phone: row.phone || "",
    eventType: row.event_type,
    method: row.method || "",
    ipAddress: row.ip_address || "",
    userAgent: row.user_agent || "",
    createdAt: row.created_at,
  };
}

async function sendOtpEmail(email, otp, purpose = "login") {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || "";
  if (!user || !pass) return { sent: false, reason: "SMTP is not configured" };

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass: pass.replace(/\s+/g, "") },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    const isPasswordReset = purpose === "admin_reset_password" || purpose === "reset_password";
    const isAdmin = purpose.startsWith("admin_");
    const action = isPasswordReset ? "password reset" : "login";
    await transporter.sendMail({
      from: `"Annai Jewellery" <${user}>`,
      to: email,
      subject: `Your Annai Jewellery ${isAdmin ? "admin " : ""}${action} OTP`,
      text: `Your Annai Jewellery ${isAdmin ? "admin " : ""}${action} OTP is ${otp}. It expires in 10 minutes. Do not share this code.`,
      html: `<p>Your Annai Jewellery ${isAdmin ? "admin " : ""}${action} OTP is <strong>${otp}</strong>.</p><p>This code expires in 10 minutes. Do not share it with anyone.</p>`,
    });
    return { sent: true };
  } catch (error) {
    console.error("OTP email failed", error);
    if (error?.code === "EAUTH" || Number(error?.responseCode) === 535) {
      return {
        sent: false,
        reason: "OTP email authentication failed. Update the Gmail App Password and restart the server.",
        code: "MAIL_AUTH_FAILED",
      };
    }
    return { sent: false, reason: "Unable to send OTP email" };
  }
}

function escapeEmailHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendAdminOrderNotification(order) {
  const user = process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER || "";
  const pass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD || "";
  const adminEmail = clean(
    process.env.ADMIN_ORDER_EMAIL
      || process.env.ADMIN_RECOVERY_EMAIL
      || process.env.SEED_ADMIN_EMAIL,
  ).toLowerCase();
  if (!user || !pass || !adminEmail) {
    console.warn(`Order ${order.order_id} notification skipped: admin email service is not configured`);
    return false;
  }

  const details = {
    orderId: clean(order.order_id),
    customerName: clean(order.customer_name),
    customerPhone: phoneDigits(order.customer_phone),
    customerEmail: clean(order.customer_email) || "Not provided",
    products: clean(order.product) || "Order items",
    categories: clean(order.category) || "Not specified",
    amount: Number(order.amount || 0),
    paymentMethod: clean(order.payment_method) || "Not specified",
    paymentStatus: clean(order.payment_status) || "Awaiting Verification",
    address: clean(order.delivery_address) || "Not provided",
    notes: clean(order.notes) || "None",
  };
  const amount = `Rs. ${details.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
  const text = [
    "A new order has been placed on Annai Silver Jewellery.",
    "",
    `Order ID: ${details.orderId}`,
    `Customer: ${details.customerName}`,
    `Phone: ${details.customerPhone}`,
    `Email: ${details.customerEmail}`,
    `Products: ${details.products}`,
    `Categories: ${details.categories}`,
    `Total: ${amount}`,
    `Payment method: ${details.paymentMethod}`,
    `Payment status: ${details.paymentStatus}`,
    `Delivery address: ${details.address}`,
    `Notes: ${details.notes}`,
    "",
    "Open the Annai admin panel to verify the payment and manage this order.",
  ].join("\n");

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      service: "gmail",
      auth: { user, pass: pass.replace(/\s+/g, "") },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });
    await transporter.sendMail({
      from: `"Annai Jewellery Orders" <${user}>`,
      to: adminEmail,
      replyTo: isEmail(details.customerEmail) ? details.customerEmail : undefined,
      subject: `New order ${details.orderId} · ${details.customerPhone}`,
      text,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#292218">
          <div style="background:#d8aa20;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0">
            <h2 style="margin:0;font-size:20px">New jewellery order</h2>
          </div>
          <div style="border:1px solid #ecd99e;border-top:0;padding:22px;border-radius:0 0 14px 14px">
            <p style="margin-top:0">A customer has placed a new order.</p>
            <table style="width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:7px 0;color:#76684f">Order ID</td><td style="padding:7px 0;font-weight:700">${escapeEmailHtml(details.orderId)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Customer</td><td style="padding:7px 0">${escapeEmailHtml(details.customerName)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Phone</td><td style="padding:7px 0;font-weight:700">${escapeEmailHtml(details.customerPhone)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Email</td><td style="padding:7px 0">${escapeEmailHtml(details.customerEmail)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Products</td><td style="padding:7px 0">${escapeEmailHtml(details.products)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Categories</td><td style="padding:7px 0">${escapeEmailHtml(details.categories)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Total</td><td style="padding:7px 0;font-weight:700">${escapeEmailHtml(amount)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Payment</td><td style="padding:7px 0">${escapeEmailHtml(`${details.paymentMethod} · ${details.paymentStatus}`)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Address</td><td style="padding:7px 0">${escapeEmailHtml(details.address)}</td></tr>
              <tr><td style="padding:7px 0;color:#76684f">Notes</td><td style="padding:7px 0">${escapeEmailHtml(details.notes)}</td></tr>
            </table>
            <p style="margin:20px 0 0;color:#76684f;font-size:13px">Open the Annai admin panel to verify the payment and manage this order.</p>
          </div>
        </div>`,
    });
    console.log(`Order ${details.orderId} notification sent to ${adminEmail}`);
    return true;
  } catch (error) {
    console.error(
      `Order ${details.orderId} notification failed:`,
      error?.code || error?.responseCode || "MAIL_DELIVERY_FAILED",
    );
    return false;
  }
}

async function requireAdmin(req, res, next) {
  try {
    const sessionToken = cookieValue(req, adminSessionCookie);
    if (!sessionToken) return res.status(401).json({ message: "Admin session required" });
    const rows = await query(
      `SELECT a.id, a.name, a.email, a.role, a.active, s.id session_id
       FROM admin_sessions s
       JOIN admin_users a ON a.id = s.admin_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
       LIMIT 1`,
      [sessionHash(sessionToken)],
    );
    const admin = rows[0];
    if (!admin || !admin.active) return res.status(401).json({ message: "Admin account is not active" });
    await query("UPDATE admin_sessions SET last_used_at = NOW() WHERE id = ?", [admin.session_id]);
    req.admin = admin;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired admin session" });
  }
}

async function requireUser(req, res, next) {
  try {
    const token = cookieValue(req, userSessionCookie);
    if (!token) return res.status(401).json({ message: "User login required" });
    const rows = await query(
      `SELECT u.*, s.id session_id FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW()
       LIMIT 1`,
      [sessionHash(token)],
    );
    const user = rows[0];
    if (!user || !user.is_active) return res.status(401).json({ message: "User account is not active" });
    await query("UPDATE user_sessions SET last_used_at = NOW() WHERE id = ?", [user.session_id]);
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired user session" });
  }
}

async function optionalUser(req, _res, next) {
  try {
    const token = cookieValue(req, userSessionCookie);
    if (token) {
      const rows = await query(
        `SELECT u.* FROM user_sessions s JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > NOW() LIMIT 1`,
        [sessionHash(token)],
      );
      if (rows[0]?.is_active) req.user = rows[0];
    }
  } catch {
    // Anonymous public routes can continue without a user.
  }
  next();
}

function pageParams(req) {
  const page = Math.max(Math.floor(Number(req.query.page || 1)) || 1, 1);
  const limit = Math.min(Math.max(Math.floor(Number(req.query.limit || 20)) || 20, 1), 100);
  return { page, limit, offset: (page - 1) * limit };
}

function toProduct(row) {
  const images = safeJson(row.images, row.image_url ? [row.image_url] : []);
  const variants = safeJson(row.variants, []);
  const features = safeJson(row.features, []);
  const reviews = safeJson(row.reviews, []);
  const price = Number(row.price || 0);
  const comparePrice = Number(row.compare_price || 0);

  const specs = safeJson(row.specs, {});
  return {
    _id: String(row.id),
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline || "",
    category: row.category || "",
    brand: row.brand || "",
    goal: row.goal || "",
    flavor: row.flavor || "",
    badge: row.badge || "",
    price,
    comparePrice,
    stock: Number(row.stock || 0),
    inStock: Boolean(row.in_stock),
    image: row.image_url || images[0] || "",
    imageUrl: row.image_url || images[0] || "",
    images,
    variants,
    features,
    specs,
    material: specs.material || "",
    purity: specs.purity || "",
    weight: specs.weight || "",
    relatedProductIds: Array.isArray(specs.relatedProductIds) ? specs.relatedProductIds.map(String) : [],
    faqs: safeJson(row.faqs, []),
    reviews,
    description: row.description || "",
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || reviews.length || 0),
    verified: true,
    isActive: Boolean(row.is_active),
    isFeatured: Boolean(row.is_featured),
    displayPrice: price,
    displayOriginalPrice: comparePrice,
    displayDiscount: comparePrice > price ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOrder(row) {
  return {
    _id: String(row.id),
    id: row.id,
    orderId: row.order_id,
    product: row.product,
    category: row.category || "",
    amount: Number(row.amount || 0),
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method || "",
    paymentTransactionId: row.payment_transaction_id || "",
    paymentReviewedAt: row.payment_reviewed_at || null,
    paymentReviewedBy: row.payment_reviewed_by || null,
    paymentRejectionReason: row.payment_rejection_reason || "",
    inventoryReserved: Boolean(row.inventory_reserved),
    paymentGatewayResponse: row.payment_gateway_response || "",
    deliveryMode: row.delivery_mode,
    deliveryAddress: row.delivery_address || "",
    invoiceNumber: row.invoice_number || "",
    licenseKey: row.license_key || "",
    notes: row.notes || "",
    user: {
      _id: row.user_id ? String(row.user_id) : "",
      name: row.customer_name,
      email: row.customer_email || "",
      phone: row.customer_phone || "",
    },
    customerName: row.customer_name,
    customerEmail: row.customer_email || "",
    customerPhone: row.customer_phone || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toOrderItem(item) {
  const snapshot = safeJson(item.product_snapshot, {});
  const currentImage = clean(item.current_product_image);
  return {
    id: Number(item.id),
    productId: item.product_id
      ? Number(item.product_id)
      : item.current_product_id
        ? Number(item.current_product_id)
        : null,
    variantId: item.variant_id || "",
    productName: item.product_name,
    sku: item.sku || "",
    unitPrice: Number(item.unit_price || 0),
    quantity: Number(item.quantity || 0),
    lineTotal: Number(item.line_total || 0),
    productSnapshot: {
      ...snapshot,
      image: currentImage || clean(snapshot.image),
    },
  };
}

function toAdminOrder(row) {
  return {
    ...toOrder(row),
    paymentProofUrl: row.payment_proof_url
      ? `${apiPrefix}/admin/orders/${encodeURIComponent(row.id)}/payment-proof`
      : "",
  };
}

async function couponUsage(code, email = "") {
  const search = `%Coupon used: ${code};%`;
  const successfulOrder = "deleted_at IS NULL AND status <> 'Cancelled' AND payment_status NOT IN ('Rejected','Failed','Refunded')";
  const rows = await query(
    `SELECT COUNT(*) total,
            COUNT(DISTINCT COALESCE(NULLIF(customer_email, ''), NULLIF(customer_phone, ''), customer_name)) customers
     FROM orders WHERE notes LIKE ? AND ${successfulOrder}`,
    [search],
  );
  const userRows = email
    ? await query(`SELECT COUNT(*) total FROM orders WHERE notes LIKE ? AND customer_email = ? AND ${successfulOrder}`, [search, email])
    : [{ total: 0 }];
  return {
    total: Number(rows[0]?.total || 0),
    customers: Number(rows[0]?.customers || 0),
    user: Number(userRows[0]?.total || 0),
  };
}

function toCoupon(row, usage = 0, customerCount = 0) {
  return {
    _id: String(row.id),
    id: Number(row.id),
    code: row.code || "",
    title: row.title || "",
    discountType: row.discount_type || "percentage",
    discountValue: Number(row.discount_value || 0),
    minOrderAmount: Number(row.min_order_amount || 0),
    maxDiscount: Number(row.max_discount || 0),
    validFrom: row.valid_from ? new Date(row.valid_from).toISOString().slice(0, 16) : "",
    validTo: row.valid_to ? new Date(row.valid_to).toISOString().slice(0, 16) : "",
    usageLimit: Number(row.usage_limit || 0),
    perUserLimit: Number(row.per_user_limit || 0),
    usageCount: Number(usage || 0),
    customerCount: Number(customerCount || 0),
    isActive: Boolean(row.is_active),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function certificateDate(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function toCertificate(row) {
  return {
    _id: String(row.id),
    id: Number(row.id),
    templateId: row.template_id ? Number(row.template_id) : "",
    studentName: row.student_name || "",
    studentId: row.student_id || "",
    certificateNo: row.certificate_no || "",
    verificationToken: row.verification_token || "",
    courseName: row.course_name || "Annai Silver Jewellery",
    courseLevel: row.course_level || "Jewellery Authenticity and Care",
    batchName: row.batch_name || "",
    duration: row.duration || "",
    enrollmentDate: certificateDate(row.enrollment_date),
    completionDate: certificateDate(row.completion_date),
    issueDate: certificateDate(row.issue_date),
    instructorName: row.instructor_name || "Annai Silver Jewellery",
    directorName: row.director_name || "Annai Silver Jewellery",
    studentPhoto: row.student_photo || "",
    signatureUrl: row.signature_url || "",
    certificatePdfUrl: row.certificate_pdf_url || "",
    pdfUrl: row.certificate_pdf_url || "",
    status: row.status || "Valid",
    notes: row.notes || "",
    templateJson: safeJson(row.template_json, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toCertificateTemplate(row) {
  return {
    _id: String(row.id),
    id: Number(row.id),
    name: row.name || "Annai Jewellery Authenticity",
    backgroundImage: row.background_image || "",
    logoImage: row.logo_image || "",
    signatureImage: row.signature_image || "",
    basePdfUrl: row.base_pdf_url || "",
    accentColor: row.accent_color || "#dd0b5b",
    navyColor: row.navy_color || "#142348",
    goldColor: row.gold_color || "#bd8a2e",
    logoTop: Number(row.logo_top || 8.55),
    logoLeft: Number(row.logo_left || 30.5),
    logoWidth: Number(row.logo_width || 39),
    taglineTop: Number(row.tagline_top || 21.05),
    taglineLeft: Number(row.tagline_left || 23.5),
    taglineWidth: Number(row.tagline_width || 53),
    taglineFontSize: Number(row.tagline_font_size || 0.68),
    taglineLetterSpacing: Number(row.tagline_letter_spacing || 0.52),
    nameTop: Number(row.name_top || 42.05),
    nameLeft: Number(row.name_left || 16),
    nameWidth: Number(row.name_width || 68),
    nameFontSize: Number(row.name_font_size || 3.55),
    nameFont: row.name_font || "Georgia",
    nameFontWeight: Number(row.name_font_weight || 800),
    nameLetterSpacing: Number(row.name_letter_spacing || 0),
    nameAlign: row.name_align || "center",
    courseTop: Number(row.course_top || 47.9),
    qrTop: Number(row.qr_top || 4.3),
    qrRight: Number(row.qr_right || 5.2),
    qrSize: Number(row.qr_size || 10.2),
    showQr: row.show_qr !== 0,
    signatureTop: Number(row.signature_top || 75.65),
    signatureLeft: Number(row.signature_left || 30.7),
    signatureWidth: Number(row.signature_width || 38.6),
    photoLeft: Number(row.photo_left || 43.7),
    photoBottom: Number(row.photo_bottom || 5.55),
    photoSize: Number(row.photo_size || 12.6),
    elements: safeJson(row.layout_json, {}),
    layoutJson: safeJson(row.layout_json, {}),
    status: row.status || "Active",
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function colorValue(value, fallback) {
  const text = clean(value || fallback);
  return /^#[0-9a-fA-F]{6}$/.test(text) ? text : fallback;
}

function imageValue(value, label) {
  const text = clean(value || "");
  if (text && !isUrl(text) && !text.startsWith("data:image/")) {
    throw Object.assign(new Error(`${label} image is invalid.`), { status: 400 });
  }
  return text;
}

function pdfTemplateValue(value) {
  const text = clean(value || "");
  if (text && !isUrl(text) && !text.startsWith("/uploads/")) {
    throw Object.assign(new Error("Certificate PDF template path is invalid."), { status: 400 });
  }
  return text;
}

function templateElementsValue(body) {
  const raw = body.elements || body.layoutJson || body.layout_json || {};
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function certificateTemplatePayload(body) {
  const name = clean(body.name);
  if (name.length < 3) throw Object.assign(new Error("Template name is required."), { status: 400 });
  const backgroundImage = imageValue(body.backgroundImage || body.background_image, "Template background");
  const logoImage = imageValue(body.logoImage || body.logo_image, "Template logo");
  const signatureImage = imageValue(body.signatureImage || body.signature_image, "Template signature");
  const basePdfUrl = pdfTemplateValue(body.basePdfUrl || body.base_pdf_url);
  const status = ["Active", "Hidden"].includes(body.status) ? body.status : "Active";
  const requestedFont = clean(body.nameFont || body.name_font || "Georgia").slice(0, 120);
  const nameAlign = ["left", "center", "right"].includes(body.nameAlign || body.name_align) ? clean(body.nameAlign || body.name_align) : "center";
  return {
    name,
    backgroundImage,
    logoImage,
    signatureImage,
    basePdfUrl,
    accentColor: colorValue(body.accentColor || body.accent_color, "#dd0b5b"),
    navyColor: colorValue(body.navyColor || body.navy_color, "#142348"),
    goldColor: colorValue(body.goldColor || body.gold_color, "#bd8a2e"),
    logoTop: clampNumber(body.logoTop || body.logo_top, 3, 18, 8.55),
    logoLeft: clampNumber(body.logoLeft || body.logo_left, 5, 55, 30.5),
    logoWidth: clampNumber(body.logoWidth || body.logo_width, 20, 75, 39),
    taglineTop: clampNumber(body.taglineTop || body.tagline_top, 15, 27, 21.05),
    taglineLeft: clampNumber(body.taglineLeft || body.tagline_left, 8, 45, 23.5),
    taglineWidth: clampNumber(body.taglineWidth || body.tagline_width, 25, 84, 53),
    taglineFontSize: clampNumber(body.taglineFontSize || body.tagline_font_size, 0.6, 2, 0.68),
    taglineLetterSpacing: clampNumber(body.taglineLetterSpacing || body.tagline_letter_spacing, 0.1, 0.8, 0.52),
    nameTop: clampNumber(body.nameTop || body.name_top, 35, 52, 42.05),
    nameLeft: clampNumber(body.nameLeft || body.name_left, 10, 40, 16),
    nameWidth: clampNumber(body.nameWidth || body.name_width, 30, 80, 68),
    nameFontSize: clampNumber(body.nameFontSize || body.name_font_size, 1.4, 5, 3.55),
    nameFont: requestedFont || "Georgia",
    nameFontWeight: Math.round(clampNumber(body.nameFontWeight || body.name_font_weight, 100, 900, 800) / 100) * 100,
    nameLetterSpacing: clampNumber(body.nameLetterSpacing || body.name_letter_spacing, 0, 0.3, 0),
    nameAlign,
    courseTop: clampNumber(body.courseTop || body.course_top, 45, 58, 47.9),
    qrTop: clampNumber(body.qrTop || body.qr_top, 2, 12, 4.3),
    qrRight: clampNumber(body.qrRight || body.qr_right, 2, 12, 5.2),
    qrSize: clampNumber(body.qrSize || body.qr_size, 7, 18, 10.2),
    showQr: body.showQr !== false && body.show_qr !== 0,
    signatureTop: clampNumber(body.signatureTop || body.signature_top, 74, 87, 75.65),
    signatureLeft: clampNumber(body.signatureLeft || body.signature_left, 10, 60, 30.7),
    signatureWidth: clampNumber(body.signatureWidth || body.signature_width, 20, 70, 38.6),
    photoLeft: clampNumber(body.photoLeft || body.photo_left, 25, 60, 43.7),
    photoBottom: clampNumber(body.photoBottom || body.photo_bottom, 3, 16, 5.55),
    photoSize: clampNumber(body.photoSize || body.photo_size, 8, 22, 12.6),
    elements: templateElementsValue(body),
    status,
    isDefault: body.isDefault === true || body.is_default === 1,
  };
}

async function nextCertificateIdentity() {
  const rows = await query("SELECT COUNT(*) total FROM certificates");
  const serial = Number(rows[0]?.total || 0) + 1;
  return {
    certificateNo: `ASJ-AUTH-${String(serial).padStart(6, "0")}`,
    studentId: `ASJ-CUSTOMER-${String(serial).padStart(4, "0")}`,
  };
}

function certificatePayload(body, identity = {}) {
  const studentName = clean(body.studentName || body.student_name);
  if (!isName(studentName)) throw Object.assign(new Error("Enter a valid student full name."), { status: 400 });
  const studentId = clean(body.studentId || body.student_id || identity.studentId);
  const certificateNo = clean(body.certificateNo || body.certificate_no || identity.certificateNo);
  if (!studentId) throw Object.assign(new Error("Student ID is required."), { status: 400 });
  if (!certificateNo) throw Object.assign(new Error("Certificate number is required."), { status: 400 });
  const status = ["Valid", "Revoked", "Expired"].includes(body.status) ? body.status : "Valid";
  const studentPhoto = imageValue(body.studentPhoto || body.student_photo, "Student photo");
  const signatureUrl = imageValue(body.signatureUrl || body.signature_url, "Signature");
  return {
    studentName,
    studentId,
    certificateNo,
    templateId: body.templateId || body.template_id ? Number(body.templateId || body.template_id) : null,
    courseName: clean(body.courseName || body.course_name || "Annai Silver Jewellery"),
    courseLevel: clean(body.courseLevel || body.course_level || "Jewellery Authenticity and Care"),
    batchName: clean(body.batchName || body.batch_name || ""),
    duration: clean(body.duration || ""),
    enrollmentDate: clean(body.enrollmentDate || body.enrollment_date || "") || null,
    completionDate: clean(body.completionDate || body.completion_date || "") || null,
    issueDate: clean(body.issueDate || body.issue_date || "") || null,
    instructorName: clean(body.instructorName || body.instructor_name || "Annai Silver Jewellery"),
    directorName: clean(body.directorName || body.director_name || "Annai Silver Jewellery"),
    studentPhoto,
    signatureUrl,
    status,
    notes: clean(body.notes || ""),
    templateJson: JSON.stringify(body.templateJson || body.template_json || {}),
  };
}

async function validateCouponCode({ code, subtotal, email = "" }) {
  const couponCode = clean(code).toUpperCase();
  const amount = Number(subtotal || 0);
  if (!couponCode) return { valid: false, message: "Enter a coupon code.", discount: 0 };
  if (amount <= 0) return { valid: false, message: "Add products before applying coupon.", discount: 0 };

  const rows = await query("SELECT * FROM coupons WHERE code = ? LIMIT 1", [couponCode]);
  const coupon = rows[0];
  if (!coupon) return { valid: false, message: "Coupon not found.", discount: 0 };
  if (!coupon.is_active) return { valid: false, message: "Coupon is inactive.", discount: 0, coupon: toCoupon(coupon) };

  const now = Date.now();
  if (coupon.valid_from && new Date(coupon.valid_from).getTime() > now) {
    return { valid: false, message: "Coupon is not active yet.", discount: 0, coupon: toCoupon(coupon) };
  }
  if (coupon.valid_to && new Date(coupon.valid_to).getTime() < now) {
    return { valid: false, message: "Coupon has expired.", discount: 0, coupon: toCoupon(coupon) };
  }
  if (amount < Number(coupon.min_order_amount || 0)) {
    return { valid: false, message: `Minimum order amount is Rs. ${Number(coupon.min_order_amount || 0).toLocaleString("en-IN")}.`, discount: 0, coupon: toCoupon(coupon) };
  }

  const usage = await couponUsage(couponCode, clean(email));
  if (Number(coupon.usage_limit || 0) > 0 && usage.total >= Number(coupon.usage_limit || 0)) {
    return { valid: false, message: "Coupon usage limit reached.", discount: 0, coupon: toCoupon(coupon, usage.total) };
  }
  if (clean(email) && Number(coupon.per_user_limit || 0) > 0 && usage.user >= Number(coupon.per_user_limit || 0)) {
    return { valid: false, message: "You have already used this coupon.", discount: 0, coupon: toCoupon(coupon, usage.total) };
  }

  let discount = coupon.discount_type === "flat"
    ? Number(coupon.discount_value || 0)
    : Math.round((amount * Number(coupon.discount_value || 0)) / 100);
  discount = Math.min(Math.max(Math.round(discount), 0), amount);
  return { valid: discount > 0, message: discount > 0 ? "Coupon applied." : "Coupon has no discount.", discount, coupon: toCoupon(coupon, usage.total) };
}

function publicBaseUrl(req) {
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto || req.protocol;
  return `${protocol}://${req.get("host")}`;
}

const imagePresets = {
  "banner-desktop": { folder: "banners", width: 1920, height: 1080, minWidth: 1200, minHeight: 675 },
  "banner-mobile": { folder: "banners", width: 1080, height: 1350, minWidth: 720, minHeight: 900 },
  category: { folder: "categories", width: 640, height: 640, minWidth: 400, minHeight: 400 },
  product: { folder: "catalog", width: 1200, height: 1200, minWidth: 600, minHeight: 600 },
};

async function saveUploadedImage(req, dataUrl, folder = "images", presetName = "") {
  const text = clean(dataUrl);
  const match = text.match(/^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) {
    const error = new Error("Upload a valid PNG, JPG or WEBP image.");
    error.status = 400;
    throw error;
  }
  const mime = match[1].toLowerCase();
  const extension = mime === "jpeg" ? "jpg" : mime;
  const sourceBuffer = Buffer.from(match[2], "base64");
  if (!sourceBuffer.length || sourceBuffer.length > 5 * 1024 * 1024) {
    const error = new Error("Image must be under 5 MB.");
    error.status = 400;
    throw error;
  }
  let metadata;
  let outputBuffer = sourceBuffer;
  try {
    const source = sharp(sourceBuffer, { limitInputPixels: 40_000_000, failOn: "warning" }).rotate();
    metadata = await source.metadata();
    if (!metadata.width || !metadata.height) throw new Error("Image dimensions could not be read");
    if (metadata.width > 8000 || metadata.height > 8000) throw new Error("Image dimensions are too large");
    const preset = imagePresets[clean(presetName).toLowerCase()];
    if (preset && (metadata.width < preset.minWidth || metadata.height < preset.minHeight)) {
      const error = new Error(`Upload an image at least ${preset.minWidth} x ${preset.minHeight} pixels.`);
      error.status = 400;
      throw error;
    }
    const pipeline = sharp(sourceBuffer, { limitInputPixels: 40_000_000, failOn: "warning" }).rotate();
    if (preset) pipeline.resize(preset.width, preset.height, { fit: "cover", position: "centre" });
    if (extension === "png") {
      outputBuffer = await pipeline.png({ compressionLevel: 9, adaptiveFiltering: true, palette: false }).toBuffer();
    } else if (extension === "jpg") {
      outputBuffer = await pipeline.jpeg({ quality: 95, chromaSubsampling: "4:4:4", mozjpeg: true }).toBuffer();
    } else if (extension === "webp") {
      outputBuffer = await pipeline.webp({ quality: 95, smartSubsample: true, effort: 6 }).toBuffer();
    }
    if (!outputBuffer.length) throw new Error("Image encoding failed");
  } catch (reason) {
    if (reason?.status) throw reason;
    const error = new Error("The uploaded file is not a readable image.");
    error.status = 400;
    throw error;
  }
  const preset = imagePresets[clean(presetName).toLowerCase()];
  const safeFolder = preset?.folder || clean(folder).replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "images";
  const targetDir = path.join(uploadsDir, safeFolder);
  await mkdir(targetDir, { recursive: true });
  const filename = `${Date.now()}-${randomUUID()}.${extension}`;
  const absolutePath = path.join(targetDir, filename);
  await writeFile(absolutePath, outputBuffer);
  const relativeUrl = `${uploadUrlPath}/${safeFolder}/${filename}`;
  return {
    url: `${publicBaseUrl(req)}${relativeUrl}`,
    path: relativeUrl,
    size: outputBuffer.length,
    originalSize: sourceBuffer.length,
    savedBytes: Math.max(sourceBuffer.length - outputBuffer.length, 0),
    width: preset?.width || metadata?.width || null,
    height: preset?.height || metadata?.height || null,
    compressed: outputBuffer.length < sourceBuffer.length,
  };
}

function dataUrlToBuffer(value) {
  const match = clean(value).match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/i);
  if (!match) return null;
  return { mime: match[1].toLowerCase(), buffer: Buffer.from(match[2], "base64") };
}

async function readImageBytes(value) {
  const text = clean(value);
  if (!text) return null;
  const dataImage = dataUrlToBuffer(text);
  if (dataImage) return dataImage;
  if (text.startsWith("/uploads/")) {
    const relative = text.replace(/^\/uploads\//, "");
    const filePath = path.resolve(uploadsDir, relative);
    const buffer = await readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    return { mime: extension.includes("png") ? "png" : "jpg", buffer };
  }
  if (/^https?:\/\//i.test(text)) {
    const response = await fetch(text);
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") || "";
    const buffer = Buffer.from(await response.arrayBuffer());
    return { mime: contentType.includes("png") ? "png" : "jpg", buffer };
  }
  return null;
}

async function embedImage(pdfDoc, value) {
  const image = await readImageBytes(value);
  if (!image?.buffer?.length) return null;
  if (image.mime.includes("png")) return pdfDoc.embedPng(image.buffer);
  return pdfDoc.embedJpg(image.buffer);
}

function drawCover(page, x, y, width, height) {
  page.drawRectangle({ x, y, width, height, color: rgb(1, 1, 1), opacity: 1, borderOpacity: 0 });
}

function drawSingleLineCentered(page, text, font, size, y, color, maxWidth, characterSpacing = 0) {
  const value = clean(text);
  if (!value) return;
  let fontSize = size;
  const measure = () => font.widthOfTextAtSize(value, fontSize) + Math.max(value.length - 1, 0) * characterSpacing;
  while (measure() > maxWidth && fontSize > size * 0.62) fontSize -= 0.5;
  page.drawText(value, {
    x: (page.getWidth() - measure()) / 2,
    y,
    size: fontSize,
    font,
    color,
    characterSpacing,
  });
}

function drawImageContain(page, image, x, y, width, height) {
  const imageWidth = image.width || width;
  const imageHeight = image.height || height;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  page.drawImage(image, {
    x: x + (width - drawWidth) / 2,
    y: y + (height - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  });
}

function drawCenteredText(page, text, font, size, y, color, maxWidth, lineHeight = 1.18) {
  const value = clean(text);
  if (!value) return;
  const words = value.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  const totalHeight = lines.length * size * lineHeight;
  lines.forEach((line, index) => {
    const width = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: (page.getWidth() - width) / 2,
      y: y + totalHeight / 2 - (index + 1) * size * lineHeight,
      size,
      font,
      color,
    });
  });
}

function drawCenteredTextInBox(page, text, font, size, x, y, width, color, lineHeight = 1.18) {
  const value = clean(text);
  if (!value) return;
  const words = value.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(next, size) <= width || !current) {
      current = next;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  lines.forEach((line, index) => {
    const lineWidth = font.widthOfTextAtSize(line, size);
    page.drawText(line, {
      x: x + (width - lineWidth) / 2,
      y: y - index * size * lineHeight,
      size,
      font,
      color,
    });
  });
}

function drawLabelValue(page, label, value, x, y, fonts, navy) {
  page.drawText(clean(label).toUpperCase(), {
    x,
    y,
    size: 6,
    font: fonts.helvetica,
    color: navy,
    characterSpacing: 1.4,
  });
  page.drawText(clean(value), {
    x,
    y: y - 13,
    size: 8.5,
    font: fonts.helveticaBold,
    color: navy,
    characterSpacing: 1.2,
  });
}

function formatPdfDate(value) {
  if (!value) return "DD / MM / YYYY";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value);
  return date.toLocaleDateString("en-GB").replace(/\//g, " / ");
}

async function getCertificateTemplate(templateId) {
  if (templateId) {
    const rows = await query("SELECT * FROM certificate_templates WHERE id = ? LIMIT 1", [templateId]);
    if (rows[0]) return toCertificateTemplate(rows[0]);
  }
  const defaults = await query("SELECT * FROM certificate_templates WHERE is_default = 1 LIMIT 1");
  return defaults[0] ? toCertificateTemplate(defaults[0]) : {};
}

async function certificateBasePdfBytes(template) {
  if (template?.basePdfUrl?.startsWith("/uploads/")) {
    const relative = template.basePdfUrl.replace(/^\/uploads\//, "");
    return readFile(path.resolve(uploadsDir, relative));
  }
  throw Object.assign(new Error("Upload an Annai Jewellery certificate base PDF"), { status: 400 });
}

async function generateCertificatePdf(req, certificate, template = null) {
  const pdfDoc = await PDFDocument.create();
  const background = await pdfDoc.embedPng(await readFile(certificateBackgroundImagePath));
  const page = pdfDoc.addPage([background.width, background.height]);
  const { width, height } = page.getSize();
  page.drawImage(background, { x: 0, y: 0, width, height });
  const fonts = {
    times: await pdfDoc.embedFont(StandardFonts.TimesRoman),
    timesBold: await pdfDoc.embedFont(StandardFonts.TimesRomanBold),
    timesItalic: await pdfDoc.embedFont(StandardFonts.TimesRomanItalic),
    helvetica: await pdfDoc.embedFont(StandardFonts.Helvetica),
    helveticaBold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };
  const navy = rgb(0.075, 0.13, 0.28);
  const gold = rgb(0.72, 0.48, 0.14);
  const black = rgb(0.05, 0.05, 0.05);

  const academyLogo = await pdfDoc.embedPng(await readFile(certificateLogoImagePath));
  drawImageContain(page, academyLogo, width * 0.235, height * 0.792, width * 0.53, height * 0.13);
  drawSingleLineCentered(page, "TRUSTED SILVER JEWELLERY", fonts.helveticaBold, 8.4, height * 0.765, gold, width * 0.55, 3);

  const verifyUrl = `${normalizedFrontendUrl()}/annai-jewellery/verify/${encodeURIComponent(certificate.verificationToken || certificate.certificateNo)}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 360 });
  const qrImage = await embedImage(pdfDoc, qrDataUrl);
  if (qrImage) {
    drawImageContain(page, qrImage, width * 0.812, height * 0.862, width * 0.075, width * 0.075);
    drawCenteredTextInBox(page, "SCAN TO VERIFY", fonts.helveticaBold, 5.5, width * 0.79, height * 0.848, width * 0.14, navy);
    drawCenteredTextInBox(page, "CERTIFICATE NO.", fonts.helvetica, 4.9, width * 0.79, height * 0.829, width * 0.14, navy);
    drawCenteredTextInBox(page, certificate.certificateNo, fonts.helveticaBold, 6, width * 0.79, height * 0.815, width * 0.14, navy);
    drawCenteredTextInBox(page, "STUDENT ID", fonts.helvetica, 4.9, width * 0.79, height * 0.79, width * 0.14, navy);
    drawCenteredTextInBox(page, certificate.studentId, fonts.helveticaBold, 6, width * 0.79, height * 0.776, width * 0.14, navy);
  }

  drawSingleLineCentered(page, "CERTIFICATE", fonts.timesBold, 34, height * 0.662, navy, width * 0.68, 8.4);
  drawSingleLineCentered(page, "OF COMPLETION", fonts.helveticaBold, 13.2, height * 0.622, gold, width * 0.5, 8);
  drawSingleLineCentered(page, "This is to certify that", fonts.timesItalic, 10.5, height * 0.585, navy, width * 0.5, 0);
  drawSingleLineCentered(page, certificate.studentName, fonts.timesBold, 28, height * 0.547, black, width * 0.58, 0);
  page.drawRectangle({ x: width * 0.497, y: height * 0.527, width: 5, height: 5, color: gold });
  drawSingleLineCentered(page, "has successfully completed the", fonts.timesItalic, 10.8, height * 0.503, navy, width * 0.48, 0);
  drawSingleLineCentered(page, certificate.courseName || "Annai Silver Jewellery", fonts.timesBold, 15.5, height * 0.481, navy, width * 0.62, 0.3);
  drawSingleLineCentered(page, certificate.courseLevel || "Jewellery Authenticity and Care", fonts.helveticaBold, 15, height * 0.448, gold, width * 0.74, 2);

  drawCenteredText(
    page,
    "and has demonstrated the required knowledge of silver purity, gold-plated finishes, product care, customer guidance, quality checks, and responsible jewellery handling.",
    fonts.helvetica,
    8.7,
    height * 0.405,
    black,
    width * 0.74,
    1.32,
  );
  drawCenteredText(
    page,
    "This certificate is awarded in recognition of the successful completion of all required coursework, practical assessments, and final evaluation.",
    fonts.helvetica,
    8.7,
    height * 0.352,
    black,
    width * 0.68,
    1.32,
  );
  drawCenteredText(
    page,
    `"This certificate records the authenticity details supplied for this Annai Silver Jewellery item."`,
    fonts.timesItalic,
    8.4,
    height * 0.306,
    navy,
    width * 0.58,
    1.18,
  );

  page.drawLine({ start: { x: width * 0.31, y: height * 0.245 }, end: { x: width * 0.69, y: height * 0.245 }, thickness: 1.5, color: black });
  drawSingleLineCentered(page, "COURSE DIRECTOR & INSTRUCTOR", fonts.helveticaBold, 7.2, height * 0.225, navy, width * 0.42, 3);
  drawSingleLineCentered(page, "ANNAI SILVER JEWELLERY", fonts.helveticaBold, 5.4, height * 0.212, navy, width * 0.38, 1.8);

  if (certificate.signatureUrl) {
    const signature = await embedImage(pdfDoc, certificate.signatureUrl);
    if (signature) {
      drawImageContain(page, signature, width * 0.395, height * 0.252, width * 0.21, height * 0.047);
    }
  }

  let photo = certificate.studentPhoto ? await embedImage(pdfDoc, certificate.studentPhoto) : null;
  if (!photo) {
    photo = await pdfDoc.embedPng(await readFile(certificateDefaultStudentPhotoPath));
  }
  if (photo) {
    drawImageContain(page, photo, width * 0.427, height * 0.075, width * 0.146, height * 0.09);
    drawCenteredTextInBox(page, "STUDENT ID", fonts.helvetica, 6, width * 0.395, height * 0.061, width * 0.21, navy);
    drawCenteredTextInBox(page, certificate.studentId, fonts.helveticaBold, 6.4, width * 0.395, height * 0.05, width * 0.21, navy);
  }

  drawLabelValue(page, "Issued by", "Annai Silver Jewellery", width * 0.055, height * 0.108, fonts, navy);
  drawLabelValue(page, "Date of completion", formatPdfDate(certificate.completionDate), width * 0.055, height * 0.068, fonts, navy);

  drawLabelValue(page, "Course", certificate.courseLevel || "Jewellery Authenticity and Care", width * 0.705, height * 0.108, fonts, navy);
  drawLabelValue(page, "Issued date", formatPdfDate(certificate.issueDate), width * 0.705, height * 0.068, fonts, navy);

  const bytes = await pdfDoc.save();
  const safeCertificate = clean(certificate.certificateNo).replace(/[^A-Za-z0-9_-]/g, "-") || randomUUID();
  const targetDir = path.join(uploadsDir, "certificates", "generated");
  await mkdir(targetDir, { recursive: true });
  const filename = `${safeCertificate}.pdf`;
  await writeFile(path.join(targetDir, filename), bytes);
  return `${uploadUrlPath}/certificates/generated/${filename}`;
}

async function regenerateCertificatePdf(req, certificateId) {
  const rows = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [certificateId]);
  if (!rows[0]) return null;
  const certificate = toCertificate(rows[0]);
  const pdfUrl = await generateCertificatePdf(req, certificate);
  await query("UPDATE certificates SET certificate_pdf_url = ? WHERE id = ?", [pdfUrl, certificateId]);
  const updated = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [certificateId]);
  return updated[0] ? toCertificate(updated[0]) : null;
}

function uploadPathToFile(relativeUrl) {
  const text = clean(relativeUrl);
  if (!text.startsWith("/uploads/")) return "";
  const relative = text.replace(/^\/uploads\//, "");
  const target = path.resolve(uploadsDir, relative);
  if (!target.startsWith(uploadsDir)) return "";
  return target;
}

function sendEmbeddablePdf(res, filePath) {
  res.removeHeader("X-Frame-Options");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Security-Policy", "frame-ancestors 'self' http://localhost:5173 http://127.0.0.1:5173");
  return res.sendFile(filePath);
}

function normalizedFrontendUrl() {
  return frontendUrl.replace(/\/$/, "");
}

function toTestimonial(row) {
  return {
    _id: String(row.id),
    id: row.id,
    productId: row.product_id ? Number(row.product_id) : null,
    name: row.name,
    role: row.role || "",
    rating: Number(row.rating || 5),
    text: row.text || "",
    imageUrl: row.image_url || "",
    source: row.source || "Website",
    sourceId: row.source_id || "",
    authorMeta: row.author_meta || "",
    reviewDate: row.review_date || "",
    isVisible: Boolean(row.is_visible),
    createdAt: row.created_at,
  };
}

async function validReviewProductId(value) {
  if (value === null || value === undefined || value === "") return null;
  const productId = Number(value);
  if (!Number.isInteger(productId) || productId < 1) {
    throw Object.assign(new Error("A valid product is required"), { status: 400 });
  }
  const rows = await query("SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1", [productId]);
  if (!rows[0]) throw Object.assign(new Error("Selected product was not found"), { status: 404 });
  return productId;
}

function toUser(row) {
  return {
    _id: String(row.id),
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone || "",
    plan: row.plan || "",
    membership: row.plan || "",
    address: row.address || "",
    isActive: Boolean(row.is_active),
    orderCount: Number(row.order_count || 0),
    totalSpent: Number(row.total_spent || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toUserAddress(row) {
  return {
    id: Number(row.id),
    label: row.label || "Delivery address",
    address: row.address || "",
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

app.get(`${apiPrefix}/health`, asyncHandler(async (_req, res) => {
  await pool.query("SELECT 1");
  res.json({ ok: true, service: "Annai Jewellery admin backend", time: new Date().toISOString() });
}));

app.post(`${apiPrefix}/admin/login`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const username = clean(req.body.email).toLowerCase();
  const password = req.body.password;
  if (!username || !password) return res.status(400).json({ message: "Admin email and password are required" });
  const configuredEmail = clean(process.env.ADMIN_RECOVERY_EMAIL || process.env.SEED_ADMIN_EMAIL).toLowerCase();
  if (!configuredEmail || username !== configuredEmail) {
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  const rows = await query(
    "SELECT id, name, email, password_hash, role, active, failed_login_attempts, locked_until FROM admin_users WHERE LOWER(email) = ? LIMIT 1",
    [username],
  );
  const admin = rows[0];
  if (admin?.locked_until && new Date(admin.locked_until).getTime() > Date.now()) {
    return res.status(429).json({ message: "Admin login is temporarily locked. Try again later." });
  }
  if (!admin || !admin.active || !(await bcrypt.compare(password, admin.password_hash))) {
    if (admin?.id) {
      const failures = Number(admin.failed_login_attempts || 0) + 1;
      await query(
        `UPDATE admin_users SET failed_login_attempts = ?,
         locked_until = IF(? >= 5, DATE_ADD(NOW(), INTERVAL 15 MINUTE), NULL) WHERE id = ?`,
        [failures, failures, admin.id],
      );
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
  }

  await query("UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?", [admin.id]);
  await issueAdminSession(req, res, admin);
  res.json({
    _id: String(admin.id),
    id: admin.id,
    username: admin.name,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  });
}));

async function createAdminOtp(emailValue, purpose, req) {
  const email = String(emailValue || "").trim().toLowerCase();
  const configuredEmail = String(process.env.ADMIN_RECOVERY_EMAIL || process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  if (!email || (configuredEmail && email !== configuredEmail)) return null;

  const rows = await query(
    "SELECT id, name, email, role, active FROM admin_users WHERE LOWER(email) = ? AND active = 1 LIMIT 1",
    [email],
  );
  const admin = rows[0];
  if (!admin) return null;

  await query("UPDATE auth_otps SET used_at = NOW() WHERE email = ? AND purpose = ? AND used_at IS NULL", [email, purpose]);
  const recentRows = await query(
    "SELECT created_at FROM auth_otps WHERE email = ? AND purpose = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1",
    [email, purpose],
  );
  if (recentRows[0] && Date.now() - new Date(recentRows[0].created_at).getTime() < 60_000) {
    throw Object.assign(new Error("Please wait 60 seconds before requesting another OTP"), { status: 429 });
  }
  const otp = String(randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(otp, 10);
  await query(
    "INSERT INTO auth_otps (email, otp_hash, purpose, request_ip, expires_at) VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [email, otpHash, purpose, clientIp(req)],
  );
  const mail = await sendOtpEmail(email, otp, purpose);
  if (!mail.sent) {
    await query("UPDATE auth_otps SET used_at = NOW() WHERE email = ? AND purpose = ? AND used_at IS NULL", [email, purpose]);
    throw Object.assign(new Error(mail.reason || "Unable to send OTP email"), {
      status: 503,
      code: mail.code || "MAIL_DELIVERY_FAILED",
    });
  }
  return admin;
}

async function verifyAdminOtp(emailValue, otpValue, purpose) {
  const email = String(emailValue || "").trim().toLowerCase();
  const otp = String(otpValue || "").trim();
  if (!/^\d{6}$/.test(otp)) return null;
  const rows = await query(
    `SELECT o.id otp_id, o.otp_hash, o.attempts, a.id, a.name, a.email, a.role, a.active
     FROM auth_otps o
     JOIN admin_users a ON LOWER(a.email) = o.email
     WHERE o.email = ? AND o.purpose = ? AND o.used_at IS NULL
       AND o.expires_at >= NOW() AND a.active = 1
     ORDER BY o.created_at DESC LIMIT 1`,
    [email, purpose],
  );
  const admin = rows[0];
  if (!admin || Number(admin.attempts || 0) >= 5) return null;
  if (!(await bcrypt.compare(otp, admin.otp_hash))) {
    await query("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?", [admin.otp_id]);
    return null;
  }
  await query("UPDATE auth_otps SET used_at = NOW() WHERE id = ?", [admin.otp_id]);
  return admin;
}

app.post(`${apiPrefix}/admin/otp/request`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const admin = await createAdminOtp(req.body.email, "admin_login", req);
  if (!admin) return res.status(400).json({ message: "Enter the configured active admin email address" });
  res.json({ message: `OTP sent to ${admin.email}`, email: admin.email, expiresInMinutes: 10 });
}));

app.post(`${apiPrefix}/admin/otp/verify`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const admin = await verifyAdminOtp(req.body.email, req.body.otp, "admin_login");
  if (!admin) return res.status(401).json({ message: "Invalid or expired OTP" });
  await issueAdminSession(req, res, admin);
  res.json({ id: admin.id, username: admin.name, name: admin.name, email: admin.email, role: admin.role });
}));

app.post(`${apiPrefix}/admin/password-reset/request`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const admin = await createAdminOtp(req.body.email, "admin_reset_password", req);
  if (!admin) return res.status(400).json({ message: "Enter the configured active admin email address" });
  res.json({ message: `Password reset OTP sent to ${admin.email}`, email: admin.email, expiresInMinutes: 10 });
}));

app.post(`${apiPrefix}/admin/password-reset/confirm`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const newPassword = String(req.body.newPassword || "");
  if (!isStrongAdminPassword(newPassword)) {
    return res.status(400).json({ message: "Use 12-72 characters with uppercase, lowercase, number and symbol" });
  }
  const admin = await verifyAdminOtp(req.body.email, req.body.otp, "admin_reset_password");
  if (!admin) return res.status(401).json({ message: "Invalid or expired OTP" });
  const hash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE admin_users SET password_hash = ?, token_version = token_version + 1, password_changed_at = NOW() WHERE id = ?", [hash, admin.id]);
  await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = ?", [admin.id]);
  await audit(req, "reset_password", "admin_users", admin.id, { method: "email_otp" });
  res.json({ message: "Admin password reset successfully" });
}));

app.get(`${apiPrefix}/admin/profile`, requireAdmin, asyncHandler(async (req, res) => {
  res.json({ _id: String(req.admin.id), ...req.admin });
}));

app.post(`${apiPrefix}/admin/logout`, asyncHandler(async (req, res) => {
  await revokeAdminSession(req, res);
  res.json({ message: "Logged out successfully" });
}));

app.post(`${apiPrefix}/admin/uploads/image`, requireAdmin, asyncHandler(async (req, res) => {
  const uploaded = await saveUploadedImage(req, req.body.image || req.body.dataUrl, req.body.folder || "images", req.body.preset);
  await audit(req, "upload", "uploads", uploaded.path, { folder: req.body.folder || "images", preset: req.body.preset || "", size: uploaded.size });
  res.status(201).json(uploaded);
}));

app.post(`${apiPrefix}/admin/change-password`, requireAdmin, asyncHandler(async (req, res) => {
  const { currentPassword, oldPassword, newPassword } = req.body;
  const current = currentPassword || oldPassword;
  if (!current || !isStrongAdminPassword(newPassword)) {
    return res.status(400).json({ message: "Enter the current password and a 12-72 character password with uppercase, lowercase, number and symbol" });
  }

  const rows = await query("SELECT password_hash FROM admin_users WHERE id = ?", [req.admin.id]);
  if (!rows[0] || !(await bcrypt.compare(current, rows[0].password_hash))) {
    return res.status(400).json({ message: "Current password is incorrect" });
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE admin_users SET password_hash = ?, token_version = token_version + 1, password_changed_at = NOW() WHERE id = ?", [hash, req.admin.id]);
  await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE admin_id = ? AND id <> ?", [req.admin.id, req.admin.session_id]);
  await audit(req, "change_password", "admin_users", req.admin.id);
  res.json({ message: "Password updated successfully" });
}));

app.get(`${apiPrefix}/admin/dashboard`, requireAdmin, asyncHandler(async (_req, res) => {
  const [orderStats] = await query(`
    SELECT
      COUNT(*) totalOrders,
      COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN amount ELSE 0 END),0) revenue,
      SUM(status = 'Pending') pendingOrders,
      SUM(DATE(created_at) = CURRENT_DATE()) todayOrders
    FROM orders
    WHERE deleted_at IS NULL
  `);
  const [userStats] = await query("SELECT COUNT(*) totalClients, SUM(is_active = 1) activeClients FROM users");
  const [productStats] = await query("SELECT COUNT(*) products, SUM(stock <= 5) lowStock FROM products");
  const [enquiryStats] = await query("SELECT COUNT(*) enquiries, SUM(status = 'New') newEnquiries FROM enquiries");
  const recentOrders = await query("SELECT * FROM orders ORDER BY created_at DESC LIMIT 8");

  res.json({
    stats: { ...orderStats, ...userStats, ...productStats, ...enquiryStats },
    recentOrders: recentOrders.map(toOrder),
  });
}));

app.get(`${apiPrefix}/products/admin/brands`, requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query("SELECT id, name, created_at createdAt FROM product_brands ORDER BY name");
  res.json({ brands: rows.map((row) => ({ ...row, _id: String(row.id) })) });
}));

app.post(`${apiPrefix}/products/admin/brands`, requireAdmin, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Brand name is required" });
  const result = await query("INSERT INTO product_brands (name) VALUES (?)", [name]);
  await audit(req, "create", "product_brands", result.insertId, { name });
  res.status(201).json({ _id: String(result.insertId), id: result.insertId, name });
}));

app.put(`${apiPrefix}/products/admin/brands/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Brand name is required" });
  await query("UPDATE product_brands SET name = ? WHERE id = ?", [name, req.params.id]);
  await audit(req, "update", "product_brands", req.params.id, { name });
  res.json({ _id: String(req.params.id), id: Number(req.params.id), name });
}));

app.delete(`${apiPrefix}/products/admin/brands/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const brands = await query("SELECT name FROM product_brands WHERE id = ?", [req.params.id]);
  if (!brands[0]) return res.status(404).json({ message: "Brand not found" });
  const used = await query("SELECT COUNT(*) total FROM products WHERE brand = ?", [brands[0].name]);
  if (Number(used[0]?.total || 0)) return res.status(409).json({ message: "Archive or reassign products before deleting this brand" });
  await query("DELETE FROM product_brands WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "product_brands", req.params.id);
  res.json({ message: "Brand deleted" });
}));

app.get(`${apiPrefix}/products/admin/categories`, requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query(`
    SELECT c.id, c.name, c.image_url imageUrl, c.created_at createdAt,
      COUNT(p.id) productCount,
      COALESCE(SUM(p.is_active = 1), 0) visibleProductCount
    FROM product_categories c
    LEFT JOIN products p ON p.category_id = c.id OR (p.category_id IS NULL AND p.category = c.name)
    GROUP BY c.id, c.name, c.image_url, c.created_at
    ORDER BY c.name
  `);
  res.json({ categories: rows.map((row) => ({ ...row, _id: String(row.id) })) });
}));

app.get(`${apiPrefix}/categories`, asyncHandler(async (_req, res) => {
  const rows = await query(`
    SELECT c.id, c.name, c.created_at createdAt,
      COUNT(p.id) productCount,
      COALESCE(
        NULLIF(c.image_url, ''),
        MAX(CASE WHEN p.is_featured = 1 THEN p.image_url END),
        MAX(p.image_url),
        ''
      ) imageUrl
    FROM product_categories c
    LEFT JOIN products p ON (p.category_id = c.id OR p.category = c.name) AND p.is_active = 1
    GROUP BY c.id, c.name, c.image_url, c.created_at
    ORDER BY c.name
  `);
  res.json({
    categories: rows.map((row) => ({
      id: Number(row.id),
      name: row.name,
      slug: slugify(row.name),
      imageUrl: row.imageUrl || "",
      productCount: Number(row.productCount || 0),
      createdAt: row.createdAt,
    })),
  });
}));

app.post(`${apiPrefix}/products/admin/categories`, requireAdmin, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Category name is required" });
  if (!hasMax(name, 120)) return bad(res, "Category name must be 120 characters or less");
  const imageUrl = clean(req.body.imageUrl || req.body.image_url);
  if (imageUrl && !isManagedUpload(imageUrl, "categories")) return bad(res, "Upload the category image using the admin image uploader");
  const result = await query("INSERT INTO product_categories (name, image_url) VALUES (?, ?)", [name, imageUrl]);
  await audit(req, "create", "product_categories", result.insertId, { name, imageUrl });
  res.status(201).json({ _id: String(result.insertId), id: result.insertId, name, imageUrl });
}));

app.put(`${apiPrefix}/products/admin/categories/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ message: "Category name is required" });
  if (!hasMax(name, 120)) return bad(res, "Category name must be 120 characters or less");
  const imageUrl = clean(req.body.imageUrl || req.body.image_url);
  if (imageUrl && !isManagedUpload(imageUrl, "categories")) return bad(res, "Upload the category image using the admin image uploader");
  const current = await query("SELECT name FROM product_categories WHERE id = ? LIMIT 1", [req.params.id]);
  if (!current[0]) return res.status(404).json({ message: "Category not found" });
  await transaction(async (connection) => {
    await connection.execute("UPDATE product_categories SET name = ?, image_url = ? WHERE id = ?", [name, imageUrl, req.params.id]);
    await connection.execute("UPDATE products SET category = ? WHERE category_id = ?", [name, req.params.id]);
  });
  await audit(req, "update", "product_categories", req.params.id, { name, imageUrl });
  res.json({ _id: String(req.params.id), id: Number(req.params.id), name, imageUrl });
}));

app.delete(`${apiPrefix}/products/admin/categories/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const categories = await query("SELECT name FROM product_categories WHERE id = ?", [req.params.id]);
  if (!categories[0]) return res.status(404).json({ message: "Category not found" });
  const used = await query("SELECT COUNT(*) total FROM products WHERE category_id = ? OR category = ?", [req.params.id, categories[0].name]);
  if (Number(used[0]?.total || 0)) return res.status(409).json({ message: "Archive or reassign products before deleting this category" });
  await query("DELETE FROM product_categories WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "product_categories", req.params.id);
  res.json({ message: "Category deleted" });
}));

app.get(`${apiPrefix}/products/admin/all`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR category LIKE ? OR brand LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.category) {
    where.push("category = ?");
    params.push(req.query.category);
  }
  if (req.query.inStock === "true") {
    where.push("in_stock = 1");
  }
  if (req.query.inStock === "false") {
    where.push("in_stock = 0");
  }
  if (req.query.inStock === "low") {
    where.push("stock <= 5");
  }
  if (req.query.isActive !== undefined) {
    where.push("is_active = ?");
    params.push(normalizeBoolean(req.query.isActive));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM products ${clause}`, params);
  const rows = await query(`SELECT * FROM products ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ products: rows.map(toProduct), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/products`, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = ["is_active = 1"];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR category LIKE ? OR brand LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.category) {
    where.push("category = ?");
    params.push(req.query.category);
  }
  if (req.query.collection === "best-sellers") {
    where.push("(is_featured = 1 OR LOWER(REPLACE(REPLACE(badge, ' ', ''), '-', '')) = 'bestseller')");
  }
  if (req.query.collection === "new-arrivals") {
    where.push("LOWER(REPLACE(REPLACE(badge, ' ', ''), '-', '')) IN ('new', 'newarrival', 'newarrivals')");
  }
  if (req.query.inStock === "true") where.push("in_stock = 1");
  if (req.query.inStock === "false") where.push("in_stock = 0");
  if (req.query.minPrice !== undefined) {
    where.push("price >= ?");
    params.push(Math.max(Number(req.query.minPrice) || 0, 0));
  }
  if (req.query.maxPrice !== undefined) {
    where.push("price <= ?");
    params.push(Math.max(Number(req.query.maxPrice) || 0, 0));
  }
  if (req.query.material) {
    where.push("JSON_UNQUOTE(JSON_EXTRACT(specs, '$.material')) = ?");
    params.push(clean(req.query.material));
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const orderBy = {
    low: "price ASC, id DESC",
    high: "price DESC, id DESC",
    name: "name ASC, id DESC",
    newest: "created_at DESC",
    featured: "is_featured DESC, created_at DESC",
  }[String(req.query.sort || "featured")] || "is_featured DESC, created_at DESC";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM products ${clause}`, params);
  const rows = await query(`SELECT * FROM products ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ products: rows.map(toProduct), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/products/:id`, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM products WHERE id = ? OR slug = ? LIMIT 1", [req.params.id, req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Product not found" });
  res.json(toProduct(rows[0]));
}));

app.post(`${apiPrefix}/orders`, publicOrderLimiter, optionalUser, asyncHandler(async (req, res) => {
  const requestedItems = Array.isArray(req.body.items) ? req.body.items : [];
  if (!requestedItems.length || requestedItems.length > 25) return bad(res, "Add at least one valid product to your order");
  const customerName = clean(req.body.customerName || req.user?.name);
  const customerEmail = clean(req.body.customerEmail || req.user?.email);
  const customerPhone = phoneDigits(req.body.customerPhone || req.user?.phone);
  const deliveryAddress = clean(req.body.deliveryAddress);
  if (!isName(customerName)) return bad(res, "Valid customer name is required");
  if (!isPhone(customerPhone)) return bad(res, "Valid 10 digit customer phone is required");
  if (customerEmail && !isEmail(customerEmail)) return bad(res, "Valid customer email is required");
  if (deliveryAddress.length < 8 || deliveryAddress.length > 300) return bad(res, "A complete delivery address is required");
  const paymentMethod = clean(req.body.paymentMethod || "UPI").toUpperCase();
  if (!["UPI", "GPAY", "QR", "WHATSAPP"].includes(paymentMethod)) return bad(res, "Invalid payment method");
  const proofData = req.body.paymentProof || req.body.paymentScreenshot || req.body.screenshot;
  if (!String(proofData || "").startsWith("data:image/")) return bad(res, "Upload the payment screenshot before placing the order");
  const idempotencyKey = clean(req.get("Idempotency-Key") || req.body.idempotencyKey);
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(idempotencyKey)) return bad(res, "A valid idempotency key is required");

  const existingRows = await query("SELECT * FROM orders WHERE idempotency_key = ? LIMIT 1", [idempotencyKey]);
  if (existingRows[0]) return res.status(200).json(toOrder(existingRows[0]));
  const proof = await saveUploadedImage(req, proofData, "payment-proofs");
  const orderId = `ASJ-${Date.now().toString(36).toUpperCase()}-${randomBytes(4).toString("hex").toUpperCase()}`;
  const invoiceNumber = `INV-${orderId}`;

  let created;
  try {
    created = await transaction(async (connection) => {
    const pricedItems = [];
    let subtotal = 0;
    for (const requested of requestedItems) {
      const productId = Number(requested.productId || requested.id);
      const quantity = Math.min(Math.max(Number(requested.quantity || 1), 1), 20);
      if (!Number.isInteger(productId)) throw Object.assign(new Error("Every order item must reference a valid product"), { status: 400 });
      const [rows] = await connection.execute("SELECT * FROM products WHERE id = ? AND is_active = 1 FOR UPDATE", [productId]);
      const product = rows[0];
      if (!product || !product.in_stock) throw Object.assign(new Error("A selected product is unavailable"), { status: 409 });
      const variants = safeJson(product.variants, []);
      const variantId = clean(requested.variantId || requested.variant_id);
      const variant = variantId ? variants.find((item) => String(item.id) === variantId) : null;
      if (variantId && !variant) throw Object.assign(new Error(`Selected variation is unavailable for ${product.name}`), { status: 409 });
      const availableStock = Number(variant ? variant.stock : product.stock);
      if (availableStock < quantity || Number(product.stock) < quantity) {
        throw Object.assign(new Error(`Only ${Math.max(Math.min(availableStock, Number(product.stock)), 0)} left for ${product.name}`), { status: 409 });
      }
      const unitPrice = Number(variant?.price ?? product.price);
      if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw Object.assign(new Error(`Invalid catalogue price for ${product.name}`), { status: 500 });
      const lineTotal = Number((unitPrice * quantity).toFixed(2));
      subtotal += lineTotal;
      if (variant) {
        variant.stock = availableStock - quantity;
      }
      await connection.execute(
        "UPDATE products SET stock = stock - ?, in_stock = IF(stock - ? > 0, 1, 0), variants = ? WHERE id = ? AND stock >= ?",
        [quantity, quantity, JSON.stringify(variants), product.id, quantity],
      );
      pricedItems.push({
        productId: product.id,
        variantId,
        name: product.name,
        sku: clean(variant?.sku),
        unitPrice,
        quantity,
        lineTotal,
        category: product.category || "",
        snapshot: { name: product.name, category: product.category, image: product.image_url, variant: variant || null },
      });
    }
    const couponCode = clean(req.body.couponCode).toUpperCase();
    const couponResult = couponCode
      ? await validateCouponCode({ code: couponCode, subtotal, email: customerEmail })
      : { valid: true, discount: 0 };
    if (!couponResult.valid) {
      throw Object.assign(new Error(couponResult.message || "Coupon is not valid"), { status: 400 });
    }
    const discount = Number(couponResult.discount || 0);
    const total = Number(Math.max(subtotal - discount, 0).toFixed(2));
    const productSummary = pricedItems.map((item) => `${item.name} x${item.quantity}`).join(", ");
    const categorySummary = [...new Set(pricedItems.map((item) => item.category).filter(Boolean))].join(", ");
    const [result] = await connection.execute(
      `INSERT INTO orders
       (order_id, user_id, customer_name, customer_email, customer_phone, product, category, amount, status,
        payment_status, payment_method, delivery_mode, delivery_address, invoice_number, notes, payment_proof_url,
        idempotency_key, inventory_reserved)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending', 'Awaiting Verification', ?, 'Delivery', ?, ?, ?, ?, ?, 1)`,
      [
        orderId, req.user?.id || null, customerName, customerEmail, customerPhone, productSummary, categorySummary,
        total, paymentMethod, deliveryAddress, invoiceNumber,
        [clean(req.body.notes), couponCode ? `Coupon used: ${couponCode}; Discount: ${discount}` : ""].filter(Boolean).join(" | ").slice(0, 500),
        proof.path, idempotencyKey,
      ],
    );
    for (const item of pricedItems) {
      await connection.execute(
        `INSERT INTO order_items
         (order_id, product_id, variant_id, product_name, sku, unit_price, quantity, line_total, product_snapshot)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [result.insertId, item.productId, item.variantId, item.name, item.sku, item.unitPrice, item.quantity, item.lineTotal, JSON.stringify(item.snapshot)],
      );
    }
    if (req.user?.id) {
      await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
    }
    const [rows] = await connection.execute("SELECT * FROM orders WHERE id = ?", [result.insertId]);
    return rows[0];
    });
  } catch (error) {
    const proofFile = uploadPathToFile(proof.path);
    if (proofFile) await unlink(proofFile).catch(() => {});
    throw error;
  }
  await audit(req, "create_manual_payment_order", "orders", created.id, { orderId, paymentMethod });
  setImmediate(() => {
    void sendAdminOrderNotification(created);
  });
  return res.status(201).json(toOrder(created));
}));

async function upsertProduct(req, res, id = null) {
  const body = req.body;
  const existingRows = id ? await query("SELECT * FROM products WHERE id = ? LIMIT 1", [id]) : [];
  const existing = existingRows[0] || null;
  if (id && !existing) return res.status(404).json({ message: "Product not found" });
  const name = String(body.name || "").trim();
  if (name.length < 2) return bad(res, "Product name must be at least 2 characters");
  if (!hasMax(name, 120)) return bad(res, "Product name must be 120 characters or less");
  if (!clean(body.category || body.breadcrumb?.category)) return bad(res, "Product category is required");
  if (!hasMax(body.brand, 80)) return bad(res, "Brand must be 80 characters or less");
  if (!hasMax(body.badge, 60)) return bad(res, "Deal badge must be 60 characters or less");
  if (!hasMax(body.description, 1200)) return bad(res, "Product description must be 1200 characters or less");

  const existingImages = existing ? safeJson(existing.images, existing.image_url ? [existing.image_url] : []) : [];
  const images = Array.isArray(body.images)
    ? body.images
    : (body.image || body.imageUrl ? [body.image || body.imageUrl] : existingImages);
  const price = Number(body.price ?? body.displayPrice ?? body.variants?.[0]?.price ?? existing?.price ?? 0);
  const comparePrice = Number(body.comparePrice ?? body.displayOriginalPrice ?? body.variants?.[0]?.originalPrice ?? existing?.compare_price ?? 0);
  const stock = Number(body.stock ?? existing?.stock ?? (body.inStock === false ? 0 : 25));
  const rating = Number(body.rating ?? existing?.rating ?? 4.8);
  if (!Number.isFinite(price) || price <= 0) return bad(res, "Product price must be a valid number greater than 0");
  if (!Number.isFinite(comparePrice) || comparePrice < 0) return bad(res, "Compare price must be a valid non-negative number");
  if (comparePrice > 0 && comparePrice < price) return bad(res, "Compare price must be greater than selling price");
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return bad(res, "Stock must be a whole number between 0 and 1,000,000");
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) return bad(res, "Rating must be between 0 and 5");
  if (!images.length || images.length > 12 || images.some((image) => !isManagedUpload(image, "catalog"))) {
    return bad(res, "Upload between 1 and 12 product images using the admin image uploader");
  }
  const categoryName = clean(body.category || body.breadcrumb?.category);
  await query("INSERT IGNORE INTO product_categories (name) VALUES (?)", [categoryName]);
  const categoryRows = await query("SELECT id FROM product_categories WHERE name = ? LIMIT 1", [categoryName]);
  const brandName = clean(body.brand || "Annai Jewellery");
  await query("INSERT IGNORE INTO product_brands (name) VALUES (?)", [brandName]);
  const brandRows = await query("SELECT id FROM product_brands WHERE name = ? LIMIT 1", [brandName]);
  const suppliedVariants = Array.isArray(body.variants)
    ? body.variants
    : (existing ? safeJson(existing.variants, []) : []);
  const variants = suppliedVariants.length
    ? suppliedVariants
    : [{
      id: "standard",
      label: "Standard",
      sku: `ASJ-${slugify(name).toUpperCase().slice(0, 32)}`,
      price: Number(price),
      originalPrice: Number(comparePrice || price),
      stock,
    }];
  if (variants.length === 1) {
    variants[0] = {
      ...variants[0],
      price: Number(price),
      originalPrice: Number(comparePrice || price),
      stock,
    };
  }
  const values = {
    name,
    slug: body.slug || slugify(name),
    category: categoryName,
    brand: brandName,
    goal: body.goal || body.industry || "",
    flavor: body.flavor || "",
    price,
    compare_price: comparePrice,
    stock,
    rating,
    review_count: body.reviewCount ?? 0,
    in_stock: normalizeBoolean(body.inStock ?? true),
    image_url: body.imageUrl || body.image || images[0] || "",
    images: JSON.stringify(images),
    variants: JSON.stringify(variants),
    features: JSON.stringify(Array.isArray(body.features) ? body.features : (existing ? safeJson(existing.features, []) : [])),
    specs: JSON.stringify({
      ...(body.specs || {}),
      relatedProductIds: Array.isArray(body.relatedProductIds)
        ? [...new Set(body.relatedProductIds.map(String).filter((value) => value && value !== String(id || "")))].slice(0, 12)
        : (body.specs?.relatedProductIds || []),
    }),
    faqs: JSON.stringify(Array.isArray(body.faqs) ? body.faqs : (existing ? safeJson(existing.faqs, []) : [])),
    reviews: JSON.stringify(Array.isArray(body.reviews) ? body.reviews : (existing ? safeJson(existing.reviews, []) : [])),
    description: body.description || "",
    tagline: body.tagline || "",
    badge: body.badge || "",
    is_active: normalizeBoolean(body.isActive ?? true),
    is_featured: normalizeBoolean(body.isFeatured ?? false),
  };

  if (id) {
    await query(
      `UPDATE products SET name=?, slug=?, category=?, brand=?, goal=?, flavor=?, price=?, compare_price=?, stock=?,
      rating=?, review_count=?, in_stock=?, image_url=?, images=?, variants=?, features=?, specs=?, faqs=?, reviews=?,
      description=?, tagline=?, badge=?, is_active=?, is_featured=? WHERE id=?`,
      [...Object.values(values), id],
    );
    await audit(req, "update", "products", id, values);
    await query("UPDATE products SET category_id=?, brand_id=? WHERE id=?", [categoryRows[0]?.id || null, brandRows[0]?.id || null, id]);
  } else {
    const result = await query(
      `INSERT INTO products (name, slug, category, brand, goal, flavor, price, compare_price, stock, rating, review_count,
      in_stock, image_url, images, variants, features, specs, faqs, reviews, description, tagline, badge, is_active, is_featured)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(values),
    );
    id = result.insertId;
    await query("UPDATE products SET category_id=?, brand_id=? WHERE id=?", [categoryRows[0]?.id || null, brandRows[0]?.id || null, id]);
    await audit(req, "create", "products", id, values);
  }

  const rows = await query("SELECT * FROM products WHERE id = ?", [id]);
  res.status(id && req.method === "POST" ? 201 : 200).json(toProduct(rows[0]));
}

app.post(`${apiPrefix}/products`, requireAdmin, asyncHandler((req, res) => upsertProduct(req, res)));
app.put(`${apiPrefix}/products/:id`, requireAdmin, asyncHandler((req, res) => upsertProduct(req, res, req.params.id)));

app.patch(`${apiPrefix}/products/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  const updates = [];
  const params = [];
  const isActive = normalizeBoolean(req.body.isActive ?? req.body.is_active);
  const isFeatured = normalizeBoolean(req.body.isFeatured ?? req.body.is_featured);
  const inStock = normalizeBoolean(req.body.inStock ?? req.body.in_stock);
  if (isActive !== undefined) { updates.push("is_active = ?"); params.push(isActive); }
  if (isFeatured !== undefined) { updates.push("is_featured = ?"); params.push(isFeatured); }
  if (inStock !== undefined) { updates.push("in_stock = ?"); params.push(inStock); }
  if (!updates.length) return res.status(400).json({ message: "No valid status field supplied" });
  params.push(req.params.id);
  const result = await query(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, params);
  if (!result.affectedRows) return res.status(404).json({ message: "Product not found" });
  await audit(req, "status", "products", req.params.id, req.body);
  const rows = await query("SELECT * FROM products WHERE id = ?", [req.params.id]);
  res.json({ message: "Product updated", product: toProduct(rows[0]) });
}));

app.delete(`${apiPrefix}/products/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const result = await query("UPDATE products SET is_active = 0, is_featured = 0 WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Product not found" });
  await audit(req, "deactivate", "products", req.params.id);
  res.json({ message: "Product archived" });
}));

app.delete(`${apiPrefix}/products/:id/permanent`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT id, name, category FROM products WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Product not found" });
  await transaction(async (connection) => {
    await connection.execute("UPDATE testimonials SET product_id = NULL WHERE product_id = ?", [req.params.id]);
    await connection.execute("DELETE FROM products WHERE id = ?", [req.params.id]);
  });
  await audit(req, "delete", "products", req.params.id, rows[0]);
  res.json({ message: "Product permanently deleted" });
}));

app.get(`${apiPrefix}/admin/orders`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = ["deleted_at IS NULL"];
  const params = [];
  if (req.query.search) {
    where.push("(order_id LIKE ? OR customer_name LIKE ? OR customer_email LIKE ? OR customer_phone LIKE ? OR product LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.status) {
    where.push("status = ?");
    params.push(req.query.status);
  }
  if (req.query.paymentMethod) {
    where.push("payment_method = ?");
    params.push(req.query.paymentMethod);
  }
  if (req.query.startDate || req.query.from) {
    where.push("DATE(created_at) >= ?");
    params.push(req.query.startDate || req.query.from);
  }
  if (req.query.endDate || req.query.to) {
    where.push("DATE(created_at) <= ?");
    params.push(req.query.endDate || req.query.to);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM orders ${clause}`, params);
  const [stats] = await query(`
    SELECT COUNT(*) total, COALESCE(SUM(CASE WHEN payment_status = 'Paid' THEN amount ELSE 0 END),0) revenue, SUM(status='Delivered') delivered,
      SUM(status='Pending') pending, SUM(status='Processing') processing, SUM(status='Cancelled') cancelled,
      SUM(DATE(created_at)=CURRENT_DATE()) todayOrders
    FROM orders ${clause}
  `, params);
  const rows = await query(`SELECT * FROM orders ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ orders: rows.map(toAdminOrder), total, stats, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/admin/orders/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT * FROM orders WHERE (id = ? OR order_id = ?) AND deleted_at IS NULL LIMIT 1",
    [req.params.id, req.params.id],
  );
  if (!rows[0]) return res.status(404).json({ message: "Order not found" });
  const items = await query(
    `SELECT oi.*,
       COALESCE(
         oi.product_id,
         (SELECT p2.id FROM products p2 WHERE LOWER(p2.name) = LOWER(oi.product_name) ORDER BY p2.is_active DESC, p2.id DESC LIMIT 1)
       ) current_product_id,
       COALESCE(
         p.image_url,
         (SELECT p3.image_url FROM products p3 WHERE LOWER(p3.name) = LOWER(oi.product_name) ORDER BY p3.is_active DESC, p3.id DESC LIMIT 1)
       ) current_product_image
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [rows[0].id],
  );
  res.json({
    ...toAdminOrder(rows[0]),
    items: items.map(toOrderItem),
  });
}));

app.get(`${apiPrefix}/admin/orders/:id/payment-proof`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT payment_proof_url FROM orders WHERE id = ? AND deleted_at IS NULL LIMIT 1",
    [req.params.id],
  );
  if (!rows[0]?.payment_proof_url) return res.status(404).json({ message: "Payment proof not found" });
  const filePath = uploadPathToFile(rows[0].payment_proof_url);
  if (!filePath) return res.status(404).json({ message: "Payment proof not found" });
  res.set("Cache-Control", "private, no-store");
  res.set("Cross-Origin-Resource-Policy", "same-site");
  return res.sendFile(filePath);
}));

app.post(`${apiPrefix}/admin/orders`, requireAdmin, asyncHandler(async (req, res) => {
  return res.status(405).json({ message: "Create customer orders through the secure checkout so pricing and inventory are verified" });
}));

app.post(`${apiPrefix}/admin/orders/:id/payment-review`, requireAdmin, asyncHandler(async (req, res) => {
  const action = clean(req.body.action).toLowerCase();
  const reason = clean(req.body.reason).slice(0, 500);
  if (!["approve", "reject"].includes(action)) return bad(res, "Choose approve or reject");
  if (action === "reject" && reason.length < 3) return bad(res, "Provide a rejection reason");
  const updated = await transaction(async (connection) => {
    const [rows] = await connection.execute("SELECT * FROM orders WHERE id = ? AND deleted_at IS NULL FOR UPDATE", [req.params.id]);
    const order = rows[0];
    if (!order) throw Object.assign(new Error("Order not found"), { status: 404 });
    if (order.payment_status !== "Awaiting Verification") {
      throw Object.assign(new Error(`Payment has already been ${String(order.payment_status).toLowerCase()}`), { status: 409 });
    }
    if (!order.payment_proof_url) throw Object.assign(new Error("Payment proof is missing"), { status: 409 });
    if (action === "reject" && order.inventory_reserved) {
      const [items] = await connection.execute("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      for (const item of items) {
        if (!item.product_id) continue;
        const [productRows] = await connection.execute("SELECT * FROM products WHERE id = ? FOR UPDATE", [item.product_id]);
        const product = productRows[0];
        if (!product) continue;
        const variants = safeJson(product.variants, []);
        if (item.variant_id) {
          const variant = variants.find((entry) => String(entry.id) === String(item.variant_id));
          if (variant) variant.stock = Number(variant.stock || 0) + Number(item.quantity);
        }
        await connection.execute(
          "UPDATE products SET stock = stock + ?, in_stock = 1, variants = ? WHERE id = ?",
          [item.quantity, JSON.stringify(variants), item.product_id],
        );
      }
    }
    const paymentStatus = action === "approve" ? "Paid" : "Rejected";
    const orderStatus = action === "approve" ? "Processing" : "Cancelled";
    await connection.execute(
      `UPDATE orders SET payment_status = ?, status = ?, inventory_reserved = 0,
       payment_reviewed_at = NOW(), payment_reviewed_by = ?, payment_rejection_reason = ?
       WHERE id = ?`,
      [paymentStatus, orderStatus, req.admin.id, action === "reject" ? reason : "", order.id],
    );
    await connection.execute(
      `INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, payload)
       VALUES (?, ?, ?, 'orders', ?, ?)`,
      [
        req.admin.id,
        req.admin.name,
        `payment_${action}`,
        String(order.id),
        JSON.stringify({ reason: action === "reject" ? reason : undefined }),
      ],
    );
    const [nextRows] = await connection.execute("SELECT * FROM orders WHERE id = ?", [order.id]);
    return nextRows[0];
  });
  res.json(toAdminOrder(updated));
}));

app.patch(`${apiPrefix}/admin/orders/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  const status = req.body.status;
  const allowed = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(status)) return res.status(400).json({ message: "Invalid order status" });
  const currentRows = await query("SELECT status, payment_status, inventory_reserved FROM orders WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
  if (!currentRows[0]) return res.status(404).json({ message: "Order not found" });
  const currentStatus = currentRows[0].status;
  const transitions = {
    Pending: ["Pending", "Processing", "Cancelled"],
    Processing: ["Processing", "Shipped"],
    Shipped: ["Shipped", "Delivered"],
    Delivered: ["Delivered"],
    Cancelled: ["Cancelled"],
  };
  if (!(transitions[currentStatus] || []).includes(status)) {
    return res.status(409).json({ message: `Order cannot move from ${currentStatus} to ${status}` });
  }
  if (["Processing", "Shipped", "Delivered"].includes(status) && currentRows[0].payment_status !== "Paid") {
    return res.status(409).json({ message: "Approve the payment proof before processing or delivering this order" });
  }
  if (status === "Cancelled" && currentRows[0].inventory_reserved) {
    return res.status(409).json({ message: "Reject the payment proof to cancel and restore reserved stock safely" });
  }
  await query(
    "UPDATE orders SET status = ?, notes = COALESCE(?, notes) WHERE id = ? AND deleted_at IS NULL",
    [status, req.body.notes ?? null, req.params.id],
  );
  await audit(req, "status", "orders", req.params.id, req.body);
  const rows = await query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  res.json(toAdminOrder(rows[0]));
}));

app.patch(`${apiPrefix}/admin/orders/:id/license`, requireAdmin, asyncHandler(async (req, res) => {
  const licenseKey = String(req.body.licenseKey || req.body.license_key || "").trim();
  await query("UPDATE orders SET license_key = ? WHERE id = ?", [licenseKey, req.params.id]);
  await audit(req, "license", "orders", req.params.id, { licenseKey });
  const rows = await query("SELECT * FROM orders WHERE id = ?", [req.params.id]);
  res.json(toOrder(rows[0]));
}));

app.delete(`${apiPrefix}/admin/orders/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT payment_status, inventory_reserved FROM orders WHERE id = ? AND deleted_at IS NULL", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Order not found" });
  if (["Paid", "Refunded"].includes(rows[0].payment_status)) {
    return res.status(409).json({ message: "Paid and refunded orders are financial records and cannot be deleted" });
  }
  if (rows[0].inventory_reserved) {
    return res.status(409).json({ message: "Reject the payment first so reserved stock is restored before archiving" });
  }
  await query("UPDATE orders SET deleted_at = NOW() WHERE id = ?", [req.params.id]);
  await audit(req, "archive", "orders", req.params.id);
  res.json({ message: "Order archived" });
}));

app.get(`${apiPrefix}/admin/users`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.status === "active") where.push("u.is_active = 1");
  if (req.query.status === "inactive") where.push("u.is_active = 0");
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM users u ${clause}`, params);
  const rows = await query(`
    SELECT u.*, COUNT(o.id) order_count, COALESCE(SUM(o.amount),0) total_spent
    FROM users u LEFT JOIN orders o ON o.user_id = u.id
    ${clause}
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `, [...params, limit, offset]);
  res.json({ users: rows.map(toUser), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.post(`${apiPrefix}/admin/users`, requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, phone, password, address } = req.body;
  const membership = req.body.membership ?? req.body.plan;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  if (phone && !isPhone(phone)) return bad(res, "Phone must be a valid 10 digit mobile number");
  if (clean(password).length < 6) return bad(res, "Password must be at least 6 characters");
  if (!hasMax(password, 72)) return bad(res, "Password must be 72 characters or less");
  if (!hasMax(membership, 80)) return bad(res, "Membership must be 80 characters or less");
  if (!hasMax(address, 300)) return bad(res, "Address must be 300 characters or less");

  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    `INSERT INTO users (name, email, phone, password_hash, plan, goal, address, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
    [clean(name), clean(email), phoneDigits(phone), hash, clean(membership) || "Annai customer", "", clean(address)],
  );
  await audit(req, "create", "users", result.insertId, { name, email, membership });
  const rows = await query("SELECT * FROM users WHERE id = ?", [result.insertId]);
  res.status(201).json(toUser(rows[0]));
}));

app.patch(`${apiPrefix}/admin/users/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  const active = normalizeBoolean(req.body.isActive ?? req.body.active);
  await query("UPDATE users SET is_active = ? WHERE id = ?", [active, req.params.id]);
  await audit(req, "status", "users", req.params.id, { active });
  const rows = await query("SELECT * FROM users WHERE id = ?", [req.params.id]);
  res.json(toUser(rows[0]));
}));

app.get(`${apiPrefix}/admin/users/:id/orders`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC", [req.params.id]);
  res.json(rows.map(toOrder));
}));

app.get(`${apiPrefix}/admin/users/:id/wishlist`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*, w.created_at wishlist_created_at
     FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [req.params.id],
  );
  res.json({
    products: rows.map((row) => ({
      ...toProduct(row),
      wishlistedAt: row.wishlist_created_at,
    })),
  });
}));
app.get(`${apiPrefix}/admin/users/:id/cart`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*, c.quantity, c.updated_at cart_updated_at
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.updated_at DESC`,
    [req.params.id],
  );
  res.json({
    items: rows.map((row) => ({
      product: toProduct(row),
      quantity: Number(row.quantity || 0),
      updatedAt: row.cart_updated_at,
    })),
  });
}));
app.get(`${apiPrefix}/admin/users/:id/addresses`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT address FROM users WHERE id = ?", [req.params.id]);
  res.json(rows[0]?.address ? [{ address: rows[0].address }] : []);
}));

app.delete(`${apiPrefix}/admin/users/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await transaction(async (connection) => {
    await connection.execute("UPDATE users SET is_active = 0 WHERE id = ?", [req.params.id]);
    await connection.execute("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [req.params.id]);
  });
  await audit(req, "deactivate", "users", req.params.id);
  res.json({ message: "User deactivated and active sessions revoked" });
}));

app.post(`${apiPrefix}/auth/login`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const login = req.body.loginIdentifier || req.body.email || req.body.phone;
  if (!clean(login) || !clean(req.body.password)) return bad(res, "Email/phone and password are required");
  const rows = await query("SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1", [login, login]);
  const user = rows[0];
  if (!user || !user.is_active || !user.password_hash || !(await bcrypt.compare(req.body.password || "", user.password_hash))) {
    await recordAuthEvent(req, { email: login }, "login", "password_failed");
    return res.status(401).json({ message: "Invalid credentials" });
  }
  await recordAuthEvent(req, user, "login", "password");
  await issueUserSession(req, res, user);
  res.json(toUser(user));
}));

app.post(`${apiPrefix}/auth/register`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const { name, email, phone, password, address } = req.body;
  const membership = req.body.membership ?? req.body.plan;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  if (phone && !isPhone(phone)) return bad(res, "Phone must be a valid 10 digit mobile number");
  if (clean(password).length < 6) return bad(res, "Password must be at least 6 characters");
  if (!hasMax(password, 72)) return bad(res, "Password must be 72 characters or less");
  if (!hasMax(membership, 80)) return bad(res, "Membership must be 80 characters or less");
  if (!hasMax(address, 300)) return bad(res, "Address must be 300 characters or less");
  const hash = await bcrypt.hash(password, 12);
  const result = await query(
    "INSERT INTO users (name, email, phone, password_hash, plan, goal, address, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)",
    [clean(name), clean(email), phoneDigits(phone), hash, clean(membership) || "Annai customer", "", clean(address)],
  );
  const rows = await query("SELECT * FROM users WHERE id = ?", [result.insertId]);
  const user = rows[0];
  await recordAuthEvent(req, user, "register", "password");
  await issueUserSession(req, res, user);
  res.status(201).json({ ...toUser(user), role: "user" });
}));

app.post(`${apiPrefix}/auth/otp/request`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !user.is_active) return res.status(404).json({ message: "No active user found for this email" });
  const recent = await query(
    "SELECT id FROM auth_otps WHERE email = ? AND purpose = 'login' AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) LIMIT 1",
    [email],
  );
  if (recent[0]) return res.status(429).json({ message: "Please wait 60 seconds before requesting another OTP" });

  const otp = String(randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(otp, 10);
  await query(
    "INSERT INTO auth_otps (email, otp_hash, purpose, request_ip, expires_at) VALUES (?, ?, 'login', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [email, otpHash, clientIp(req)],
  );
  await recordAuthEvent(req, user, "otp_request", "email_otp");
  const mail = await sendOtpEmail(email, otp);
  res.json({
    message: mail.sent ? "OTP sent to your email." : "OTP generated. Configure Gmail SMTP to send real email.",
    otpSent: mail.sent,
    devOtp: mail.sent || process.env.NODE_ENV === "production" ? undefined : otp,
  });
}));

app.post(`${apiPrefix}/auth/otp/verify`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const otp = clean(req.body.otp);
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  if (!/^\d{6}$/.test(otp)) return bad(res, "Enter the 6 digit OTP");
  const otpRows = await query(
    "SELECT * FROM auth_otps WHERE email = ? AND purpose = 'login' AND used_at IS NULL AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1",
    [email],
  );
  const otpRow = otpRows[0];
  if (!otpRow || Number(otpRow.attempts || 0) >= 5) return res.status(401).json({ message: "Invalid or expired OTP" });
  await query("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?", [otpRow.id]);
  if (!(await bcrypt.compare(otp, otpRow.otp_hash))) return res.status(401).json({ message: "Invalid or expired OTP" });
  const userRows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = userRows[0];
  if (!user || !user.is_active) return res.status(404).json({ message: "No active user found for this email" });
  await query("UPDATE auth_otps SET used_at = NOW() WHERE id = ?", [otpRow.id]);
  await recordAuthEvent(req, user, "otp_login", "email_otp");
  await issueUserSession(req, res, user);
  res.json(toUser(user));
}));

app.post(`${apiPrefix}/auth/forgot-password`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = rows[0];
  if (!user || !user.is_active) return res.status(404).json({ message: "No active user found for this email" });
  const recent = await query(
    "SELECT id FROM auth_otps WHERE email = ? AND purpose = 'reset_password' AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) LIMIT 1",
    [email],
  );
  if (recent[0]) return res.status(429).json({ message: "Please wait 60 seconds before requesting another OTP" });

  const otp = String(randomInt(100000, 1000000));
  const otpHash = await bcrypt.hash(otp, 10);
  await query(
    "INSERT INTO auth_otps (email, otp_hash, purpose, request_ip, expires_at) VALUES (?, ?, 'reset_password', ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))",
    [email, otpHash, clientIp(req)],
  );
  await recordAuthEvent(req, user, "password_reset_request", "email_otp");
  const mail = await sendOtpEmail(email, otp);
  res.json({
    message: mail.sent ? "Password reset OTP sent to your email." : "Reset OTP generated. Configure Gmail SMTP to send real email.",
    otpSent: mail.sent,
    devOtp: mail.sent || process.env.NODE_ENV === "production" ? undefined : otp,
  });
}));

app.post(`${apiPrefix}/auth/reset-password`, adminAuthLimiter, asyncHandler(async (req, res) => {
  const email = clean(req.body.email).toLowerCase();
  const otp = clean(req.body.otp);
  const password = clean(req.body.password);
  if (!isEmail(email, true)) return bad(res, "Valid email is required");
  if (!/^\d{6}$/.test(otp)) return bad(res, "Enter the 6 digit OTP");
  if (password.length < 6) return bad(res, "Password must be at least 6 characters");
  if (!hasMax(password, 72)) return bad(res, "Password must be 72 characters or less");
  const otpRows = await query(
    "SELECT * FROM auth_otps WHERE email = ? AND purpose = 'reset_password' AND used_at IS NULL AND expires_at >= NOW() ORDER BY created_at DESC LIMIT 1",
    [email],
  );
  const otpRow = otpRows[0];
  if (!otpRow || Number(otpRow.attempts || 0) >= 5) return res.status(401).json({ message: "Invalid or expired OTP" });
  await query("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?", [otpRow.id]);
  if (!(await bcrypt.compare(otp, otpRow.otp_hash))) return res.status(401).json({ message: "Invalid or expired OTP" });
  const userRows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [email]);
  const user = userRows[0];
  if (!user || !user.is_active) return res.status(404).json({ message: "No active user found for this email" });
  const hash = await bcrypt.hash(password, 12);
  await query("UPDATE users SET password_hash = ? WHERE id = ?", [hash, user.id]);
  await query("UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = ? AND revoked_at IS NULL", [user.id]);
  await query("UPDATE auth_otps SET used_at = NOW() WHERE id = ?", [otpRow.id]);
  await recordAuthEvent(req, user, "password_reset", "email_otp");
  await issueUserSession(req, res, user);
  res.json(toUser(user));
}));

app.post(`${apiPrefix}/auth/logout`, requireUser, asyncHandler(async (req, res) => {
  await revokeUserSession(req, res);
  await recordAuthEvent(req, req.user, "logout", "session");
  res.json({ message: "Logged out" });
}));

app.get(`${apiPrefix}/me`, requireUser, asyncHandler(async (req, res) => {
  res.json(toUser(req.user));
}));

app.put(`${apiPrefix}/me`, requireUser, asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;
  const membership = req.body.membership ?? req.body.plan;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (phone && !isPhone(phone)) return bad(res, "Phone must be a valid 10 digit mobile number");
  if (!hasMax(membership, 80)) return bad(res, "Membership must be 80 characters or less");
  if (!hasMax(address, 300)) return bad(res, "Address must be 300 characters or less");
  await query("UPDATE users SET name=?, phone=?, plan=?, address=? WHERE id=?", [
    clean(name),
    phoneDigits(phone),
    clean(membership) || req.user.plan || "Annai customer",
    clean(address),
    req.user.id,
  ]);
  const rows = await query("SELECT * FROM users WHERE id = ?", [req.user.id]);
  await recordAuthEvent(req, rows[0], "profile_update", "member_portal");
  res.json(toUser(rows[0]));
}));

app.get(`${apiPrefix}/me/addresses`, requireUser, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT * FROM user_addresses
     WHERE user_id = ?
     ORDER BY is_default DESC, updated_at DESC, id DESC`,
    [req.user.id],
  );
  res.json({ addresses: rows.map(toUserAddress) });
}));

app.post(`${apiPrefix}/me/addresses`, requireUser, asyncHandler(async (req, res) => {
  const address = clean(req.body.address);
  const label = clean(req.body.label) || "Delivery address";
  if (address.length < 8) return bad(res, "Enter a complete delivery address");
  if (!hasMax(address, 300)) return bad(res, "Address must be 300 characters or less");
  if (!hasMax(label, 40)) return bad(res, "Address label must be 40 characters or less");

  const addressId = await transaction(async (connection) => {
    const [existing] = await connection.execute(
      "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC",
      [req.user.id],
    );
    const duplicate = existing.find((item) => clean(item.address).toLowerCase() === address.toLowerCase());
    if (duplicate) return Number(duplicate.id);
    if (existing.length >= 5) {
      throw Object.assign(new Error("You can save up to 5 delivery addresses"), { status: 409 });
    }
    const makeDefault = existing.length === 0 || Boolean(req.body.isDefault);
    if (makeDefault) {
      await connection.execute("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
    }
    const [result] = await connection.execute(
      "INSERT INTO user_addresses (user_id, label, address, is_default) VALUES (?, ?, ?, ?)",
      [req.user.id, label, address, makeDefault ? 1 : 0],
    );
    if (makeDefault) {
      await connection.execute("UPDATE users SET address = ? WHERE id = ?", [address, req.user.id]);
    }
    return Number(result.insertId);
  });
  const rows = await query("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1", [addressId, req.user.id]);
  res.status(201).json(toUserAddress(rows[0]));
}));

app.put(`${apiPrefix}/me/addresses/:id`, requireUser, asyncHandler(async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) return bad(res, "A valid saved address is required");
  const currentRows = await query("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1", [addressId, req.user.id]);
  if (!currentRows[0]) return res.status(404).json({ message: "Saved address not found" });
  const address = clean(req.body.address ?? currentRows[0].address);
  const label = clean(req.body.label ?? currentRows[0].label) || "Delivery address";
  if (address.length < 8) return bad(res, "Enter a complete delivery address");
  if (!hasMax(address, 300)) return bad(res, "Address must be 300 characters or less");
  if (!hasMax(label, 40)) return bad(res, "Address label must be 40 characters or less");

  await transaction(async (connection) => {
    const makeDefault = req.body.isDefault === true || Boolean(currentRows[0].is_default);
    if (makeDefault) {
      await connection.execute("UPDATE user_addresses SET is_default = 0 WHERE user_id = ?", [req.user.id]);
    }
    await connection.execute(
      "UPDATE user_addresses SET label = ?, address = ?, is_default = ? WHERE id = ? AND user_id = ?",
      [label, address, makeDefault ? 1 : 0, addressId, req.user.id],
    );
    if (makeDefault) {
      await connection.execute("UPDATE users SET address = ? WHERE id = ?", [address, req.user.id]);
    }
  });
  const rows = await query("SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1", [addressId, req.user.id]);
  res.json(toUserAddress(rows[0]));
}));

app.delete(`${apiPrefix}/me/addresses/:id`, requireUser, asyncHandler(async (req, res) => {
  const addressId = Number(req.params.id);
  if (!Number.isInteger(addressId) || addressId < 1) return bad(res, "A valid saved address is required");
  await transaction(async (connection) => {
    const [rows] = await connection.execute(
      "SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1",
      [addressId, req.user.id],
    );
    if (!rows[0]) throw Object.assign(new Error("Saved address not found"), { status: 404 });
    await connection.execute("DELETE FROM user_addresses WHERE id = ? AND user_id = ?", [addressId, req.user.id]);
    if (rows[0].is_default) {
      const [remaining] = await connection.execute(
        "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY updated_at DESC, id DESC LIMIT 1",
        [req.user.id],
      );
      if (remaining[0]) {
        await connection.execute("UPDATE user_addresses SET is_default = 1 WHERE id = ?", [remaining[0].id]);
        await connection.execute("UPDATE users SET address = ? WHERE id = ?", [remaining[0].address, req.user.id]);
      } else {
        await connection.execute("UPDATE users SET address = '' WHERE id = ?", [req.user.id]);
      }
    }
  });
  res.json({ message: "Saved address removed" });
}));

app.post(`${apiPrefix}/me/change-password`, requireUser, asyncHandler(async (req, res) => {
  const currentPassword = clean(req.body.currentPassword);
  const newPassword = clean(req.body.newPassword);
  if (!currentPassword) return bad(res, "Enter your current password");
  if (newPassword.length < 6 || newPassword.length > 72) return bad(res, "New password must be between 6 and 72 characters");
  const rows = await query("SELECT password_hash FROM users WHERE id = ? LIMIT 1", [req.user.id]);
  if (!rows[0] || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    return bad(res, "Current password is incorrect");
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await query("UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?", [hash, req.user.id]);
  await recordAuthEvent(req, req.user, "change_password", "member_portal");
  res.json({ message: "Password changed successfully" });
}));

app.get(`${apiPrefix}/me/orders`, requireUser, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const [{ total }] = await query("SELECT COUNT(*) total FROM orders WHERE user_id = ? OR customer_email = ? OR customer_phone = ?", [req.user.id, req.user.email, req.user.phone]);
  const rows = await query(
    "SELECT * FROM orders WHERE user_id = ? OR customer_email = ? OR customer_phone = ? ORDER BY created_at DESC LIMIT ? OFFSET ?",
    [req.user.id, req.user.email, req.user.phone, limit, offset],
  );
  res.json({ orders: rows.map(toOrder), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/me/orders/:id`, requireUser, asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT * FROM orders WHERE (id = ? OR order_id = ?) AND (user_id = ? OR customer_email = ? OR customer_phone = ?) LIMIT 1",
    [req.params.id, req.params.id, req.user.id, req.user.email, req.user.phone],
  );
  if (!rows[0]) return res.status(404).json({ message: "Order not found" });
  const items = await query(
    `SELECT oi.*,
       COALESCE(
         oi.product_id,
         (SELECT p2.id FROM products p2 WHERE LOWER(p2.name) = LOWER(oi.product_name) ORDER BY p2.is_active DESC, p2.id DESC LIMIT 1)
       ) current_product_id,
       COALESCE(
         p.image_url,
         (SELECT p3.image_url FROM products p3 WHERE LOWER(p3.name) = LOWER(oi.product_name) ORDER BY p3.is_active DESC, p3.id DESC LIMIT 1)
       ) current_product_image
     FROM order_items oi
     LEFT JOIN products p ON p.id = oi.product_id
     WHERE oi.order_id = ?
     ORDER BY oi.id`,
    [rows[0].id],
  );
  res.json({
    ...toOrder(rows[0]),
    items: items.map(toOrderItem),
  });
}));

app.get(`${apiPrefix}/me/wishlist`, requireUser, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.* FROM wishlists w
     JOIN products p ON p.id = w.product_id
     WHERE w.user_id = ?
     ORDER BY w.created_at DESC`,
    [req.user.id],
  );
  res.json({ products: rows.map(toProduct) });
}));

app.post(`${apiPrefix}/me/wishlist`, requireUser, asyncHandler(async (req, res) => {
  const productId = Number(req.body.productId || req.body.id);
  if (!productId) return bad(res, "Product is required");
  const products = await query("SELECT id FROM products WHERE id = ? AND is_active = 1 LIMIT 1", [productId]);
  if (!products[0]) return res.status(404).json({ message: "Product not found" });
  await query("INSERT IGNORE INTO wishlists (user_id, product_id) VALUES (?, ?)", [req.user.id, productId]);
  await recordAuthEvent(req, req.user, "wishlist_update", "add");
  res.status(201).json({ message: "Wishlist updated", productId });
}));

app.delete(`${apiPrefix}/me/wishlist/:productId`, requireUser, asyncHandler(async (req, res) => {
  await query("DELETE FROM wishlists WHERE user_id = ? AND product_id = ?", [req.user.id, req.params.productId]);
  await recordAuthEvent(req, req.user, "wishlist_update", "remove");
  res.json({ message: "Wishlist item removed" });
}));

app.get(`${apiPrefix}/me/cart`, requireUser, asyncHandler(async (req, res) => {
  const rows = await query(
    `SELECT p.*, c.quantity
     FROM cart_items c
     JOIN products p ON p.id = c.product_id
     WHERE c.user_id = ? AND p.is_active = 1
     ORDER BY c.updated_at DESC`,
    [req.user.id],
  );
  res.json({
    items: rows.map((row) => ({ product: toProduct(row), quantity: Number(row.quantity || 0) })),
  });
}));

app.put(`${apiPrefix}/me/cart`, requireUser, asyncHandler(async (req, res) => {
  const requested = Array.isArray(req.body.items) ? req.body.items.slice(0, 100) : [];
  const normalized = new Map();
  for (const item of requested) {
    const productId = Number(item.productId);
    const quantity = Number(item.quantity);
    if (!Number.isInteger(productId) || productId < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return bad(res, "Cart contains an invalid product or quantity");
    }
    normalized.set(productId, Math.min((normalized.get(productId) || 0) + quantity, 99));
  }
  await transaction(async (connection) => {
    await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [req.user.id]);
    for (const [productId, quantity] of normalized) {
      const [products] = await connection.execute("SELECT id, stock, in_stock FROM products WHERE id = ? AND is_active = 1 LIMIT 1", [productId]);
      const product = products[0];
      if (!product || !product.in_stock || Number(product.stock || 0) < quantity) {
        throw Object.assign(new Error("A cart product is unavailable or has insufficient stock"), { status: 409 });
      }
      await connection.execute("INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)", [req.user.id, productId, quantity]);
    }
  });
  res.json({ message: "Cart synced", itemCount: [...normalized.values()].reduce((sum, quantity) => sum + quantity, 0) });
}));

app.get(`${apiPrefix}/admin/auth-events`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR event_type LIKE ? OR method LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM auth_events ${clause}`, params);
  const rows = await query(`SELECT * FROM auth_events ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ authEvents: rows.map(toAuthEvent), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/admin/enquiries`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR phone LIKE ? OR program LIKE ? OR source LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(`SELECT * FROM enquiries ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM enquiries ${clause}`, params);
  res.json({ enquiries: rows.map((row) => ({ ...row, _id: String(row.id), createdAt: row.created_at })), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.post(`${apiPrefix}/admin/enquiries`, requireAdmin, asyncHandler(async (req, res) => {
  const { name, email, phone, program, source, message } = req.body;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!isPhone(phone)) return bad(res, "Valid 10 digit phone is required");
  if (!isEmail(email)) return bad(res, "Valid email is required when provided");
  if (clean(program).length < 2) return bad(res, "Program is required");
  if (!hasMax(program, 80)) return bad(res, "Program must be 80 characters or less");
  if (!hasMax(source, 80)) return bad(res, "Source must be 80 characters or less");
  if (!hasMax(message, 500)) return bad(res, "Message must be 500 characters or less");
  const result = await query(
    "INSERT INTO enquiries (name, email, phone, program, source, message) VALUES (?, ?, ?, ?, ?, ?)",
    [clean(name), clean(email), phoneDigits(phone), clean(program), clean(source) || "Website", clean(message)],
  );
  res.status(201).json({ _id: String(result.insertId), id: result.insertId, name, email, phone, program, source, message, status: "New" });
}));

app.post(`${apiPrefix}/enquiries`, asyncHandler(async (req, res) => {
  const { name, email, phone, program, source, message } = req.body;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!isPhone(phone)) return bad(res, "Valid 10 digit phone is required");
  if (!isEmail(email)) return bad(res, "Valid email is required when provided");
  if (clean(program).length < 2) return bad(res, "Program is required");
  if (!hasMax(program, 80)) return bad(res, "Program must be 80 characters or less");
  if (!hasMax(source, 80)) return bad(res, "Source must be 80 characters or less");
  if (!hasMax(message, 500)) return bad(res, "Message must be 500 characters or less");
  const result = await query(
    "INSERT INTO enquiries (name, email, phone, program, source, message) VALUES (?, ?, ?, ?, ?, ?)",
    [clean(name), clean(email), phoneDigits(phone), clean(program), clean(source) || "Website", clean(message)],
  );
  res.status(201).json({ _id: String(result.insertId), id: result.insertId, name, email, phone, program, source, message, status: "New" });
}));

app.patch(`${apiPrefix}/admin/enquiries/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  const status = clean(req.body.status);
  if (!["New", "Contacted", "Converted", "Closed"].includes(status)) {
    return bad(res, "Choose a valid enquiry status");
  }
  await query("UPDATE enquiries SET status = ? WHERE id = ?", [status, req.params.id]);
  await audit(req, "status", "enquiries", req.params.id, req.body);
  const rows = await query("SELECT * FROM enquiries WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Enquiry not found" });
  res.json({ ...rows[0], _id: String(rows[0].id) });
}));

app.delete(`${apiPrefix}/admin/enquiries/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await query("DELETE FROM enquiries WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "enquiries", req.params.id);
  res.json({ message: "Enquiry deleted" });
}));

app.get(`${apiPrefix}/admin/testimonials`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR role LIKE ? OR text LIKE ? OR source LIKE ? OR author_meta LIKE ? OR review_date LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.productId) {
    where.push("product_id = ?");
    params.push(Number(req.query.productId));
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const rows = await query(`SELECT * FROM testimonials ${clause} ORDER BY source = 'Website' DESC, id ASC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const [{ total }] = await query(`SELECT COUNT(*) total FROM testimonials ${clause}`, params);
  res.json({ testimonials: rows.map(toTestimonial), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/testimonials`, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = ["is_visible = 1"];
  const params = [];
  if (req.query.search) {
    where.push("(name LIKE ? OR role LIKE ? OR text LIKE ? OR author_meta LIKE ? OR review_date LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.rating) {
    where.push("rating = ?");
    params.push(Number(req.query.rating));
  }
  if (req.query.productId) {
    where.push("product_id = ?");
    params.push(Number(req.query.productId));
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const [{ total }] = await query(`SELECT COUNT(*) total FROM testimonials ${clause}`, params);
  const [stats] = await query(`
    SELECT
      COUNT(*) total,
      COALESCE(AVG(rating), 0) average,
      SUM(rating = 5) five,
      SUM(rating = 4) four,
      SUM(rating = 3) three,
      SUM(rating = 2) two,
      SUM(rating = 1) one
    FROM testimonials
    ${clause}
  `, params);
  const sort = String(req.query.sort || "relevant");
  const orderBy = {
    newest: "created_at DESC, id ASC",
    highest: "rating DESC, id ASC",
    lowest: "rating ASC, id ASC",
    relevant: "source = 'Website' DESC, id ASC",
  }[sort] || "source = 'Website' DESC, id ASC";
  const rows = await query(`SELECT * FROM testimonials ${clause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({
    testimonials: rows.map(toTestimonial),
    total,
    stats: {
      total: Number(stats.total || 0),
      average: Number(stats.average || 0),
      distribution: {
        5: Number(stats.five || 0),
        4: Number(stats.four || 0),
        3: Number(stats.three || 0),
        2: Number(stats.two || 0),
        1: Number(stats.one || 0),
      },
    },
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}));

app.post(`${apiPrefix}/testimonials`, asyncHandler(async (req, res) => {
  const name = String(req.body.name || "").trim();
  const text = String(req.body.text || req.body.message || "").trim();
  const rating = Math.min(Math.max(Number(req.body.rating || 5), 1), 5);
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!text) return bad(res, "Review message is required");
  if (!hasMax(text, 1200)) return bad(res, "Review message must be 1200 characters or less");
  if (!hasMax(req.body.role, 120)) return bad(res, "Role must be 120 characters or less");
  if (!hasMax(req.body.authorMeta, 120)) return bad(res, "Author meta must be 120 characters or less");
  if (!hasMax(req.body.reviewDate, 40)) return bad(res, "Review date must be 40 characters or less");
  if (!isUrl(req.body.imageUrl || req.body.image_url || "")) return bad(res, "Image URL must be valid when provided");
  const productId = await validReviewProductId(req.body.productId);

  const result = await query(
    "INSERT INTO testimonials (product_id, name, role, rating, text, image_url, source, author_meta, review_date, is_visible) VALUES (?, ?, ?, ?, ?, ?, 'Website', ?, ?, 1)",
    [productId, name, clean(req.body.role) || "Annai Customer", rating, text, clean(req.body.imageUrl || req.body.image_url), clean(req.body.authorMeta), clean(req.body.reviewDate)],
  );
  const rows = await query("SELECT * FROM testimonials WHERE id = ?", [result.insertId]);
  res.status(201).json({ ...toTestimonial(rows[0]), message: "Thank you. Your review is now published." });
}));

app.post(`${apiPrefix}/admin/testimonials`, requireAdmin, asyncHandler(async (req, res) => {
  const { name, role, rating, text, imageUrl } = req.body;
  if (!isName(name)) return bad(res, "Valid name is required");
  if (!hasMax(role, 120)) return bad(res, "Role must be 120 characters or less");
  if (clean(text).length < 12) return bad(res, "Testimonial must be at least 12 characters");
  if (!hasMax(text, 1200)) return bad(res, "Testimonial must be 1200 characters or less");
  if (Number(rating || 5) < 1 || Number(rating || 5) > 5) return bad(res, "Rating must be between 1 and 5");
  if (!hasMax(req.body.authorMeta || req.body.author_meta, 120)) return bad(res, "Author meta must be 120 characters or less");
  if (!hasMax(req.body.reviewDate || req.body.review_date, 40)) return bad(res, "Review date must be 40 characters or less");
  if (!isUrl(imageUrl || req.body.image_url || "")) return bad(res, "Image URL must be valid when provided");
  const productId = await validReviewProductId(req.body.productId);
  const result = await query(
    "INSERT INTO testimonials (product_id, name, role, rating, text, image_url, source, author_meta, review_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [productId, clean(name), clean(role), Math.min(Math.max(Number(rating || 5), 1), 5), clean(text), clean(imageUrl || req.body.image_url), clean(req.body.source) || "Website", clean(req.body.authorMeta || req.body.author_meta), clean(req.body.reviewDate || req.body.review_date)],
  );
  await audit(req, "create", "testimonials", result.insertId, req.body);
  res.status(201).json({ _id: String(result.insertId), id: result.insertId, ...req.body, isVisible: true });
}));

app.put(`${apiPrefix}/admin/testimonials/:id`, requireAdmin, asyncHandler(async (req, res) => {
  if (!isName(req.body.name)) return bad(res, "Valid name is required");
  if (!hasMax(req.body.role, 120)) return bad(res, "Role must be 120 characters or less");
  if (clean(req.body.text).length < 12) return bad(res, "Testimonial must be at least 12 characters");
  if (!hasMax(req.body.text, 1200)) return bad(res, "Testimonial must be 1200 characters or less");
  if (Number(req.body.rating || 5) < 1 || Number(req.body.rating || 5) > 5) return bad(res, "Rating must be between 1 and 5");
  if (!hasMax(req.body.authorMeta || req.body.author_meta, 120)) return bad(res, "Author meta must be 120 characters or less");
  if (!hasMax(req.body.reviewDate || req.body.review_date, 40)) return bad(res, "Review date must be 40 characters or less");
  if (!isUrl(req.body.imageUrl || req.body.image_url || "")) return bad(res, "Image URL must be valid when provided");
  const productId = await validReviewProductId(req.body.productId);
  await query("UPDATE testimonials SET product_id=?, name=?, role=?, rating=?, text=?, image_url=?, source=?, author_meta=?, review_date=? WHERE id=?", [
    productId,
    clean(req.body.name),
    clean(req.body.role),
    Math.min(Math.max(Number(req.body.rating || 5), 1), 5),
    clean(req.body.text),
    clean(req.body.imageUrl || req.body.image_url),
    clean(req.body.source) || "Website",
    clean(req.body.authorMeta || req.body.author_meta),
    clean(req.body.reviewDate || req.body.review_date),
    req.params.id,
  ]);
  await audit(req, "update", "testimonials", req.params.id, req.body);
  res.json({ _id: String(req.params.id), id: Number(req.params.id), ...req.body });
}));

app.patch(`${apiPrefix}/admin/testimonials/:id/visible`, requireAdmin, asyncHandler(async (req, res) => {
  const visible = normalizeBoolean(req.body.isVisible ?? req.body.is_visible);
  await query("UPDATE testimonials SET is_visible = ? WHERE id = ?", [visible, req.params.id]);
  await audit(req, "visible", "testimonials", req.params.id, { visible });
  res.json({ message: "Testimonial visibility updated", isVisible: Boolean(visible) });
}));

app.delete(`${apiPrefix}/admin/testimonials/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await query("DELETE FROM testimonials WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "testimonials", req.params.id);
  res.json({ message: "Testimonial deleted" });
}));

app.get(`${apiPrefix}/admin/blogs`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(title LIKE ? OR excerpt LIKE ? OR category LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.status) {
    where.push("status = ?");
    params.push(req.query.status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM blogs ${clause}`, params);
  const rows = await query(`SELECT * FROM blogs ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({
    blogs: rows.map((row) => ({ ...row, _id: String(row.id), imageUrl: row.image_url, isFeatured: Boolean(row.is_featured), createdAt: row.created_at })),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}));

const toBlog = (row) => ({
  ...row,
  _id: String(row.id),
  id: Number(row.id),
  category: row.category || "Jewellery Guide",
  imageUrl: row.image_url || "",
  image: row.image_url || "",
  isFeatured: Boolean(row.is_featured),
  featured: Boolean(row.is_featured),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

app.get(`${apiPrefix}/blogs`, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = ["status = 'Published'"];
  const params = [];
  if (req.query.search) {
    where.push("(title LIKE ? OR excerpt LIKE ? OR body LIKE ? OR category LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  if (req.query.category && req.query.category !== "All") {
    where.push("category = ?");
    params.push(req.query.category);
  }
  const clause = `WHERE ${where.join(" AND ")}`;
  const [{ total }] = await query(`SELECT COUNT(*) total FROM blogs ${clause}`, params);
  const rows = await query(`SELECT * FROM blogs ${clause} ORDER BY is_featured DESC, created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const categoryRows = await query("SELECT category, COUNT(*) total FROM blogs WHERE status = 'Published' GROUP BY category ORDER BY category ASC");
  res.json({
    blogs: rows.map(toBlog),
    categories: categoryRows.map((row) => ({ category: row.category || "Jewellery Guide", total: Number(row.total || 0) })),
    total,
    currentPage: page,
    totalPages: Math.ceil(total / limit) || 1,
  });
}));

app.get(`${apiPrefix}/blogs/:slug`, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM blogs WHERE slug = ? AND status = 'Published' LIMIT 1", [req.params.slug]);
  if (!rows[0]) return res.status(404).json({ message: "Blog post not found" });
  const related = await query(
    "SELECT * FROM blogs WHERE status = 'Published' AND slug <> ? AND category = ? ORDER BY is_featured DESC, created_at DESC LIMIT 3",
    [req.params.slug, rows[0].category],
  );
  res.json({ blog: toBlog(rows[0]), related: related.map(toBlog) });
}));

async function upsertBlog(req, res, id = null) {
  const title = String(req.body.title || "").trim();
  if (title.length < 3) return bad(res, "Blog title must be at least 3 characters");
  if (!hasMax(title, 160)) return bad(res, "Blog title must be 160 characters or less");
  if (!hasMax(req.body.slug, 180)) return bad(res, "Blog slug must be 180 characters or less");
  if (clean(req.body.excerpt).length < 20) return bad(res, "Blog excerpt must be at least 20 characters");
  if (!hasMax(req.body.excerpt, 300)) return bad(res, "Blog excerpt must be 300 characters or less");
  if (!hasMax(req.body.body || req.body.content, 10000)) return bad(res, "Blog content must be 10000 characters or less");
  if (!isUrl(req.body.imageUrl || req.body.image_url || "")) return bad(res, "Blog image URL must be valid when provided");
  const payload = [
    title,
    clean(req.body.slug) || slugify(title),
    clean(req.body.category) || "Jewellery Guide",
    clean(req.body.excerpt),
    clean(req.body.body || req.body.content),
    clean(req.body.imageUrl || req.body.image_url),
    req.body.status || "Draft",
    normalizeBoolean(req.body.isFeatured ?? req.body.is_featured ?? req.body.featured ?? false),
  ];
  if (id) {
    await query("UPDATE blogs SET title=?, slug=?, category=?, excerpt=?, body=?, image_url=?, status=?, is_featured=? WHERE id=?", [...payload, id]);
    await audit(req, "update", "blogs", id, req.body);
  } else {
    const result = await query("INSERT INTO blogs (title, slug, category, excerpt, body, image_url, status, is_featured) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", payload);
    id = result.insertId;
    await audit(req, "create", "blogs", id, req.body);
  }
  const rows = await query("SELECT * FROM blogs WHERE id = ?", [id]);
  res.status(req.method === "POST" ? 201 : 200).json(toBlog(rows[0]));
}

app.post(`${apiPrefix}/admin/blogs`, requireAdmin, asyncHandler((req, res) => upsertBlog(req, res)));
app.put(`${apiPrefix}/admin/blogs/:id`, requireAdmin, asyncHandler((req, res) => upsertBlog(req, res, req.params.id)));

app.patch(`${apiPrefix}/admin/blogs/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  await query("UPDATE blogs SET status = ? WHERE id = ?", [req.body.status, req.params.id]);
  const rows = await query("SELECT * FROM blogs WHERE id = ?", [req.params.id]);
  await audit(req, "status", "blogs", req.params.id, req.body);
  res.json({ ...rows[0], _id: String(rows[0].id), imageUrl: rows[0].image_url, isFeatured: Boolean(rows[0].is_featured) });
}));

app.patch(`${apiPrefix}/admin/blogs/:id/featured`, requireAdmin, asyncHandler(async (req, res) => {
  await query("UPDATE blogs SET is_featured = NOT is_featured WHERE id = ?", [req.params.id]);
  const rows = await query("SELECT * FROM blogs WHERE id = ?", [req.params.id]);
  await audit(req, "featured", "blogs", req.params.id);
  res.json({ ...rows[0], _id: String(rows[0].id), imageUrl: rows[0].image_url, isFeatured: Boolean(rows[0].is_featured) });
}));

app.delete(`${apiPrefix}/admin/blogs/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await query("DELETE FROM blogs WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "blogs", req.params.id);
  res.json({ message: "Blog deleted" });
}));

const toGalleryItem = (row) => ({
  ...row,
  _id: String(row.id),
  id: Number(row.id),
  mediaType: row.media_type,
  imageUrl: row.image_url,
  videoUrl: row.video_url,
  sortOrder: Number(row.sort_order || 0),
  isVisible: Boolean(row.is_visible),
  createdAt: row.created_at,
});

app.get(`${apiPrefix}/gallery`, asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM gallery_items WHERE is_visible = 1 ORDER BY sort_order ASC, id DESC");
  res.json({ galleryItems: rows.map(toGalleryItem) });
}));

app.get(`${apiPrefix}/admin/gallery`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const where = [];
  const params = [];
  if (req.query.search) {
    where.push("(title LIKE ? OR category LIKE ? OR description LIKE ?)");
    params.push(`%${req.query.search}%`, `%${req.query.search}%`, `%${req.query.search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM gallery_items ${clause}`, params);
  const rows = await query(`SELECT * FROM gallery_items ${clause} ORDER BY sort_order ASC, id DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ galleryItems: rows.map(toGalleryItem), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

async function upsertGalleryItem(req, res, id = null) {
  const title = clean(req.body.title);
  if (title.length < 2) return bad(res, "Gallery title must be at least 2 characters");
  if (!hasMax(title, 120)) return bad(res, "Gallery title must be 120 characters or less");
  if (!hasMax(req.body.category, 80)) return bad(res, "Gallery category must be 80 characters or less");
  if (!isUrl(req.body.imageUrl || req.body.image_url || "")) return bad(res, "Gallery image URL must be valid");
  if (!isUrl(req.body.videoUrl || req.body.video_url || "")) return bad(res, "Gallery video URL must be valid when provided");
  if (!hasMax(req.body.description, 500)) return bad(res, "Gallery description must be 500 characters or less");
  if (Number(req.body.sortOrder ?? req.body.sort_order ?? 0) < 0) return bad(res, "Sort order cannot be negative");
  const mediaType = ["image", "video", "tour"].includes(req.body.mediaType || req.body.media_type) ? (req.body.mediaType || req.body.media_type) : "image";
  const payload = [
    title,
    clean(req.body.category) || "Jewellery",
    mediaType,
    clean(req.body.imageUrl || req.body.image_url),
    clean(req.body.videoUrl || req.body.video_url),
    clean(req.body.description),
    Number(req.body.sortOrder ?? req.body.sort_order ?? 0),
    normalizeBoolean(req.body.isVisible ?? req.body.is_visible ?? true),
  ];
  if (id) {
    await query("UPDATE gallery_items SET title=?, category=?, media_type=?, image_url=?, video_url=?, description=?, sort_order=?, is_visible=? WHERE id=?", [...payload, id]);
    await audit(req, "update", "gallery_items", id, req.body);
  } else {
    const result = await query("INSERT INTO gallery_items (title, category, media_type, image_url, video_url, description, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", payload);
    id = result.insertId;
    await audit(req, "create", "gallery_items", id, req.body);
  }
  const rows = await query("SELECT * FROM gallery_items WHERE id = ?", [id]);
  res.status(req.method === "POST" ? 201 : 200).json(toGalleryItem(rows[0]));
}

app.post(`${apiPrefix}/admin/gallery`, requireAdmin, asyncHandler((req, res) => upsertGalleryItem(req, res)));
app.put(`${apiPrefix}/admin/gallery/:id`, requireAdmin, asyncHandler((req, res) => upsertGalleryItem(req, res, req.params.id)));

app.patch(`${apiPrefix}/admin/gallery/:id/visible`, requireAdmin, asyncHandler(async (req, res) => {
  const visible = normalizeBoolean(req.body.isVisible ?? req.body.is_visible);
  await query("UPDATE gallery_items SET is_visible = ? WHERE id = ?", [visible, req.params.id]);
  const rows = await query("SELECT * FROM gallery_items WHERE id = ?", [req.params.id]);
  await audit(req, "visible", "gallery_items", req.params.id, { visible });
  res.json(toGalleryItem(rows[0]));
}));

app.delete(`${apiPrefix}/admin/gallery/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await query("DELETE FROM gallery_items WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "gallery_items", req.params.id);
  res.json({ message: "Gallery item deleted" });
}));

app.get(`${apiPrefix}/admin/content-blocks`, requireAdmin, asyncHandler(async (_req, res) => {
  const rows = await query("SELECT * FROM content_blocks ORDER BY block_key");
  res.json({ blocks: rows.map((row) => ({ ...row, _id: String(row.id), isActive: Boolean(row.is_active) })) });
}));

app.get(`${apiPrefix}/content-blocks/:key`, asyncHandler(async (req, res) => {
  const rows = await query(
    "SELECT block_key, title, body, is_active FROM content_blocks WHERE block_key = ? LIMIT 1",
    [req.params.key],
  );
  if (!rows[0] || !rows[0].is_active) return res.status(404).json({ message: "Content block not found" });
  res.json({
    key: rows[0].block_key,
    title: rows[0].title,
    body: rows[0].body,
    isActive: Boolean(rows[0].is_active),
  });
}));

app.put(`${apiPrefix}/admin/content-blocks/:key`, requireAdmin, asyncHandler(async (req, res) => {
  if (!/^[a-z0-9_]{2,60}$/.test(req.params.key)) return bad(res, "Content block key is invalid");
  if (!hasMax(req.body.title, 120)) return bad(res, "Content title must be 120 characters or less");
  if (String(req.body.body || "").length > 100_000) return bad(res, "Content configuration is too large");
  if (req.params.key === "home_banners") {
    let config;
    try {
      config = JSON.parse(req.body.body || "{}");
    } catch {
      return bad(res, "Banner configuration is invalid");
    }
    const banners = Array.isArray(config.banners) ? config.banners : [];
    if (!banners.length || banners.length > 4) return bad(res, "Create between 1 and 4 home banners");
    for (const banner of banners) {
      if (!clean(banner.title) || !hasMax(banner.title, 36)) return bad(res, "Each banner title is required and must be 36 characters or less");
      if (!hasMax(banner.accent, 42)) return bad(res, "Banner accent text must be 42 characters or less");
      if (!hasMax(banner.text, 90)) return bad(res, "Banner description must be 90 characters or less");
      if (!hasMax(banner.primaryLabel, 24) || !hasMax(banner.secondaryLabel, 20)) return bad(res, "Banner button labels are too long");
      if (!hasMax(banner.primaryLink, 200) || !hasMax(banner.secondaryLink, 200)) return bad(res, "Banner links must be 200 characters or less");
      if (!isSafeDestination(banner.primaryLink) || !isSafeDestination(banner.secondaryLink)) return bad(res, "Banner links must be a store path, HTTPS URL, phone or email link");
      if (!String(banner.imageUrl || "").startsWith("/uploads/banners/")) return bad(res, "Upload a desktop image for every banner");
      if (banner.mobileImageUrl && !String(banner.mobileImageUrl).startsWith("/uploads/banners/")) return bad(res, "Upload a valid mobile banner image");
      if (!["center", "center 35%", "center 65%", "left center", "right center"].includes(clean(banner.position) || "center")) return bad(res, "Banner focal point is invalid");
    }
  }
  if (req.params.key === "home_popup") {
    let popup;
    try {
      popup = JSON.parse(req.body.body || "{}");
    } catch {
      return bad(res, "Popup configuration is invalid");
    }
    let popupImage = clean(popup.imageUrl);
    if (/^https?:\/\//i.test(popupImage)) {
      try {
        const parsed = new URL(popupImage);
        if (parsed.host !== req.get("host")) return bad(res, "Popup image must be uploaded from this admin panel");
        popupImage = parsed.pathname;
      } catch {
        return bad(res, "Upload a valid popup image");
      }
    }
    if (!popupImage.startsWith("/uploads/promotions/")) return bad(res, "Upload a valid popup image");
    popup.imageUrl = popupImage;
    req.body.body = JSON.stringify(popup);
    if (!isSafeDestination(popup.linkUrl)) return bad(res, "Popup link must be a store path, HTTPS URL, phone or email link");
    const delay = Number(popup.delaySeconds ?? 2);
    if (!Number.isFinite(delay) || delay < 0 || delay > 30) return bad(res, "Popup delay must be between 0 and 30 seconds");
    if (!hasMax(popup.alt, 120)) return bad(res, "Popup alternative text must be 120 characters or less");
  }
  await query(
    `INSERT INTO content_blocks (block_key, title, body, is_active) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), is_active=VALUES(is_active)`,
    [req.params.key, req.body.title || "", req.body.body || "", normalizeBoolean(req.body.isActive ?? true)],
  );
  await audit(req, "upsert", "content_blocks", req.params.key, req.body);
  res.json({ message: "Content block saved" });
}));

app.post(`${apiPrefix}/coupons/validate`, optionalUser, asyncHandler(async (req, res) => {
  const subtotal = Number(req.body.subtotal || req.body.amount || 0);
  const result = await validateCouponCode({
    code: req.body.code,
    subtotal,
    email: req.body.email || req.user?.email,
  });
  res.status(result.valid ? 200 : 400).json(result);
}));

app.get(`${apiPrefix}/admin/coupons`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const search = clean(req.query.search);
  const where = [];
  const params = [];
  if (search) {
    where.push("(code LIKE ? OR title LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM coupons ${clause}`, params);
  const rows = await query(`SELECT * FROM coupons ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  const coupons = await Promise.all(rows.map(async (row) => {
    const usage = await couponUsage(row.code);
    return toCoupon(row, usage.total, usage.customers);
  }));
  res.json({ coupons, total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/admin/coupons/:id/usage`, requireAdmin, asyncHandler(async (req, res) => {
  const couponRows = await query("SELECT * FROM coupons WHERE id = ? LIMIT 1", [req.params.id]);
  if (!couponRows[0]) return res.status(404).json({ message: "Coupon not found" });
  const coupon = couponRows[0];
  const search = `%Coupon used: ${coupon.code};%`;
  const rows = await query(
    `SELECT id, order_id, customer_name, customer_email, customer_phone, amount, status,
            payment_status, notes, created_at
     FROM orders
     WHERE notes LIKE ?
       AND deleted_at IS NULL
       AND status <> 'Cancelled'
       AND payment_status NOT IN ('Rejected','Failed','Refunded')
     ORDER BY created_at DESC`,
    [search],
  );
  const orders = rows.map((row) => {
    const match = String(row.notes || "").match(/Discount:\s*([\d.]+)/i);
    return {
      id: Number(row.id),
      orderId: row.order_id,
      customerName: row.customer_name || "Customer",
      customerEmail: row.customer_email || "",
      customerPhone: row.customer_phone || "",
      amount: Number(row.amount || 0),
      discount: Number(match?.[1] || 0),
      status: row.status,
      paymentStatus: row.payment_status,
      createdAt: row.created_at,
    };
  });
  const customers = new Map();
  for (const order of orders) {
    const key = order.customerEmail.toLowerCase() || order.customerPhone || order.customerName.toLowerCase();
    const current = customers.get(key) || {
      name: order.customerName,
      email: order.customerEmail,
      phone: order.customerPhone,
      orderCount: 0,
      totalSpent: 0,
      totalDiscount: 0,
      lastUsedAt: order.createdAt,
    };
    current.orderCount += 1;
    current.totalSpent += order.amount;
    current.totalDiscount += order.discount;
    customers.set(key, current);
  }
  res.json({
    coupon: toCoupon(coupon, orders.length),
    customerCount: customers.size,
    orderCount: orders.length,
    customers: [...customers.values()],
    orders,
  });
}));

async function upsertCoupon(req, res, id = null) {
  const code = clean(req.body.code).toUpperCase();
  const title = clean(req.body.title);
  const discountType = req.body.discountType === "flat" ? "flat" : "percentage";
  const discountValue = Number(req.body.discountValue || 0);
  const minOrderAmount = Number(req.body.minOrderAmount || 0);
  const maxDiscount = 0;
  const usageLimit = Math.max(Number(req.body.usageLimit || 0), 0);
  const perUserLimit = Math.max(Number(req.body.perUserLimit || 0), 0);
  const validFrom = clean(req.body.validFrom) ? clean(req.body.validFrom).replace("T", " ") : null;
  const validTo = clean(req.body.validTo) ? clean(req.body.validTo).replace("T", " ") : null;
  if (!/^[A-Z0-9_-]{3,40}$/.test(code)) return bad(res, "Coupon code must be 3-40 characters using letters, numbers, dash or underscore.");
  if (title.length < 2) return bad(res, "Coupon title is required.");
  if (discountValue <= 0) return bad(res, "Discount value must be greater than 0.");
  if (discountType === "percentage" && discountValue > 100) return bad(res, "Percentage discount cannot exceed 100.");
  if (minOrderAmount < 0) return bad(res, "Amounts cannot be negative.");
  if (validFrom && validTo && new Date(validFrom).getTime() > new Date(validTo).getTime()) return bad(res, "Valid from date must be before valid to date.");

  if (id) {
    await query(
      `UPDATE coupons SET code = ?, title = ?, discount_type = ?, discount_value = ?, min_order_amount = ?,
       max_discount = ?, valid_from = ?, valid_to = ?, usage_limit = ?, per_user_limit = ?, is_active = ? WHERE id = ?`,
      [code, title, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit, perUserLimit, normalizeBoolean(req.body.isActive ?? true), id],
    );
    await audit(req, "update", "coupons", id, { code });
    const rows = await query("SELECT * FROM coupons WHERE id = ?", [id]);
    const usage = await couponUsage(rows[0].code);
    return res.json(toCoupon(rows[0], usage.total));
  }

  const result = await query(
    `INSERT INTO coupons (code, title, discount_type, discount_value, min_order_amount, max_discount, valid_from, valid_to, usage_limit, per_user_limit, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [code, title, discountType, discountValue, minOrderAmount, maxDiscount, validFrom, validTo, usageLimit, perUserLimit, normalizeBoolean(req.body.isActive ?? true)],
  );
  await audit(req, "create", "coupons", result.insertId, { code });
  const rows = await query("SELECT * FROM coupons WHERE id = ?", [result.insertId]);
  res.status(201).json(toCoupon(rows[0], 0));
}

app.post(`${apiPrefix}/admin/coupons`, requireAdmin, asyncHandler((req, res) => upsertCoupon(req, res)));
app.put(`${apiPrefix}/admin/coupons/:id`, requireAdmin, asyncHandler((req, res) => upsertCoupon(req, res, req.params.id)));

app.patch(`${apiPrefix}/admin/coupons/:id/active`, requireAdmin, asyncHandler(async (req, res) => {
  const isActive = normalizeBoolean(req.body.isActive);
  if (isActive === undefined) return bad(res, "Coupon active status is required");
  const result = await query("UPDATE coupons SET is_active = ? WHERE id = ?", [isActive, req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
  await audit(req, "toggle_active", "coupons", req.params.id, req.body);
  const rows = await query("SELECT * FROM coupons WHERE id = ?", [req.params.id]);
  const usage = rows[0] ? await couponUsage(rows[0].code) : { total: 0 };
  res.json(toCoupon(rows[0], usage.total));
}));

app.delete(`${apiPrefix}/admin/coupons/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const result = await query("UPDATE coupons SET is_active = 0 WHERE id = ?", [req.params.id]);
  if (!result.affectedRows) return res.status(404).json({ message: "Coupon not found" });
  await audit(req, "deactivate", "coupons", req.params.id, {});
  res.json({ message: "Coupon deactivated" });
}));

app.get(`${apiPrefix}/admin/certificates/next`, requireAdmin, asyncHandler(async (_req, res) => {
  res.json(await nextCertificateIdentity());
}));

app.get(`${apiPrefix}/admin/certificate-templates`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const search = clean(req.query.search);
  const status = clean(req.query.status);
  const where = [];
  const params = [];
  if (search) {
    where.push("name LIKE ?");
    params.push(`%${search}%`);
  }
  if (status && ["Active", "Hidden"].includes(status)) {
    where.push("status = ?");
    params.push(status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM certificate_templates ${clause}`, params);
  const rows = await query(`SELECT * FROM certificate_templates ${clause} ORDER BY is_default DESC, created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ templates: rows.map(toCertificateTemplate), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.post(`${apiPrefix}/admin/certificate-templates`, requireAdmin, asyncHandler(async (req, res) => {
  const payload = certificateTemplatePayload(req.body);
  if (payload.isDefault) await query("UPDATE certificate_templates SET is_default = 0");
  const result = await query(
    `INSERT INTO certificate_templates
     (name, background_image, logo_image, signature_image, base_pdf_url, accent_color, navy_color, gold_color, logo_top, logo_left, logo_width,
      tagline_top, tagline_left, tagline_width, tagline_font_size, tagline_letter_spacing,
      name_top, name_left, name_width, name_font_size, name_font, name_font_weight, name_letter_spacing, name_align,
      course_top, qr_top, qr_right, qr_size, show_qr, signature_top, signature_left, signature_width, photo_left, photo_bottom, photo_size, layout_json, status, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.name, payload.backgroundImage, payload.logoImage, payload.signatureImage, payload.basePdfUrl, payload.accentColor, payload.navyColor,
      payload.goldColor, payload.logoTop, payload.logoLeft, payload.logoWidth, payload.taglineTop, payload.taglineLeft,
      payload.taglineWidth, payload.taglineFontSize, payload.taglineLetterSpacing, payload.nameTop, payload.nameLeft, payload.nameWidth,
      payload.nameFontSize, payload.nameFont, payload.nameFontWeight, payload.nameLetterSpacing, payload.nameAlign, payload.courseTop,
      payload.qrTop, payload.qrRight, payload.qrSize, payload.showQr ? 1 : 0, payload.signatureTop, payload.signatureLeft,
      payload.signatureWidth, payload.photoLeft, payload.photoBottom, payload.photoSize, JSON.stringify(payload.elements || {}), payload.status, payload.isDefault ? 1 : 0,
    ],
  );
  await audit(req, "create", "certificate_templates", result.insertId, { name: payload.name });
  const rows = await query("SELECT * FROM certificate_templates WHERE id = ?", [result.insertId]);
  res.status(201).json({ template: toCertificateTemplate(rows[0]) });
}));

app.put(`${apiPrefix}/admin/certificate-templates/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const existing = await query("SELECT * FROM certificate_templates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: "Certificate template not found" });
  const payload = certificateTemplatePayload(req.body);
  if (payload.isDefault) await query("UPDATE certificate_templates SET is_default = 0 WHERE id <> ?", [req.params.id]);
  await query(
    `UPDATE certificate_templates SET
      name = ?, background_image = ?, logo_image = ?, signature_image = ?, base_pdf_url = ?, accent_color = ?, navy_color = ?, gold_color = ?,
      logo_top = ?, logo_left = ?, logo_width = ?, tagline_top = ?, tagline_left = ?, tagline_width = ?, tagline_font_size = ?,
      tagline_letter_spacing = ?, name_top = ?, name_left = ?, name_width = ?, name_font_size = ?,
      name_font = ?, name_font_weight = ?, name_letter_spacing = ?, name_align = ?, course_top = ?, qr_top = ?, qr_right = ?,
      qr_size = ?, show_qr = ?, signature_top = ?, signature_left = ?, signature_width = ?, photo_left = ?, photo_bottom = ?,
      photo_size = ?, layout_json = ?, status = ?, is_default = ?
     WHERE id = ?`,
    [
      payload.name, payload.backgroundImage, payload.logoImage, payload.signatureImage, payload.basePdfUrl, payload.accentColor, payload.navyColor,
      payload.goldColor, payload.logoTop, payload.logoLeft, payload.logoWidth, payload.taglineTop, payload.taglineLeft,
      payload.taglineWidth, payload.taglineFontSize, payload.taglineLetterSpacing, payload.nameTop, payload.nameLeft, payload.nameWidth,
      payload.nameFontSize, payload.nameFont, payload.nameFontWeight, payload.nameLetterSpacing, payload.nameAlign, payload.courseTop,
      payload.qrTop, payload.qrRight, payload.qrSize, payload.showQr ? 1 : 0, payload.signatureTop, payload.signatureLeft,
      payload.signatureWidth, payload.photoLeft, payload.photoBottom, payload.photoSize, JSON.stringify(payload.elements || {}),
      payload.status, payload.isDefault ? 1 : 0, req.params.id,
    ],
  );
  await audit(req, "update", "certificate_templates", req.params.id, { name: payload.name });
  const rows = await query("SELECT * FROM certificate_templates WHERE id = ?", [req.params.id]);
  res.json({ template: toCertificateTemplate(rows[0]) });
}));

app.delete(`${apiPrefix}/admin/certificate-templates/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const existing = await query("SELECT * FROM certificate_templates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: "Certificate template not found" });
  if (existing[0].is_default) return bad(res, "Default certificate template cannot be deleted.");
  await query("UPDATE certificates SET template_id = NULL WHERE template_id = ?", [req.params.id]);
  await query("DELETE FROM certificate_templates WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "certificate_templates", req.params.id, {});
  res.json({ message: "Certificate template deleted" });
}));

app.get(`${apiPrefix}/admin/certificates`, requireAdmin, asyncHandler(async (req, res) => {
  const { page, limit, offset } = pageParams(req);
  const search = clean(req.query.search);
  const status = clean(req.query.status);
  const where = [];
  const params = [];
  if (search) {
    where.push("(student_name LIKE ? OR student_id LIKE ? OR certificate_no LIKE ? OR course_name LIKE ? OR course_level LIKE ? OR batch_name LIKE ?)");
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  if (status && ["Valid", "Revoked", "Expired"].includes(status)) {
    where.push("status = ?");
    params.push(status);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const [{ total }] = await query(`SELECT COUNT(*) total FROM certificates ${clause}`, params);
  const rows = await query(`SELECT * FROM certificates ${clause} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  res.json({ certificates: rows.map(toCertificate), total, currentPage: page, totalPages: Math.ceil(total / limit) || 1 });
}));

app.get(`${apiPrefix}/admin/certificates/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  res.json({ certificate: toCertificate(rows[0]) });
}));

app.post(`${apiPrefix}/admin/certificates`, requireAdmin, asyncHandler(async (req, res) => {
  const payload = certificatePayload(req.body, await nextCertificateIdentity());
  const verificationToken = randomUUID().replace(/-/g, "");
  const result = await query(
    `INSERT INTO certificates
     (template_id, student_name, student_id, certificate_no, verification_token, course_name, course_level, batch_name, duration,
      enrollment_date, completion_date, issue_date, instructor_name, director_name, student_photo, signature_url, status, notes, template_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.templateId, payload.studentName, payload.studentId, payload.certificateNo, verificationToken, payload.courseName, payload.courseLevel,
      payload.batchName, payload.duration, payload.enrollmentDate, payload.completionDate, payload.issueDate, payload.instructorName,
      payload.directorName, payload.studentPhoto, payload.signatureUrl, payload.status, payload.notes, payload.templateJson,
    ],
  );
  await audit(req, "create", "certificates", result.insertId, { certificateNo: payload.certificateNo, studentId: payload.studentId });
  const certificate = await regenerateCertificatePdf(req, result.insertId);
  res.status(201).json({ certificate });
}));

app.put(`${apiPrefix}/admin/certificates/:id`, requireAdmin, asyncHandler(async (req, res) => {
  const existing = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!existing[0]) return res.status(404).json({ message: "Certificate not found" });
  const payload = certificatePayload(req.body, { studentId: existing[0].student_id, certificateNo: existing[0].certificate_no });
  await query(
    `UPDATE certificates SET
      template_id = ?, student_name = ?, student_id = ?, certificate_no = ?, course_name = ?, course_level = ?, batch_name = ?, duration = ?,
      enrollment_date = ?, completion_date = ?, issue_date = ?, instructor_name = ?, director_name = ?,
      student_photo = ?, signature_url = ?, status = ?, notes = ?, template_json = ?
     WHERE id = ?`,
    [
      payload.templateId, payload.studentName, payload.studentId, payload.certificateNo, payload.courseName, payload.courseLevel, payload.batchName,
      payload.duration, payload.enrollmentDate, payload.completionDate, payload.issueDate, payload.instructorName, payload.directorName,
      payload.studentPhoto, payload.signatureUrl, payload.status, payload.notes, payload.templateJson, req.params.id,
    ],
  );
  await audit(req, "update", "certificates", req.params.id, { certificateNo: payload.certificateNo, status: payload.status });
  const certificate = await regenerateCertificatePdf(req, req.params.id);
  res.json({ certificate });
}));

app.post(`${apiPrefix}/admin/certificates/:id/duplicate`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  const next = await nextCertificateIdentity();
  const source = toCertificate(rows[0]);
  const payload = certificatePayload({ ...source, ...next, studentName: `${source.studentName} Copy` }, next);
  const verificationToken = randomUUID().replace(/-/g, "");
  const result = await query(
    `INSERT INTO certificates
     (template_id, student_name, student_id, certificate_no, verification_token, course_name, course_level, batch_name, duration,
      enrollment_date, completion_date, issue_date, instructor_name, director_name, student_photo, signature_url, status, notes, template_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Valid', ?, ?)`,
    [
      payload.templateId, payload.studentName, payload.studentId, payload.certificateNo, verificationToken, payload.courseName, payload.courseLevel,
      payload.batchName, payload.duration, payload.enrollmentDate, payload.completionDate, payload.issueDate, payload.instructorName,
      payload.directorName, payload.studentPhoto, payload.signatureUrl, payload.notes, payload.templateJson,
    ],
  );
  await audit(req, "duplicate", "certificates", result.insertId, { sourceId: req.params.id });
  const certificate = await regenerateCertificatePdf(req, result.insertId);
  res.status(201).json({ certificate });
}));

app.patch(`${apiPrefix}/admin/certificates/:id/status`, requireAdmin, asyncHandler(async (req, res) => {
  const status = ["Valid", "Revoked", "Expired"].includes(req.body.status) ? req.body.status : "";
  if (!status) return bad(res, "Valid certificate status is required.");
  await query("UPDATE certificates SET status = ? WHERE id = ?", [status, req.params.id]);
  await audit(req, "status", "certificates", req.params.id, { status });
  const rows = await query("SELECT * FROM certificates WHERE id = ?", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  res.json({ certificate: toCertificate(rows[0]) });
}));

app.delete(`${apiPrefix}/admin/certificates/:id`, requireAdmin, asyncHandler(async (req, res) => {
  await query("DELETE FROM certificates WHERE id = ?", [req.params.id]);
  await audit(req, "delete", "certificates", req.params.id, {});
  res.json({ message: "Certificate deleted" });
}));

app.get(`${apiPrefix}/admin/certificates/:id/pdf`, requireAdmin, asyncHandler(async (req, res) => {
  const rows = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  const certificate = await regenerateCertificatePdf(req, req.params.id);
  const filePath = uploadPathToFile(certificate?.certificatePdfUrl);
  if (!filePath) return res.status(404).json({ message: "Certificate PDF not found" });
  sendEmbeddablePdf(res, filePath);
}));

app.get(`${apiPrefix}/certificates/:id/pdf`, asyncHandler(async (req, res) => {
  if (!/^\d+$/.test(String(req.params.id))) return res.status(404).json({ message: "Certificate not found" });
  const rows = await query("SELECT * FROM certificates WHERE id = ? LIMIT 1", [req.params.id]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  const certificate = await regenerateCertificatePdf(req, req.params.id);
  const filePath = uploadPathToFile(certificate?.certificatePdfUrl);
  if (!filePath) return res.status(404).json({ message: "Certificate PDF not found" });
  sendEmbeddablePdf(res, filePath);
}));

app.get(`${apiPrefix}/certificates/verify/:token`, asyncHandler(async (req, res) => {
  const token = clean(req.params.token);
  const rows = await query("SELECT * FROM certificates WHERE verification_token = ? OR certificate_no = ? OR student_id = ? LIMIT 1", [token, token, token]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  const certificate = toCertificate(rows[0]);
  if (certificate.templateId) {
    const templates = await query("SELECT * FROM certificate_templates WHERE id = ? LIMIT 1", [certificate.templateId]);
    if (templates[0]) certificate.template = toCertificateTemplate(templates[0]);
  }
  res.json({ certificate, verifiedAt: new Date().toISOString() });
}));

app.get(`${apiPrefix}/certificates/verify/:token/pdf`, asyncHandler(async (req, res) => {
  const token = clean(req.params.token);
  const rows = await query("SELECT * FROM certificates WHERE verification_token = ? OR certificate_no = ? OR student_id = ? LIMIT 1", [token, token, token]);
  if (!rows[0]) return res.status(404).json({ message: "Certificate not found" });
  let certificate = toCertificate(rows[0]);
  if (certificate.status !== "Valid") return res.status(403).json({ message: `Certificate is ${certificate.status}` });
  certificate = await regenerateCertificatePdf(req, certificate.id);
  const filePath = uploadPathToFile(certificate?.certificatePdfUrl);
  if (!filePath) return res.status(404).json({ message: "Certificate PDF not found" });
  sendEmbeddablePdf(res, filePath);
}));

app.get(`${apiPrefix}/certificates/default-pdf`, asyncHandler(async (req, res) => {
  const sampleCertificate = {
    certificateNo: "ASJ-AUTH-000001",
    studentId: "ASJ-CUSTOMER-0001",
    studentName: "Student Full Name",
    verificationToken: "ASJ-AUTH-000001",
    courseName: "Annai Silver Jewellery",
    courseLevel: "Jewellery Authenticity and Care",
    completionDate: new Date().toISOString(),
    issueDate: new Date().toISOString(),
    studentPhoto: "",
    signatureUrl: "",
  };
  const pdfUrl = await generateCertificatePdf(req, sampleCertificate);
  const filePath = uploadPathToFile(pdfUrl);
  if (!filePath) return res.status(404).json({ message: "Certificate PDF not found" });
  sendEmbeddablePdf(res, filePath);
}));

const reroute = (target) => (req, res, next) => {
  req.url = target;
  app.handle(req, res, next);
};

app.post(`${apiPrefix}/login`, reroute(`${apiPrefix}/auth/login`));
app.post(`${apiPrefix}/register`, reroute(`${apiPrefix}/auth/register`));
app.post(`${apiPrefix}/send-otp`, reroute(`${apiPrefix}/auth/otp/request`));
app.post(`${apiPrefix}/verify-otp`, reroute(`${apiPrefix}/auth/otp/verify`));
app.post(`${apiPrefix}/forgot-password`, reroute(`${apiPrefix}/auth/forgot-password`));
app.post(`${apiPrefix}/reset-password`, reroute(`${apiPrefix}/auth/reset-password`));
app.get(`${apiPrefix}/profile`, reroute(`${apiPrefix}/me`));
app.put(`${apiPrefix}/profile`, reroute(`${apiPrefix}/me`));

app.use((_req, res) => res.status(404).json({ message: "API route not found" }));

app.use((error, _req, res, _next) => {
  console.error(error);
  const status = error.status || (error.code === "ER_DUP_ENTRY" ? 409 : 500);
  const safeClientError = status >= 400 && status < 500;
  const message = error.code === "ER_DUP_ENTRY"
    ? "Duplicate record"
    : process.env.NODE_ENV === "production" && !safeClientError
      ? "Server error"
      : error.message || "Server error";
  res.status(status).json({
    message,
    detail: process.env.NODE_ENV === "production" ? undefined : error.message,
  });
});

async function releaseExpiredReservations() {
  const expired = await query(
    `SELECT id FROM orders
     WHERE inventory_reserved = 1 AND payment_status = 'Awaiting Verification'
       AND created_at < DATE_SUB(NOW(), INTERVAL ? HOUR)
     ORDER BY id LIMIT 100`,
    [Math.min(Math.max(Number(process.env.ORDER_RESERVATION_HOURS || 24), 1), 168)],
  );
  for (const candidate of expired) {
    await transaction(async (connection) => {
      const [rows] = await connection.execute(
        "SELECT * FROM orders WHERE id = ? AND inventory_reserved = 1 AND payment_status = 'Awaiting Verification' FOR UPDATE",
        [candidate.id],
      );
      const order = rows[0];
      if (!order) return;
      const [items] = await connection.execute("SELECT * FROM order_items WHERE order_id = ?", [order.id]);
      for (const item of items) {
        if (!item.product_id) continue;
        const [productRows] = await connection.execute("SELECT * FROM products WHERE id = ? FOR UPDATE", [item.product_id]);
        const product = productRows[0];
        if (!product) continue;
        const variants = safeJson(product.variants, []);
        if (item.variant_id) {
          const variant = variants.find((entry) => String(entry.id) === String(item.variant_id));
          if (variant) variant.stock = Number(variant.stock || 0) + Number(item.quantity);
        }
        await connection.execute(
          "UPDATE products SET stock = stock + ?, in_stock = 1, variants = ? WHERE id = ?",
          [item.quantity, JSON.stringify(variants), item.product_id],
        );
      }
      await connection.execute(
        `UPDATE orders SET inventory_reserved = 0, payment_status = 'Rejected', status = 'Cancelled',
         payment_reviewed_at = NOW(), payment_rejection_reason = 'Payment verification window expired'
         WHERE id = ?`,
        [order.id],
      );
      await connection.execute(
        `INSERT INTO audit_logs (actor_id, actor_name, action, entity_type, entity_id, payload)
         VALUES (NULL, 'Annai system', 'payment_expired', 'orders', ?, ?)`,
        [String(order.id), JSON.stringify({ reason: "Payment verification window expired" })],
      );
    });
  }
  return expired.length;
}

const port = Number(process.env.PORT || 3000);
validateProductionConfiguration();
let server;
ensureBaseSchema()
  .then(async () => {
    await ensureAuthSchema();
    await ensureSecurityCommerceSchema();
    await ensureConfiguredAdminIdentity();
    await Promise.all([ensureGallerySchema(), ensureProductImageSchema(), ensureReviewSchema(), ensurePaymentSchema(), ensureCouponSchema(), ensureBlogSchema(), ensureCertificateSchema()]);
    await ensurePerformanceIndexes();
  })
  .then(() => {
    server = app.listen(port, () => {
      console.log(`Annai Jewellery admin backend running at http://localhost:${port}${apiPrefix}`);
    });
    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        console.error(`Port ${port} is already in use. Stop the existing Annai backend or choose another PORT.`);
        process.exit(1);
      }
      throw error;
    });
    releaseExpiredReservations().catch((error) => console.error("Reservation cleanup failed", error));
    setInterval(
      () => releaseExpiredReservations().catch((error) => console.error("Reservation cleanup failed", error)),
      15 * 60 * 1000,
    ).unref();
  })
  .catch((error) => {
    console.error("Unable to initialize backend schema", error);
    process.exit(1);
  });

const shutdown = (signal) => {
  console.log(`${signal} received; closing Annai Jewellery backend`);
  if (!server) return pool.end().finally(() => process.exit(0));
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection", error);
});
