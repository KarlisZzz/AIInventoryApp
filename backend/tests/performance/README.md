# Performance Testing Suite

This directory contains performance testing tools for the Inventory Management system.

## Requirements

Per FR-035 to FR-038:
- **FR-035**: Automated performance benchmarking
- **FR-036**: Representative test dataset (500 items, 50 users, 1000 lending logs)
- **FR-037**: Response time logging for critical operations
- **FR-038**: Pass/fail thresholds matching success criteria

## Success Criteria

- **SC-004**: Dashboard load time < 2 seconds
- **SC-005**: Search response time < 1 second

## Files

### Test Data Generator
**File**: `../../src/scripts/generateTestData.js`

Generates representative test dataset:
- 500 inventory items (various categories and statuses)
- 50 users (mix of Admin and Member roles)
- 1000 lending logs (with ~20% currently active)

```bash
node src/scripts/generateTestData.js
```

### Performance Benchmark Suite
**File**: `benchmark.js`

Runs comprehensive performance tests:
- Dashboard load time test (10 iterations)
- Search response time test (5 queries × 10 iterations each)
- Items list endpoint test
- Lending history endpoint test

Includes warmup requests and statistical analysis (min, max, avg, median, p95, p99).

```bash
node tests/performance/benchmark.js
```

### Complete Test Runner
**File**: `run-tests.js`

Executes full performance testing workflow:
1. Generates test dataset
2. Runs all benchmarks
3. Verifies thresholds

```bash
node tests/performance/run-tests.js
```

## Usage

### Prerequisites

1. Backend server must be running:
   ```bash
   npm start
   ```

2. Database must be initialized and accessible

### Running Tests

**Option 1: Complete Test Suite**
```bash
cd backend
node tests/performance/run-tests.js
```

**Option 2: Individual Steps**
```bash
# Generate test data
node src/scripts/generateTestData.js

# Run benchmarks
node tests/performance/benchmark.js
```

## Performance Logging

Response time logging is enabled per FR-037 for critical operations:
- Dashboard load (`/api/v1/dashboard`)
- Search (`/api/v1/items?search=...`)
- Lend operation (`/api/v1/lending/lend`)
- Return operation (`/api/v1/lending/return`)
- Lending history (`/api/v1/lending/history/:id`)

Logs include:
- Operation name
- HTTP method and path
- Duration in milliseconds
- Status code
- Query parameters
- Request body (sanitized)

Warnings are logged when operations exceed thresholds.

## Configuration

### Benchmark Settings
Located in `benchmark.js`:
```javascript
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  API_PREFIX: '/api/v1',
  DASHBOARD_THRESHOLD_MS: 2000, // SC-004
  SEARCH_THRESHOLD_MS: 1000,    // SC-005
  WARMUP_REQUESTS: 3,
  TEST_ITERATIONS: 10,
};
```

### Test Dataset Size
Located in `generateTestData.js`:
```javascript
const CONFIG = {
  ITEMS: 500,
  USERS: 50,
  LENDING_LOGS: 1000,
};
```

## Output Examples

### Successful Run
```
======================================================================
✓ ALL PERFORMANCE TESTS PASSED
======================================================================

📊 Dashboard Load Time (SC-004: < 2000ms)
  Average: 62.50ms
  Median: 63ms
  Result: ✓ PASSED

🔍 Search Response Time (SC-005: < 1000ms)
  Average: 18.18ms
  Median: 16ms
  Result: ✓ PASSED
```

### Failed Test
```
======================================================================
✗ SOME PERFORMANCE TESTS FAILED
======================================================================
  - Dashboard load time exceeded threshold
```

## Troubleshooting

### Server Not Reachable
```
✗ Benchmark failed: connect ECONNREFUSED
```
**Solution**: Ensure backend server is running on port 3001

### Database Errors
```
✗ Error generating test data: Error
```
**Solution**: Check database connection and ensure migrations have run

### Slow Performance
If tests fail due to slow performance:
1. Check system resources (CPU, memory)
2. Ensure database is not on slow storage
3. Review query optimization in models/services
4. Check for network latency issues

## Integration with CI/CD

Add to your CI pipeline:
```yaml
- name: Run Performance Tests
  run: |
    cd backend
    npm start &
    sleep 5
    node tests/performance/run-tests.js
```

## Verification Tasks

✅ T137a: Test dataset generator created  
✅ T137b: Performance benchmark suite created  
✅ T137c: Dashboard load time test implemented  
✅ T137d: Search response time test implemented  
✅ T137e: Response time logging added to controllers  
✅ T137f: Automated verification with thresholds  
