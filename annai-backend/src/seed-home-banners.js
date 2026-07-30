import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";
import sharp from "sharp";
import { query, pool } from "./db.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const sourceDir = path.resolve(currentDir, "../../src/assets/banner");
const outputDir = path.resolve(currentDir, "../uploads/banners");

const content = [
  ["Jewellery for Today.", "Heirlooms for Tomorrow.", "Handcrafted silver. Timeless beauty.", "center"],
  ["Crafted by Hand.", "Cherished for Generations.", "Heritage artistry, made to treasure.", "center 43%"],
  ["Designed to Shine.", "Made to Be Yours.", "Graceful jewellery for every moment.", "center"],
  ["Tradition Reimagined.", "Beauty Without Time.", "Tradition, refined for today.", "center"],
];

try {
  await mkdir(outputDir, { recursive: true });
  const banners = [];
  for (let index = 0; index < content.length; index += 1) {
    const source = path.join(sourceDir, `homebanner${index + 1}.png`);
    const desktopName = `home-banner-${index + 1}-desktop.webp`;
    const mobileName = `home-banner-${index + 1}-mobile.webp`;
    await sharp(source).rotate().resize(1920, 1080, { fit: "cover", position: "centre" }).webp({ quality: 88 }).toFile(path.join(outputDir, desktopName));
    await sharp(source).rotate().resize(1080, 1350, { fit: "cover", position: "centre" }).webp({ quality: 86 }).toFile(path.join(outputDir, mobileName));
    const [title, accent, text, position] = content[index];
    banners.push({
      id: `home-banner-${index + 1}`,
      title,
      accent,
      text,
      imageUrl: `/uploads/banners/${desktopName}`,
      mobileImageUrl: `/uploads/banners/${mobileName}`,
      position,
      primaryLabel: "Explore Collections",
      primaryLink: "/collection/products",
      secondaryLabel: "Call Us",
      secondaryLink: "tel:+919751229418",
      isActive: true,
    });
  }
  await query(
    `INSERT INTO content_blocks (block_key, title, body, is_active)
     VALUES ('home_banners', 'Home carousel', ?, 1)
     ON DUPLICATE KEY UPDATE title = VALUES(title), body = VALUES(body), is_active = VALUES(is_active)`,
    [JSON.stringify({ banners })],
  );
  console.log(`Seeded ${banners.length} managed home banners.`);
} finally {
  await pool.end();
}
