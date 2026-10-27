# Deployment Guide

This guide covers the production deployment of the Hostel Management System (HMS). The application is a server-rendered Next.js application backed by PostgreSQL. It must not be deployed to a static hosting product.

## Release Model

Every release follows the same order:

1. Build and test the application in CI.
2. Back up the production database.
3. Apply committed migrations with `npm run db:deploy`.
4. Start the new application version.
5. Verify `/api/health`, login, and one protected page.

Migrations are forward-only. If a release introduces an incompatible schema change, roll back by restoring the database backup and redeploying the previous image. Do not edit an applied migration file.

## Bootstrap the First Admin

Do not run the destructive demo seed against production. Create the first administrator with a one-off command instead:

```bash
read -rsp "Admin password: " ADMIN_PASSWORD; echo
ADMIN_EMAIL=admin@example.com \
ADMIN_NAME="System Administrator" \
ADMIN_PASSWORD="$ADMIN_PASSWORD" \
npm run db:create-admin
```

The password must be 12-72 characters. The command creates the ADMIN account, or updates the password/name if that email is already an ADMIN. It refuses to promote an existing STAFF or STUDENT account unless you explicitly set `ADMIN_FORCE_PROMOTE=true`. The password is not printed and the operation is recorded in `AuditLog`.

For a one-off Compose run after migrations:

```bash
read -rsp "Admin password: " ADMIN_PASSWORD; echo
docker compose run --rm \
  -e ADMIN_EMAIL=admin@example.com \
  -e ADMIN_NAME="System Administrator" \
  -e ADMIN_PASSWORD="$ADMIN_PASSWORD" \
  migrate npm run db:create-admin
```

Keep the password out of shell history and CI logs. On managed platforms, run this as a one-off task with secrets from the platform secret manager.

Password changes do not revoke already-issued JWT sessions. If an administrator account is compromised, rotate `NEXTAUTH_SECRET` to invalidate all sessions, then require users to sign in again.

## Option A: Docker Compose on a VPS

This is the simplest self-hosted path. It runs PostgreSQL, a one-shot migration container, and the production Next.js image.

### 1. Prepare the host

- Install Docker Engine and the Compose plugin.
- Open only ports `80` and `443` publicly. Keep PostgreSQL and the app port private behind a reverse proxy.
- Create a DNS record for the application hostname.
- Use a reverse proxy or load balancer for TLS. Caddy automatically provisions certificates; Nginx with certbot is also suitable.

### 2. Configure secrets

```bash
cp .env.example .env
openssl rand -base64 48
```

Set the following in `.env`:

```env
POSTGRES_USER=hms
POSTGRES_PASSWORD=<openssl-rand-hex-32>
POSTGRES_DB=hms
NEXTAUTH_SECRET=<generated-secret>
NEXTAUTH_URL=https://hms.example.com
APP_PORT=3000
```

Generate the database password with `openssl rand -hex 32`. Compose embeds it in `DATABASE_URL`, so avoid URL-special characters such as `@`, `:`, `/`, `?`, and `#`.

`DATABASE_URL` in `.env.example` is for local development. Docker Compose constructs the container database URL from `POSTGRES_*` and connects to the `db` service.

### 3. Build and start

```bash
docker compose build
docker compose up -d db migrate app
docker compose ps
curl -fsS http://127.0.0.1:3000/api/health
```

The `app` container waits for PostgreSQL health and for the migration container to exit successfully. The Docker image runs as a non-root user and includes a health check backed by the database.

### 4. Seed demo data (development only)

```bash
docker compose --profile seed run --rm seed
```

The seed is destructive: it removes existing application records before inserting demo users, rooms, invoices, and attendance. Never run it against production.

### 5. Back up the database

Use `pg_dump` from the host or a scheduled container. Example:

```bash
docker compose exec -T db sh -c \
  'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' \
  > "hms-$(date +%Y%m%d-%H%M%S).dump"
```

Store backups off the host, encrypt them, and test a restore regularly. A backup you have never restored is not a verified backup.

Restore (stop the app first so no writes race the restore):

```bash
docker compose stop app
docker compose exec -T db sh -c \
  'pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists' \
  < backup.dump
docker compose start app
```

### 6. Upgrade

```bash
git pull
docker compose build
docker compose run --rm migrate
docker compose up -d app
curl -fsS http://127.0.0.1:3000/api/health
```

The migration step is idempotent. If a migration fails, stop the rollout, inspect the migration logs, and restore the backup if necessary.

## Option B: Managed PostgreSQL and a Node Platform

Use this path for Render, Railway, Fly.io, or a Node/container platform. For Vercel, use its native Next.js integration and the same environment variables; Vercel manages the server process instead of `npm run start`.

### Build and release commands

- Install: `npm ci`
- Build: `npm run db:generate && npm run build`
- Release/migrate: `npm run db:deploy`
- Start: `npm run start` (runs the standalone server from `.next/standalone`)
- Health check path: `/api/health`

Set the following environment variables in the platform:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/<database>?schema=public
NEXTAUTH_SECRET=<at-least-32-random-characters>
NEXTAUTH_URL=https://your-public-origin.example.com
NODE_ENV=production
```

Notes:

- Use Node.js 22.12+ or 24. Node 20 is end-of-life; if you must use it, Prisma 7.10 requires 20.19 or newer.
- Use the platform's pooled connection string for serverless or autoscaling deployments. Keep a direct connection string for migrations if the provider distinguishes them.
- `NEXTAUTH_URL` must match the public origin exactly, including scheme and port. A mismatch causes cookie and callback problems.
- Run migrations as a release step, not on every request and not concurrently from multiple instances.
- Do not run `npm run db:seed` in production.

## Security Checklist

- [ ] `NEXTAUTH_SECRET` is random, at least 32 bytes, and stored in a secret manager.
- [ ] The database password is strong and not reused elsewhere.
- [ ] Demo accounts are removed or their passwords are changed.
- [ ] The first production `ADMIN` was created with `npm run db:create-admin`; the destructive demo seed was not run.
- [ ] TLS terminates at the proxy/platform and redirects HTTP to HTTPS.
- [ ] `NEXTAUTH_URL` uses the public HTTPS origin.
- [ ] Only the application port and proxy ports are exposed; PostgreSQL is private.
- [ ] The application runs as a non-root user in containers.
- [ ] Backups are automated, encrypted, off-host, and restore-tested.
- [ ] Database and application logs are shipped to a central location.
- [ ] `/api/health` is wired to the platform health check.
- [ ] A reverse-proxy Content-Security-Policy is added after testing assets and integrations.
- [ ] Dependency audit results are reviewed before each release; CI runs `npm audit --audit-level=high`.
- [ ] A retention policy exists for `AuditLog` and `LoginAttempt`.

## Reverse Proxy Example

Nginx should forward the original host, protocol, and client IP so audit records and rate limits see the real client:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

The example overwrites `X-Forwarded-For` with the address Nginx actually saw. Do not use `$proxy_add_x_forwarded_for` here: it preserves a client-supplied header and lets callers spoof the first address used by rate limiting and audit logs.

Only trust forwarded headers from a proxy you control. If you run a CDN in front of Nginx, configure the CDN's published ranges with Nginx `real_ip`/trusted proxies instead of accepting arbitrary client headers. If the app is exposed directly, do not trust client-supplied `X-Forwarded-For` values.

## Health Checks and Monitoring

`GET /api/health` returns:

- `200` with `{ "status": "ok", "database": "up", ... }` when the database responds.
- `503` with `{ "status": "error", "database": "down", ... }` when it does not.

Alert on:

- health check failures for more than two intervals,
- elevated login failures or rate-limit events,
- migration failures,
- database connection saturation,
- disk usage and backup failures.

The audit log records administrative writes with actor, entity, metadata, IP, and user agent. Ship it to your log pipeline if you need long-term retention.

## Scaling

- The app is stateless apart from PostgreSQL. Run multiple instances behind a load balancer.
- Use a pooled database connection string and size the pool for the number of instances.
- Rate limiting is stored in PostgreSQL, so it works across instances without sticky sessions.
- Session JWTs are signed with `NEXTAUTH_SECRET`; every instance must use the same secret.
- Apply migrations once before scaling up the new version.

## Troubleshooting

### The app starts but `/api/health` returns 503

Check `DATABASE_URL`, database reachability, credentials, and whether migrations have been applied. The endpoint intentionally returns a non-200 status so load balancers remove unhealthy instances.

### Login succeeds but protected pages redirect back to `/login`

- Confirm `NEXTAUTH_URL` matches the public origin.
- Confirm the proxy forwards `Host`, `X-Forwarded-Proto`, and `X-Forwarded-For`.
- Confirm the browser accepts cookies for the application hostname.
- Confirm the account is active (`User.isActive = true`).

### Login is blocked with a rate-limit message

The limit is 5 failed attempts per identifier and 50 per IP in 15 minutes. Wait for the window to expire or remove stale rows from `LoginAttempt` during an incident. Do not disable the limit.

### Prisma cannot find the query engine or OpenSSL

The Dockerfile installs OpenSSL and runs `prisma generate` before the build. If you use a custom image, install OpenSSL and regenerate the client in the same image that runs the app.

### A migration fails mid-deploy

Do not start new application instances. Inspect the database migration state with `npx prisma migrate status`, fix the cause, and either complete the migration or restore the pre-deploy backup. Schema changes should be backward-compatible long enough to allow a safe rollout.
