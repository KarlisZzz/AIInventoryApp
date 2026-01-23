# API Contract: Delete Item Image

**Endpoint**: `DELETE /api/v1/items/:id/image`  
**Purpose**: Remove the image associated with an item (sets imageUrl to NULL)  
**Authentication**: Required (future enhancement)  
**Rate Limit**: 20 requests per minute per IP (future enhancement)

---

## Request

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | string | YES | Unique identifier of the item (UUID or integer) |

### Headers

| Header | Value | Required | Description |
|--------|-------|----------|-------------|
| `Content-Type` | `application/json` | NO | Not required (no request body) |

### Body

No request body required.

### Example Request (cURL)

```bash
curl -X DELETE http://localhost:3000/api/v1/items/550e8400-e29b-41d4-a716-446655440000/image
```

### Example Request (JavaScript Fetch)

```javascript
const response = await fetch(`/api/v1/items/${itemId}/image`, {
  method: 'DELETE',
});

const result = await response.json();
```

---

## Response

### Success Response (200 OK)

**Status Code**: `200 OK`

**Body**:
```json
{
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Cordless Drill",
    "description": "18V cordless drill with two batteries and charger",
    "category": "Power Tools",
    "status": "Available",
    "imageUrl": null,
    "createdAt": "2026-01-15T10:30:00.000Z",
    "updatedAt": "2026-01-23T15:10:45.000Z"
  },
  "error": null,
  "message": "Image deleted successfully"
}
```

### Error Responses

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
  "message": "Image deletion failed"
}
```

#### 404 Not Found - Item Has No Image

**Status Code**: `404 Not Found`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "NO_IMAGE_FOUND",
    "message": "Item does not have an image to delete"
  },
  "message": "Image deletion failed"
}
```

#### 500 Internal Server Error - File Deletion Failed

**Status Code**: `500 Internal Server Error`

**Body**:
```json
{
  "data": null,
  "error": {
    "code": "FILE_DELETE_ERROR",
    "message": "Failed to delete image file from disk"
  },
  "message": "Image deletion failed"
}
```

---

## Business Logic

### Pre-Conditions

1. Item with specified `id` must exist in database
2. Item must have a non-null `imageUrl` field

### Processing Steps

1. **Validate Request**:
   - Check if item exists: `SELECT id, imageUrl FROM items WHERE id = :id`
   - If not found, return `404 Not Found` with code `ITEM_NOT_FOUND`
   - If `imageUrl` is NULL, return `404 Not Found` with code `NO_IMAGE_FOUND`

2. **Delete File from Disk**:
   - Extract filename from `imageUrl`: `path.basename(item.imageUrl)`
   - Construct full path: `data/uploads/items/{filename}`
   - Delete file: `fs.promises.unlink(filePath)`
   - If file doesn't exist (already deleted), log warning but continue (idempotent)
   - If deletion fails with permission error, return `500 Internal Server Error`

3. **Update Database**:
   - BEGIN transaction
   - UPDATE items SET imageUrl = NULL, updatedAt = CURRENT_TIMESTAMP WHERE id = :id
   - COMMIT transaction
   - If update fails, rollback (file already deleted, logged as orphan)

4. **Return Success**:
   - Fetch updated item from database
   - Return full item object with `imageUrl = null`

### Post-Conditions

- Item record has `imageUrl` field set to `NULL`
- Image file deleted from `data/uploads/items/` directory
- Item's `updatedAt` timestamp is current

---

## Validation Rules

| Rule | Enforcement | Error Code |
|------|-------------|-----------|
| Item exists | Database query | `ITEM_NOT_FOUND` (404) |
| Item has image | Database query (imageUrl IS NOT NULL) | `NO_IMAGE_FOUND` (404) |
| File can be deleted | File system operation | `FILE_DELETE_ERROR` (500) |

---

## Idempotency

This endpoint is **idempotent**:
- Calling it multiple times on the same item (after first successful deletion) will return `404 Not Found` with code `NO_IMAGE_FOUND`
- If the file is already deleted from disk but database still references it, the operation succeeds (sets imageUrl to NULL) and logs a warning about missing file

---

## Security Considerations

### Current Implementation (Phase 1)

- ✅ Filename extracted from database (prevents path traversal)
- ✅ Files only deleted from designated upload directory
- ✅ No user input accepted in file path construction

### Future Enhancements (Phase 2+)

- ⚠️ **Authentication**: Require user to be logged in
- ⚠️ **Authorization**: Verify user has permission to edit item
- ⚠️ **Audit Logging**: Log who deleted which image and when
- ⚠️ **Soft Delete**: Move files to quarantine directory instead of immediate deletion (recover within 30 days)
- ⚠️ **CSRF Protection**: Require CSRF token for state-changing operations

---

## Performance Characteristics

| Metric | Target | Notes |
|--------|--------|-------|
| **Response Time** (p95) | < 500ms | Fast operation (single file delete) |
| **Throughput** | 50 requests/sec | Not I/O intensive |
| **Disk Cleanup** | Immediate | File deleted synchronously (no background job) |

---

## Edge Cases

### Case 1: Image File Missing but Database References It

**Scenario**: File was manually deleted or corrupted, but `imageUrl` in database is not NULL.

**Behavior**:
- File deletion step fails with `ENOENT` (file not found)
- Log warning: "Image file not found on disk, setting imageUrl to NULL anyway"
- Continue to update database (set imageUrl = NULL)
- Return `200 OK` (idempotent behavior)

### Case 2: Database Update Fails After File Deleted

**Scenario**: File successfully deleted, but database transaction fails (connection lost, constraint violation).

**Behavior**:
- Rollback transaction (database unchanged)
- Log error: "Orphan file detected: {filename} (item {id})"
- Return `500 Internal Server Error`
- File becomes orphan—cleanup job will remove it later

### Case 3: Item Deleted Concurrently

**Scenario**: Item is deleted by another request while image deletion is in progress.

**Behavior**:
- Database query in step 1 fails (item not found)
- Return `404 Not Found` with code `ITEM_NOT_FOUND`
- File remains on disk (orphan)—cleanup job will remove it

---

## OpenAPI 3.0 Specification (Optional)

```yaml
/api/v1/items/{id}/image:
  delete:
    summary: Delete item image
    operationId: deleteItemImage
    tags:
      - Items
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
        description: Item unique identifier
    responses:
      '200':
        description: Image deleted successfully
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
                  example: "Image deleted successfully"
      '404':
        description: Item not found or has no image
        content:
          application/json:
            schema:
              type: object
              properties:
                data:
                  type: 'null'
                error:
                  type: object
                  properties:
                    code:
                      type: string
                      enum: [ITEM_NOT_FOUND, NO_IMAGE_FOUND]
                    message:
                      type: string
                message:
                  type: string
                  example: "Image deletion failed"
      '500':
        description: Server error (file deletion failed)
```
