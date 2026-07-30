import "dotenv/config";
import { pool, transaction } from "./db.js";

const retiredCategories = ["ring", "rings", "pendant", "pendants"];

try {
  const result = await transaction(async (connection) => {
    const placeholders = retiredCategories.map(() => "?").join(",");
    const [matchingProducts] = await connection.execute(
      `SELECT id, name, category FROM products
       WHERE LOWER(TRIM(category)) IN (${placeholders})
          OR LOWER(name) REGEXP '(^|[[:space:]-])(ring|rings|pendant|pendants)([[:space:]-]|$)'`,
      retiredCategories,
    );
    const productIds = matchingProducts.map((item) => item.id);
    if (productIds.length) {
      const productPlaceholders = productIds.map(() => "?").join(",");
      await connection.execute(`DELETE FROM wishlists WHERE product_id IN (${productPlaceholders})`, productIds);
      await connection.execute(`DELETE FROM products WHERE id IN (${productPlaceholders})`, productIds);
    }
    const [categoryResult] = await connection.execute(
      `DELETE FROM product_categories WHERE LOWER(TRIM(name)) IN (${placeholders})`,
      retiredCategories,
    );
    return {
      removedProducts: matchingProducts.map(({ id, name, category }) => ({ id, name, category })),
      removedCategories: categoryResult.affectedRows,
    };
  });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
