/**
 * Manual Security Tests - Quick verification for specific concerns
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testXSSWithSanitizer() {
  console.log('\n=== Testing XSS Sanitization ===');
  
  const xssPayload = '<script>alert("XSS")</script>';
  
  try {
    const response = await axios.post(`${BASE_URL}/items`, {
      Name: xssPayload,
      Category: 'Test',
      Status: 'Available',
      Description: '<img src=x onerror="alert(1)">'
    });
    
    const item = response.data.data;
    console.log('✓ Item created');
    console.log('  Name:', item.Name);
    console.log('  Description:', item.Description);
    
    if (item.Name.includes('<script>')) {
      console.log('✗ XSS NOT sanitized - script tag present!');
    } else {
      console.log('✓ XSS sanitized - script tag removed');
    }
    
    // Clean up
    await axios.delete(`${BASE_URL}/items/${item.ItemID}`).catch(() => {});
    
  } catch (error) {
    console.log('✗ Error:', error.response?.data || error.message);
  }
}

async function testRateLimiting() {
  console.log('\n=== Testing Rate Limiting ===');
  
  let successCount = 0;
  let rateLimitedCount = 0;
  const totalRequests = 110; // Exceed 100 req/min limit
  
  console.log(`Sending ${totalRequests} rapid requests...`);
  
  const requests = [];
  for (let i = 0; i < totalRequests; i++) {
    requests.push(
      axios.get(`${BASE_URL}/items`)
        .then(() => { successCount++; })
        .catch(err => {
          if (err.response?.status === 429) {
            rateLimitedCount++;
          }
        })
    );
  }
  
  await Promise.all(requests);
  
  console.log(`✓ Success: ${successCount}`);
  console.log(`✓ Rate Limited (429): ${rateLimitedCount}`);
  
  if (rateLimitedCount > 0) {
    console.log('✓ Rate limiting is ACTIVE');
  } else {
    console.log('⚠ Rate limiting may not be active (or limit not reached)');
  }
}

async function runTests() {
  console.log('╔════════════════════════════════════════╗');
  console.log('║   Manual Security Tests               ║');
  console.log('╚════════════════════════════════════════╝');
  
  await testXSSWithSanitizer();
  await testRateLimiting();
  
  console.log('\n✓ Manual tests complete\n');
}

runTests().catch(console.error);
