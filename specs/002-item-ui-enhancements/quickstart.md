# Quickstart: Item Screen UI Enhancements

**Feature**: 002-item-ui-enhancements  
**Branch**: `002-item-ui-enhancements`  
**Date**: 2026-01-23

This guide provides step-by-step instructions for implementing the Item Screen UI enhancements.

---

## Overview

This feature adds four user stories in priority order:

1. **P1: Add Images to Items** - Backend + frontend image upload/display
2. **P2: Grid/List View Toggle** - Frontend view mode switching with persistence
3. **P3: Three-Dots Menu** - UI refactor for cleaner action menus
4. **P4: Click-to-Edit** - Card-level click handler for faster editing

**Estimated Effort**: 3-4 days (1 developer)

---

## Implementation Order

### Phase 1: Backend - Image Upload API (Day 1)

#### 1.1 Database Migration

**File**: `backend/src/db/migrations/003_add_item_image_url.js`

```javascript
module.exports = {
  up: async (db) => {
    await db.exec(`
      ALTER TABLE items 
      ADD COLUMN imageUrl TEXT;
    `);
    console.log('[Migration 003] Added imageUrl column to items table');
  },

  down: async (db) => {
    // SQLite DROP COLUMN workaround: recreate table
    await db.exec(`
      BEGIN TRANSACTION;
      CREATE TABLE items_backup AS 
        SELECT id, name, description, category, status, createdAt, updatedAt FROM items;
      DROP TABLE items;
      ALTER TABLE items_backup RENAME TO items;
      CREATE INDEX idx_items_status ON items(status);
      CREATE INDEX idx_items_category ON items(category);
      COMMIT;
    `);
    console.log('[Migration 003] Removed imageUrl column (rollback)');
  }
};
```

**Run Migration**:
```bash
cd backend
node src/db/migrate.js up
# Verify: sqlite3 data/inventory.db ".schema items"
```

---

#### 1.2 File Storage Service

**File**: `backend/src/services/fileStorageService.js` (NEW)

```javascript
const fs = require('fs').promises;
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '../../data/uploads/items');

/**
 * Ensure upload directory exists
 */
async function ensureUploadDir() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

/**
 * Save uploaded file (already handled by multer)
 * Returns relative URL path
 */
function getImageUrl(filename) {
  return `/uploads/items/${filename}`;
}

/**
 * Delete image file from disk
 */
async function deleteImageFile(imageUrl) {
  if (!imageUrl) return;
  
  try {
    const filename = path.basename(imageUrl);
    const filePath = path.join(UPLOAD_DIR, filename);
    await fs.unlink(filePath);
    console.log(`Deleted image file: ${filename}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Image file not found (already deleted): ${imageUrl}`);
    } else {
      console.error(`Failed to delete image file ${imageUrl}:`, error);
      throw error;
    }
  }
}

module.exports = {
  ensureUploadDir,
  getImageUrl,
  deleteImageFile,
  UPLOAD_DIR
};
```

---

#### 1.3 Multer Middleware Configuration

**File**: `backend/src/middleware/upload.js` (NEW)

```javascript
const multer = require('multer');
const path = require('path');
const { UPLOAD_DIR } = require('../services/fileStorageService');

// Configure disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `item-${uniqueSuffix}${ext}`);
  }
});

// File filter for image types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and WebP images are allowed'));
  }
};

// Create multer instance
const upload = multer({
  storage: storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  },
  fileFilter: fileFilter
});

module.exports = upload;
```

---

#### 1.4 Item Service - Image Methods

**File**: `backend/src/services/itemService.js` (MODIFY)

Add these methods to existing itemService:

```javascript
const { getImageUrl, deleteImageFile } = require('./fileStorageService');

/**
 * Upload image for an existing item
 * @param {string} itemId - Item ID
 * @param {Express.Multer.File} file - Uploaded file from multer
 * @returns {Promise<Item>} Updated item with imageUrl
 */
async function uploadItemImage(itemId, file) {
  const db = await getDatabase(); // Assuming this function exists
  
  // Check if item exists and get current imageUrl
  const item = await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
  if (!item) {
    // Delete uploaded file (orphan cleanup)
    await deleteImageFile(getImageUrl(file.filename));
    throw new Error('Item not found');
  }
  
  // Delete old image if exists
  if (item.imageUrl) {
    await deleteImageFile(item.imageUrl);
  }
  
  // Update database with new imageUrl
  const newImageUrl = getImageUrl(file.filename);
  await db.run(
    'UPDATE items SET imageUrl = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [newImageUrl, itemId]
  );
  
  // Return updated item
  return await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
}

/**
 * Delete image from an item
 * @param {string} itemId - Item ID
 * @returns {Promise<Item>} Updated item with imageUrl = null
 */
async function deleteItemImage(itemId) {
  const db = await getDatabase();
  
  // Check if item exists and has an image
  const item = await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
  if (!item) {
    throw new Error('Item not found');
  }
  if (!item.imageUrl) {
    throw new Error('Item does not have an image');
  }
  
  // Delete file from disk
  await deleteImageFile(item.imageUrl);
  
  // Update database
  await db.run(
    'UPDATE items SET imageUrl = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [itemId]
  );
  
  // Return updated item
  return await db.get('SELECT * FROM items WHERE id = ?', [itemId]);
}

module.exports = {
  // ...existing exports
  uploadItemImage,
  deleteItemImage
};
```

---

#### 1.5 Item Controller - Image Endpoints

**File**: `backend/src/controllers/itemController.js` (MODIFY)

Add these controller methods:

```javascript
const { uploadItemImage, deleteItemImage } = require('../services/itemService');

/**
 * POST /api/v1/items/:id/image
 * Upload image for an item
 */
async function uploadImage(req, res, next) {
  try {
    // Multer has already processed the file (req.file)
    if (!req.file) {
      return res.status(400).json({
        data: null,
        error: {
          code: 'MISSING_FILE',
          message: 'No image file provided'
        },
        message: 'Image upload failed'
      });
    }
    
    const updatedItem = await uploadItemImage(req.params.id, req.file);
    
    res.status(201).json({
      data: updatedItem,
      error: null,
      message: 'Image uploaded successfully'
    });
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({
        data: null,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Item with ID ${req.params.id} not found`
        },
        message: 'Image upload failed'
      });
    }
    next(error);
  }
}

/**
 * DELETE /api/v1/items/:id/image
 * Delete image from an item
 */
async function deleteImage(req, res, next) {
  try {
    const updatedItem = await deleteItemImage(req.params.id);
    
    res.status(200).json({
      data: updatedItem,
      error: null,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Item not found') {
      return res.status(404).json({
        data: null,
        error: {
          code: 'ITEM_NOT_FOUND',
          message: `Item with ID ${req.params.id} not found`
        },
        message: 'Image deletion failed'
      });
    }
    if (error.message === 'Item does not have an image') {
      return res.status(404).json({
        data: null,
        error: {
          code: 'NO_IMAGE_FOUND',
          message: 'Item does not have an image to delete'
        },
        message: 'Image deletion failed'
      });
    }
    next(error);
  }
}

module.exports = {
  // ...existing exports
  uploadImage,
  deleteImage
};
```

---

#### 1.6 Routes Configuration

**File**: `backend/src/routes/itemRoutes.js` (MODIFY)

```javascript
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemController');
const upload = require('../middleware/upload');

// ...existing routes

// Image upload/delete routes
router.post('/:id/image', upload.single('image'), itemController.uploadImage);
router.delete('/:id/image', itemController.deleteImage);

module.exports = router;
```

---

#### 1.7 Serve Static Files

**File**: `backend/src/app.js` (MODIFY)

Add this line to serve uploaded images:

```javascript
const express = require('express');
const app = express();
const path = require('path');

// ...existing middleware

// Serve static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../data/uploads')));

// ...existing routes
```

---

#### 1.8 Error Handling for Multer

**File**: `backend/src/middleware/errorHandler.js` (MODIFY)

Add multer-specific error handling:

```javascript
function errorHandler(err, req, res, next) {
  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      data: null,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Image size exceeds 5MB limit'
      },
      message: 'Image upload failed'
    });
  }
  
  // Multer file type error
  if (err.message === 'Only JPG, PNG, and WebP images are allowed') {
    return res.status(400).json({
      data: null,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: err.message
      },
      message: 'Image upload failed'
    });
  }
  
  // ...existing error handling
}
```

---

#### 1.9 Initialize Upload Directory on Startup

**File**: `backend/src/app.js` or `backend/src/server.js` (MODIFY)

```javascript
const { ensureUploadDir } = require('./services/fileStorageService');

// Create upload directory on startup
(async () => {
  await ensureUploadDir();
  console.log('Upload directory initialized');
})();

// ...start server
```

---

#### 1.10 Test Backend API

```bash
# Test image upload
curl -X POST http://localhost:3000/api/v1/items/<ITEM_ID>/image \
  -F "image=@test-image.jpg"

# Expected: 201 Created with imageUrl in response

# Test image delete
curl -X DELETE http://localhost:3000/api/v1/items/<ITEM_ID>/image

# Expected: 200 OK with imageUrl = null
```

---

### Phase 2: Frontend - Image Display & Upload (Day 2)

#### 2.1 Update Item Type Definition

**File**: `frontend/src/services/itemService.ts` (MODIFY)

```typescript
export interface Item {
  id: string;
  name: string;
  description: string | null;
  category: string;
  status: 'Available' | 'Lent' | 'Maintenance';
  imageUrl: string | null; // [NEW] Add this field
  createdAt: string;
  updatedAt: string;
}
```

---

#### 2.2 Image Upload Service Methods

**File**: `frontend/src/services/itemService.ts` (MODIFY)

Add these API functions:

```typescript
/**
 * Upload image for an item
 */
export async function uploadItemImage(itemId: string, file: File): Promise<Item> {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch(`/api/v1/items/${itemId}/image`, {
    method: 'POST',
    body: formData,
    // Do NOT set Content-Type header - browser sets it with boundary
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Image upload failed');
  }
  
  const result = await response.json();
  return result.data;
}

/**
 * Delete image from an item
 */
export async function deleteItemImage(itemId: string): Promise<Item> {
  const response = await fetch(`/api/v1/items/${itemId}/image`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Image deletion failed');
  }
  
  const result = await response.json();
  return result.data;
}
```

---

#### 2.3 Image Upload Component

**File**: `frontend/src/components/ImageUpload.tsx` (NEW)

```typescript
import { useState } from 'react';

interface ImageUploadProps {
  currentImageUrl: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
}

export default function ImageUpload({ currentImageUrl, onImageSelect, onImageRemove }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPG, PNG, and WebP images are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setError(null);
    
    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    onImageRemove();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-300">
        Item Image (Optional)
      </label>

      {preview ? (
        <div className="space-y-2">
          <div className="w-48 h-48 bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <label className="px-3 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg
                             hover:bg-blue-500/30 cursor-pointer transition-colors">
              Replace Image
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3 py-2 text-sm bg-red-500/20 text-red-400 rounded-lg
                         hover:bg-red-500/30 transition-colors"
            >
              Remove Image
            </button>
          </div>
        </div>
      ) : (
        <label className="block w-48 h-48 bg-slate-900 border-2 border-dashed border-slate-700
                          rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
          <div className="h-full flex flex-col items-center justify-center text-slate-500">
            <svg className="h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm">Click to upload</span>
            <span className="text-xs mt-1">JPG, PNG, WebP (max 5MB)</span>
          </div>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>
      )}

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
```

---

#### 2.4 Update ItemForm with Image Upload

**File**: `frontend/src/components/ItemForm.tsx` (MODIFY)

```typescript
import { useState } from 'react';
import ImageUpload from './ImageUpload';
import { uploadItemImage, deleteItemImage } from '../services/itemService';

export default function ItemForm({ item, onClose, onSave }: ItemFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  // ...existing state

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setRemoveImage(false);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save item data first
      let savedItem;
      if (item) {
        savedItem = await updateItem(item.id, formData);
      } else {
        savedItem = await createItem(formData);
      }

      // 2. Handle image upload/delete
      if (imageFile) {
        savedItem = await uploadItemImage(savedItem.id, imageFile);
      } else if (removeImage && savedItem.imageUrl) {
        savedItem = await deleteItemImage(savedItem.id);
      }

      onSave(savedItem);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* ...existing form fields */}

      <ImageUpload
        currentImageUrl={item?.imageUrl || null}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
      />

      {/* ...submit buttons */}
    </form>
  );
}
```

---

#### 2.5 Display Images in ItemCard

**File**: `frontend/src/components/ItemCard.tsx` (MODIFY)

```typescript
export default function ItemCard({ item, onEdit, onDelete, onLend, onReturn, onViewHistory }: ItemCardProps) {
  // ...existing state

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden
                    hover:border-slate-600 transition-colors">
      {/* Image Section (NEW) */}
      <div className="aspect-square w-full bg-slate-900">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback to placeholder on error
              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%230F172A" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="sans-serif" font-size="14" fill="%2364748B" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Content Section (MODIFY - add padding) */}
      <div className="p-4">
        {/* Header: Name and Status */}
        <div className="flex items-start justify-between mb-2">
          {/* ...existing content */}
        </div>

        {/* ...rest of card */}
      </div>
    </div>
  );
}
```

---

### Phase 3: Frontend - View Toggle (Day 2-3)

#### 3.1 useLocalStorage Hook

**File**: `frontend/src/hooks/useLocalStorage.ts` (NEW)

```typescript
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error loading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error saving localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}
```

---

#### 3.2 ViewToggle Component

**File**: `frontend/src/components/ViewToggle.tsx` (NEW)

```typescript
interface ViewToggleProps {
  viewMode: 'grid' | 'list';
  onChange: (mode: 'grid' | 'list') => void;
}

export default function ViewToggle({ viewMode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-2 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
      <button
        onClick={() => onChange('grid')}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-slate-400 hover:text-slate-200'}`}
        aria-label="Grid view"
        aria-pressed={viewMode === 'grid'}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      </button>
      
      <button
        onClick={() => onChange('list')}
        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'text-slate-400 hover:text-slate-200'}`}
        aria-label="List view"
        aria-pressed={viewMode === 'list'}
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      </button>
    </div>
  );
}
```

---

#### 3.3 Update ItemList for Grid/List Rendering

**File**: `frontend/src/components/ItemList.tsx` (MODIFY)

```typescript
interface ItemListProps {
  items: Item[];
  viewMode: 'grid' | 'list'; // [NEW] Add this prop
  onEdit: (item: Item) => void;
  onDelete: (itemId: string) => Promise<void>;
  onLend?: (item: Item) => void;
  onReturn?: (item: Item) => void;
  onViewHistory?: (item: Item) => void;
  isLoading?: boolean;
}

export default function ItemList({ 
  items, 
  viewMode, // [NEW]
  onEdit, 
  onDelete, 
  onLend, 
  onReturn, 
  onViewHistory, 
  isLoading = false 
}: ItemListProps) {
  // ...existing sort logic

  if (isLoading) return <LoadingSpinner size="lg" text="Loading items..." />;
  if (items.length === 0) return <EmptyState title="No items found" />;

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ...existing sort buttons */}
      </div>

      {/* Items Count */}
      <p className="text-sm text-slate-400">
        Showing {sortedItems.length} item{sortedItems.length !== 1 ? 's' : ''}
      </p>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onEdit={onEdit}
              onDelete={onDelete}
              onLend={onLend}
              onReturn={onReturn}
              onViewHistory={onViewHistory}
            />
          ))}
        </div>
      )}

      {/* List View (Table) */}
      {viewMode === 'list' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900 border-b border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedItems.map((item) => (
                <tr 
                  key={item.id} 
                  className="hover:bg-slate-700/50 cursor-pointer"
                  onClick={() => onEdit(item)}
                >
                  <td className="px-4 py-3">
                    <div className="h-12 w-12 rounded overflow-hidden bg-slate-900">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-slate-600">
                          <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-200">{item.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{item.category}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[item.status]}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    {/* Three-dots menu will go here (Phase 4) */}
                    <button className="text-slate-400 hover:text-slate-200">⋮</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

---

#### 3.4 Integrate ViewToggle in InventoryPage

**File**: `frontend/src/pages/InventoryPage.tsx` (MODIFY)

```typescript
import { useLocalStorage } from '../hooks/useLocalStorage';
import ViewToggle from '../components/ViewToggle';

export default function InventoryPage() {
  const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('inventory-view-mode', 'grid');
  // ...existing state

  return (
    <div>
      {/* Header with Search and View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onFilterChange={(status, category) => {
            setStatusFilter(status);
            setCategoryFilter(category);
          }}
        />
        
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
      </div>

      {/* Items List with View Mode */}
      <ItemList
        items={filteredItems}
        viewMode={viewMode}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onLend={handleLend}
        onReturn={handleReturn}
        onViewHistory={handleViewHistory}
        isLoading={isLoading}
      />
    </div>
  );
}
```

---

### Phase 4: Frontend - Three-Dots Menu & Click-to-Edit (Day 3-4)

#### 4.1 DropdownMenu Component

**File**: `frontend/src/components/DropdownMenu.tsx` (NEW)

```typescript
import { useState, useRef, useEffect } from 'react';

interface MenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: 'default' | 'danger';
}

interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: MenuItem[];
  align?: 'left' | 'right';
}

export default function DropdownMenu({ trigger, items, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onClick();
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 
                         bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50`}>
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              title={item.tooltip}
              className={`w-full px-4 py-2 text-left text-sm transition-colors
                          ${item.variant === 'danger' ? 'text-red-400 hover:bg-red-500/20' : 'text-slate-200 hover:bg-slate-700'}
                          ${item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                          ${index === 0 ? 'rounded-t-lg' : ''} 
                          ${index === items.length - 1 ? 'rounded-b-lg' : 'border-b border-slate-700'}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

#### 4.2 Update ItemCard with Three-Dots & Click-to-Edit

**File**: `frontend/src/components/ItemCard.tsx` (MODIFY)

```typescript
import { useState } from 'react';
import DropdownMenu from './DropdownMenu';

export default function ItemCard({ item, onEdit, onDelete, onLend, onReturn, onViewHistory }: ItemCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    if (!menuOpen) {
      onEdit(item); // Click-to-edit (FR-028)
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      setIsDeleting(false);
    }
  };

  const menuItems = [
    {
      label: 'Edit',
      onClick: () => onEdit(item),
    },
    {
      label: item.status === 'Lent' ? 'Return' : 'Lend',
      onClick: () => item.status === 'Lent' ? onReturn?.(item) : onLend?.(item),
      disabled: !onLend && !onReturn,
    },
    {
      label: 'View History',
      onClick: () => onViewHistory?.(item),
      disabled: !onViewHistory,
    },
    {
      label: 'Delete',
      onClick: () => setShowDeleteConfirm(true),
      disabled: item.status === 'Lent',
      tooltip: item.status === 'Lent' ? 'Cannot delete lent items' : undefined,
      variant: 'danger' as const,
    },
  ];

  const statusColors = {
    Available: 'bg-green-500/20 text-green-400 border-green-500/30',
    Lent: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Maintenance: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <>
      <div 
        onClick={handleCardClick}
        className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg overflow-hidden
                   hover:border-slate-600 hover:ring-2 hover:ring-blue-500/50 transition-all cursor-pointer"
      >
        {/* Image Section */}
        <div className="aspect-square w-full bg-slate-900 relative">
          {item.imageUrl ? (
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect fill="%230F172A" width="100" height="100"/%3E%3Ctext x="50" y="50" font-family="sans-serif" font-size="14" fill="%2364748B" text-anchor="middle" dominant-baseline="middle"%3ENo Image%3C/text%3E%3C/svg%3E';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
            </div>
          )}

          {/* Three-Dots Menu (Top-Right) */}
          <div className="absolute top-2 right-2">
            <DropdownMenu
              trigger={
                <div className="bg-slate-900/80 backdrop-blur-sm rounded-full p-1 hover:bg-slate-800 transition-colors">
                  <svg className="h-5 w-5 text-slate-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </div>
              }
              items={menuItems}
            />
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-lg font-semibold text-slate-200 flex-1 mr-2">
              {item.name}
            </h3>
            <span className={`px-2 py-1 text-xs font-medium rounded border ${statusColors[item.status]}`}>
              {item.status}
            </span>
          </div>

          {item.description && (
            <p className="text-sm text-slate-400 mb-3 line-clamp-2">
              {item.description}
            </p>
          )}

          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            <span className="text-sm text-slate-400">{item.category}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-200 mb-2">Delete Item?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Are you sure you want to delete "{item.name}"? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-slate-700 text-slate-200 rounded-lg
                           hover:bg-slate-600 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-red-500 text-white rounded-lg
                           hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
```

---

## Testing Checklist

### Backend Tests

- [ ] Image upload endpoint returns 201 with imageUrl
- [ ] Image upload validates file type (reject PDF, TXT, etc.)
- [ ] Image upload validates file size (reject >5MB)
- [ ] Image upload replaces old image (old file deleted)
- [ ] Image delete endpoint returns 200 with imageUrl=null
- [ ] Image delete removes file from disk
- [ ] Image delete on item without image returns 404
- [ ] Orphan cleanup: Failed upload/update deletes uploaded file

### Frontend Tests

- [ ] Image upload in ItemForm shows preview
- [ ] Image upload in ItemForm validates file type/size client-side
- [ ] ItemCard displays image with correct aspect ratio
- [ ] ItemCard shows placeholder for items without images
- [ ] ItemCard image fails gracefully (onError fallback)
- [ ] ViewToggle switches between grid and list views
- [ ] ViewToggle preference persists across sessions (localStorage)
- [ ] Three-dots menu opens/closes correctly
- [ ] Three-dots menu closes on click outside or Escape
- [ ] Three-dots menu items execute correct actions
- [ ] Delete option disabled for Lent items
- [ ] Click-to-edit opens dialog on card click
- [ ] Click-to-edit does NOT open when menu is open
- [ ] List view table rows also open edit dialog on click

---

## Deployment Notes

1. **Ensure `/data/uploads/items/` directory exists** before starting server
2. **Configure static file serving** for `/uploads` route in Express
3. **Run database migration** to add `imageUrl` column
4. **Set file size limits** in reverse proxy (Nginx, etc.) if applicable
5. **Monitor disk space** for image storage
6. **Implement scheduled orphan cleanup** (daily cron job) - optional enhancement

---

## Next Steps

After completing this feature:

1. Run `/speckit.tasks` command to generate task breakdown
2. Create feature branch: `git checkout -b 002-item-ui-enhancements`
3. Implement in order: Backend → Frontend (Images) → Frontend (View Toggle) → Frontend (Menu & Click)
4. Test each phase before moving to next
5. Create pull request with screenshots showing grid view + images

---

**Questions?** Refer to:
- [Feature Spec](./spec.md) for requirements
- [Data Model](./data-model.md) for schema details
- [API Contracts](./contracts/) for endpoint specifications
- [Research](./research.md) for technology decisions
