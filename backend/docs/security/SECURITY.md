# Security Configuration Guide

This document outlines the security measures implemented in the Inventory Management System and provides configuration guidance.

## Security Overview

The system implements multiple layers of security per Phase 8 requirements (T138-T153):

1. **SQL Injection Prevention** (T138)
2. **XSS Protection** (T139)
3. **CSRF Protection** (T140)
4. **Rate Limiting** (T141)
5. **Input Validation** (T142)
6. **Database Security** (T143-T144)
7. **Error Sanitization** (T145)
8. **Request Logging** (T146)

---

## 1. SQL Injection Prevention (T138)

**Status**: ✅ Implemented

**Implementation**:
- All database queries use Sequelize ORM with parameterized queries
- No raw SQL queries with string concatenation
- All model methods use built-in Sequelize query builders

**Verification**:
```javascript
// ✓ SAFE: Parameterized query (Sequelize automatic)
Item.findOne({ where: { id: userInput } });

// ✗ UNSAFE: Raw SQL with concatenation (NOT USED)
sequelize.query(`SELECT * FROM Items WHERE id = '${userInput}'`);
```

**Files**:
- `backend/src/models/Item.js`
- `backend/src/models/User.js`
- `backend/src/models/LendingLog.js`

---

## 2. XSS Protection (T139)

**Status**: ✅ Implemented

**Implementation**:
- `sanitizer.js` middleware sanitizes all user input
- Removes potentially dangerous HTML/script tags
- Sanitizes `req.body`, `req.query`, and `req.params`

**Configuration**:
```javascript
// Apply to all routes (recommended)
app.use(sanitizeInput);

// Or apply selectively
router.post('/items', sanitizeInput, itemController.createItem);
```

**Files**:
- `backend/src/middleware/sanitizer.js`

**Package Required**:
```bash
npm install xss
```

**Testing**:
```bash
# Test XSS payload
curl -X POST http://localhost:3001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","category":"Test"}'

# Expected: Script tags are stripped
```

---

## 3. CSRF Protection (T140)

**Status**: ✅ Implemented (Two Approaches)

### Approach 1: Token-Based (Full Protection)

For traditional web apps with sessions:

```javascript
const { generateCsrfToken, verifyCsrfToken } = require('./middleware/csrf');

// Generate token for initial page load
app.get('/', generateCsrfToken, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

// Verify token on state-changing operations
app.use(verifyCsrfToken);
```

Client must send token in header:
```javascript
fetch('/api/v1/items', {
  method: 'POST',
  headers: {
    'X-CSRF-Token': csrfToken,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});
```

### Approach 2: Custom Header (SPA-Friendly)

For Single Page Applications:

```javascript
const { simpleCsrfProtection } = require('./middleware/csrf');

// Apply to all state-changing routes
app.use(simpleCsrfProtection);
```

Client must include custom header (automatically set by axios/fetch):
```javascript
// axios config (in api.js)
axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
```

**Files**:
- `backend/src/middleware/csrf.js`

**Note**: Currently using Approach 2 (SPA-friendly) as the application is a React SPA.

---

## 4. Rate Limiting (T141)

**Status**: ✅ Implemented

**Configuration**: 100 requests per minute per IP (default)

### Usage

**Global Rate Limiting**:
```javascript
const { rateLimiter } = require('./middleware/rateLimiter');

// Apply to all routes
app.use(rateLimiter);
```

**Selective Rate Limiting**:
```javascript
const { rateLimiter, strictRateLimiter, lenientRateLimiter } = require('./middleware/rateLimiter');

// Strict for sensitive endpoints (20 req/min)
router.post('/admin/*', strictRateLimiter);

// Default for most endpoints (100 req/min)
router.use('/api/v1', rateLimiter);

// Lenient for read-only (200 req/min)
router.get('/items', lenientRateLimiter);
```

**Custom Rate Limit**:
```javascript
const { createRateLimiter } = require('./middleware/rateLimiter');

const customLimiter = createRateLimiter({
  windowMs: 60 * 1000,       // 1 minute
  maxRequests: 50,            // 50 requests
  message: 'Custom message',
});
```

**Response Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: When the rate limit resets
- `Retry-After`: Seconds to wait (when limit exceeded)

**Files**:
- `backend/src/middleware/rateLimiter.js`

**Production Note**: For multi-server deployments, replace in-memory store with Redis.

---

## 5. Input Validation (T142)

**Status**: ✅ Implemented

**Implementation**:
- Length limits enforced in models and middleware
- Type validation
- Format validation (email, UUID)
- Enum validation

**Validation Rules**:
```javascript
const VALIDATION_RULES = {
  item: {
    name: { maxLength: 100, minLength: 1 },
    description: { maxLength: 500 },
    category: { maxLength: 50, minLength: 1 },
    status: { enum: ['Available', 'Lent', 'Maintenance'] },
  },
  user: {
    name: { maxLength: 100, minLength: 1 },
    email: { maxLength: 255, format: 'email' },
    role: { maxLength: 50 },
  },
  lendingLog: {
    conditionNotes: { maxLength: 500 },
  },
};
```

**Files**:
- `backend/src/middleware/validator.js`
- `backend/src/models/*.js` (Sequelize validations)

**Testing**:
```bash
# Test oversized input
curl -X POST http://localhost:3001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"'$(python -c 'print("A"*101)')'","category":"Test"}'

# Expected: 400 error with validation message
```

---

## 6. Database Security (T143-T144)

**Status**: ✅ Implemented

### Database File Location (T143)

**Requirement**: Store database file outside web root

**Configuration** (`.env`):
```bash
# ✓ SAFE: Outside web root
DB_PATH=./data/inventory.db
DB_PATH=../data/inventory.db
DB_PATH=/var/app/data/inventory.db

# ✗ UNSAFE: In web-accessible directory
DB_PATH=./public/inventory.db
DB_PATH=./static/inventory.db
```

### File Permissions (T144)

**Check Permissions**:
```bash
node backend/src/scripts/checkPermissions.js
```

**Recommended Permissions**:
- **Linux/Mac**: `600` (owner read/write only) or `644` (owner read/write, others read)
- **Windows**: Restrict to your user account only

**Set Permissions** (Linux/Mac):
```bash
chmod 600 ./data/inventory.db
```

**Verification**:
```bash
ls -l data/inventory.db
# Expected: -rw------- (600) or -rw-r--r-- (644)
```

**Files**:
- `backend/src/scripts/checkPermissions.js`

---

## 7. Error Sanitization (T145)

**Status**: ✅ Implemented

**Implementation**:
- Database errors never exposed to client in production
- Stack traces only in development mode
- Generic error messages in production

**Configuration**:
```bash
# Development: Shows detailed errors
NODE_ENV=development

# Production: Sanitized errors only
NODE_ENV=production
```

**Error Response Format**:
```json
{
  "data": null,
  "error": {
    "code": "DATABASE_ERROR",
    "message": "An unexpected error occurred",
    "details": null
  },
  "message": "An unexpected error occurred"
}
```

**Files**:
- `backend/src/middleware/errorHandler.js`

**Testing**:
```bash
# In production mode, database errors should return generic message
NODE_ENV=production npm start

# Trigger database error and verify response doesn't contain SQL details
```

---

## 8. Request Logging (T146)

**Status**: ✅ Implemented

**Implementation**:
- All requests logged with timing
- Sensitive fields redacted (passwords, tokens, etc.)
- Structured JSON logs in production

**Sanitized Fields**:
- `password`
- `token`
- `secret`
- `apiKey` / `api_key`
- `authorization`
- `cookie`

**Log Format** (Production):
```json
{
  "timestamp": "2026-01-20T10:12:16.523Z",
  "method": "POST",
  "path": "/api/v1/items",
  "status": 201,
  "responseTime": 45,
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0..."
}
```

**Files**:
- `backend/src/middleware/logger.js`
- `backend/src/middleware/performanceLogger.js`

---

## Security Checklist

### Development

- [ ] All middleware installed: `npm install xss`
- [ ] Database file outside `public/` or `static/`
- [ ] `.env` file not committed to git
- [ ] Security headers configured (CORS)
- [ ] Input validation tested

### Production

- [ ] `NODE_ENV=production`
- [ ] Rate limiting enabled
- [ ] CSRF protection enabled (if applicable)
- [ ] XSS sanitization enabled
- [ ] Database file permissions set (600 or 644)
- [ ] Database outside web root
- [ ] Error sanitization verified
- [ ] HTTPS enabled (via reverse proxy)
- [ ] Security headers configured (Helmet.js)

---

## Middleware Application Order

**Critical**: Apply middleware in the correct order:

```javascript
const express = require('express');
const { rateLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitizer');
const { simpleCsrfProtection } = require('./middleware/csrf');
const { requestLogger } = require('./middleware/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// 1. Rate limiting (first line of defense)
app.use(rateLimiter);

// 2. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 3. Request logging
app.use(requestLogger);

// 4. Input sanitization (XSS protection)
app.use(sanitizeInput);

// 5. CSRF protection (if enabled)
// app.use(simpleCsrfProtection);

// 6. Application routes
app.use('/api/v1/items', itemRoutes);
app.use('/api/v1/users', userRoutes);
// ... other routes

// 7. 404 handler (after all routes)
app.use(notFoundHandler);

// 8. Error handler (last)
app.use(errorHandler);
```

---

## Security Testing

### Manual Testing

```bash
# 1. Test rate limiting
for i in {1..105}; do
  curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3001/api/v1/items
done
# Expected: First 100 return 200, then 429

# 2. Test XSS sanitization
curl -X POST http://localhost:3001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>","category":"Test"}'
# Expected: Script tags stripped

# 3. Test input validation
curl -X POST http://localhost:3001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"","category":"Test"}'
# Expected: 400 validation error

# 4. Test CSRF protection
curl -X POST http://localhost:3001/api/v1/items \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","category":"Test"}'
# Expected: 403 CSRF error (if CSRF protection enabled)
```

### Automated Testing

Create test suite in `backend/tests/security/`:

```javascript
// backend/tests/security/security.test.js
describe('Security Tests', () => {
  test('should prevent XSS attacks', async () => {
    const response = await request(app)
      .post('/api/v1/items')
      .send({ name: '<script>alert(1)</script>', category: 'Test' });
    
    expect(response.body.data.name).not.toContain('<script>');
  });
  
  test('should enforce rate limits', async () => {
    const requests = Array(101).fill().map(() =>
      request(app).get('/api/v1/items')
    );
    
    const responses = await Promise.all(requests);
    const lastResponse = responses[responses.length - 1];
    
    expect(lastResponse.status).toBe(429);
  });
});
```

---

## Security Monitoring

### Log Analysis

**Monitor for suspicious patterns**:
- High rate of 429 responses (potential DDoS)
- Multiple validation errors from same IP
- Unusual request patterns
- SQL injection attempts in logs

**Tools**:
- `grep 429 logs/access.log` - Find rate limit violations
- `grep "VALIDATION_ERROR" logs/error.log` - Find validation failures

### Health Metrics

```javascript
// Add monitoring endpoint
app.get('/api/v1/security/stats', (req, res) => {
  res.json({
    rateLimiting: getRateLimiterStats(),
    csrf: getCsrfStats(),
  });
});
```

---

## Security Incident Response

### If Breach Detected

1. **Immediate Actions**:
   - Enable strict rate limiting
   - Review and rotate any secrets/keys
   - Check database for unauthorized changes
   - Review access logs

2. **Investigation**:
   - Identify attack vector
   - Assess data exposure
   - Document incident timeline

3. **Remediation**:
   - Apply security patches
   - Update firewall rules
   - Enhance monitoring
   - Update this security guide

---

## Additional Recommendations

### Future Enhancements

1. **Authentication & Authorization**
   - Implement JWT token auth
   - Role-based access control (RBAC)
   - Session management

2. **Advanced Security**
   - Add Helmet.js for security headers
   - Implement Content Security Policy (CSP)
   - Add HTTPS/TLS (via reverse proxy)
   - Input sanitization for file uploads

3. **Monitoring & Alerts**
   - Set up error tracking (Sentry, etc.)
   - Configure alerts for suspicious activity
   - Regular security audits

4. **Compliance**
   - GDPR data handling procedures
   - Data retention policies
   - Privacy policy implementation

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [Sequelize Security](https://sequelize.org/docs/v6/core-concepts/raw-queries/#security)

---

**Last Updated**: January 20, 2026  
**Maintained By**: Development Team  
**Review Schedule**: Quarterly

For security issues, contact: security@example.com
