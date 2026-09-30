# Changes in v1.1

- Fixed Prisma block/enum formatting and added versioned migrations.
- Added expiring, revocable admin/guest sessions and salted password hashes.
- Protected admin routes, super-admin, and APIs; removed hardcoded hotel selection.
- Implemented guest room QR validation and deactivation; replaced demo room content with database-backed data.
- Connected guest submission and status tracking, with genuine success/error messages.
- Enforced hotel/session ownership, input limits, request transitions, and change attribution.
- Added create/edit controls for rooms, services, menus, staff, and hotel information.
- Connected dining menu, Wi-Fi copy, reception call link, and completed-request feedback.
- Added 10-second polling for operational and guest screens.
- Replaced destructive seeding with non-destructive setup and user-chosen admin credentials.
- Fixed missing ArrowRight icon export, invalid mobile CSS media rule, request-status class, and Decimal rendering.
- Pinned installed dependency versions, added package lock, and replaced the obsolete lint command with a TypeScript check.
- Added Mac startup guide, upgrade instructions, and test coverage.
