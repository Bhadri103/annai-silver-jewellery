import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query, pool } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const reviewHtmlPath = path.resolve(__dirname, "..", "..", "frontend", "review.html");

const decode = (value = "") => value
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&nbsp;/g, " ");

const strip = (value = "") => decode(value)
  .replace(/<a\b[^>]*>\s*More\s*<\/a>/gi, "")
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim();

const grab = (block, re) => {
  const match = block.match(re);
  return match ? strip(match[1]) : "";
};

async function ensureColumn(column, definition) {
  const rows = await query(
    `SELECT COUNT(*) total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'testimonials' AND COLUMN_NAME = ?`,
    [column],
  );
  if (!Number(rows[0]?.total || 0)) {
    await query(`ALTER TABLE testimonials ADD COLUMN ${column} ${definition}`);
  }
}

async function ensureSchema() {
  await ensureColumn("source", "VARCHAR(40) NOT NULL DEFAULT 'Website'");
  await ensureColumn("source_id", "VARCHAR(220) NULL");
  await ensureColumn("author_meta", "VARCHAR(220) NULL");
  await ensureColumn("review_date", "VARCHAR(80) NULL");
}

function parseReviews() {
  const html = fs.readFileSync(reviewHtmlPath, "utf8");
  const starts = [...html.matchAll(/<div class="bwb7ce"/g)].map((match) => match.index);
  return starts.map((start, index) => {
    const end = starts[index + 1] || html.length;
    const block = html.slice(start, end);
    const idMatch = block.match(/data-id="([^"]+)"/);
    const avatarMatch = block.match(/background-image:\s*url\(&quot;([^&]+)&quot;\)/);
    const ratingMatch = block.match(/aria-label="Rated\s+([\d.]+)\s+out of 5"/i);
    const text = grab(block, /class="OA1nbd"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<div class="svzjne"/);
    return {
      sourceId: idMatch ? idMatch[1] : `google-review-${index + 1}`,
      name: grab(block, /class="Vpc5Fe">([\s\S]*?)<\/div>/) || "Google reviewer",
      role: "Google Review",
      rating: ratingMatch ? Math.min(Math.max(Number(ratingMatch[1]), 1), 5) : 5,
      text: text || "Rating-only Google review.",
      imageUrl: avatarMatch ? decode(avatarMatch[1]) : "",
      authorMeta: grab(block, /class="GSM50">([\s\S]*?)<\/div>/),
      reviewDate: grab(block, /class="y3Ibjb">([\s\S]*?)<\/span>/) || "Google review",
    };
  }).filter((review) => review.name && review.sourceId);
}

async function importReviews() {
  await ensureSchema();
  const reviews = parseReviews();
  let inserted = 0;
  let updated = 0;

  for (const review of reviews) {
    const existing = await query("SELECT id FROM testimonials WHERE source = 'Google' AND source_id = ? LIMIT 1", [review.sourceId]);
    if (existing[0]) {
      await query(
        `UPDATE testimonials
         SET name=?, role=?, rating=?, text=?, image_url=?, author_meta=?, review_date=?, is_visible=1
         WHERE id=?`,
        [review.name, review.role, review.rating, review.text, review.imageUrl, review.authorMeta, review.reviewDate, existing[0].id],
      );
      updated += 1;
    } else {
      await query(
        `INSERT INTO testimonials (name, role, rating, text, image_url, source, source_id, author_meta, review_date, is_visible)
         VALUES (?, ?, ?, ?, ?, 'Google', ?, ?, ?, 1)`,
        [review.name, review.role, review.rating, review.text, review.imageUrl, review.sourceId, review.authorMeta, review.reviewDate],
      );
      inserted += 1;
    }
  }

  console.log(`Imported Google reviews: ${inserted} inserted, ${updated} updated, ${reviews.length} total from export.`);
  console.log(`Written comments: ${reviews.filter((review) => review.text !== "Rating-only Google review.").length}`);
}

importReviews()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
