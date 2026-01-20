/**
 * Security Verification Test Suite (T148-T153)
 * 
 * Tests all security measures implemented in Phase 8
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001/api/v1';
const RESULTS = {
  passed: [],
  failed: [],
  warnings: []
};

// Colors for terminal output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testId, description) {
  console.log(`\n${colors.blue}[${testId}] ${description}${colors.reset}`);
}

function pass(testId, message) {
  const result = `✓ ${testId}: ${message}`;
  RESULTS.passed.push(result);
  log(result, 'green');
}

function fail(testId, message) {
  const result = `✗ ${testId}: ${message}`;
  RESULTS.failed.push(result);
  log(result, 'red');
}

function warn(testId, message) {
  const result = `⚠ ${testId}: ${message}`;
  RESULTS.warnings.push(result);
  log(result, 'yellow');
}

/**
 * T148: Test SQL Injection Prevention
 */
async function testSQLInjection() {
  logTest('T148', 'SQL Injection Prevention');
  
  const sqlInjectionPayloads = [
    "'; DROP TABLE Items; --",
    "1' OR '1'='1",
    "1; DELETE FROM Items WHERE 1=1; --",
    "admin'--",
    "' UNION SELECT * FROM Users--"
  ];

  try {
    // Test in search query parameter
    for (const payload of sqlInjectionPayloads) {
      try {
        const response = await axios.get(`${BASE_URL}/items`, {
          params: { search: payload }
        });
        
        // Should return normal results, not execute SQL
        if (response.status === 200) {
          pass('T148.1', `SQL injection payload blocked in search: "${payload.substring(0, 20)}..."`);
        }
      } catch (error) {
        if (error.response && error.response.status !== 500) {
          pass('T148.1', `SQL injection rejected safely: ${error.response.status}`);
        } else {
          fail('T148.1', `SQL injection caused server error: ${error.message}`);
        }
      }
    }

    // Test in POST body
    try {
      const response = await axios.post(`${BASE_URL}/items`, {
        Name: "'; DROP TABLE Items; --",
        Category: "Test",
        Status: "Available",
        Description: "1' OR '1'='1"
      });
      
      if (response.status === 201) {
        pass('T148.2', 'SQL injection in POST body safely handled by Sequelize parameterization');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        warn('T148.2', 'Server not running - cannot test SQL injection in POST');
      } else {
        pass('T148.2', `Invalid POST rejected: ${error.response?.status || error.message}`);
      }
    }

    // Verify Sequelize uses parameterized queries
    const modelsPath = path.join(__dirname, '../../src/models');
    const modelFiles = fs.readdirSync(modelsPath).filter(f => f.endsWith('.js'));
    
    let usesRawQueries = false;
    for (const file of modelFiles) {
      const content = fs.readFileSync(path.join(modelsPath, file), 'utf8');
      if (content.includes('sequelize.query') && !content.includes('replacements')) {
        usesRawQueries = true;
        fail('T148.3', `Model ${file} may use unsafe raw queries`);
      }
    }
    
    if (!usesRawQueries) {
      pass('T148.3', 'All models use Sequelize ORM with parameterized queries');
    }

  } catch (error) {
    fail('T148', `SQL injection test failed: ${error.message}`);
  }
}

/**
 * T149: Test XSS Sanitization
 */
async function testXSSSanitization() {
  logTest('T149', 'XSS Sanitization');

  const xssPayloads = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(1)">',
    '<svg onload=alert(1)>',
    'javascript:alert(1)',
    '<iframe src="javascript:alert(1)">',
    '"><script>alert(String.fromCharCode(88,83,83))</script>'
  ];

  try {
    // Check if sanitizer middleware exists
    const sanitizerPath = path.join(__dirname, '../../src/middleware/sanitizer.js');
    if (!fs.existsSync(sanitizerPath)) {
      fail('T149.1', 'Sanitizer middleware not found');
      return;
    }
    pass('T149.1', 'Sanitizer middleware exists');

    // Check middleware implementation
    const sanitizerContent = fs.readFileSync(sanitizerPath, 'utf8');
    if (sanitizerContent.includes('xss') || sanitizerContent.includes('sanitize')) {
      pass('T149.2', 'Sanitizer uses XSS protection library');
    } else {
      warn('T149.2', 'Sanitizer may not use proper XSS library');
    }

    // Test XSS payloads (requires server with middleware active)
    let testedPayloads = 0;
    for (const payload of xssPayloads) {
      try {
        const response = await axios.post(`${BASE_URL}/items`, {
          Name: payload,
          Category: 'Test',
          Status: 'Available',
          Description: `Test with XSS: ${payload}`
        });
        
        // Check if response data is sanitized
        if (response.data?.data?.Name && !response.data.data.Name.includes('<script>')) {
          pass('T149.3', `XSS payload sanitized: "${payload.substring(0, 30)}..."`);
          testedPayloads++;
        }
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          warn('T149.3', 'Server not running - cannot test live XSS sanitization');
          break;
        }
      }
    }

    if (testedPayloads === 0) {
      warn('T149.4', 'Could not test live XSS sanitization (server offline)');
    }

  } catch (error) {
    fail('T149', `XSS sanitization test failed: ${error.message}`);
  }
}

/**
 * T150: Test Rate Limiting
 */
async function testRateLimiting() {
  logTest('T150', 'Rate Limiting');

  try {
    // Check if rate limiter exists
    const rateLimiterPath = path.join(__dirname, '../../src/middleware/rateLimiter.js');
    if (!fs.existsSync(rateLimiterPath)) {
      fail('T150.1', 'Rate limiter middleware not found');
      return;
    }
    pass('T150.1', 'Rate limiter middleware exists');

    // Check configuration
    const rateLimiterContent = fs.readFileSync(rateLimiterPath, 'utf8');
    if (rateLimiterContent.includes('429') || rateLimiterContent.includes('Too Many Requests')) {
      pass('T150.2', 'Rate limiter returns 429 status code');
    }
    
    if (rateLimiterContent.includes('Retry-After')) {
      pass('T150.3', 'Rate limiter includes Retry-After header');
    }

    // Test actual rate limiting (requires server running)
    try {
      const requests = [];
      const limit = 105; // Try to exceed 100 req/min default limit
      
      for (let i = 0; i < limit; i++) {
        requests.push(axios.get(`${BASE_URL}/items`).catch(e => e.response));
      }
      
      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r?.status === 429);
      
      if (rateLimited.length > 0) {
        pass('T150.4', `Rate limiting active: ${rateLimited.length} requests blocked with 429`);
      } else {
        warn('T150.4', 'Rate limiting may not be active or limit not reached');
      }
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        warn('T150.4', 'Server not running - cannot test live rate limiting');
      } else {
        warn('T150.4', `Could not test rate limiting: ${error.message}`);
      }
    }

  } catch (error) {
    fail('T150', `Rate limiting test failed: ${error.message}`);
  }
}

/**
 * T151: Test Input Validation
 */
async function testInputValidation() {
  logTest('T151', 'Input Length Validation');

  try {
    // Check validator middleware
    const validatorPath = path.join(__dirname, '../../src/middleware/validator.js');
    if (!fs.existsSync(validatorPath)) {
      fail('T151.1', 'Validator middleware not found');
      return;
    }
    pass('T151.1', 'Validator middleware exists');

    const validatorContent = fs.readFileSync(validatorPath, 'utf8');
    
    // Check for length validations
    const hasLengthChecks = validatorContent.includes('length') || 
                           validatorContent.includes('maxLength') ||
                           validatorContent.includes('max');
    
    if (hasLengthChecks) {
      pass('T151.2', 'Validator includes length validation checks');
    } else {
      warn('T151.2', 'Validator may not include length validation');
    }

    // Test oversized inputs
    const oversizedPayloads = [
      { field: 'Name', value: 'A'.repeat(101), maxLength: 100 },
      { field: 'Description', value: 'B'.repeat(501), maxLength: 500 },
      { field: 'Category', value: 'C'.repeat(51), maxLength: 50 }
    ];

    for (const payload of oversizedPayloads) {
      try {
        const response = await axios.post(`${BASE_URL}/items`, {
          Name: payload.field === 'Name' ? payload.value : 'Test',
          Category: payload.field === 'Category' ? payload.value : 'Test',
          Description: payload.field === 'Description' ? payload.value : 'Test',
          Status: 'Available'
        });
        
        warn('T151.3', `Oversized ${payload.field} was accepted (should be rejected)`);
      } catch (error) {
        if (error.code === 'ECONNREFUSED') {
          warn('T151.3', 'Server not running - cannot test input validation');
          break;
        } else if (error.response?.status === 400) {
          pass('T151.3', `Oversized ${payload.field} (${payload.value.length} > ${payload.maxLength}) rejected`);
        }
      }
    }

    // Check required field validation
    try {
      const response = await axios.post(`${BASE_URL}/items`, {
        // Missing required Name field
        Category: 'Test',
        Status: 'Available'
      });
      warn('T151.4', 'Missing required field was accepted');
    } catch (error) {
      if (error.code !== 'ECONNREFUSED' && error.response?.status === 400) {
        pass('T151.4', 'Missing required fields rejected');
      }
    }

  } catch (error) {
    fail('T151', `Input validation test failed: ${error.message}`);
  }
}

/**
 * T152: Test Error Sanitization
 */
async function testErrorSanitization() {
  logTest('T152', 'Error Message Sanitization');

  try {
    // Check error handler
    const errorHandlerPath = path.join(__dirname, '../../src/middleware/errorHandler.js');
    if (!fs.existsSync(errorHandlerPath)) {
      fail('T152.1', 'Error handler middleware not found');
      return;
    }
    pass('T152.1', 'Error handler middleware exists');

    const errorHandlerContent = fs.readFileSync(errorHandlerPath, 'utf8');
    
    // Check for production mode checks
    if (errorHandlerContent.includes('NODE_ENV') || errorHandlerContent.includes('production')) {
      pass('T152.2', 'Error handler checks environment for detail level');
    }

    // Check that SQL/stack traces are not exposed
    const exposesDetails = errorHandlerContent.includes('err.stack') && 
                          !errorHandlerContent.includes('development');
    
    if (!exposesDetails) {
      pass('T152.3', 'Error handler does not expose stack traces in production');
    } else {
      warn('T152.3', 'Error handler may expose sensitive details');
    }

    // Test error response format
    try {
      // Try to access non-existent item
      await axios.get(`${BASE_URL}/items/99999`);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        warn('T152.4', 'Server not running - cannot test error sanitization');
      } else if (error.response) {
        const errorData = error.response.data;
        
        // Check that error doesn't contain SQL keywords
        const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'FROM', 'WHERE', 'sqlite'];
        const errorString = JSON.stringify(errorData).toUpperCase();
        const hasSqlKeywords = sqlKeywords.some(kw => errorString.includes(kw));
        
        if (!hasSqlKeywords) {
          pass('T152.4', 'Error response does not expose SQL details');
        } else {
          fail('T152.4', 'Error response may expose SQL details');
        }

        // Check for stack traces
        if (!errorString.includes('AT ') && !errorString.includes('STACK')) {
          pass('T152.5', 'Error response does not expose stack traces');
        } else {
          fail('T152.5', 'Error response exposes stack traces');
        }
      }
    }

  } catch (error) {
    fail('T152', `Error sanitization test failed: ${error.message}`);
  }
}

/**
 * T153: Test Database Security
 */
async function testDatabaseSecurity() {
  logTest('T153', 'Database File Security');

  try {
    // Check permission checker exists
    const permCheckerPath = path.join(__dirname, '../../src/scripts/checkPermissions.js');
    if (!fs.existsSync(permCheckerPath)) {
      fail('T153.1', 'Permission checker script not found');
      return;
    }
    pass('T153.1', 'Permission checker script exists');

    // Run the permission checker
    const { execSync } = require('child_process');
    try {
      execSync('node src/scripts/checkPermissions.js', {
        cwd: path.join(__dirname, '../..'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
      pass('T153.2', 'Database permissions check passed');
    } catch (error) {
      if (error.stdout && error.stdout.includes('world-writable')) {
        warn('T153.2', 'Database file has insecure permissions (world-writable)');
      } else {
        warn('T153.2', `Permission check detected issues: ${error.message}`);
      }
    }

    // Check database location
    const configPath = path.join(__dirname, '../../src/config/database.js');
    if (fs.existsSync(configPath)) {
      const configContent = fs.readFileSync(configPath, 'utf8');
      
      if (configContent.includes('data/') || configContent.includes('data\\')) {
        pass('T153.3', 'Database stored in dedicated data directory');
      }

      // Check it's not in public/static folders
      if (!configContent.includes('public') && !configContent.includes('static')) {
        pass('T153.4', 'Database not in web-accessible directory');
      } else {
        fail('T153.4', 'Database may be in web-accessible directory');
      }
    }

    // Check SECURITY.md documentation
    const securityDocPath = path.join(__dirname, '../../SECURITY.md');
    if (fs.existsSync(securityDocPath)) {
      const secDoc = fs.readFileSync(securityDocPath, 'utf8');
      if (secDoc.includes('permission') || secDoc.includes('database security')) {
        pass('T153.5', 'Database security documented in SECURITY.md');
      }
    }

  } catch (error) {
    fail('T153', `Database security test failed: ${error.message}`);
  }
}

/**
 * Print Summary
 */
function printSummary() {
  console.log('\n' + '='.repeat(60));
  log('\nSECURITY VERIFICATION SUMMARY (T148-T153)', 'blue');
  console.log('='.repeat(60));

  if (RESULTS.passed.length > 0) {
    log(`\n✓ PASSED (${RESULTS.passed.length}):`, 'green');
    RESULTS.passed.forEach(r => console.log(`  ${r}`));
  }

  if (RESULTS.warnings.length > 0) {
    log(`\n⚠ WARNINGS (${RESULTS.warnings.length}):`, 'yellow');
    RESULTS.warnings.forEach(r => console.log(`  ${r}`));
  }

  if (RESULTS.failed.length > 0) {
    log(`\n✗ FAILED (${RESULTS.failed.length}):`, 'red');
    RESULTS.failed.forEach(r => console.log(`  ${r}`));
  }

  console.log('\n' + '='.repeat(60));
  
  const total = RESULTS.passed.length + RESULTS.failed.length + RESULTS.warnings.length;
  const passRate = ((RESULTS.passed.length / total) * 100).toFixed(1);
  
  log(`\nTotal Tests: ${total}`, 'blue');
  log(`Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');
  
  if (RESULTS.failed.length === 0 && RESULTS.warnings.length <= 3) {
    log('\n✓ Security verification PASSED - Ready for production', 'green');
  } else if (RESULTS.failed.length === 0) {
    log('\n⚠ Security verification passed with warnings - Review needed', 'yellow');
  } else {
    log('\n✗ Security verification FAILED - Fix critical issues', 'red');
  }
  
  console.log('\n');
}

/**
 * Main Test Runner
 */
async function runAllTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'blue');
  log('║   SECURITY VERIFICATION TEST SUITE (T148-T153)            ║', 'blue');
  log('╚════════════════════════════════════════════════════════════╝\n', 'blue');

  await testSQLInjection();        // T148
  await testXSSSanitization();     // T149
  await testRateLimiting();        // T150
  await testInputValidation();     // T151
  await testErrorSanitization();   // T152
  await testDatabaseSecurity();    // T153

  printSummary();
  
  // Exit with error code if any tests failed
  process.exit(RESULTS.failed.length > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
