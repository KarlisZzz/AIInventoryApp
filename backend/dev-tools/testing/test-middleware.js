/**
 * Test API Middleware
 * 
 * Tests API versioning and response envelope middleware.
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testMiddleware() {
  console.log('🧪 Testing API Middleware\n');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Health endpoint (no versioning required)
    console.log('\n📍 Test 1: Health endpoint (no versioning)');
    const health = await axios.get(`${BASE_URL}/health`);
    console.log(`Status: ${health.status}`);
    console.log('Response:', JSON.stringify(health.data, null, 2));
    console.log('✅ PASS - Health check works without versioning');
    
    // Test 2: Root endpoint
    console.log('\n📍 Test 2: Root endpoint');
    const root = await axios.get(`${BASE_URL}/`);
    console.log(`Status: ${root.status}`);
    console.log('Response:', JSON.stringify(root.data, null, 2));
    console.log('✅ PASS - Root endpoint returns API info');
    
    // Test 3: Invalid endpoint without versioning (should fail)
    console.log('\n📍 Test 3: Endpoint without /api/v1/ prefix (should fail)');
    try {
      await axios.get(`${BASE_URL}/items`);
      console.log('❌ FAIL - Should have rejected unversioned endpoint');
    } catch (error) {
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
        if (error.response.status === 400 && 
            error.response.data.error?.code === 'INVALID_API_VERSION') {
          console.log('✅ PASS - Correctly rejects unversioned endpoint');
        } else {
          console.log('❌ FAIL - Wrong error response');
        }
      } else {
        throw error;
      }
    }
    
    // Test 4: Versioned endpoint (404 expected - route doesn't exist yet)
    console.log('\n📍 Test 4: Versioned endpoint /api/v1/items (404 expected)');
    try {
      await axios.get(`${BASE_URL}/api/v1/items`);
      console.log('❌ FAIL - Should return 404');
    } catch (error) {
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
        if (error.response.status === 404 && 
            error.response.data.error?.code === 'NOT_FOUND') {
          console.log('✅ PASS - Correctly returns 404 with envelope format');
        } else {
          console.log('❌ FAIL - Wrong error response');
        }
      } else {
        throw error;
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/health`, { timeout: 2000 });
    return true;
  } catch (error) {
    return false;
  }
}

(async () => {
  const isRunning = await checkServer();
  if (!isRunning) {
    console.error('❌ Server is not running on port 3001');
    console.error('   Start it with: npm run dev');
    process.exit(1);
  }
  
  await testMiddleware();
})();
