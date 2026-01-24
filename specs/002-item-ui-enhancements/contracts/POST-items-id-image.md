# API Contract: Upload Item Image

**Endpoint**: `POST /api/v1/items/:id/image`  
**Purpose**: Upload or replace an image for an existing item  
**Authentication**: Required (future enhancement)  
**Rate Limit**: 10 requests per minute per IP (future enhancement)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | YES | Unique identifier of the item (UUID or integer) |

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Content-Type` | `multipart/form-data` | YES | Required for file uploads |

### Body (Form Data)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `image` | File | YES | MIME: `image/jpeg`, `image/png`, `image/webp`<br>Max size: 5MB | Image file to upload |

### Example Request (cURL)

```bash
curl -X POST http://localhost:3000/api/v1/items/550e8400-e29b-41d4-a716-446655440000/image \
  -F "image=@/path/to/cordless-drill.jpg" \
  -H "Content-Type: multipart/form-data"
```

### Example Request (JavaScript Fetch)

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);

const response = await fetch(`/api/v1/items/${itemId}/image`, {
  method: 'POST',
  body: formData,
  // Note: Do NOT set Content-Type header manually - browser sets it with boundary
});

const result = await response.json();
```

---

## Response

### Success Response (201 Created)

**Status Code**: `201 Created`

**Body**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cordless Drill",
    "description": "18V cordless drill with two batteries and charger",
    "category": "Power Tools",
    "status": "Available",
    "imageUrl": "/uploads/items/item-1706019234567-abc123def.jpg",
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-23T14:45:22.000Z"
  },
  "error": null,
  "message": "Image uploaded successfully"
}
```

### Error Responses

#### 400 Bad Request - No File Provided

**Status Code**: `400 Bad Request`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "MISSING_FILE",
    "message": "No image file provided"
  },
  "message": "Image upload failed"
}
```

#### 400 Bad Request - Invalid File Type

**Status Code**: `400 Bad Request`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPG, PNG, and WebP images are allowed"
  },
  "message": "Image upload failed"
}
```

#### 413 Payload Too Large - File Size Exceeds Limit

**Status Code**: `413 Payload Too Large`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image size exceeds 5MB limit"
  },
  "message": "Image upload failed"
}
```

#### 404 Not Found - Item Does Not Exist

**Status Code**: `404 Not Found`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "ITEM_NOT_FOUND",
    "message": "Item with ID 550e8400-e29b-41d4-a716-446655440000 not found"
  },
  "message": "Image upload failed"
}
```

#### 500 Internal Server Error - Disk Write Failure

**Status Code**: `500 Internal Server Error`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "STORAGE_ERROR",
    "message": "Failed to save image to disk"
  },
  "message": "Image upload failed"
}
```

#### 507 Insufficient Storage - Disk Full

**Status Code**: `507 Insufficient Storage`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "DISK_FULL",
    "message": "Server storage is full"
  },
  "message": "Image upload failed"
}
```

---

## Business Logic

### Pre-Conditions

1. Item with specified `id` must exist in database
2. Request must include exactly one file in `image` field
3. File MIME type must be `image/jpeg`, `image/png`, or `image/webp`
4. File size must not exceed 5MB (5,242,880 bytes)

### Processing Steps

1. **Validate Request**:
   - Check if item exists: `SELECT id FROM items WHERE id = :id`
   - If not found, return `404 Not Found`

2. **Process Upload**:
   - Multer middleware validates file type and size
   - Generate unique filename: `item-{timestamp}-{random}.{ext}`
   - Save file to `data/uploads/items/` directory
   - If save fails, return `500 Internal Server Error`

3. **Delete Old Image** (if exists):
   - Query current `imageUrl` from database
   - If not null, delete old file from disk: `fs.unlink(oldImagePath)`
   - Log warning if deletion fails (non-blocking)

4. **Update Database**:
   - BEGIN transaction
   - UPDATE items SET imageUrl = :newImageUrl, updatedAt = CURRENT_TIMESTAMP WHERE id = :id
   - COMMIT transaction
   - If update fails, rollback and delete uploaded file (orphan cleanup)

5. **Return Success**:
   - Fetch updated item from database
   - Return full item object with new `imageUrl`

### Post-Conditions

- Item record has `imageUrl` field pointing to newly uploaded file
- Old image file (if existed) is deleted from disk
- New image file exists at `data/uploads/items/{filename}`
- Item's `updatedAt` timestamp is current

---

## Validation Rules

| Rule | Enforcement | Error Code |
|------|-------------|-----------|
| Item exists | Database query | `ITEM_NOT_FOUND` (404) |
| File provided | Multer middleware | `MISSING_FILE` (400) |
| File type allowed | Multer fileFilter | `INVALID_FILE_TYPE` (400) |
| File size ≤ 5MB | Multer limits | `FILE_TOO_LARGE` (413) |
| Disk space available | File system check | `DISK_FULL` (507) |

---

## Security Considerations

### Current Implementation (Phase 1)

- ✅ File type validation (whitelist MIME types + extensions)
- ✅ File size limit (5MB)
- ✅ Unique filename generation (prevents path traversal attacks)
- ✅ Files stored outside web root (served via Express static middleware)

### Future Enhancements (Phase 2+)

- ⚠️ **Authentication**: Require user to be logged in to upload images
- ⚠️ **Authorization**: Verify user has permission to edit item
- ⚠️ **Malware Scanning**: Integrate ClamAV or VirusTotal for uploaded files
- ⚠️ **Content-Type Verification**: Check file magic numbers, not just extension
- ⚠️ **Rate Limiting**: Prevent abuse (10 uploads per minute per user)
- ⚠️ **CSRF Protection**: Require CSRF token for state-changing operations

---

## Performance Characteristics

| Metric | Target | Notes |
|--------|--------|-------|
| **Response Time** (p95) | < 2 seconds | For 2MB file under normal conditions |
| **Throughput** | 10 concurrent uploads | Limited by disk I/O, not CPU |
| **Disk Usage** | ~2MB per item (avg) | Based on 5MB max, typical photos 1-3MB |

---

## OpenAPI 3.0 Specification (Optional)

```yaml
/api/v1/items/{id}/image:
  post:
    summary: Upload item image
    operationId: uploadItemImage
    tags:
      - Items
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
        description: Item unique identifier
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              image:
                type: string
                format: binary
                description: Image file (JPG, PNG, or WebP, max 5MB)
            required:
              - image
    responses:
      '201':
        description: Image uploaded successfully
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  $ref: '#/components/schemas/Item'
                error:
                  type: 'null'
                message:
                  type: string
                  example: "Image uploaded successfully"
      '400':
        description: Bad request (invalid file type or missing file)
      '404':
        description: Item not found
      '413':
        description: File too large
      '500':
        description: Server error
```
