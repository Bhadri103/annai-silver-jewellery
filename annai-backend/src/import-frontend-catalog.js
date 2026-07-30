import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool, transaction } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendRoot = path.resolve(__dirname, "../..");
const assetsRoot = path.join(frontendRoot, "src/assets");
const homePagePath = path.join(frontendRoot, "src/pages/HomePage.tsx");
const uploadsRoot = path.resolve(__dirname, "../uploads/catalog");
const material = "925 Silver with 24K Gold Plating";

const categoryDefinitions = [
  { name: "Bangles", folder: "bangles", shelf: "bangles", sku: "BAN" },
  { name: "Chains", folder: "chains", shelf: "chains", sku: "CHA" },
  { name: "Earrings", folder: "earings", shelf: "earrings", sku: "EAR" },
  { name: "Jewellery", folder: "jewellery", shelf: "jewellery", sku: "JEW", include: ["temple-necklace.png"] },
  { name: "Necklaces", folder: "necklace", shelf: "necklaces", sku: "NEC" },
];

const missingMetadata = {
  "earings/12.png": { name: "Signature Temple Jhumka", price: 2399, badge: "New" },
  "jewellery/temple-necklace.png": { name: "Annai Temple Statement Necklace", price: 8999, badge: "Bestseller" },
  "necklace/4.png": { name: "Classic Bridal Necklace", price: 7499, badge: "New" },
};

const slugify = (value) => String(value || "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const parsePrice = (value) => Number(String(value || "0").replace(/[^\d.]/g, "")) || 0;
const normalizedPath = (value) => path.resolve(value).toLowerCase();

function importedAssets(source) {
  const assets = new Map();
  const pattern = /import\s+([A-Za-z_$][\w$]*)\s+from\s+["']([^"']+\.(?:png|jpe?g|webp|avif))["'];/g;
  for (const match of source.matchAll(pattern)) {
    assets.set(match[1], path.resolve(path.dirname(homePagePath), match[2]));
  }
  return assets;
}

function shelfSource(source, shelfId) {
  const marker = `id: "${shelfId}"`;
  const start = source.indexOf(marker);
  if (start < 0) return "";
  const productsStart = source.indexOf("products:", start);
  const nextShelf = source.indexOf("\n  {\n    id:", productsStart);
  return source.slice(productsStart, nextShelf < 0 ? source.length : nextShelf);
}

function productMetadata(source) {
  const assets = importedAssets(source);
  const metadata = new Map();
  const itemPattern = /\{\s*name:\s*"([^"]+)"\s*,\s*material:\s*"([^"]+)"\s*,\s*price:\s*"([^"]+)"\s*,([\s\S]*?)image:\s*([^,}\n]+)\s*}/g;

  for (const category of categoryDefinitions) {
    const block = shelfSource(source, category.shelf);
    for (const match of block.matchAll(itemPattern)) {
      const imagePath = assets.get(match[5].trim());
      if (!imagePath) continue;
      metadata.set(normalizedPath(imagePath), {
        name: match[1],
        material: match[2],
        price: parsePrice(match[3]),
        badge: match[4].match(/badge:\s*"([^"]+)"/)?.[1] || "",
      });
    }
  }
  return metadata;
}

function numericFileSort(left, right) {
  const leftNumber = Number.parseInt(path.basename(left), 10);
  const rightNumber = Number.parseInt(path.basename(right), 10);
  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) return leftNumber - rightNumber;
  return left.localeCompare(right);
}

async function buildCatalogue() {
  const source = await fs.readFile(homePagePath, "utf8");
  const metadata = productMetadata(source);
  const products = [];

  for (const category of categoryDefinitions) {
    const directory = path.join(assetsRoot, category.folder);
    const entries = (await fs.readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && /\.(png|jpe?g|webp|avif)$/i.test(entry.name))
      .map((entry) => entry.name)
      .filter((name) => !category.include || category.include.includes(name))
      .sort(numericFileSort);

    for (let index = 0; index < entries.length; index += 1) {
      const fileName = entries[index];
      const sourcePath = path.join(directory, fileName);
      const relativeKey = `${category.folder}/${fileName}`.toLowerCase();
      const details = metadata.get(normalizedPath(sourcePath)) || missingMetadata[relativeKey];
      if (!details) throw new Error(`Product details are missing for src/assets/${relativeKey}`);
      products.push({
        ...details,
        material: details.material || material,
        category: category.name,
        categorySku: category.sku,
        categoryIndex: index,
        sourcePath,
        sourceFile: fileName,
      });
    }
  }

  const duplicateSlugs = products
    .map((product) => slugify(product.name))
    .filter((slug, index, values) => values.indexOf(slug) !== index);
  if (duplicateSlugs.length) throw new Error(`Duplicate product names: ${[...new Set(duplicateSlugs)].join(", ")}`);
  if (products.length !== 85) throw new Error(`Expected exactly 85 asset products, found ${products.length}.`);
  return products;
}

async function publishImages(products) {
  const resolvedRoot = path.resolve(uploadsRoot);
  if (path.basename(resolvedRoot) !== "catalog" || path.basename(path.dirname(resolvedRoot)) !== "uploads") {
    throw new Error(`Refusing to replace unexpected upload directory: ${resolvedRoot}`);
  }
  await fs.rm(resolvedRoot, { recursive: true, force: true });
  await fs.mkdir(resolvedRoot, { recursive: true });
  for (const product of products) {
    const extension = path.extname(product.sourceFile).toLowerCase();
    const destinationName = `${slugify(product.category)}-${path.basename(product.sourceFile, extension)}${extension}`;
    await fs.copyFile(product.sourcePath, path.join(resolvedRoot, destinationName));
    product.imageUrl = `/uploads/catalog/${destinationName}`;
  }
}

async function replaceCatalogue(products) {
  await transaction(async (connection) => {
    await connection.execute("INSERT IGNORE INTO product_brands (name) VALUES ('Annai Jewellery')");
    const [[brand]] = await connection.execute("SELECT id FROM product_brands WHERE name = 'Annai Jewellery' LIMIT 1");

    // Keep store-level reviews and order history, but remove references to catalogue rows being replaced.
    await connection.execute("UPDATE testimonials SET product_id = NULL WHERE product_id IS NOT NULL");
    await connection.execute("DELETE FROM products");
    await connection.execute("DELETE FROM product_categories");

    const categoryIds = new Map();
    for (const category of categoryDefinitions) {
      const firstProduct = products.find((product) => product.category === category.name);
      const [result] = await connection.execute(
        "INSERT INTO product_categories (name, image_url) VALUES (?, ?)",
        [category.name, firstProduct?.imageUrl || ""],
      );
      categoryIds.set(category.name, result.insertId);
    }

    const inserted = [];
    for (let index = 0; index < products.length; index += 1) {
      const product = products[index];
      const stock = 8 + (index % 23);
      const comparePrice = Math.ceil(product.price * 1.12 / 10) * 10;
      const featured = /bestseller/i.test(product.badge) ? 1 : 0;
      const sku = `ASJ-${product.categorySku}-${String(product.categoryIndex + 1).padStart(3, "0")}`;
      const description = `${product.name}, crafted on a 925 silver base with refined 24K gold plating.`;
      const variants = [{
        id: "default",
        sku,
        color: "Gold",
        size: "Free Size",
        originalPrice: comparePrice,
        price: product.price,
        stock,
        gstPercent: 3,
        image: product.imageUrl,
      }];
      const specs = {
        material: product.material,
        purity: "925",
        finish: "24K gold plating",
        origin: "India",
        relatedProductIds: [],
      };
      const [result] = await connection.execute(
        `INSERT INTO products
         (name, slug, category_id, brand_id, category, brand, goal, flavor, price, compare_price, stock, rating,
          review_count, in_stock, image_url, images, variants, features, specs, faqs, reviews, description,
          tagline, badge, is_active, is_featured)
         VALUES (?, ?, ?, ?, ?, 'Annai Jewellery', ?, 'Gold', ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          product.name,
          slugify(product.name),
          categoryIds.get(product.category),
          brand?.id || null,
          product.category,
          slugify(product.category),
          product.price,
          comparePrice,
          stock,
          4.5 + ((index % 5) / 10),
          12 + (index % 47),
          product.imageUrl,
          JSON.stringify([product.imageUrl]),
          JSON.stringify(variants),
          JSON.stringify(["925 silver base", "24K gold plated", "Skin friendly", "Annai quality checked"]),
          JSON.stringify(specs),
          JSON.stringify([{ question: "How should I care for this jewellery?", answer: "Keep it dry, avoid chemicals and store it separately in the supplied pouch." }]),
          JSON.stringify([]),
          description,
          `${product.category} by Annai Jewellery`,
          product.badge || "",
          featured,
        ],
      );
      inserted.push({ ...product, id: result.insertId });
    }

    for (const product of inserted) {
      const relatedProductIds = inserted
        .filter((candidate) => candidate.category === product.category && candidate.id !== product.id)
        .slice(product.categoryIndex % Math.max(1, inserted.filter((candidate) => candidate.category === product.category).length - 1))
        .concat(inserted.filter((candidate) => candidate.category === product.category && candidate.id !== product.id))
        .slice(0, 4)
        .map((candidate) => String(candidate.id));
      const specs = {
        material: product.material,
        purity: "925",
        finish: "24K gold plating",
        origin: "India",
        relatedProductIds,
      };
      await connection.execute("UPDATE products SET specs = ? WHERE id = ?", [JSON.stringify(specs), product.id]);
    }
  });
}

async function importCatalogue() {
  const products = await buildCatalogue();
  const distribution = Object.fromEntries(categoryDefinitions.map(({ name }) => [
    name,
    products.filter((product) => product.category === name).length,
  ]));

  if (process.argv.includes("--dry-run")) {
    console.log(`Validated ${products.length} asset products across ${categoryDefinitions.length} categories.`);
    console.log(distribution);
    return;
  }

  await publishImages(products);
  await replaceCatalogue(products);
  console.log(`Replaced the catalogue with ${products.length} asset products across ${categoryDefinitions.length} categories.`);
  console.log(distribution);
}

try {
  await importCatalogue();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
