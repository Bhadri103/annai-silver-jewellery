import { pool, query } from "./db.js";

try {
  const [products, categories, activeProducts, productsWithImages, variants, productsMissingVariants, variantDistribution, categoryDistribution, brokenCategoryLinks, productsMissingRelatedData] = await Promise.all([
    query("SELECT COUNT(*) total FROM products"),
    query("SELECT COUNT(*) total FROM product_categories"),
    query("SELECT COUNT(*) total FROM products WHERE is_active = 1"),
    query("SELECT COUNT(*) total FROM products WHERE image_url IS NOT NULL AND image_url <> ''"),
    query("SELECT COUNT(*) total FROM products WHERE JSON_LENGTH(variants) > 0"),
    query("SELECT id, name, slug FROM products WHERE variants IS NULL OR JSON_LENGTH(variants) = 0 ORDER BY id"),
    query("SELECT JSON_LENGTH(variants) variantCount, COUNT(*) total FROM products GROUP BY JSON_LENGTH(variants) ORDER BY variantCount"),
    query("SELECT category, COUNT(*) total FROM products GROUP BY category ORDER BY category"),
    query("SELECT p.id, p.name FROM products p LEFT JOIN product_categories c ON c.id = p.category_id WHERE c.id IS NULL OR c.name <> p.category"),
    query("SELECT id, name FROM products WHERE category <> 'Jewellery' AND (specs IS NULL OR JSON_LENGTH(JSON_EXTRACT(specs, '$.relatedProductIds')) = 0)"),
  ]);
  console.log(`products=${products[0].total}`);
  console.log(`categories=${categories[0].total}`);
  console.log(`activeProducts=${activeProducts[0].total}`);
  console.log(`productsWithImages=${productsWithImages[0].total}`);
  console.log(`productsWithVariants=${variants[0].total}`);
  if (productsMissingVariants.length) {
    console.log(`productsMissingVariants=${JSON.stringify(productsMissingVariants)}`);
  }
  console.log(`variantDistribution=${JSON.stringify(variantDistribution)}`);
  console.log(`categoryDistribution=${JSON.stringify(categoryDistribution)}`);

  const expectedDistribution = {
    Bangles: 24,
    Chains: 24,
    Earrings: 12,
    Jewellery: 1,
    Necklaces: 24,
  };
  const actualDistribution = Object.fromEntries(categoryDistribution.map((item) => [item.category, Number(item.total)]));
  const failures = [];
  if (Number(products[0].total) !== 85) failures.push(`expected 85 products, found ${products[0].total}`);
  if (Number(categories[0].total) !== 5) failures.push(`expected 5 categories, found ${categories[0].total}`);
  if (Number(activeProducts[0].total) !== 85) failures.push(`expected 85 visible products, found ${activeProducts[0].total}`);
  if (Number(productsWithImages[0].total) !== 85) failures.push("one or more products has no image");
  if (Number(variants[0].total) !== 85 || productsMissingVariants.length) failures.push("one or more products has no purchasable variant");
  if (JSON.stringify(actualDistribution) !== JSON.stringify(expectedDistribution)) failures.push("category distribution does not match the asset catalogue");
  if (brokenCategoryLinks.length) failures.push(`${brokenCategoryLinks.length} products have invalid category links`);
  if (productsMissingRelatedData.length) failures.push(`${productsMissingRelatedData.length} products have no related-product binding`);
  if (failures.length) throw new Error(`Catalogue verification failed: ${failures.join("; ")}`);
  console.log("catalogueIntegrity=passed");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
