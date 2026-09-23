# Delivery Tracker — Environment Variables

New environment variables introduced by the Delivery Tracker feature. Add these to your local `.env` (and to your hosting provider's environment settings before deploying).

| Variable | Purpose | Default / example |
|---|---|---|
| `STORAGE_DRIVER` | Selects the file storage backend for proof-of-delivery uploads | `vercel-blob` (or `local-disk` for a future cPanel migration) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob API token, used when `STORAGE_DRIVER=vercel-blob` | Auto-populated by Vercel when Blob storage is attached to the project |
| `DELIVERY_LOCAL_STORAGE_DIR` | Local filesystem directory for uploads, used when `STORAGE_DRIVER=local-disk` | `./storage/delivery` |
| `CRON_SECRET` | Bearer token securing `GET /api/delivery/reports/generate` — Vercel Cron sends this automatically as `Authorization: Bearer $CRON_SECRET` when the env var is set on the project | Generate with `openssl rand -hex 32` |
| `SMTP_HOST` | SMTP server for the weekly/monthly report email | (unset = email sending is skipped with a warning) |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP auth username | |
| `SMTP_PASS` | SMTP auth password | |
| `SMTP_FROM` | From address for report emails | `"BrandOS Delivery <no-reply@brandos.io>"` |
| `DELIVERY_REPORT_EMAIL_TO` | Fallback recipient for report emails when an org has no owner email on file | `niidodooofei@gmail.com` |
