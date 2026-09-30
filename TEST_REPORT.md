# Verification report — corrected v1.1

## Passed

- Prisma schema validation: valid (Prisma 6.19.3).
- Prisma Client generation: successful.
- TypeScript validation: successful.
- Next.js production build: successful, with protected/admin/guest routes rendered dynamically.
- Four focused security tests: salted password hashing and legacy-password rejection; terminal request states; cross-site request rejection; malformed JSON handling.
- Fresh database: both included migrations applied successfully.
- Starter seed: successful; second run preserved an edited hotel name.
- Existing-schema migration: retained hotel/guest-session records and expired legacy guest sessions.
- 50 HTTP/database integration assertions against the production build: all passed.

## Integration coverage

Anonymous and authenticated admin access, invalid login, old cookie rejection, super-admin restriction, cross-site mutation protection, QR-created guest sessions, correct hotel/room data, cross-room and cross-hotel rejection, input validation, persisted request quantity, authorized status transitions, terminal-state protection, guest tracking, valid/invalid/duplicate feedback, staff audit attribution, menu creation, service edits, hotel/Wi-Fi settings, QR PNG generation and isolation, rendering of all eight admin sections, staff creation and permissions, QR deactivation, existing guest access revocation, logout, and rejection of a revoked session.

## Test environment and limits

- Node.js 24.19.0; Next.js 15.5.26; Prisma 6.19.3; Linux test runtime.
- Database tests used an isolated PGlite PostgreSQL WASM database through its PostgreSQL wire-protocol socket adapter. Test-only connection options disabled prepared-statement caching to accommodate the adapter. Those options and test database tools are not part of the application or its default configuration.
- Native PostgreSQL 16 through Docker Desktop, macOS execution, and public HTTPS hosting were not exercised here. Docker Compose and Mac instructions are included for local setup.
- Full browser interaction/visual testing was not completed because the browser binary download failed in this environment. Physical phone scanning and clipboard behavior should be checked locally.
- No external email, WhatsApp, push provider, payment system, or deployment was configured. Operational updates use dashboard polling.

The ZIP excludes installed dependencies, generated build files, actual environment secrets, test databases, and temporary test tools. It contains application source, pinned dependency lockfile, migrations, tests, and setup documentation.
