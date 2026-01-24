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

---

## Image Upload Feature

The backend supports image uploads for inventory items with the following capabilities:

### Endpoints

- **POST** `/api/v1/items/:id/image` - Upload an image for an item
- **DELETE** `/api/v1/items/:id/image` - Remove an item's image

### Upload Specifications

- **Accepted formats**: JPG, JPEG, PNG, WebP
- **Maximum file size**: 5MB
- **Storage location**: `backend/data/uploads/items/`
- **Naming convention**: `{timestamp}-{random}.{ext}`
- **Database field**: `imageUrl` (TEXT, nullable) in `items` table

### Usage Example

Upload an image using `multipart/form-data`:

```bash
curl -X POST http://localhost:3001/api/v1/items/{itemId}/image \
  -F "image=@/path/to/image.jpg"
```

Delete an image:

```bash
curl -X DELETE http://localhost:3001/api/v1/items/{itemId}/image
```

### Error Handling

The API returns appropriate errors for:
- **413 Payload Too Large**: File exceeds 5MB limit
- **400 Bad Request**: Invalid file type (not JPG/PNG/WebP)
- **404 Not Found**: Item does not exist
- **500 Internal Server Error**: File system or database errors

### File Management

- Images are automatically cleaned up when items are deleted
- Orphaned files are removed on upload failure
- The upload directory is created automatically on server startup
- Static file serving is configured at `/uploads` route

### Implementation Details

See [specs/002-item-ui-enhancements/quickstart.md](../specs/002-item-ui-enhancements/quickstart.md) for complete implementation guide including:
- Database migration for `imageUrl` column
- Multer middleware configuration
- File storage service with cleanup logic
- Controller and route implementations
