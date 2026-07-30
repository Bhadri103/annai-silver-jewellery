# Annai Jewellery Admin Backend

Node.js + Express + MySQL backend for the Annai Jewellery storefront and administration panel. It manages jewellery categories, products, multiple product images, variants, inventory, customers, orders, payments, reviews, offers and website content.

## Setup

```bat
cd D:\Jwellery\backend
copy .env.example .env
npm install
npm run seed
npm run dev
```

The API will run at:

```text
http://localhost:3000/api
```

The frontend reads `VITE_API_BASE_URL`. Development defaults to `http://localhost:3000/api`; production defaults to same-origin `/api`.

## Default Seed Login

```text
Admin name: Annai Silver Jewellery
Admin email: admin@annaijewellery.com
Password: set with SEED_ADMIN_PASSWORD
```

Seed member:

```text
Email: bhadri@gmail.com
Password: Bhadri@103
```

Change these values in `.env` before using this outside local development.

## Admin email OTP

Admin OTP login and password recovery are restricted to the active address in
`ADMIN_RECOVERY_EMAIL`. For Gmail delivery, enable 2-Step Verification on the
sender account and create a dedicated 16-character Google App Password. Store
it only in the deployment provider's secret environment settings:

```env
SEED_ADMIN_EMAIL=annaisilverjewellerytky@gmail.com
ADMIN_RECOVERY_EMAIL=annaisilverjewellerytky@gmail.com
ADMIN_ORDER_EMAIL=annaisilverjewellerytky@gmail.com
GMAIL_USER=annaisilverjewellerytky@gmail.com
GMAIL_APP_PASSWORD=your_16_character_google_app_password
```

Never use the Gmail account password for `GMAIL_APP_PASSWORD`, and never commit
the real App Password or `SEED_ADMIN_PASSWORD`.

After a customer places an order, the backend sends the order ID, customer
contact details, products, amount, payment state and delivery address to
`ADMIN_ORDER_EMAIL`. Notification delivery runs after checkout and does not
delay or cancel a successfully created order.

## Main Tables

- `admin_users`
- `users`
- `products`
- `product_categories`
- `product_brands`
- `orders`
- `enquiries`
- `testimonials`
- `blogs`
- `content_blocks`
- `audit_logs`

## Admin API

All admin endpoints except login require:

```text
Authorization: Bearer <token>
```

Important routes:

```text
POST   /api/admin/login
GET    /api/admin/profile
POST   /api/admin/change-password
GET    /api/admin/dashboard

GET    /api/products/admin/all
POST   /api/products
PUT    /api/products/:id
PATCH  /api/products/:id/status
DELETE /api/products/:id

GET    /api/products/admin/brands
POST   /api/products/admin/brands
PUT    /api/products/admin/brands/:id
DELETE /api/products/admin/brands/:id

GET    /api/products/admin/categories
POST   /api/products/admin/categories
PUT    /api/products/admin/categories/:id
DELETE /api/products/admin/categories/:id

GET    /api/admin/orders
PATCH  /api/admin/orders/:id/status
PATCH  /api/admin/orders/:id/license
DELETE /api/admin/orders/:id

GET    /api/admin/users
PATCH  /api/admin/users/:id/status
GET    /api/admin/users/:id/orders
DELETE /api/admin/users/:id

GET    /api/admin/enquiries
POST   /api/admin/enquiries
PATCH  /api/admin/enquiries/:id/status
DELETE /api/admin/enquiries/:id

GET    /api/admin/testimonials
POST   /api/admin/testimonials
PUT    /api/admin/testimonials/:id
PATCH  /api/admin/testimonials/:id/visible
DELETE /api/admin/testimonials/:id

GET    /api/admin/blogs
POST   /api/admin/blogs
PUT    /api/admin/blogs/:id
PATCH  /api/admin/blogs/:id/status
PATCH  /api/admin/blogs/:id/featured
DELETE /api/admin/blogs/:id
```

## MySQL Notes

The seed command executes `schema.sql`, creates the `annai_jewellery` database, seeds accounts and operational data, then replaces the store catalogue with the 85 product images in the Bangles, Chains, Earrings, Jewellery and Necklaces asset folders. Local product images are copied into `uploads/catalog`; historical orders are preserved while obsolete catalogue, cart and wishlist rows are removed.

Validate the catalogue without MySQL:

```bat
npm run validate:catalog
```

Import only the catalogue into an existing database:

```bat
npm run seed:catalog
```

If MySQL uses a password, set it in `.env`:

```env
DB_USER=root
DB_PASSWORD=your_password
```

For production, use a dedicated least-privilege database account, restrict
`CORS_ORIGIN` and `FRONTEND_URL` to HTTPS origins, configure SMTP, schedule
encrypted off-host MySQL backups, and monitor `/api/health`. Authentication uses
revocable opaque HttpOnly cookie sessions; no JWT secret or browser token is used.
