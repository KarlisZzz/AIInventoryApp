# Image Upload Testing Guide

## Quick Test Methods

### Method 1: Automated Test Script (Recommended)

```bash
# Run automatic test (uses first item in DB)
node test-image-upload.js

# Test specific item
node test-image-upload.js <item-uuid>

# Test with your own image
node test-image-upload.js <item-uuid> ./my-test-image.jpg
```

**What it does:**
- ✅ Uploads an image to the specified item
- ✅ Verifies imageUrl is saved to database
- ✅ Confirms correct item was updated
- ✅ Checks image file exists on disk
- ✅ Ensures no other items were affected

---

### Method 2: Manual Testing with PowerShell

```powershell
# Step 1: Check items before upload
node view-items.js 5

# Step 2: Get an item ID
$itemId = "your-item-uuid-here"

# Step 3: Create test image (or use existing)
# Place a test image in the backend folder: test.jpg

# Step 4: Upload image using curl
curl -X POST http://localhost:3001/api/v1/items/$itemId/image `
  -F "image=@test.jpg"

# Step 5: Verify in database
node view-items.js 5

# Step 6: Check specific item
cd data
sqlite3 inventory.db "SELECT id, name, imageUrl FROM Items WHERE id = '$itemId';"
cd ..
```

---

### Method 3: Interactive SQL Verification

```bash
# Open database
cd backend/data
sqlite3 inventory.db

# View items before upload
SELECT id, name, imageUrl, updatedAt FROM Items LIMIT 5;

# After uploading via UI or API...

# Verify specific item
SELECT id, name, imageUrl, updatedAt FROM Items WHERE id = 'your-uuid';

# Check timestamp was updated
SELECT id, name, 
       DATETIME(updatedAt) as update_time,
       imageUrl 
FROM Items 
WHERE id = 'your-uuid';

# Exit
.quit
```

---

### Method 4: Using the Frontend

1. **Start both servers:**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend  
   cd frontend
   npm run dev
   ```

2. **Open the app:** http://localhost:5173

3. **Test steps:**
   - Click on an item to edit OR create new item
   - Click "Click to upload image" 
   - Select a JPG/PNG/WebP under 5MB
   - Click "Update Item" or "Create Item"
   - Wait for success message
   - Check if image appears in the card

4. **Verify in database:**
   ```bash
   cd backend
   node view-items.js
   ```

---

## Expected Results

### ✅ Successful Upload

**API Response:**
```json
{
  "data": {
    "imageUrl": "/uploads/items/item-1737734567890-123456789.jpg",
    "item": {
      "id": "uuid-here",
      "name": "Test Item",
      "imageUrl": "/uploads/items/item-1737734567890-123456789.jpg",
      "updatedAt": "2026-01-24T..."
    }
  },
  "message": "Image uploaded successfully"
}
```

**Database Check:**
```
🖼️  Image URL:   /uploads/items/item-1737734567890-123456789.jpg
🔄 Updated:     2026-01-24 10:42:47.890 +00:00
```

**File System:**
```
backend/data/uploads/items/item-1737734567890-123456789.jpg  ✓ exists
```

---

## Validation Tests

### Test 1: Correct Item Updated
```sql
-- Before: Item A has no image
SELECT id, name, imageUrl FROM Items WHERE name = 'Item A';
-- Result: imageUrl = NULL

-- Upload image to Item A

-- After: Item A has image, Item B unchanged
SELECT id, name, imageUrl FROM Items WHERE name IN ('Item A', 'Item B');
-- Expected: Item A has imageUrl, Item B still NULL
```

### Test 2: Invalid File Type
```bash
# Should fail with 400 error
curl -X POST http://localhost:3001/api/v1/items/$itemId/image \
  -F "image=@test.pdf"

# Expected: "Invalid file type. Only JPG, PNG, and WebP images are allowed."
```

### Test 3: File Too Large
```bash
# Create large file (>5MB)
# Should fail with 413 error
curl -X POST http://localhost:3001/api/v1/items/$itemId/image \
  -F "image=@large-image.jpg"

# Expected: "File size exceeds 5MB limit"
```

### Test 4: Invalid Item ID
```bash
curl -X POST http://localhost:3001/api/v1/items/invalid-uuid/image \
  -F "image=@test.jpg"

# Expected: 404 "Item not found"
```

---

## Troubleshooting

### Image uploads but doesn't show in database?

1. **Check if upload succeeded:**
   ```bash
   ls backend/data/uploads/items/
   ```

2. **Check database directly:**
   ```bash
   cd backend/data
   sqlite3 inventory.db "SELECT id, name, imageUrl FROM Items WHERE imageUrl IS NOT NULL;"
   ```

3. **Check updatedAt timestamp:**
   ```sql
   SELECT id, name, updatedAt, imageUrl FROM Items ORDER BY updatedAt DESC LIMIT 5;
   ```

### Image saved to wrong item?

Run the comprehensive test:
```bash
node test-image-upload.js <item-id>
```

This will verify:
- ✓ Correct item was updated
- ✓ No other items were affected
- ✓ ImageUrl matches the file on disk

---

## Quick Verification Checklist

After uploading an image, verify:

- [ ] API returned 201 status code
- [ ] API response includes `imageUrl`
- [ ] `imageUrl` starts with `/uploads/items/item-`
- [ ] Database shows imageUrl for the correct item
- [ ] File exists at `backend/data/uploads/items/[filename]`
- [ ] `updatedAt` timestamp was updated
- [ ] No other items have the same imageUrl
- [ ] Image displays in the frontend

---

## Examples

### Example 1: Test First Item
```bash
node test-image-upload.js
```

### Example 2: Test Specific Item with Custom Image
```bash
# Get item ID from database
node view-items.js 1

# Use that ID
node test-image-upload.js 856f0a03-3cb2-407e-9e5d-4e9ee194add8 ./my-photo.jpg
```

### Example 3: Batch Test Multiple Items
```powershell
# PowerShell script to test multiple items
$items = @(
  "item-id-1",
  "item-id-2",
  "item-id-3"
)

foreach ($itemId in $items) {
  Write-Host "Testing item: $itemId"
  node test-image-upload.js $itemId
  Start-Sleep -Seconds 2
}
```
