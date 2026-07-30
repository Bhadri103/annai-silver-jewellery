import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import mysql from "mysql2/promise";
import { pool, query } from "./db.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function runSchema() {
  let schema = await fs.readFile(path.join(rootDir, "schema.sql"), "utf8");
  if (process.env.NODE_ENV === "production") {
    schema = schema
      .replace(/CREATE DATABASE IF NOT EXISTS\s+`?[A-Za-z0-9_$]+`?[^;]*;/i, "")
      .replace(/USE\s+`?[A-Za-z0-9_$]+`?;/i, "");
  }
  const bootstrap = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.NODE_ENV === "production" ? process.env.DB_NAME : undefined,
    multipleStatements: true,
  });
  await bootstrap.query(schema);
  await bootstrap.end();
}

async function seedAdmin() {
  const name = process.env.SEED_ADMIN_NAME || "Annai Silver Jewellery";
  const email = String(process.env.SEED_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD || "");
  const strongPassword = password.length >= 12
    && password.length <= 72
    && /[a-z]/.test(password)
    && /[A-Z]/.test(password)
    && /\d/.test(password)
    && /[^A-Za-z0-9]/.test(password);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("SEED_ADMIN_EMAIL must be a valid admin email address");
  }
  if (!strongPassword) {
    throw new Error("SEED_ADMIN_PASSWORD must be 12-72 characters with uppercase, lowercase, number and symbol");
  }
  const hash = await bcrypt.hash(password, 12);

  await query(
    `INSERT INTO admin_users (name, email, password_hash, role, active)
     VALUES (?, ?, ?, 'owner', 1)
     ON DUPLICATE KEY UPDATE name=VALUES(name), password_hash=VALUES(password_hash), role='owner', active=1`,
    [name, email, hash],
  );
}

async function seedUsers() {
  const users = [
    ["Bhadri", "bhadri@gmail.com", "7449143530", "Annai Customer", "Silver jewellery", "Padmanabhapuram, Tamil Nadu", "Bhadri@103"],
  ];
  for (const user of users) {
    const hash = await bcrypt.hash(user[6], 12);
    await query(
      `INSERT INTO users (name, email, phone, plan, goal, address, password_hash, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE name=VALUES(name), phone=VALUES(phone), plan=VALUES(plan), goal=VALUES(goal), address=VALUES(address), password_hash=VALUES(password_hash), is_active=1`,
      [user[0], user[1], user[2], user[3], user[4], user[5], hash],
    );
  }
}

async function seedTaxonomy() {
  for (const name of ["Bangles", "Chains", "Earrings", "Jewellery", "Necklaces"]) {
    await query("INSERT IGNORE INTO product_categories (name) VALUES (?)", [name]);
  }
  for (const name of ["Annai Jewellery"]) {
    await query("INSERT IGNORE INTO product_brands (name) VALUES (?)", [name]);
  }
}

async function seedProducts() {
  // The asset catalogue importer is the only product source. This intentionally
  // avoids recreating placeholder products before the catalogue replacement.
}

async function seedOrders() {
  const rows = await query("SELECT id, name, email, phone FROM users WHERE email = ?", ["bhadri@gmail.com"]);
  const user = rows[0];
  const orders = [
    ["ASJ-1001", user?.id || null, user?.name || "Bhadri", user?.email || "bhadri@gmail.com", user?.phone || "", "Temple Bridal Necklace", "Necklaces", 8999, "Delivered", "Paid", "UPI", "Delivery"],
    ["ASJ-1002", user?.id || null, user?.name || "Bhadri", user?.email || "bhadri@gmail.com", user?.phone || "", "Lotus Jhumka Earrings", "Earrings", 1699, "Processing", "Paid", "GPay", "Delivery"],
  ];
  for (const order of orders) {
    await query(
      `INSERT IGNORE INTO orders
       (order_id, user_id, customer_name, customer_email, customer_phone, product, category, amount, status, payment_status, payment_method, delivery_mode, invoice_number)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [...order, `INV-${order[0]}`],
    );
  }
}

async function seedContent() {
  const enquiries = [
    ["Priya", "priya@example.com", "9876500091", "Bridal Jewellery", "Website", "Need a bridal necklace consultation."],
    ["Meena", "meena@example.com", "9876500092", "Silver Jewellery", "Website", "Looking for a gold-plated silver jewellery gift."],
  ];
  for (const enquiry of enquiries) {
    await query("INSERT INTO enquiries (name, email, phone, program, source, message) VALUES (?, ?, ?, ?, ?, ?)", enquiry);
  }

  const testimonials = [
    ["Bhadri", "Verified customer", 5, "Beautiful jewellery, elegant finish and careful packaging.", ""],
    ["Meena", "Verified customer", 5, "The bridal collection was lovely and the service was excellent.", ""],
  ];
  for (const testimonial of testimonials) {
    await query("INSERT INTO testimonials (name, role, rating, text, image_url) VALUES (?, ?, ?, ?, ?)", testimonial);
  }

  const blogs = [
    ["How to Care for Gold-Plated Silver Jewellery", "Simple habits that help preserve shine and finish.", "Jewellery Care", "Keep plated silver jewellery dry, avoid perfume and chemicals, and wipe it gently after use. Store each piece separately in a soft pouch."],
    ["Choosing a Necklace for Your Neckline", "Match chain length and pendant shape to your outfit.", "Style Guide", "Short necklaces suit open necklines, while longer chains complement high necks and layered outfits. Choose a pendant that balances the neckline."],
    ["A Guide to 925 Silver", "Understand the hallmark and everyday care of sterling silver.", "Silver Guide", "925 silver contains 92.5 percent pure silver for a practical balance of beauty and durability. Natural tarnish can be cleaned with a soft silver cloth."],
    ["Bangles for Everyday and Occasion Wear", "Find a comfortable style for daily or festive dressing.", "Style Guide", "Slim bangles are easy to stack for everyday wear, while textured and stone-set pieces add a festive finish. Measure your size before ordering."],
    ["How to Store Your Jewellery", "Prevent scratches, tangles and moisture damage.", "Jewellery Care", "Fasten chains before storing, separate pieces in lined compartments, and keep jewellery away from humidity and direct sunlight."],
    ["Selecting Earrings for Every Occasion", "From subtle studs to statement jhumkas.", "Style Guide", "Choose lightweight designs for long wear and statement pieces for celebrations. Consider hairstyle, neckline and comfort together."],
    ["Gold-Plated Silver: What to Expect", "Care tips for maintaining a radiant plated finish.", "Silver Guide", "Gold plating gives silver a warm finish. Its life depends on wear and care, so remove pieces before bathing, exercise or household work."],
    ["Finding the Right Bangle Size", "A quick way to measure before you order.", "Buying Guide", "Measure the widest part of your hand or compare the inner diameter of a comfortable bangle. Contact Annai Jewellery if you need sizing help."],
    ["Building a Simple Jewellery Collection", "Versatile pieces that work across outfits.", "Buying Guide", "Start with a fine chain, a classic pair of earrings and one bangle set. Add statement designs based on the occasions you attend most."],
    ["Preparing Jewellery for a Wedding", "Plan styling, fittings and care before the celebration.", "Bridal Guide", "Choose jewellery with your outfit neckline and hairstyle in mind. Complete fittings early and keep every piece labelled in its own pouch."],
  ];
  for (const [title, excerpt, category, body] of blogs) {
    await query(
      `INSERT IGNORE INTO blogs (title, slug, category, excerpt, body, image_url, status, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, 'Published', ?)`,
      [
        title,
        slugify(title),
        category,
        excerpt,
        `${body}\n\nAnnai Jewellery note: review product material, care guidance, availability and delivery details before publishing.`,
        "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=80",
        category === "Nutrition" ? 1 : 0,
      ],
    );
  }

  await query(
    `INSERT INTO content_blocks (block_key, title, body, is_active)
     VALUES ('home_hero', 'Timeless jewellery for every celebration', 'Explore Annai Jewellery gold-plated silver collections crafted for modern traditions.', 1)
     ON DUPLICATE KEY UPDATE title=VALUES(title), body=VALUES(body), is_active=1`,
  );
}

try {
  console.log("Creating Annai Jewellery MySQL schema...");
  await runSchema();
  console.log("Seeding admin, users, products, orders, and content...");
  await seedAdmin();
  await seedUsers();
  await seedTaxonomy();
  await seedProducts();
  await seedOrders();
  await seedContent();
  console.log("Seed complete.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
