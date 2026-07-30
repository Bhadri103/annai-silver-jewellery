import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "crypto";
import { pool, query } from "./db.js";

const baseUrl = `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || "/api"}`;
const suffix = randomUUID().replaceAll("-", "").slice(0, 10);
const created = {};

async function request(path, { method = "GET", cookie = "", body, expected = [200] } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(cookie ? { Cookie: cookie } : {}),
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const payload = await response.json().catch(() => ({}));
  assert.ok(expected.includes(response.status), `${method} ${path} returned ${response.status}: ${payload.message || "Unknown error"}`);
  return { response, payload };
}

try {
  const unauthorized = await request("/admin/enquiries", {
    method: "POST",
    body: { name: "Blocked Request", phone: "9876543210", program: "Jewellery enquiry" },
    expected: [401],
  });
  assert.equal(unauthorized.response.status, 401);

  const [admin] = await query("SELECT id FROM admin_users WHERE active = 1 ORDER BY id LIMIT 1");
  assert.ok(admin, "An active admin is required");
  const adminToken = randomBytes(48).toString("base64url");
  const session = await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE), '127.0.0.1', 'annai-crud-verifier')`,
    [admin.id, createHash("sha256").update(adminToken).digest("hex")],
  );
  created.adminSession = session.insertId;
  const adminCookie = `annai_admin_session=${adminToken}`;

  const categoryName = `Verification ${suffix}`;
  const categoryCreated = await request("/products/admin/categories", {
    method: "POST",
    cookie: adminCookie,
    body: { name: categoryName, imageUrl: "" },
    expected: [201],
  });
  created.category = categoryCreated.payload.id;
  const renamedCategory = `${categoryName} Updated`;
  const categoryUpdated = await request(`/products/admin/categories/${created.category}`, {
    method: "PUT",
    cookie: adminCookie,
    body: { name: renamedCategory, imageUrl: "" },
  });
  assert.equal(categoryUpdated.payload.name, renamedCategory);

  const [referenceProduct] = await query(
    "SELECT id, image_url FROM products WHERE is_active = 1 AND image_url <> '' ORDER BY id LIMIT 1",
  );
  assert.ok(referenceProduct, "A reference product is required");
  const productName = `Verification Pendant ${suffix}`;
  const productCreated = await request("/products", {
    method: "POST",
    cookie: adminCookie,
    body: {
      name: productName,
      category: renamedCategory,
      brand: "Annai Jewellery",
      price: 1250,
      comparePrice: 1500,
      stock: 7,
      imageUrl: referenceProduct.image_url,
      images: [referenceProduct.image_url],
      description: "Temporary automated CRUD verification product.",
      badge: "New",
      isActive: true,
      relatedProductIds: [String(referenceProduct.id)],
    },
    expected: [201],
  });
  created.product = productCreated.payload.id;
  assert.equal(productCreated.payload.variants.length, 1);
  assert.equal(productCreated.payload.variants[0].stock, 7);
  assert.deepEqual(productCreated.payload.relatedProductIds, [String(referenceProduct.id)]);

  const productUpdated = await request(`/products/${created.product}`, {
    method: "PUT",
    cookie: adminCookie,
    body: {
      name: productName,
      slug: productCreated.payload.slug,
      category: renamedCategory,
      brand: "Annai Jewellery",
      price: 1300,
      comparePrice: 1500,
      stock: 5,
      imageUrl: referenceProduct.image_url,
      images: [referenceProduct.image_url],
      description: "Updated automated CRUD verification product.",
      badge: "Bestseller",
      isActive: true,
      relatedProductIds: [String(referenceProduct.id)],
    },
  });
  assert.equal(productUpdated.payload.variants.length, 1);
  assert.equal(Number(productUpdated.payload.variants[0].price), 1300);
  assert.equal(Number(productUpdated.payload.variants[0].stock), 5);
  const publicProduct = await request(`/products/${encodeURIComponent(productCreated.payload.slug)}`);
  assert.equal(publicProduct.payload.id, created.product);

  const publicCategories = await request("/categories");
  const category = publicCategories.payload.categories.find((item) => item.id === created.category);
  assert.equal(category?.productCount, 1);

  const reviewName = "Verification Customer";
  const reviewCreated = await request("/testimonials", {
    method: "POST",
    body: { productId: created.product, name: reviewName, rating: 5, text: "Great" },
    expected: [201],
  });
  created.review = reviewCreated.payload.id;
  assert.equal(reviewCreated.payload.isVisible, true);
  const publicReviews = await request(`/testimonials?productId=${created.product}&search=${encodeURIComponent(reviewName)}&limit=5`);
  assert.equal(publicReviews.payload.total, 1);
  await request(`/admin/testimonials/${created.review}/visible`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { isVisible: false },
  });
  const hiddenReviews = await request(`/testimonials?productId=${created.product}&search=${encodeURIComponent(reviewName)}&limit=5`);
  assert.equal(hiddenReviews.payload.total, 0);
  await request(`/admin/testimonials/${created.review}`, {
    method: "PUT",
    cookie: adminCookie,
    body: { productId: created.product, name: reviewName, role: "Customer", rating: 4, text: "Updated verification review", source: "Website" },
  });
  await request(`/admin/testimonials/${created.review}`, { method: "DELETE", cookie: adminCookie });
  delete created.review;

  const couponCode = `QA${suffix}`.toUpperCase();
  const couponCreated = await request("/admin/coupons", {
    method: "POST",
    cookie: adminCookie,
    body: {
      code: couponCode,
      title: "Automated verification",
      discountType: "percentage",
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 200,
      usageLimit: 2,
      perUserLimit: 1,
      isActive: true,
    },
    expected: [201],
  });
  created.coupon = couponCreated.payload.id;
  const couponValidated = await request("/coupons/validate", {
    method: "POST",
    body: { code: couponCode, subtotal: 1000, email: `qa-${suffix}@example.test` },
  });
  assert.equal(couponValidated.payload.discount, 100);
  const couponUpdated = await request(`/admin/coupons/${created.coupon}`, {
    method: "PUT",
    cookie: adminCookie,
    body: {
      code: couponCode,
      title: "Updated automated verification",
      discountType: "flat",
      discountValue: 75,
      minOrderAmount: 500,
      maxDiscount: 0,
      usageLimit: 2,
      perUserLimit: 1,
      isActive: true,
    },
  });
  assert.equal(couponUpdated.payload.discountType, "flat");

  const enquiryCreated = await request("/enquiries", {
    method: "POST",
    body: {
      name: "Verification Customer",
      email: `enquiry-${suffix}@example.test`,
      phone: `9${String(Date.now()).slice(-9)}`,
      program: "Jewellery enquiry",
      source: "Automated verification",
      message: "Please share collection details.",
    },
    expected: [201],
  });
  created.enquiry = enquiryCreated.payload.id;
  const enquiryUpdated = await request(`/admin/enquiries/${created.enquiry}/status`, {
    method: "PATCH",
    cookie: adminCookie,
    body: { status: "Contacted" },
  });
  assert.equal(enquiryUpdated.payload.status, "Contacted");
  await request(`/admin/enquiries/${created.enquiry}`, { method: "DELETE", cookie: adminCookie });
  delete created.enquiry;

  const email = `customer-${suffix}@example.test`;
  const phone = `8${String(Date.now() + 7).slice(-9)}`;
  const registered = await request("/auth/register", {
    method: "POST",
    body: { name: "Verification Customer", email, phone, password: "Customer@103" },
    expected: [201],
  });
  created.user = registered.payload.id;
  const userCookie = String(registered.response.headers.get("set-cookie") || "").split(";")[0];
  assert.match(userCookie, /^annai_user_session=/);
  await request("/me/wishlist", {
    method: "POST",
    cookie: userCookie,
    body: { productId: created.product },
    expected: [201],
  });
  await request("/me/cart", {
    method: "PUT",
    cookie: userCookie,
    body: { items: [{ productId: created.product, quantity: 2 }] },
  });
  const adminWishlist = await request(`/admin/users/${created.user}/wishlist`, { cookie: adminCookie });
  const adminCart = await request(`/admin/users/${created.user}/cart`, { cookie: adminCookie });
  assert.equal(adminWishlist.payload.products.length, 1);
  assert.equal(adminCart.payload.items[0]?.quantity, 2);
  await request("/auth/logout", { method: "POST", cookie: userCookie, body: {} });
  const revoked = await request("/me", { cookie: userCookie, expected: [401] });
  assert.equal(revoked.response.status, 401);

  console.log(JSON.stringify({
    ok: true,
    checks: [
      "admin authorization",
      "category create/update/storefront binding",
      "product create/update/default variant/related products",
      "review publish/hide/edit/delete",
      "coupon create/validate/update",
      "enquiry create/status/delete",
      "customer register/wishlist/cart/logout",
    ],
  }, null, 2));
} finally {
  if (created.review) await query("DELETE FROM testimonials WHERE id = ?", [created.review]).catch(() => {});
  if (created.enquiry) await query("DELETE FROM enquiries WHERE id = ?", [created.enquiry]).catch(() => {});
  if (created.user) {
    await query("DELETE FROM user_sessions WHERE user_id = ?", [created.user]).catch(() => {});
    await query("DELETE FROM wishlists WHERE user_id = ?", [created.user]).catch(() => {});
    await query("DELETE FROM cart_items WHERE user_id = ?", [created.user]).catch(() => {});
    await query("DELETE FROM auth_events WHERE user_id = ?", [created.user]).catch(() => {});
    await query("DELETE FROM users WHERE id = ?", [created.user]).catch(() => {});
  }
  if (created.product) await query("DELETE FROM products WHERE id = ?", [created.product]).catch(() => {});
  if (created.category) await query("DELETE FROM product_categories WHERE id = ?", [created.category]).catch(() => {});
  if (created.coupon) await query("DELETE FROM coupons WHERE id = ?", [created.coupon]).catch(() => {});
  if (created.adminSession) await query("DELETE FROM admin_sessions WHERE id = ?", [created.adminSession]).catch(() => {});
  await pool.end();
}
