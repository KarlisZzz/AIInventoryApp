/**
 * Test Item API Endpoints
 * 
 * Simple test script to verify backend User Story 1 implementation (T034-T041)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// Color output helpers
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  reset: '\x1b[0m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test results tracking
let passed = 0;
let failed = 0;

async function test(description, fn) {
  try {
    log(`\n🧪 ${description}`, 'blue');
    await fn();
    log(`✓ PASS`, 'green');
    passed++;
  } catch (error) {
    log(`✗ FAIL: ${error.message}`, 'red');
    if (error.response) {
      log(`  Response: ${JSON.stringify(error.response.data, null, 2)}`, 'yellow');
    }
    failed++;
  }
}

async function runTests() {
  log('\n=== Testing Item API (User Story 1) ===\n', 'blue');
  
  let createdItemId = null;
  
  // Test T034-T035: Create Item
  await test('T034-T035: Create a new item', async () => {
    const response = await axios.post(`${BASE_URL}/items`, {
      name: 'Test Laptop',
      description: 'Dell XPS 15 for testing',
      category: 'Hardware',
      status: 'Available',
    });
    
    if (response.status !== 201) {
      throw new Error(`Expected 201, got ${response.status}`);
    }
    
    if (!response.data.data || !response.data.data.id) {
      throw new Error('Response missing item data or ID');
    }
    
    createdItemId = response.data.data.id;
    log(`  Created item ID: ${createdItemId}`, 'yellow');
  });
  
  // Test T038: Input validation - missing name
  await test('T038: Validation rejects missing name', async () => {
    try {
      await axios.post(`${BASE_URL}/items`, {
        category: 'Hardware',
      });
      throw new Error('Should have rejected missing name');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`  Correctly rejected with 400`, 'yellow');
      } else {
        throw error;
      }
    }
  });
  
  // Test T038: Input validation - missing category
  await test('T038: Validation rejects missing category', async () => {
    try {
      await axios.post(`${BASE_URL}/items`, {
        name: 'Test Item',
      });
      throw new Error('Should have rejected missing category');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`  Correctly rejected with 400`, 'yellow');
      } else {
        throw error;
      }
    }
  });
  
  // Test T038: Input validation - invalid status
  await test('T038: Validation rejects invalid status', async () => {
    try {
      await axios.post(`${BASE_URL}/items`, {
        name: 'Test Item',
        category: 'Hardware',
        status: 'InvalidStatus',
      });
      throw new Error('Should have rejected invalid status');
    } catch (error) {
      if (error.response && error.response.status === 400) {
        log(`  Correctly rejected with 400`, 'yellow');
      } else {
        throw error;
      }
    }
  });
  
  // Test T036: Get all items
  await test('T036: Get all items', async () => {
    const response = await axios.get(`${BASE_URL}/items`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!Array.isArray(response.data.data)) {
      throw new Error('Response data should be an array');
    }
    
    log(`  Found ${response.data.data.length} items`, 'yellow');
  });
  
  // Test T036: Get item by ID
  await test('T036: Get item by ID', async () => {
    if (!createdItemId) {
      throw new Error('No item ID available from creation test');
    }
    
    const response = await axios.get(`${BASE_URL}/items/${createdItemId}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (response.data.data.id !== createdItemId) {
      throw new Error('Returned item ID does not match requested ID');
    }
    
    log(`  Retrieved item: ${response.data.data.name}`, 'yellow');
  });
  
  // Test T040: Search items
  await test('T040: Search items by keyword', async () => {
    const response = await axios.get(`${BASE_URL}/items/search?q=Laptop`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!Array.isArray(response.data.data)) {
      throw new Error('Response data should be an array');
    }
    
    log(`  Found ${response.data.data.length} matching items`, 'yellow');
  });
  
  // Test T040: Filter by status
  await test('T040: Filter items by status', async () => {
    const response = await axios.get(`${BASE_URL}/items?status=Available`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const items = response.data.data;
    const allAvailable = items.every(item => item.status === 'Available');
    
    if (!allAvailable) {
      throw new Error('Some returned items are not Available');
    }
    
    log(`  All ${items.length} items have status=Available`, 'yellow');
  });
  
  // Test T040: Filter by category
  await test('T040: Filter items by category', async () => {
    const response = await axios.get(`${BASE_URL}/items?category=Hardware`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    const items = response.data.data;
    const allHardware = items.every(item => item.category === 'Hardware');
    
    if (!allHardware) {
      throw new Error('Some returned items are not Hardware');
    }
    
    log(`  All ${items.length} items have category=Hardware`, 'yellow');
  });
  
  // Test T036: Update item
  await test('T036: Update an item', async () => {
    if (!createdItemId) {
      throw new Error('No item ID available from creation test');
    }
    
    const response = await axios.put(`${BASE_URL}/items/${createdItemId}`, {
      description: 'Updated description for testing',
    });
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (response.data.data.description !== 'Updated description for testing') {
      throw new Error('Description was not updated');
    }
    
    log(`  Updated description successfully`, 'yellow');
  });
  
  // Test T039: Attempt to delete item with Available status (should succeed if no lending history)
  await test('T039: Delete item without lending history', async () => {
    if (!createdItemId) {
      throw new Error('No item ID available from creation test');
    }
    
    const response = await axios.delete(`${BASE_URL}/items/${createdItemId}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    log(`  Item deleted successfully`, 'yellow');
    
    // Verify item is gone
    try {
      await axios.get(`${BASE_URL}/items/${createdItemId}`);
      throw new Error('Item should not exist after deletion');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        log(`  Confirmed item no longer exists`, 'yellow');
      } else {
        throw error;
      }
    }
  });
  
  // Test T037: Get categories
  await test('T037: Get all categories', async () => {
    const response = await axios.get(`${BASE_URL}/items/categories`);
    
    if (response.status !== 200) {
      throw new Error(`Expected 200, got ${response.status}`);
    }
    
    if (!Array.isArray(response.data.data)) {
      throw new Error('Response data should be an array');
    }
    
    log(`  Found ${response.data.data.length} categories`, 'yellow');
  });
  
  // Summary
  log('\n=== Test Summary ===', 'blue');
  log(`✓ Passed: ${passed}`, 'green');
  log(`✗ Failed: ${failed}`, 'red');
  log(`Total: ${passed + failed}\n`, 'yellow');
  
  if (failed > 0) {
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\nFatal error: ${error.message}`, 'red');
  process.exit(1);
});
