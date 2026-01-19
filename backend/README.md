# Backend - Infra Verification

This small script helps verify that the backend infra is healthy and configured correctly.

What it does:
- Runs database migrations
- Starts the backend server
- Polls `/health` until it responds
- Checks `/api/v1/` root and response envelope
- Verifies `PRAGMA foreign_keys` is enabled
- Tears down the server

Run locally from the `backend/` folder:

```powershell
# from repository root
cd backend
npm run verify
```

If you prefer Node directly:

```powershell
node scripts/verify-infra.js
```

The script exits with code `0` on success, or `2` on verification failure.

---

## Run instructions

Prerequisites:

- Node.js 18+ and npm installed
- From repository root, install backend deps:

```powershell
cd backend
npm install
```

Set environment variables by copying `.env.example` to `.env` and adjusting values if needed:

```powershell
Copy-Item .env.example .env
```

Run database migrations:

```powershell
npm run migrate
```

Start backend server (development):

```powershell
npm run dev
```

Start backend server (production):

```powershell
npm start
```

Verify infra (automated):

```powershell
npm run verify
```

Notes:

- Server listens on `PORT` (defaults to `3001`) and exposes `/health` and `/api/v1/` endpoints.
- The database file is at `data/inventory.db` by default (set `DB_PATH` in `.env` to change).
