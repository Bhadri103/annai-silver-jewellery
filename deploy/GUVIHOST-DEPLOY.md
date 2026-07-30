# GUVIHOST Enhance deployment

This package runs the Annai Jewellery storefront, admin panel, API, and uploaded
media through one Node.js application.

## 1. Create the database

In the website dashboard, open **Databases**, create a MySQL database and user,
and save the host, database name, username, and password. Open phpMyAdmin for
that new, empty database and import:

`annai-app/deploy/data/annai-production-store.sql`

This initial import contains the current jewellery categories, products,
storefront content, coupons, and public reviews. It does not contain customer
passwords, sessions, OTPs, orders, payment proofs, or verification files.

## 2. Upload the application

Open **Files**, upload the deployment ZIP, and extract it in the website home
directory. The extracted application directory should be `annai-app`.

Copy:

`annai-app/deploy/enhance.env.example`

to:

`annai-app/annai-backend/.env`

Replace every `PASTE_...` value. Use a newly generated Gmail App Password and a
new strong admin password. Never commit or share this `.env` file.

## 3. Install production dependencies

Open the website SSH terminal and run:

```sh
cd ~/annai-app/annai-backend
npm ci --omit=dev
```

## 4. Deploy the Node application

Open **Advanced → Node.js → Deploy app** and use:

- Mode: `Automatic`
- Node version: `20`
- Working directory: `annai-app/annai-backend`
- Startup command: `npm start`
- Proxy: enabled
- Proxy path: `/`
- Port: `3000`

Deploy the app. If it was already deployed, restart it after replacing files or
environment values.

## 5. Verify

Open:

- `https://annaisilverjewellery.com/api/health`
- `https://annaisilverjewellery.com/`
- `https://annaisilverjewellery.com/admin`

Do not delete the `annai-backend/uploads` directory or the production database
during later updates.
