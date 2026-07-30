import "dotenv/config";
import sharp from "sharp";
import { createHash, randomBytes, randomUUID } from "crypto";
import { unlink } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { pool, query, transaction } from "./db.js";

const baseUrl = `http://localhost:${process.env.PORT || 3000}${process.env.API_PREFIX || "/api"}`;
const uploadsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../uploads");
let createdOrder;
let proofPath = "";

try {
  const [product] = await query("SELECT id, name, price, stock FROM products WHERE is_active = 1 AND in_stock = 1 AND stock > 0 ORDER BY id LIMIT 1");
  if (!product) throw new Error("No in-stock product is available for commerce verification");
  const initialStock = Number(product.stock);
  const screenshot = await sharp({
    create: { width: 640, height: 900, channels: 3, background: { r: 248, g: 245, b: 237 } },
  }).png().toBuffer();
  const orderResponse = await fetch(`${baseUrl}/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": randomUUID().replaceAll("-", "") },
    body: JSON.stringify({
      customerName: "Security Verifier",
      customerEmail: "security-verifier@example.test",
      customerPhone: "9876543210",
      deliveryAddress: "Annai Jewellery automated security verification address",
      paymentMethod: "UPI",
      paymentProof: `data:image/png;base64,${screenshot.toString("base64")}`,
      items: [{ productId: product.id, quantity: 1, price: 0.01 }],
      amount: 0.01,
      paymentStatus: "Paid",
    }),
  });
  createdOrder = await orderResponse.json();
  if (!orderResponse.ok) throw new Error(createdOrder.message || "Secure checkout failed");
  if (Number(createdOrder.amount) !== Number(product.price)) throw new Error("Server pricing verification failed");
  if (createdOrder.paymentStatus !== "Awaiting Verification") throw new Error("Forged paid status was accepted");
  if (createdOrder.paymentProofUrl) throw new Error("Private payment proof leaked to customer response");

  const [admin] = await query("SELECT id FROM admin_users WHERE active = 1 ORDER BY id LIMIT 1");
  const token = randomBytes(48).toString("base64url");
  const session = await query(
    `INSERT INTO admin_sessions (admin_id, token_hash, ip_address, user_agent, expires_at)
     VALUES (?, ?, '127.0.0.1', 'annai-commerce-verifier', DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
    [admin.id, createHash("sha256").update(token).digest("hex")],
  );
  const headers = { Cookie: `annai_admin_session=${token}`, "Content-Type": "application/json" };
  const listResponse = await fetch(`${baseUrl}/admin/orders?search=${encodeURIComponent(createdOrder.orderId)}`, { headers });
  const listed = await listResponse.json();
  const adminOrder = listed.orders?.[0];
  if (!adminOrder?.paymentProofUrl) throw new Error("Admin cannot access payment proof");
  const proofResponse = await fetch(new URL(adminOrder.paymentProofUrl, baseUrl).toString(), { headers });
  if (!proofResponse.ok || !String(proofResponse.headers.get("content-type")).startsWith("image/")) {
    throw new Error("Private payment proof endpoint failed");
  }
  const reviewResponse = await fetch(`${baseUrl}/admin/orders/${createdOrder.id}/payment-review`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action: "reject", reason: "Automated transaction and stock restoration verification" }),
  });
  const reviewed = await reviewResponse.json();
  if (!reviewResponse.ok || reviewed.paymentStatus !== "Rejected") throw new Error(reviewed.message || "Payment rejection failed");
  const [restored] = await query("SELECT stock FROM products WHERE id = ?", [product.id]);
  if (Number(restored.stock) !== initialStock) throw new Error("Rejected payment did not restore stock");
  await query("UPDATE admin_sessions SET revoked_at = NOW() WHERE id = ?", [session.insertId]);
  const [storedOrder] = await query("SELECT payment_proof_url FROM orders WHERE id = ?", [createdOrder.id]);
  proofPath = storedOrder?.payment_proof_url || "";
  console.log(JSON.stringify({
    ok: true,
    orderId: createdOrder.orderId,
    serverPrice: createdOrder.amount,
    forgedPriceIgnored: true,
    forgedPaidStatusBlocked: true,
    privateProofVerified: true,
    stockRestored: true,
  }, null, 2));
} finally {
  if (createdOrder?.id) {
    await transaction(async (connection) => {
      await connection.execute("DELETE FROM order_items WHERE order_id = ?", [createdOrder.id]);
      await connection.execute("DELETE FROM orders WHERE id = ? AND payment_status = 'Rejected'", [createdOrder.id]);
    }).catch(() => {});
  }
  if (proofPath.startsWith("/uploads/")) {
    const file = path.resolve(uploadsDir, proofPath.replace(/^\/uploads\//, ""));
    if (file.startsWith(uploadsDir)) await unlink(file).catch(() => {});
  }
  await pool.end();
}
