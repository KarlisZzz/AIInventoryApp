# Research: Item Screen UI Enhancements

**Feature**: 002-item-ui-enhancements  
**Phase**: 0 - Outline & Research  
**Date**: 2026-01-23

This document consolidates research findings for technical unknowns identified during the planning phase.

---

## 1. Image Upload & Storage

### Decision: Multer + Local Filesystem

**Rationale**:
- **Multer** is the de facto standard for handling multipart/form-data in Express.js applications
- Well-maintained (41k+ GitHub stars), battle-tested for production use
- Provides built-in file validation (type, size limits), temporary storage, and error handling
- Minimal configuration required for basic file uploads
- Local filesystem storage meets current requirements (no CDN/cloud needed per assumption A-001)

**Implementation Pattern**:
```javascript
// backend/src/middleware/upload.js
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './data/uploads/items/',
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `item-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed'));
    }
  }
});
```

**Alternatives Considered**:
- **Formidable**: Lower-level API, requires more manual handling of file streams
- **Busboy**: Even lower-level, better for streaming large files (overkill for 5MB limit)
- **Cloud Storage (S3/Azure Blob)**: Out of scope per A-001, adds complexity and cost

**Best Practices**:
- Generate unique filenames with timestamp + random suffix to prevent collisions
- Validate file type on both client (UX) and server (security) sides
- Set appropriate `Content-Type` headers when serving images via Express static
- Implement orphan file cleanup: delete old images when replaced/removed
- Use `fs.promises.unlink()` for async file deletion with error handling

**Edge Case Handling**:
- Network failure during upload: Multer will clean up temporary files automatically
- Disk space full: Return 507 Insufficient Storage HTTP status code
- Concurrent uploads to same item: Use transaction + item lock to prevent race conditions

---

## 2. Grid vs. List View Toggle State Management

### Decision: React useState + useLocalStorage Hook

**Rationale**:
- **useState** manages immediate UI state (which view is active)
- **useLocalStorage** custom hook persists preference across sessions (FR-015)
- Keeps state management simple—no need for Redux or Context API for single boolean
- localStorage is synchronous, fast, and has 5-10MB capacity (sufficient for user preferences)
- Pattern aligns with existing codebase (SearchBar, filters use useState)

**Implementation Pattern**:
```typescript
// frontend/src/hooks/useLocalStorage.ts
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

// Usage in InventoryPage.tsx
const [viewMode, setViewMode] = useLocalStorage<'grid' | 'list'>('inventory-view-mode', 'grid');
```

**Alternatives Considered**:
- **Context API**: Overkill for single component state, adds boilerplate
- **Redux/Zustand**: Heavy-handed for one boolean preference, not in dependency list
- **URL Query Params**: Persists state but requires router integration, affects browser history
- **Server-side Preference Storage**: Adds API calls, latency, and database complexity

**Best Practices**:
- Wrap localStorage access in try/catch (private browsing modes may block access)
- Use descriptive key names with feature prefix (`inventory-view-mode`)
- Provide sensible defaults (`'grid'` as initial value per FR-013)
- Validate stored values to prevent type errors from corrupted data

**Responsive Behavior**:
- On mobile (<768px), default to list view for better vertical scrolling (or single-column grid)
- Use CSS media queries + conditional rendering for optimal layout per breakpoint
- Preserve user's explicit toggle choice even on small screens (user preference takes precedence)

---

## 3. Three-Dots Dropdown Menu UI Component

### Decision: Headless UI Pattern with Custom Styling

**Rationale**:
- **Custom Implementation** using React state + refs for click-outside detection
- No external dropdown library needed (Headless UI, Radix UI would add dependencies)
- Existing codebase uses custom components (SearchBar, ItemCard), maintain consistency
- Full control over positioning logic (flip up/left near screen edges per FR-023)
- TailwindCSS provides all necessary styling (absolute positioning, z-index, animations)

**Implementation Pattern**:
```typescript
// frontend/src/components/DropdownMenu.tsx
import { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  trigger: React.ReactNode; // Three-dots icon button
  children: React.ReactNode; // Menu items
  align?: 'left' | 'right';
}

export default function DropdownMenu({ trigger, children, align = 'right' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
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

  return (
    <div ref={dropdownRef} className="relative">
      <button onClick={() => setIsOpen(!isOpen)} aria-haspopup="true" aria-expanded={isOpen}>
        {trigger}
      </button>
      {isOpen && (
        <div className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 
                         bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50`}>
          {children}
        </div>
      )}
    </div>
  );
}
```

**Alternatives Considered**:
- **Headless UI (@headlessui/react)**: Adds 35KB dependency, requires learning new API
- **Radix UI Primitives**: More accessible but increases bundle size, overkill for simple dropdown
- **React Select**: Not designed for action menus, focused on form inputs
- **Native `<details>` element**: Limited styling control, accessibility concerns

**Best Practices**:
- Use `useRef` + `useEffect` for click-outside detection (standard pattern)
- Escape key closes menu (accessibility requirement)
- `aria-haspopup` and `aria-expanded` for screen reader support
- Auto-close menu after action selected (return focus to trigger button)
- Position dropdown using `getBoundingClientRect()` to flip up/left near viewport edges
- Prevent menu from triggering card click-to-edit with `event.stopPropagation()`

**Menu Item Structure**:
```typescript
interface MenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string; // For disabled state explanations
  variant?: 'default' | 'danger'; // Styling (e.g., red for Delete)
}
```

---

## 4. Click-to-Edit Card Interaction

### Decision: Event Delegation with stopPropagation

**Rationale**:
- Entire card is clickable (FR-028) except three-dots menu and dropdown
- Use `onClick` on card container, `stopPropagation()` on menu to prevent bubbling
- React's synthetic event system handles cross-browser compatibility
- Pattern is intuitive for users (consistent with modern web apps like Notion, Trello)
- No additional state needed—existing `onEdit` handler in ItemCard already opens dialog

**Implementation Pattern**:
```typescript
// ItemCard.tsx (simplified)
export default function ItemCard({ item, onEdit, onDelete, onLend, onReturn, onViewHistory }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    if (!menuOpen) {
      onEdit(item); // Open edit dialog (FR-028)
    }
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click (FR-024)
    setMenuOpen(!menuOpen);
  };

  return (
    <div onClick={handleCardClick} className="cursor-pointer ...">
      {/* Image, name, status, etc. */}
      
      <DropdownMenu
        trigger={
          <button onClick={handleMenuClick} aria-label="Item actions">
            ⋮
          </button>
        }
      >
        <MenuItem onClick={() => onEdit(item)}>Edit</MenuItem>
        <MenuItem onClick={() => onDelete(item.id)} disabled={item.status === 'Lent'}>Delete</MenuItem>
        {/* ... */}
      </DropdownMenu>
    </div>
  );
}
```

**Alternatives Considered**:
- **Explicit Edit Button**: Contradicts spec requirement (FR-028: click anywhere on card)
- **Double-Click for Edit**: Confusing UX, not discoverable, accessibility issues
- **Hover-to-Show Edit Overlay**: Poor mobile support, adds complexity
- **Context Menu (Right-Click)**: Not intuitive for primary action, desktop-only

**Best Practices**:
- Add visual hover state to card (`hover:ring-2 ring-blue-500/50`) to indicate clickability
- Use `cursor-pointer` CSS class on card container
- Preserve scroll position when dialog opens (React Portal manages this automatically)
- Prevent double-click opening multiple dialogs with debounce or `isSubmitting` state
- Ensure keyboard accessibility: Enter/Space on focused card should open edit dialog

**Menu Precedence Logic** (FR-031, FR-032):
1. If menu is open, clicking card closes menu (does NOT open edit)
2. Clicking three-dots button opens/closes menu (stops propagation)
3. Clicking menu item closes menu + executes action (edit/delete/lend/return)
4. Clicking outside menu or pressing Escape closes menu

---

## 5. Image Display & Aspect Ratio Preservation

### Decision: CSS Object-Fit + Tailwind Aspect Ratio

**Rationale**:
- **CSS `object-fit: cover`** preserves aspect ratio while filling container (FR-010)
- **Tailwind `aspect-*` utilities** (`aspect-square`, `aspect-video`) enforce consistent dimensions
- No client-side image resizing needed—browser handles rendering efficiently
- Lazy loading with `loading="lazy"` attribute defers offscreen images (FR-004 performance)
- Placeholder image (SVG or base64 inline) for items without images (FR-009)

**Implementation Pattern**:
```typescript
// ItemCard.tsx - Image section
<div className="aspect-square w-full overflow-hidden rounded-t-lg bg-slate-900">
  {item.imageUrl ? (
    <img
      src={item.imageUrl}
      alt={item.name}
      className="w-full h-full object-cover"
      loading="lazy"
      onError={(e) => {
        // Fallback to placeholder if image fails to load
        e.currentTarget.src = '/placeholder-item.svg';
      }}
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-slate-600">
      <svg className="h-16 w-16" fill="currentColor" viewBox="0 0 20 20">
        {/* Placeholder icon (box or image icon) */}
      </svg>
    </div>
  )}
</div>
```

**Alternatives Considered**:
- **Client-Side Resizing (Canvas API)**: Adds complexity, not needed per A-003
- **Server-Side Thumbnail Generation**: Out of scope per A-003, future enhancement
- **CSS `background-image`**: Less semantic, harder for screen readers/SEO
- **`<picture>` with Multiple Sources**: Overkill without responsive image requirements

**Best Practices**:
- Use `aspect-square` (1:1) for grid view cards (consistent grid alignment)
- Use `aspect-video` (16:9) for larger detail views (future consideration)
- Implement `onError` handler to replace broken images with placeholder
- Use descriptive alt text: auto-generate from item.name (A-008)
- Lazy load images with Intersection Observer polyfill for older browsers (if needed)
- Compress images client-side before upload (optional, future enhancement)

**Responsive Sizing**:
- Grid view: Fixed aspect ratio, fluid width (fills grid column)
- List view: Thumbnail size (48x48px or 64x64px) with rounded corners
- Detail view: Larger display (300x300px or full width on mobile)

---

## 6. React State Management for Edit Dialog

### Decision: Existing Pattern (useState + Modal Portal)

**Rationale**:
- **Current implementation already works**: InventoryPage.tsx uses `showForm` and `editingItem` state
- No changes needed—just integrate click-to-edit trigger into existing handler
- React Portal (likely used in existing modal) handles z-index, focus trap, scroll lock
- Follows principle of least change: reuse working code over refactoring

**Existing Pattern** (verified from codebase):
```typescript
// InventoryPage.tsx (existing code)
const [editingItem, setEditingItem] = useState<Item | null>(null);
const [showForm, setShowForm] = useState(false);

const handleEdit = (item: Item) => {
  setEditingItem(item);
  setShowForm(true); // Opens modal with pre-filled form
};

const handleCloseForm = () => {
  setShowForm(false);
  setEditingItem(null);
};

// In render
<ItemList items={filteredItems} onEdit={handleEdit} {...} />
{showForm && <ItemForm item={editingItem} onClose={handleCloseForm} {...} />}
```

**Integration with Click-to-Edit**:
- ItemCard receives same `onEdit` prop as before
- Card's `onClick` handler calls `onEdit(item)` (opens dialog)
- No state management changes required—pure event handler addition

**Best Practices** (already implemented):
- Form dialog uses controlled components (useState for form fields)
- Pre-fill form fields from `editingItem` props
- Clear `editingItem` state on close to reset form
- Preserve scroll position with React Portal's built-in behavior
- Show loading spinner during API call (`isSubmitting` state)

**No Changes Needed**: Existing modal implementation handles FR-030 (pre-fill), FR-033 (scroll position), FR-034 (update without refresh).

---

## 7. SQLite Schema Migration for ImageURL Field

### Decision: Add Migration Script with ALTER TABLE

**Rationale**:
- **SQLite supports `ALTER TABLE ADD COLUMN`** for adding nullable columns
- Migration script pattern already exists in codebase (`backend/src/db/migrations/`)
- Nullable field safe to add—no data loss, backward compatible
- Default value `NULL` indicates no image (matches assumption A-004: one image per item)

**Implementation Pattern**:
```javascript
// backend/src/db/migrations/003_add_item_image_url.js
module.exports = {
  up: async (db) => {
    await db.exec(`
      ALTER TABLE items 
      ADD COLUMN imageUrl TEXT;
    `);
    console.log('Migration 003: Added imageUrl column to items table');
  },

  down: async (db) => {
    // SQLite does not support DROP COLUMN, requires table recreation
    await db.exec(`
      CREATE TABLE items_backup AS SELECT id, name, description, category, status, createdAt, updatedAt FROM items;
      DROP TABLE items;
      ALTER TABLE items_backup RENAME TO items;
    `);
    console.log('Migration 003: Removed imageUrl column from items table (rollback)');
  }
};
```

**Alternatives Considered**:
- **Table Recreation**: Unnecessary complexity for adding nullable column
- **Separate Images Table**: Over-engineering for one-to-one relationship (violates A-004)
- **JSON Blob in Existing Field**: Non-queryable, loses relational integrity

**Best Practices**:
- Run migrations on application startup (check current schema version)
- Use transaction for migration execution (atomicity)
- Log migration success/failure for debugging
- Document rollback procedure (recreate table without imageUrl for SQLite)
- Test migration on copy of production database before deploying

**Schema Validation**:
- Verify column added: `PRAGMA table_info(items);`
- Ensure existing data intact: `SELECT COUNT(*) FROM items;`
- Check nullable constraint: `INSERT INTO items (name, category, status) VALUES ('Test', 'Tools', 'Available');` (no imageUrl should succeed)

---

## Summary of Technology Choices

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Image Upload** | Multer + Local Filesystem | Standard Express middleware, meets 5MB limit, no cloud needed |
| **View Toggle State** | useState + useLocalStorage | Simple, persistent, no external state lib required |
| **Dropdown Menu** | Custom React Component | Full control, matches existing codebase patterns |
| **Click-to-Edit** | Event Delegation (stopPropagation) | Standard React pattern, works with existing modal |
| **Image Display** | CSS object-fit + Tailwind | Browser-native, performant, responsive-friendly |
| **Edit Dialog** | Existing useState + Modal | Reuse working code, no refactoring needed |
| **Database Migration** | SQLite ALTER TABLE | Native support, backward compatible, simple rollback |

**Next Phase**: Use these decisions to generate data-model.md (Item entity schema), contracts/ (API endpoint specifications), and quickstart.md (implementation guide).
