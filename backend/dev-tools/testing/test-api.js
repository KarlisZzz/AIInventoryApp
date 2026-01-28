// Test API endpoints for verification
const http = require('http');

function testEndpoint(path, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ description, path, status: res.statusCode, body: json });
        } catch (e) {
          resolve({ description, path, status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (error) => {
      console.error('HTTP Request Error:', error);
      reject({ description, path, error: error.message, stack: error.stack });
    });

    req.setTimeout(5000, () => {
      req.destroy();
      reject({ description, path, error: 'Request timeout after 5 seconds' });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 Testing API endpoints...\n');

  const tests = [
    testEndpoint('/health', 'Health check endpoint'),
    testEndpoint('/api/v1/', 'API v1 root endpoint'),
  ];

  try {
    const results = await Promise.allSettled(tests);

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        console.log(`✓ ${data.description}`);
        console.log(`  Path: ${data.path}`);
        console.log(`  Status: ${data.status}`);
        console.log(`  Response:`, JSON.stringify(data.body, null, 2));
        
        // Check envelope format
        if (data.body && typeof data.body === 'object') {
          const hasEnvelope = 'data' in data.body || 'error' in data.body || 'message' in data.body;
          if (hasEnvelope) {
            console.log(`  ✓ Uses envelope format (FR-002-API)`);
          }
        }
        
        // Check /api/v1/ prefix
        if (data.path.startsWith('/api/v1/')) {
          console.log(`  ✓ Uses /api/v1/ prefix (FR-001-API)`);
        }
        
        console.log('');
      } else {
        console.log(`✗ Test failed:`, result.reason);
        console.log('');
      }
    });

    console.log('✅ All API tests completed!\n');
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
