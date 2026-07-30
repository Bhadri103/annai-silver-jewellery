import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";
import sharp from "sharp";
import { query, pool } from "./db.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(currentDir, "../../src/assets");
const outputDir = path.resolve(currentDir, "../uploads/categories");

const categoryAssets = {
  Bangles: "bangles/1.png",
  Chains: "chains/1.png",
  Earrings: "earings/1.png",
  Jewellery: "jewellery/temple-necklace.png",
  Necklaces: "necklace/2.png",
};

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

try {
  await mkdir(outputDir, { recursive: true });
  const categories = await query("SELECT id, name FROM product_categories ORDER BY id");
  const updated = [];

  for (const category of categories) {
    const relativeAsset = categoryAssets[category.name] || "jewellery/temple-necklace.png";
    const source = path.join(assetsDir, relativeAsset);
    const filename = `${slug(category.name)}.webp`;
    const destination = path.join(outputDir, filename);
    await sharp(source)
      .rotate()
      .resize(640, 640, { fit: "cover", position: "centre" })
      .webp({ quality: 84 })
      .toFile(destination);
    const imageUrl = `/uploads/categories/${filename}`;
    await query("UPDATE product_categories SET image_url = ? WHERE id = ?", [imageUrl, category.id]);
    updated.push({ id: category.id, name: category.name, imageUrl });
  }

  console.log(JSON.stringify({ ok: true, updated }, null, 2));
} finally {
  await pool.end();
}
