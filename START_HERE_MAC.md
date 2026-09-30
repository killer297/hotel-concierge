# Start here — Mac

This is the corrected source project (v1.1). Start with a new, empty database unless you are following the existing-database instructions in README.md.

## 1. Install the prerequisites

Install Node.js 22 LTS (or a newer supported LTS) and Docker Desktop for Mac. Open Docker Desktop and wait for it to finish starting. Alternatively, use an existing PostgreSQL 16 database and put its connection URL in `.env`.

## 2. Extract and open the project

Double-click the ZIP in Finder. Open Terminal, type `cd ` (with a space), drag the extracted `digital-hotel-concierge` folder into Terminal, then press Enter.

## 3. Configure your account

```bash
cp .env.example .env
open -e .env
```

In TextEdit, set `ADMIN_EMAIL` to your email and `ADMIN_PASSWORD` to a password of at least 12 characters. Keep the quotes. Save the file. Keep the local database URL and `http://localhost:3000` for now.

There is no built-in `admin123` login. You choose the password yourself.

## 4. Install and start

Run these commands, one at a time:

```bash
npm ci
docker compose up -d --wait
npm run db:deploy
npm run db:seed
npm run dev
```

If you use your own PostgreSQL database, skip the Docker command. It must already exist and the configured user must be able to create tables.

## 5. Open the app

Open **http://localhost:3000/login**. Sign in with the email and password you set in `.env`.

1. Open **Hotel Info** and save your real hotel details and Wi-Fi information.
2. Open **Rooms & QR codes** and edit room numbers or add rooms.
3. Use **Open guest page** to try a room. Use **QR image** to open the printable PNG.
4. Submit a guest request. Open **Requests** in another tab to accept, start, and complete it.
5. Guest and staff screens refresh their request status every 10 seconds.

Keep Terminal running. Press Control+C when you want to stop the app. Next time, start Docker Desktop and run `npm run dev`; you do not need to seed again.

## Scan from your phone

A phone cannot reach your Mac using `localhost`. Put your Mac's local network address, for example `http://192.168.1.20:3000`, in `NEXT_PUBLIC_APP_URL`. Restart `npm run dev`, open that same address on your Mac and phone, and generate the QR again. Both devices must be on the same Wi-Fi network and your firewall must allow the connection.

For real guests, deploy the app at a stable HTTPS domain and set `NEXT_PUBLIC_APP_URL` to that domain before building. Local network addresses are for testing only.

## Common startup messages

- **Cannot reach database / P1001:** start Docker Desktop, run `docker compose up -d --wait`, and check `.env`.
- **Port 5432 already in use:** another PostgreSQL server may be running. Use it with a matching `DATABASE_URL`, or change the Docker host port and `.env` together.
- **ADMIN_PASSWORD error:** set a password of 12 or more characters in `.env`, save, and run the seed again.
- **Cross-site request rejected:** open the app at the exact origin configured in `NEXT_PUBLIC_APP_URL` and restart after changing it.
- **Guest access inactive:** scan an active room QR again. Guest sessions expire after 24 hours; disabling a room or QR revokes existing sessions.
