import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "fs/promises";

const serverSource = await readFile(new URL("../src/server.js", import.meta.url), "utf8");
const adminSource = await readFile(new URL("../../src/pages/AdminPage.tsx", import.meta.url), "utf8");
const authSource = await readFile(new URL("../../src/pages/AuthPage.tsx", import.meta.url), "utf8");

test("manual orders use server-side pricing and transactional row locks", () => {
  assert.match(serverSource, /SELECT \* FROM products WHERE id = \? AND is_active = 1 FOR UPDATE/);
  assert.match(serverSource, /const unitPrice = Number\(variant\?\.price \?\? product\.price\)/);
  assert.match(serverSource, /transaction\(async \(connection\)/);
});

test("payment proof workflow cannot start paid", () => {
  assert.match(serverSource, /'Awaiting Verification'/);
  assert.match(serverSource, /payment-review/);
  assert.doesNotMatch(serverSource, /req\.body\.paymentStatus \|\| "Paid"[\s\S]{0,400}app\.post\(`\$\{apiPrefix\}\/orders`/);
});

test("new orders notify the configured administrator without blocking checkout", () => {
  assert.match(serverSource, /async function sendAdminOrderNotification\(order\)/);
  assert.match(serverSource, /process\.env\.ADMIN_ORDER_EMAIL/);
  assert.match(serverSource, /subject: `New order \$\{details\.orderId\} · \$\{details\.customerPhone\}`/);
  assert.match(serverSource, /setImmediate\(\(\) => \{\s*void sendAdminOrderNotification\(created\)/);
});

test("admin and customer sessions are opaque, revocable cookies", () => {
  assert.match(serverSource, /httpOnly: true/);
  assert.match(serverSource, /admin_sessions/);
  assert.match(serverSource, /user_sessions/);
  assert.match(serverSource, /revoked_at IS NULL/);
});

test("payment proofs are not publicly served", () => {
  assert.match(serverSource, /uploadUrlPath\}\/payment-proofs/);
  assert.match(serverSource, /admin\/orders\/:id\/payment-proof/);
});

test("legacy fitness identifiers cannot return", () => {
  assert.doesNotMatch(serverSource, /highgrade|\bHGF/i);
});

test("browser authentication state relies on HttpOnly cookies, not localStorage markers", () => {
  assert.doesNotMatch(adminSource, /annai_admin_authenticated|tokenKey/);
  assert.doesNotMatch(authSource, /annai_user_authenticated|annai_user_token/);
});

test("admin enquiry creation requires an authenticated administrator", () => {
  assert.match(
    serverSource,
    /app\.post\(`\$\{apiPrefix\}\/admin\/enquiries`,\s*requireAdmin,/,
  );
});

test("admin-managed catalogue images cannot use arbitrary remote URLs", () => {
  assert.match(serverSource, /isManagedUpload\(image,\s*"catalog"\)/);
  assert.match(serverSource, /isManagedUpload\(imageUrl,\s*"categories"\)/);
});

test("order fulfilment enforces forward-only state transitions", () => {
  assert.match(serverSource, /Order cannot move from \$\{currentStatus\} to \$\{status\}/);
  assert.match(serverSource, /Processing:\s*\["Processing", "Shipped"\]/);
  assert.match(serverSource, /Shipped:\s*\["Shipped", "Delivered"\]/);
});

test("admin-controlled links reject unsafe URI schemes", () => {
  assert.match(serverSource, /function isSafeDestination/);
  assert.match(serverSource, /Banner links must be a store path, HTTPS URL, phone or email link/);
  assert.match(serverSource, /Popup link must be a store path, HTTPS URL, phone or email link/);
});

test("admin password and OTP login are restricted to the configured email", () => {
  assert.match(serverSource, /username !== configuredEmail/);
  assert.match(serverSource, /ADMIN_RECOVERY_EMAIL \|\| process\.env\.SEED_ADMIN_EMAIL/);
  assert.match(adminSource, /annaisilverjewellerytky@gmail\.com/);
  assert.match(adminSource, /readOnly aria-readonly="true"/);
});

test("saved delivery addresses are persistent and authenticated", () => {
  assert.match(serverSource, /CREATE TABLE IF NOT EXISTS user_addresses/);
  assert.match(serverSource, /app\.get\(`\$\{apiPrefix\}\/me\/addresses`, requireUser,/);
  assert.match(serverSource, /app\.post\(`\$\{apiPrefix\}\/me\/addresses`, requireUser,/);
  assert.match(serverSource, /You can save up to 5 delivery addresses/);
});

test("percentage coupons apply directly without a maximum discount cap", () => {
  assert.match(serverSource, /Math\.round\(\(amount \* Number\(coupon\.discount_value \|\| 0\)\) \/ 100\)/);
  assert.doesNotMatch(serverSource, /coupon\.discount_type === "percentage" && Number\(coupon\.max_discount/);
  assert.doesNotMatch(adminSource, /Maximum discount/);
});

test("coupon usage exposes successful customers and orders to administrators", () => {
  assert.match(serverSource, /admin\/coupons\/:id\/usage/);
  assert.match(serverSource, /COUNT\(DISTINCT COALESCE\(NULLIF\(customer_email/);
  assert.match(serverSource, /payment_status NOT IN \('Rejected','Failed','Refunded'\)/);
  assert.match(adminSource, /Successful orders/);
});

test("popup uploads accept admin-generated absolute URLs and persist a managed relative path", () => {
  assert.match(serverSource, /parsed\.host !== req\.get\("host"\)/);
  assert.match(serverSource, /popupImage\.startsWith\("\/uploads\/promotions\/"\)/);
  assert.match(serverSource, /popup\.imageUrl = popupImage/);
  assert.match(adminSource, /storedAssetUrl\(result\.path \|\| result\.url/);
});
