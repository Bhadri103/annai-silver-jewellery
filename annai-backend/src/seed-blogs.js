import { query, pool } from "./db.js";

const slugify = (value = "") =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 180);

const posts = [
  ["How to Care for Gold-Plated Silver Jewellery", "Jewellery Care", "Simple habits that help preserve shine and finish.", "Keep plated silver jewellery dry, avoid perfume and chemicals, and wipe it gently after use. Store each piece separately in a soft pouch."],
  ["Choosing a Necklace for Your Neckline", "Style Guide", "Match chain length and pendant shape to your outfit.", "Short necklaces suit open necklines, while longer chains complement high necks and layered outfits. Choose a pendant that balances the neckline."],
  ["A Guide to 925 Silver", "Silver Guide", "Understand the hallmark and everyday care of sterling silver.", "925 silver contains 92.5 percent pure silver for a practical balance of beauty and durability. Natural tarnish can be cleaned with a soft silver cloth."],
  ["Bangles for Everyday and Occasion Wear", "Style Guide", "Find a comfortable style for daily or festive dressing.", "Slim bangles are easy to stack for everyday wear, while textured and stone-set pieces add a festive finish. Measure your size before ordering."],
  ["How to Store Your Jewellery", "Jewellery Care", "Prevent scratches, tangles and moisture damage.", "Fasten chains before storing, separate pieces in lined compartments, and keep jewellery away from humidity and direct sunlight."],
  ["Selecting Earrings for Every Occasion", "Style Guide", "From subtle studs to statement jhumkas.", "Choose lightweight designs for long wear and statement pieces for celebrations. Consider hairstyle, neckline and comfort together."],
  ["Gold-Plated Silver: What to Expect", "Silver Guide", "Care tips for maintaining a radiant plated finish.", "Gold plating gives silver a warm finish. Its life depends on wear and care, so remove pieces before bathing, exercise or household work."],
  ["Finding the Right Bangle Size", "Buying Guide", "A quick way to measure before you order.", "Measure the widest part of your hand or compare the inner diameter of a comfortable bangle. Contact Annai Jewellery if you need sizing help."],
  ["Building a Simple Jewellery Collection", "Buying Guide", "Versatile pieces that work across outfits.", "Start with a fine chain, a classic pair of earrings and one bangle set. Add statement designs based on the occasions you attend most."],
  ["Preparing Jewellery for a Wedding", "Bridal Guide", "Plan styling, fittings and care before the celebration.", "Choose jewellery with your outfit neckline and hairstyle in mind. Complete fittings early and keep every piece labelled in its own pouch."],
];

try {
  const columnRows = await query(
    `SELECT COUNT(*) total
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'blogs' AND COLUMN_NAME = 'category'`,
  );
  if (!Number(columnRows[0]?.total || 0)) {
    await query("ALTER TABLE blogs ADD COLUMN category VARCHAR(80) NOT NULL DEFAULT 'Jewellery Guide' AFTER slug");
  }

  for (const [title, category, excerpt, body] of posts) {
    await query(
      `INSERT INTO blogs (title, slug, category, excerpt, body, image_url, status, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, 'Published', ?)
       ON DUPLICATE KEY UPDATE
         category = VALUES(category),
         excerpt = VALUES(excerpt),
         body = VALUES(body),
         status = 'Published',
         is_featured = VALUES(is_featured)`,
      [
        title,
        slugify(title),
        category,
        excerpt,
        `${body}\n\nAnnai Jewellery note: review product material, care guidance, availability and delivery details before publishing.`,
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1200&q=85",
        category === "Jewellery Care" ? 1 : 0,
      ],
    );
  }
  console.log(`Seeded ${posts.length} blog posts.`);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
