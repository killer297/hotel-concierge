# Digital Hotel Concierge — corrected v1.1

Next.js / React / TypeScript application with PostgreSQL and Prisma. This package repairs the supplied prototype's schema, authentication, guest integration, room QR flow, and admin editing screens.

**Mac users: read START_HERE_MAC.md first.**

## Fresh installation

Requirements: Node.js 22 LTS or newer supported LTS; PostgreSQL 16 (or Docker Desktop). The package lock is included for repeatable installation.

```bash
cp .env.example .env
# Edit .env: choose ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters).
npm ci
docker compose up -d --wait
npm run db:deploy
npm run db:seed
npm run dev
```

Open http://localhost:3000/login. Use the credentials you chose in `.env`. Configure real hotel information, room numbers, Wi-Fi, services, prices, and staff through the dashboard.

`npm ci` generates Prisma Client. `npm run db:deploy` applies the two included migrations without resetting the database. Seed creates missing starter records, preserves existing operational data, and upgrades the selected legacy admin's plaintext password to a new hash. It does not reset an already hashed password. Remove `ADMIN_PASSWORD` from your deployment environment after setup if it is no longer needed.

The guest entry point is `/q/{roomQrToken}`. Admin → Rooms provides valid room links and printable QR images. The old fake `/h/demo/r/104` route is not a valid guest session.

## Working behavior

- Guest screens load the real hotel, room, active services, dining menu, Wi-Fi, and information.
- Requests are written to the database before success is shown; quantity and notes are retained.
- Both guest request status and admin pages refresh every 10 seconds while visible.
- Valid lifecycle: NEW → ACCEPTED → IN_PROGRESS → COMPLETED, with cancellation allowed before completion.
- Guests can rate their own completed requests once (1–5 stars).
- Rooms, QR availability, services, menu items, staff, and hotel information have working create/edit controls.
- Staff can process requests; managers can edit hotel resources; only hotel admins can manage staff. The platform overview is restricted to SUPER_ADMIN users. No super-admin account is created by default.
- Authentication uses salted scrypt hashes and opaque database-backed sessions. Logout revokes the session. Old user-ID cookies are ignored.
- Admin sessions expire after 8 hours; guest sessions after 24 hours. QR/room deactivation immediately blocks access and expires existing room sessions.
- Requests and management operations are scoped to the authenticated hotel or guest session, with input validation and origin checks.
- Login attempts are limited per email; guest request creation is limited per room.

Dining is a menu display with room-service/reception ordering. This package does not implement a shopping cart, payments, WhatsApp/email/push notifications, subscription billing, automated deployment, or offline PWA support. Staff discover new requests through the automatically refreshing dashboard. It is not a claim that every possible feature from an unseen PRD has been implemented.

## Existing database upgrade

Back up your database before applying schema changes. Do not use `migrate reset` or delete the Docker volume.

If your database already has a migration history, retain that history and reconcile it with this package before deployment. Do not blindly apply the initial migration to existing tables.

For an existing database that exactly matches the original ZIP's schema and has **no migration history**, baseline those existing tables, then apply the session migration:

```bash
npx prisma migrate resolve --applied 202609280001_initial
npm run db:deploy
npm run db:seed
```

Set `ADMIN_EMAIL` to the original hotel admin's email and `ADMIN_PASSWORD` to a new password before seeding. Existing guest sessions are expired during migration. The selected legacy admin password is upgraded. Reset other legacy users' passwords in the Staff screen; plaintext passwords are deliberately not accepted by the new login route. Known original demo QR tokens are randomized by seed, so reprint those QR codes.

Do not baseline a differently structured database without reviewing its schema first.

## Production build

Set `DATABASE_URL` to a private production PostgreSQL database and `NEXT_PUBLIC_APP_URL` to the application's exact public HTTPS origin. Install dependencies, apply migrations, and initialize the first admin only if needed.

```bash
npm ci
npm run db:deploy
npm run build
npm start
```

Run behind HTTPS. Production cookies are Secure. Docker Compose in this package runs the database only, with a development password and localhost-only port binding; it is not a production deployment configuration. The server needs database access at runtime. Keep `.env`, generated build files, and database backups out of source control. Expired auth/guest/throttle rows can be pruned as an operational maintenance task, preserving request history.

## Checks

```bash
npx prisma validate
npm run typecheck
npm test
npm run build
```

`tests/integration.ts` exercises database-backed HTTP flows. Run it only with a disposable, migrated PostgreSQL database and an app process connected to that same database:

```bash
ALLOW_TEST_DATABASE=true TEST_BASE_URL=http://localhost:3000 npm run test:integration
```

It creates two temporary hotels, tests access isolation and the request lifecycle, and removes those test hotels. Never point it at a live hotel database. See TEST_REPORT.md for the checks actually performed on this package.

## Project structure

- `app/h/...` and `components/GuestApp.tsx`: room guest experience.
- `app/admin`: hotel operations and editors.
- `app/api`: authentication, management, requests, feedback, guest data, and QR APIs.
- `lib`: authentication, password hashing, validation/error handling, database, and lifecycle rules.
- `prisma`: schema, safe starter seed, and versioned migrations.
- `tests`: focused security checks and disposable-database integration checks.
