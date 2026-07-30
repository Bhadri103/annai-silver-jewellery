import "dotenv/config";
import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";
import { unlink } from "fs/promises";
import { createHash, randomBytes } from "crypto";
import { query, pool } from "./db.js";

const baseUrl = `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || "/api"}`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const checks = [
  ["/admin/profile", "email"],
  ["/admin/dashboard", "stats"],
  ["/products/admin/categories", "categories"],
  ["/products/admin/all?page=1&limit=10", "products"],
  ["/admin/orders?page=1&limit=10", "orders"],
  ["/admin/enquiries?page=1&limit=10", "enquiries"],
  ["/admin/users?page=1&limit=10", "users"],
  ["/admin/testimonials?page=1&limit=10", "testimonials"],
  ["/admin/coupons?page=1&limit=10", "coupons"],
  ["/admin/auth-events?page=1&limit=10", "authEvents"],
  ["/admin/gallery?page=1&limit=10", "galleryItems"],
  ["/admin/blogs?page=1&limit=10", "blogs"],
  ["/admin/certificate-templates?page=1&limit=10", "templates"],
  ["/admin/certificates?page=1&limit=10", "certificates"],
  ["/admin/content-blocks", "blocks"],
];

try {
  const [admin] = await query("SELECT id, name, email, role FROM admin_users WHERE active = 1 ORDER BY id LIMIT 1");
  if (!admin) throw new Error("No active admin account found");
  const sessionToken = randomBytes(48).toString("base64url");
  const sessionHash = createHash("sha256").update(sessionToken).digest("hex");
  const sessionResult = await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE), '127.0.0.1', 'annai-admin-verifier')`,
    [admin.id, sessionHash],
  );
  const headers = { Cookie: `annai_admin_session=${sessionToken}` };
  const results = [];

  for (const [route, expectedKey] of checks) {
    const response = await fetch(`${baseUrl}${route}`, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`${route} returned ${response.status}: ${body.message || "Unknown error"}`);
    if (!(expectedKey in body)) throw new Error(`${route} is missing "${expectedKey}"`);
    if (route.includes("limit=10")) {
      if (!Array.isArray(body[expectedKey]) || body[expectedKey].length > 10) throw new Error(`${route} returned more than the requested 10 rows`);
      if (!Number.isInteger(body.currentPage) || !Number.isInteger(body.totalPages) || typeof body.total !== "number") {
        throw new Error(`${route} is missing pagination metadata`);
      }
    }
    results.push({ route, status: response.status });
  }
  const invalidBannerResponse = await fetch(`${baseUrl}/admin/content-blocks/home_banners`, {
    method: "PUT",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({
      title: "Validation check",
      isActive: true,
      body: JSON.stringify({ banners: [{ title: "x".repeat(37), imageUrl: "/uploads/banners/check.webp" }] }),
    }),
  });
  if (invalidBannerResponse.status !== 400) throw new Error("Home banner content length validation did not reject an oversized title");
  results.push({ route: "/admin/content-blocks/home_banners length validation", status: invalidBannerResponse.status });

  const firstProducts = await fetch(`${baseUrl}/products/admin/all?page=1&limit=10`, { headers }).then((response) => response.json());
  const secondProducts = await fetch(`${baseUrl}/products/admin/all?page=2&limit=10`, { headers }).then((response) => response.json());
  if (firstProducts.products.length === 10 && secondProducts.products.length && firstProducts.products.some((first) => secondProducts.products.some((second) => second.id === first.id))) {
    throw new Error("Product pagination returned duplicate rows across page 1 and page 2");
  }
  results.push({ route: "/products/admin/all pagination boundary", status: 200 });

  const [customer] = await query("SELECT id FROM users ORDER BY id DESC LIMIT 1");
  if (customer) {
    for (const [route, expectedKey] of [
      [`/admin/users/${customer.id}/wishlist`, "products"],
      [`/admin/users/${customer.id}/cart`, "items"],
    ]) {
      const response = await fetch(`${baseUrl}${route}`, { headers });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !(expectedKey in body)) throw new Error(`${route} failed customer commerce verification`);
      results.push({ route, status: response.status });
    }
  }
  const [order] = await query("SELECT id FROM orders ORDER BY id DESC LIMIT 1");
  if (order) {
    const route = `/admin/orders/${order.id}`;
    const response = await fetch(`${baseUrl}${route}`, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(body.items)) throw new Error(`${route} failed order detail verification`);
    results.push({ route, status: response.status });
  }

  const testImage = await sharp({
    create: { width: 900, height: 900, channels: 4, background: { r: 239, g: 214, b: 151, alpha: 1 } },
  }).png({ compressionLevel: 0 }).toBuffer();
  const uploadResponse = await fetch(`${baseUrl}/admin/uploads/image`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "verification", image: `data:image/png;base64,${testImage.toString("base64")}` }),
  });
  const upload = await uploadResponse.json().catch(() => ({}));
  if (!uploadResponse.ok) throw new Error(`Upload returned ${uploadResponse.status}: ${upload.message || "Unknown error"}`);
  if (!upload.compressed || upload.size >= upload.originalSize) throw new Error("Upload compression did not reduce the verification image");
  const uploadedFile = path.resolve(__dirname, "..", String(upload.path).replace(/^\/uploads\//, "uploads/"));
  await unlink(uploadedFile);
  results.push({
    route: "/admin/uploads/image",
    status: uploadResponse.status,
    originalSize: upload.originalSize,
    compressedSize: upload.size,
  });
  const bannerSource = await sharp({
    create: { width: 1200, height: 675, channels: 4, background: { r: 210, g: 175, b: 55, alpha: 1 } },
  }).png().toBuffer();
  const bannerResponse = await fetch(`${baseUrl}/admin/uploads/image`, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ preset: "banner-desktop", image: `data:image/png;base64,${bannerSource.toString("base64")}` }),
  });
  const bannerUpload = await bannerResponse.json().catch(() => ({}));
  if (!bannerResponse.ok) throw new Error(`Banner upload returned ${bannerResponse.status}: ${bannerUpload.message || "Unknown error"}`);
  if (bannerUpload.width !== 1920 || bannerUpload.height !== 1080 || !String(bannerUpload.path).startsWith("/uploads/banners/")) {
    throw new Error("Banner upload did not produce the required 1920 x 1080 output");
  }
  await unlink(path.resolve(__dirname, "..", String(bannerUpload.path).replace(/^\/uploads\//, "uploads/")));
  results.push({ route: "/admin/uploads/image banner preset", status: bannerResponse.status, width: bannerUpload.width, height: bannerUpload.height });
  console.log(JSON.stringify({ ok: true, checks: results }, null, 2));
  await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ?", [sessionResult.insertId]);
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
