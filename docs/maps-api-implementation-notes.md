# Maps API - Backend Implementation Notes

This document provides guidance for implementing the Maps API backend based on the OpenAPI specification in `maps-api-spec.yaml`.

## Database Schema

### Recommended: PostgreSQL with JSONB

```sql
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_maps_user_id ON maps(user_id);
CREATE INDEX idx_maps_user_updated ON maps(user_id, updated_at DESC);
CREATE INDEX idx_maps_data_schema ON maps((data->>'schemaVersion'));
```

### Why JSONB for `data`?

1. **Schema flexibility**: The `MapData` structure may evolve (new fields, new placement properties)
2. **No joins needed**: Placements are always fetched with the map
3. **Query support**: Can still query/validate JSON fields if needed
4. **Storage efficiency**: JSONB compresses well for repeated keys

### Alternative: Normalized Schema

If you need to query individual placements or enforce referential integrity on `tileId`:

```sql
CREATE TABLE maps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    schema_version INTEGER NOT NULL DEFAULT 1,
    width_units INTEGER NOT NULL,
    height_units INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE map_placements (
    id VARCHAR(64) NOT NULL,  -- "cell:row:col"
    map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
    tile_id VARCHAR(64) NOT NULL,
    x INTEGER NOT NULL CHECK (x >= 0),
    y INTEGER NOT NULL CHECK (y >= 0),
    rot SMALLINT NOT NULL CHECK (rot BETWEEN 0 AND 3),
    layer INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (map_id, id)
);

CREATE INDEX idx_placements_map ON map_placements(map_id);
```

## Indexing Strategy

| Index | Purpose |
|-------|---------|
| `idx_maps_user_id` | Fast lookup of all maps for a user |
| `idx_maps_user_updated` | Efficient pagination sorted by `updatedAt DESC` |
| `idx_maps_data_schema` | Future: filter maps needing migration |

## Implementation Notes

### Authentication & Authorization

```
1. Extract userId from session cookie or JWT token
2. For GET /maps: filter by WHERE user_id = :userId
3. For GET/PUT/DELETE /maps/{id}: verify ownership
   - Fetch map, check map.user_id == session.userId
   - Return 403 if not owner
   - Return 404 if map doesn't exist (prevents enumeration)
```

### Ownership Check Pattern

```python
# Pseudocode
def get_map_with_auth(map_id: UUID, user_id: int) -> Map:
    map = db.query(Map).filter(Map.id == map_id).first()
    if not map:
        raise NotFoundError("Map not found")
    if map.user_id != user_id:
        raise ForbiddenError("You do not have permission to access this map")
    return map
```

### Pagination

```sql
-- List maps for user with pagination
SELECT id, user_id, name, created_at, updated_at
FROM maps
WHERE user_id = :user_id
ORDER BY updated_at DESC
LIMIT :size
OFFSET :start;
```

**Note**: For large datasets, consider cursor-based pagination using `updated_at` + `id`.

### Validation Rules

The backend MUST validate:

| Field | Rule |
|-------|------|
| `data.schemaVersion` | Must be exactly `1` |
| `data.widthUnits` | Positive integer |
| `data.heightUnits` | Positive integer |
| `data.placements[*].rot` | Integer in range `[0, 3]` |
| `data.placements[*].x` | Non-negative integer (x ≥ 0) |
| `data.placements[*].y` | Non-negative integer (y ≥ 0) |
| `data.placements[*].id` | Non-empty string |
| `data.placements[*].tileId` | Non-empty string |
| `name` | 1-255 characters |

**Optional backend validation** (frontend handles this, but backend can enforce):
- `widthUnits` and `heightUnits` divisible by 8
- Placements `x`, `y` divisible by 8
- Placements within map bounds

### Timestamps

- `createdAt`: Set once on INSERT, never modified
- `updatedAt`: Set on INSERT and UPDATE

```sql
-- Trigger for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER maps_updated_at
    BEFORE UPDATE ON maps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
```

### Response Codes

| Scenario | Status Code |
|----------|-------------|
| Success (GET, PUT) | 200 |
| Created (POST) | 201 |
| Deleted (DELETE) | 204 |
| Malformed JSON | 400 |
| Missing required field | 400 |
| Not authenticated | 401 |
| Not owner | 403 |
| Map not found | 404 |
| Invalid schemaVersion | 422 |
| Invalid rot value | 422 |
| Negative x/y | 422 |

### Error Response Format

```json
{
  "error": "VALIDATION_ERROR",
  "message": "Human-readable message",
  "details": [
    { "field": "data.schemaVersion", "message": "Must be 1" }
  ]
}
```

### Canonical Error Codes

| Error Code | HTTP Status | When Returned |
|------------|-------------|---------------|
| `BAD_REQUEST` | 400 | Malformed JSON, missing required fields, invalid types |
| `UNAUTHORIZED` | 401 | No valid session cookie or JWT token provided |
| `FORBIDDEN` | 403 | Authenticated user is not the owner of the requested map |
| `NOT_FOUND` | 404 | Map with given ID does not exist |
| `INVALID_SCHEMA_VERSION` | 422 | `data.schemaVersion` is not `1` |
| `INVALID_PLACEMENT` | 422 | Placement has invalid `rot` (not 0-3), negative `x`/`y`, empty `id` or `tileId` |
| `INVALID_DIMENSIONS` | 422 | `widthUnits` or `heightUnits` is not a positive integer |

**Usage guidelines:**
- Use `BAD_REQUEST` for syntactic errors (can't parse the request)
- Use `INVALID_*` codes (422) for semantic errors (request is valid JSON but violates business rules)
- Always include a human-readable `message` field
- Include `details` array for field-level errors when applicable

## Forward Compatibility

### Schema Migration Strategy

When introducing `schemaVersion: 2`:

1. Backend accepts both v1 and v2
2. On read: return as stored
3. On write: validate according to declared version
4. Optional: migration endpoint to upgrade v1 → v2

### Future Tile Sizes

The current frontend editor only supports 8×8 tiles, but the schema already supports arbitrary sizes:

- `widthUnits`/`heightUnits` on map define total size in microcells
- Future: tiles may have their own `widthUnits`/`heightUnits` in tile metadata
- Backend should NOT validate tile sizes against map grid; that's frontend's job

### Reserved Fields

- `layer` on Placement: reserved for future stacking/layering feature
- Store as provided, return as stored

## Example Queries

### Create Map

```sql
INSERT INTO maps (user_id, name, data)
VALUES (
    :user_id,
    :name,
    :data::jsonb
)
RETURNING id, user_id, name, data, created_at, updated_at;
```

### Update Map

```sql
UPDATE maps
SET name = COALESCE(:name, name),
    data = :data
WHERE id = :id AND user_id = :user_id
RETURNING id, user_id, name, data, created_at, updated_at;
```

### Delete Map

```sql
DELETE FROM maps
WHERE id = :id AND user_id = :user_id
RETURNING id;  -- Empty result means not found/not owner
```

## Testing Checklist

- [ ] Create map with valid data → 201, returns MapFull
- [ ] Create map without name → 400
- [ ] Create map with schemaVersion: 2 → 422
- [ ] Create map with rot: 5 → 422
- [ ] Create map with negative x → 422
- [ ] List maps returns only user's maps
- [ ] List maps respects pagination
- [ ] Get map by ID → 200
- [ ] Get map with wrong user → 403
- [ ] Get nonexistent map → 404
- [ ] Update map → 200, updatedAt changes
- [ ] Update map with invalid data → 422
- [ ] Update other user's map → 403
- [ ] Delete map → 204
- [ ] Delete other user's map → 403
- [ ] Delete nonexistent map → 404
- [ ] All endpoints without auth → 401
