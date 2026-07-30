# Annai Jewellery production checklist

## Required before launch

- Run the migration against a fresh backup and execute `npm test`, `npm run verify:admin`, and `npm run verify:commerce`.
- Use a dedicated least-privilege MySQL account; do not deploy with `root`.
- Set `NODE_ENV=production`, HTTPS-only `FRONTEND_URL`/`CORS_ORIGIN`, SMTP credentials, and non-default session durations.
- Rotate any credentials that were previously stored in local `.env` files or shared in logs.
- Put the API behind an HTTPS reverse proxy, enable HSTS, request-size limits, access logs, and upstream rate limiting.
- Store `backend/uploads/payment-proofs` outside the public web root and include it in encrypted backups with restricted operator access.
- Schedule `npm run backup`, copy backups off-host, encrypt them, and test restoration monthly.
- Monitor `/api/health`, process restarts, 5xx rates, authentication failures, rejected proofs, low stock, disk space, backup age, and database availability.
- Retain immutable audit logs and rejected/paid order history according to the business retention policy.

## Manual-payment operating rule

An uploaded screenshot is evidence to review, not proof that money arrived. The admin must compare amount, payer reference, timestamp, and the actual bank/UPI statement before approving. Never approve based only on the screenshot.

## Incident response

Revoke active admin/customer sessions, rotate SMTP/database credentials, preserve audit logs, take a database snapshot, and investigate affected orders before restoring service.
