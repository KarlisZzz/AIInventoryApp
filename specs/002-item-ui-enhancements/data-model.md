# Data Model: Item Screen UI Enhancements

**Feature**: 002-item-ui-enhancements  
**Phase**: 1 - Design & Contracts  
**Date**: 2026-01-23

This document defines the updated Item entity schema to support image uploads.

---

## Entity: Item (Updated)

**Description**: Represents a physical item in the inventory system. Updated to include optional image URL for visual identification.

**Table Name**: `items`

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | TEXT | PRIMARY KEY, NOT NULL | Unique identifier (UUID or auto-generated) |
| `name` | TEXT | NOT NULL | Item display name (e.g., "Cordless Drill") |
| `description` | TEXT | NULLABLE | Optional detailed description |
| `category` | TEXT | NOT NULL | Category classification (e.g., "Power Tools", "Electronics") |
| `status` | TEXT | NOT NULL, CHECK(status IN ('Available', 'Lent', 'Maintenance')) | Current availability state |
| `imageUrl` | TEXT | **[NEW]** NULLABLE | Relative path or URL to uploaded image (e.g., "/uploads/items/item-1234567890-abc.jpg") |
| `createdAt` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of item creation (ISO 8601 format) |
| `updatedAt` | TEXT | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Timestamp of last update (updated via trigger or application code) |

### Relationships

| Relationship | Type | Related Entity | Foreign Key | Notes |
|--------------|------|----------------|-------------|-------|
| `lendingLogs` | One-to-Many | LendingLog | `LendingLog.itemId` → `Item.id` | Item can have multiple lending history records |

### Indexes

- **Primary Index**: `id` (implicit via PRIMARY KEY)
- **Performance Index**: `CREATE INDEX idx_items_status ON items(status);` (for filtering by availability)
- **Performance Index**: `CREATE INDEX idx_items_category ON items(category);` (for category filtering)

### Validation Rules

| Rule | Enforcement Level | Description |
|------|-------------------|-------------|
| `name` not empty | Application + Database | Backend validates `name.trim().length > 0` before insert/update |
| `category` in allowed list | Application | Backend validates against predefined category list (extensible) |
| `status` enum constraint | Database (CHECK) | SQLite enforces valid status values |
| `imageUrl` format validation | Application | Backend validates URL format if not null (e.g., `/^\/uploads\/items\/[a-zA-Z0-9-_.]+$/`) |
| `imageUrl` file existence | Application | Backend verifies file exists on disk before saving URL (orphan prevention) |

### State Transitions

**Status Field**:
- `Available` → `Lent`: When item is lent to a user (creates LendingLog record)
- `Lent` → `Available`: When item is returned (updates LendingLog.returnedAt)
- `Available` ↔ `Maintenance`: Manual status change by admin
- `Lent` → `Maintenance`: Not allowed (must return item first)

**ImageUrl Field**:
- `NULL` → `"/uploads/items/..."`: When user uploads image (POST /api/v1/items/:id/image)
- `"/uploads/items/..."` → `"/uploads/items/..."`: When user replaces image (old file deleted)
- `"/uploads/items/..."` → `NULL`: When user removes image (DELETE /api/v1/items/:id/image, file deleted)

### Example Data

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Cordless Drill",
  "description": "18V cordless drill with two batteries and charger",
  "category": "Power Tools",
  "status": "Available",
  "imageUrl": "/uploads/items/item-1706019234567-abc123def.jpg",
  "createdAt": "2026-01-15T10:30:00.000Z",
  "updatedAt": "2026-01-23T14:45:22.000Z"
}
```

```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Laptop - Dell XPS 15",
  "description": null,
  "category": "Electronics",
  "status": "Lent",
  "imageUrl": null,
  "createdAt": "2026-01-20T08:00:00.000Z",
  "updatedAt": "2026-01-22T16:20:00.000Z"
}
```

---

## Migration: Add ImageURL Field

**Migration File**: `backend/src/db/migrations/003_add_item_image_url.js`

### Up Migration (Apply Changes)

```javascript
module.exports = {
  up: async (db) => {
    // Add imageUrl column to items table
    await db.exec(`
      ALTER TABLE items 
      ADD COLUMN imageUrl TEXT;
    `);
    
    console.log('[Migration 003] Added imageUrl column to items table');
  },

  down: async (db) => {
    // SQLite does not support DROP COLUMN directly
    // Must recreate table without imageUrl column
    await db.exec(`
      BEGIN TRANSACTION;
      
      -- Create backup table without imageUrl
      CREATE TABLE items_backup (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        category TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('Available', 'Lent', 'Maintenance')),
        createdAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      
      -- Copy data (excluding imageUrl)
      INSERT INTO items_backup (id, name, description, category, status, createdAt, updatedAt)
      SELECT id, name, description, category, status, createdAt, updatedAt FROM items;
      
      -- Drop original table
      DROP TABLE items;
      
      -- Rename backup to original
      ALTER TABLE items_backup RENAME TO items;
      
      -- Recreate indexes
      CREATE INDEX idx_items_status ON items(status);
      CREATE INDEX idx_items_category ON items(category);
      
      COMMIT;
    `);
    
    console.log('[Migration 003] Removed imageUrl column from items table (rollback)');
  }
};
```

### Migration Execution

**Run Migration**:
```bash
# Assuming migration runner exists in codebase
node backend/src/db/migrate.js up
```

**Verify Migration**:
```bash
sqlite3 backend/data/inventory.db ".schema items"
# Should show imageUrl TEXT column
```

**Rollback Migration** (if needed):
```bash
node backend/src/db/migrate.js down
```

### Migration Safety Checks

- ✅ **Backward Compatibility**: Nullable column allows existing items to remain valid
- ✅ **No Data Loss**: Rollback migration preserves all existing data (imageUrl values discarded)
- ✅ **Idempotency**: Re-running migration does not cause errors (use `IF NOT EXISTS` checks in production)
- ✅ **Transaction Safety**: Rollback uses explicit transaction for atomicity

---

## File Storage Structure

**Base Directory**: `backend/data/uploads/items/`

### Filename Convention

**Pattern**: `item-{timestamp}-{randomSuffix}.{ext}`

**Example**: `item-1706019234567-a1b2c3d4.jpg`

**Components**:
- `item-`: Prefix for easy identification
- `{timestamp}`: Unix timestamp (milliseconds) for uniqueness and sorting
- `{randomSuffix}`: Random string (8-12 chars) to prevent collisions
- `.{ext}`: Original file extension (jpg, png, webp)

### Directory Layout

```text
backend/data/uploads/items/
├── item-1706019234567-a1b2c3d4.jpg  (Cordless Drill image)
├── item-1706020123456-x9y8z7w6.png  (Hammer image)
├── item-1706021000000-m3n2b1v0.webp (Laptop image - compressed)
└── .gitkeep                          (Empty file to preserve directory in Git)
```

### Storage Metadata

| Property | Value | Notes |
|----------|-------|-------|
| **Max File Size** | 5 MB | Enforced by Multer middleware (FR-003) |
| **Allowed MIME Types** | `image/jpeg`, `image/png`, `image/webp` | Enforced by fileFilter (FR-002) |
| **Served Via** | Express static middleware | `app.use('/uploads', express.static('data/uploads'))` |
| **Access Control** | Public (no authentication) | Images are public URLs for now (future: signed URLs) |

### Orphan File Management

**Orphan Definition**: Image file exists on disk but no Item record references it (occurs on failed uploads or delete operations).

**Cleanup Strategy**:
1. **Immediate Cleanup**: Delete old image when replaced (in `uploadImage` service method)
2. **Scheduled Cleanup**: Daily cron job scans `/uploads/items/` directory and removes files not referenced in `items.imageUrl` (future enhancement)

**Example Cleanup Logic**:
```javascript
// Scheduled cleanup (pseudo-code)
const fs = require('fs').promises;
const path = require('path');

async function cleanOrphanImages() {
  const uploadsDir = path.join(__dirname, '../data/uploads/items');
  const files = await fs.readdir(uploadsDir);
  
  // Get all imageUrl values from database
  const usedImages = await db.all('SELECT imageUrl FROM items WHERE imageUrl IS NOT NULL');
  const usedFilenames = usedImages.map(row => path.basename(row.imageUrl));
  
  // Delete files not in database
  for (const file of files) {
    if (file === '.gitkeep') continue;
    if (!usedFilenames.includes(file)) {
      await fs.unlink(path.join(uploadsDir, file));
      console.log(`Deleted orphan image: ${file}`);
    }
  }
}
```

---

## Frontend Type Definition

**File**: `frontend/src/types/item.ts` (or inline in itemService.ts)

### TypeScript Interface

```typescript
/**
 * Item entity with image support
 */
export interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: 'Available' | 'Lent' | 'Maintenance';
  imageUrl: string | null; // [NEW] Relative path to image or null for placeholder
  createdAt: string; // ISO 8601 timestamp
  updatedAt: string; // ISO 8601 timestamp
}

/**
 * Data for creating a new item (excludes auto-generated fields)
 */
export interface CreateItemData {
  name: string;
  description?: string;
  category: string;
  status: 'Available' | 'Lent' | 'Maintenance';
  imageUrl?: string; // Optional: set after image upload
}

/**
 * Data for updating an existing item (all fields optional except id)
 */
export interface UpdateItemData {
  id: string;
  name?: string;
  description?: string | null;
  category?: string;
  status?: 'Available' | 'Lent' | 'Maintenance';
  imageUrl?: string | null; // Can be set to null to remove image
}
```

### Type Guards (Optional but Recommended)

```typescript
/**
 * Type guard to check if item has an image
 */
export function hasImage(item: Item): item is Item & { imageUrl: string } {
  return item.imageUrl !== null && item.imageUrl !== undefined && item.imageUrl.trim() !== '';
}

// Usage
if (hasImage(item)) {
  console.log(item.imageUrl); // TypeScript knows imageUrl is string, not null
}
```

---

## Summary

### Changes to Existing Schema

| Entity | Field | Change Type | Nullable | Default | Notes |
|--------|-------|-------------|----------|---------|-------|
| **Item** | `imageUrl` | ADD | YES | `NULL` | Stores relative path to uploaded image |

### Impact Analysis

- ✅ **Backward Compatible**: Existing items without images remain valid (imageUrl=NULL)
- ✅ **No Breaking Changes**: API responses include imageUrl field (defaults to null for old items)
- ✅ **Frontend Tolerant**: Frontend checks `if (item.imageUrl)` before displaying image
- ✅ **Database Size**: Minimal impact (TEXT column adds ~8 bytes per row, actual images stored on disk)

### Next Steps

1. ✅ Data model defined (this document)
2. 🔄 Generate API contracts for image endpoints (contracts/ folder)
3. 🔄 Create quickstart implementation guide (quickstart.md)
4. 🔄 Update agent context with new technology patterns
