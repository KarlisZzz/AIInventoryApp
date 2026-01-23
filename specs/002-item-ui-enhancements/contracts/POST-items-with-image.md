# API Contract: Create Item with Image

**Endpoint**: `POST /api/v1/items` (ENHANCED)  
**Purpose**: Create a new item with optional image upload in a single request  
**Authentication**: Required (future enhancement)  
**Rate Limit**: 10 requests per minute per IP (future enhancement)

---

## Request

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Content-Type` | `multipart/form-data` | YES (if image included) | Required for file uploads |
| `Content-Type` | `application/json` | YES (if no image) | For text-only item creation |

### Body (Form Data - with image)

| Field | Type | Required | Validation | Description |
|-------|------|----------|------------|-------------|
| `name` | string | YES | Min 1 char, Max 200 chars | Item display name |
| `description` | string | NO | Max 1000 chars | Optional detailed description |
| `category` | string | YES | Must match predefined list | Category classification |
| `status` | string | YES | Enum: `Available`, `Lent`, `Maintenance` | Initial availability state (typically `Available`) |
| `image` | File | NO | MIME: `image/jpeg`, `image/png`, `image/webp`<br>Max size: 5MB | Optional image file |

### Body (JSON - without image)

```json
{
  "name": "Cordless Drill",
  "description": "18V cordless drill with two batteries and charger",
  "category": "Power Tools",
  "status": "Available"
}
```

### Example Request (cURL - with image)

```bash
curl -X POST http://localhost:3000/api/v1/items \
  -F "name=Cordless Drill" \
  -F "description=18V cordless drill with two batteries and charger" \
  -F "category=Power Tools" \
  -F "status=Available" \
  -F "image=@/path/to/cordless-drill.jpg" \
  -H "Content-Type: multipart/form-data"
```

### Example Request (JavaScript Fetch - with image)

```javascript
const formData = new FormData();
formData.append('name', 'Cordless Drill');
formData.append('description', '18V cordless drill with two batteries and charger');
formData.append('category', 'Power Tools');
formData.append('status', 'Available');
formData.append('image', fileInput.files[0]); // Optional

const response = await fetch('/api/v1/items', {
  method: 'POST',
  body: formData,
  // Note: Do NOT set Content-Type header manually
});

const result = await response.json();
```

### Example Request (cURL - without image)

```bash
curl -X POST http://localhost:3000/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hammer",
    "description": "Claw hammer with fiberglass handle",
    "category": "Hand Tools",
    "status": "Available"
  }'
```

---

## Response

### Success Response (201 Created)

**Status Code**: `201 Created`

**Headers**:
```
Location: /api/v1/items/550e8400-e29b-41d4-a716-446655440000
```

**Body (with image)**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cordless Drill",
    "description": "18V cordless drill with two batteries and charger",
    "category": "Power Tools",
    "status": "Available",
    "imageUrl": "/uploads/items/item-1706019234567-abc123def.jpg",
    "createdAt": "2026-01-23T14:45:22.000Z",
    "updatedAt": "2026-01-23T14:45:22.000Z"
  },
  "error": null,
  "message": "Item created successfully"
}
```

**Body (without image)**:
```json
{
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Hammer",
    "description": "Claw hammer with fiberglass handle",
    "category": "Hand Tools",
    "status": "Available",
    "imageUrl": null,
    "createdAt": "2026-01-23T14:50:00.000Z",
    "updatedAt": "2026-01-23T14:50:00.000Z"
  },
  "error": null,
  "message": "Item created successfully"
}
```

### Error Responses

#### 400 Bad Request - Missing Required Fields

**Status Code**: `400 Bad Request`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required fields: name, category, status",
    "details": {
      "name": "Name is required",
      "category": "Category is required",
      "status": "Status is required"
    }
  },
  "message": "Item creation failed"
}
```

#### 400 Bad Request - Invalid Field Values

**Status Code**: `400 Bad Request`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid field values",
    "details": {
      "status": "Status must be one of: Available, Lent, Maintenance",
      "category": "Category 'Invalid Category' is not recognized"
    }
  },
  "message": "Item creation failed"
}
```

#### 400 Bad Request - Invalid Image File

**Status Code**: `400 Bad Request`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Only JPG, PNG, and WebP images are allowed"
  },
  "message": "Item creation failed"
}
```

#### 413 Payload Too Large - Image Too Large

**Status Code**: `413 Payload Too Large`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "Image size exceeds 5MB limit"
  },
  "message": "Item creation failed"
}
```

#### 500 Internal Server Error

**Status Code**: `500 Internal Server Error`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create item in database"
  },
  "message": "Item creation failed"
}
```

---

## Business Logic

### Pre-Conditions

1. Required fields (`name`, `category`, `status`) must be provided
2. If image is included:
   - File MIME type must be `image/jpeg`, `image/png`, or `image/webp`
   - File size must not exceed 5MB

### Processing Steps

#### Path A: Item with Image

1. **Validate Text Fields**:
   - Check required fields: `name`, `category`, `status`
   - Validate `status` enum: must be `Available`, `Lent`, or `Maintenance`
   - Validate `category` against predefined list (or allow any string if extensible)
   - If validation fails, return `400 Bad Request`

2. **Process Image Upload**:
   - Multer middleware validates file type and size
   - Generate unique filename: `item-{timestamp}-{random}.{ext}`
   - Save file to `data/uploads/items/` directory
   - If save fails, return `500 Internal Server Error` (no database record created)

3. **Create Database Record**:
   - BEGIN transaction
   - Generate new UUID/auto-increment ID
   - INSERT INTO items (id, name, description, category, status, imageUrl, createdAt, updatedAt) VALUES (...)
   - COMMIT transaction
   - If insert fails, rollback and delete uploaded file (orphan cleanup)

4. **Return Success**:
   - Set `Location` header with new item URL
   - Return full item object with `imageUrl` populated

#### Path B: Item without Image

1. **Validate Text Fields**: (same as Path A step 1)

2. **Create Database Record**:
   - BEGIN transaction
   - INSERT INTO items (id, name, description, category, status, imageUrl, createdAt, updatedAt) VALUES (..., NULL, ...)
   - COMMIT transaction

3. **Return Success**:
   - Set `Location` header
   - Return full item object with `imageUrl = null`

### Post-Conditions

- New item record exists in database with unique ID
- If image was uploaded:
  - Image file exists at `data/uploads/items/{filename}`
  - Item's `imageUrl` field references the file
- If no image:
  - Item's `imageUrl` field is `NULL`

---

## Validation Rules

| Rule | Enforcement | Error Code |
|------|-------------|-----------|
| `name` required | Application | `VALIDATION_ERROR` (400) |
| `name` length 1-200 | Application | `VALIDATION_ERROR` (400) |
| `category` required | Application | `VALIDATION_ERROR` (400) |
| `status` required | Application | `VALIDATION_ERROR` (400) |
| `status` enum valid | Application + Database CHECK | `VALIDATION_ERROR` (400) |
| `description` max 1000 | Application | `VALIDATION_ERROR` (400) |
| Image type valid | Multer fileFilter | `INVALID_FILE_TYPE` (400) |
| Image size ≤ 5MB | Multer limits | `FILE_TOO_LARGE` (413) |

---

## Backward Compatibility

This endpoint **enhances** the existing `POST /api/v1/items` endpoint:

- ✅ **Existing JSON Requests**: Continue to work unchanged (no image field)
- ✅ **New Multipart Requests**: Support optional image upload
- ✅ **Response Format**: Consistent JSON envelope (adds `imageUrl` field, defaults to `null`)
- ✅ **Frontend Compatibility**: Older frontends ignore `imageUrl` field, newer ones display images

**Migration Path**:
1. Deploy backend with image support
2. Frontend continues sending JSON (no images yet)
3. Update frontend to support image uploads (multipart/form-data)
4. Users gradually add images to new/existing items

---

## Security Considerations

### Current Implementation (Phase 1)

- ✅ File type validation (whitelist MIME types + extensions)
- ✅ File size limit (5MB)
- ✅ Input sanitization for text fields (prevent SQL injection via parameterized queries)
- ✅ Unique filename generation (prevents collisions and path traversal)

### Future Enhancements (Phase 2+)

- ⚠️ **Authentication**: Require user login
- ⚠️ **Authorization**: Verify user has "create item" permission
- ⚠️ **Rate Limiting**: Prevent spam (10 items per minute per user)
- ⚠️ **CSRF Protection**: Require CSRF token
- ⚠️ **Image Scanning**: Malware/virus detection on uploaded files

---

## Performance Characteristics

| Metric | Target | Notes |
|--------|--------|-------|
| **Response Time** (p95) | < 3 seconds | Includes image upload for 2MB file |
| **Throughput** | 10 concurrent creations | Limited by disk I/O |
| **Database Insert** | < 50ms | Fast insert with indexes |

---

## OpenAPI 3.0 Specification (Optional)

```yaml
/api/v1/items:
  post:
    summary: Create new item (with optional image)
    operationId: createItem
    tags:
      - Items
    requestBody:
      required: true
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              name:
                type: string
                minLength: 1
                maxLength: 200
              description:
                type: string
                maxLength: 1000
              category:
                type: string
              status:
                type: string
                enum: [Available, Lent, Maintenance]
              image:
                type: string
                format: binary
                description: Optional image file (JPG, PNG, WebP, max 5MB)
            required:
              - name
              - category
              - status
        application/json:
          schema:
            type: object
            properties:
              name:
                type: string
              description:
                type: string
              category:
                type: string
              status:
                type: string
                enum: [Available, Lent, Maintenance]
            required:
              - name
              - category
              - status
    responses:
      '201':
        description: Item created successfully
        headers:
          Location:
            schema:
              type: string
            description: URL of the newly created item
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
      '400':
        description: Validation error or invalid file
      '413':
        description: File too large
      '500':
        description: Server error
```
