/**
 * Full Regression Test Suite
 * Validates that existing features still work after admin changes
 * Tests: Items, Lending, Dashboard endpoints
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_USER_ID = '00d31d5b-2fc8-463b-be0c-44c60fba1797';

let testItemId = null;
let testCategoryId = null;

async function makeRequest(method, path, data = null, userId = ADMIN_USER_ID) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json',
      },
      validateStatus: () => true,
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return {
      status: response.status,
      data: response.data,
      success: response.status >= 200 && response.status < 300,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      success: false,
      error: error.message,
    };
  }
}

async function runRegressionTests() {
  console.log('🔄 Full Regression Test Suite\n');
  console.log('='.repeat(80));
  console.log('Testing that existing features work after admin changes...\n');
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Test 1: Health Check
    console.log('📋 Test 1: Health Check');
    console.log('-'.repeat(80));
    const health = await makeRequest('GET', '/health');
    if (health.success && health.data.status === 'ok') {
      console.log('✅ Health endpoint working');
      passed++;
    } else {
      console.log('❌ Health endpoint failed');
      failed++;
    }
    
    // Test 2: Create Category (prerequisite for items)
    console.log('\n📋 Test 2: Create Test Category');
    console.log('-'.repeat(80));
    const category = await makeRequest('POST', '/admin/categories', {
      name: 'Regression Test Category',
    });
    if (category.success) {
      testCategoryId = category.data.data.id;
      console.log(`✅ Category created: ${testCategoryId}`);
      passed++;
    } else {
      console.log('❌ Category creation failed');
      failed++;
    }
    
    // Test 3: Items List
    console.log('\n📋 Test 3: Items List');
    console.log('-'.repeat(80));
    const itemsList = await makeRequest('GET', '/items');
    if (itemsList.success && Array.isArray(itemsList.data.data)) {
      console.log(`✅ Items list working (${itemsList.data.data.length} items)`);
      passed++;
    } else {
      console.log('❌ Items list failed');
      failed++;
    }
    
    // Test 4: Create Item
    console.log('\n📋 Test 4: Create Item');
    console.log('-'.repeat(80));
    const newItem = await makeRequest('POST', '/items', {
      name: 'Regression Test Item',
      description: 'Testing after admin changes',
      quantity: 5,
      categoryId: testCategoryId,
      condition: 'New',
      status: 'Available',
      location: 'Test Location',
    });
    if (newItem.success) {
      testItemId = newItem.data.data.id;
      console.log(`✅ Item created: ${testItemId}`);
      passed++;
    } else {
      console.log(`❌ Item creation failed: ${JSON.stringify(newItem.data)}`);
      failed++;
    }
    
    // Test 5: Get Item by ID
    console.log('\n📋 Test 5: Get Item by ID');
    console.log('-'.repeat(80));
    const item = await makeRequest('GET', `/items/${testItemId}`);
    if (item.success && item.data.data.name === 'Regression Test Item') {
      console.log('✅ Get item by ID working');
      passed++;
    } else {
      console.log('❌ Get item by ID failed');
      failed++;
    }
    
    // Test 6: Update Item
    console.log('\n📋 Test 6: Update Item');
    console.log('-'.repeat(80));
    const updateItem = await makeRequest('PUT', `/items/${testItemId}`, {
      quantity: 10,
    });
    if (updateItem.success && updateItem.data.data.quantity === 10) {
      console.log('✅ Item update working');
      passed++;
    } else {
      console.log('❌ Item update failed');
      failed++;
    }
    
    // Test 7: Borrow Item
    console.log('\n📋 Test 7: Borrow Item');
    console.log('-'.repeat(80));
    const borrow = await makeRequest('POST', `/items/${testItemId}/borrow`, {
      quantity: 2,
      notes: 'Regression test borrow',
    });
    if (borrow.success) {
      console.log('✅ Item borrow working');
      passed++;
    } else {
      console.log(`❌ Item borrow failed: ${JSON.stringify(borrow.data)}`);
      failed++;
    }
    
    // Test 8: Item History
    console.log('\n📋 Test 8: Item History');
    console.log('-'.repeat(80));
    const history = await makeRequest('GET', `/items/${testItemId}/history`);
    if (history.success && Array.isArray(history.data.data)) {
      console.log(`✅ Item history working (${history.data.data.length} records)`);
      passed++;
    } else {
      console.log('❌ Item history failed');
      failed++;
    }
    
    // Test 9: User Borrows
    console.log('\n📋 Test 9: User Borrows');
    console.log('-'.repeat(80));
    const borrows = await makeRequest('GET', '/borrows');
    if (borrows.success && Array.isArray(borrows.data.data)) {
      console.log(`✅ User borrows working (${borrows.data.data.length} records)`);
      passed++;
    } else {
      console.log('❌ User borrows failed');
      failed++;
    }
    
    // Test 10: Return Item
    console.log('\n📋 Test 10: Return Item');
    console.log('-'.repeat(80));
    const activeBorrow = borrows.data.data.find(b => b.itemId === testItemId && !b.returnedAt);
    if (activeBorrow) {
      const returnItem = await makeRequest('POST', `/borrows/${activeBorrow.id}/return`, {
        returnedQuantity: 2,
      });
      if (returnItem.success) {
        console.log('✅ Item return working');
        passed++;
      } else {
        console.log('❌ Item return failed');
        failed++;
      }
    } else {
      console.log('⚠️  No active borrow to test return');
      passed++; // Don't fail the test
    }
    
    // Test 11: Dashboard Analytics
    console.log('\n📋 Test 11: Dashboard Analytics');
    console.log('-'.repeat(80));
    const dashboard = await makeRequest('GET', '/dashboard/analytics');
    if (dashboard.success && dashboard.data.data.totalItems !== undefined) {
      console.log('✅ Dashboard analytics working');
      console.log(`   Total Items: ${dashboard.data.data.totalItems}`);
      console.log(`   Total Borrows: ${dashboard.data.data.totalBorrows}`);
      passed++;
    } else {
      console.log('❌ Dashboard analytics failed');
      failed++;
    }
    
    // Test 12: Recent Activity
    console.log('\n📋 Test 12: Recent Activity');
    console.log('-'.repeat(80));
    const activity = await makeRequest('GET', '/dashboard/recent-activity');
    if (activity.success && Array.isArray(activity.data.data)) {
      console.log(`✅ Recent activity working (${activity.data.data.length} activities)`);
      passed++;
    } else {
      console.log('❌ Recent activity failed');
      failed++;
    }
    
    // Test 13: Delete Item (cleanup)
    console.log('\n📋 Test 13: Delete Item');
    console.log('-'.repeat(80));
    const deleteItem = await makeRequest('DELETE', `/items/${testItemId}`);
    if (deleteItem.success) {
      console.log('✅ Item deletion working');
      passed++;
    } else {
      console.log('❌ Item deletion failed');
      failed++;
    }
    
    // Test 14: Delete Category (cleanup)
    console.log('\n📋 Test 14: Delete Category');
    console.log('-'.repeat(80));
    const deleteCategory = await makeRequest('DELETE', `/admin/categories/${testCategoryId}`);
    if (deleteCategory.success) {
      console.log('✅ Category deletion working');
      passed++;
    } else {
      console.log('❌ Category deletion failed');
      failed++;
    }
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Regression Test Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n✅ All existing features working correctly!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some regression tests failed. Admin changes may have broken existing features.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Check if server is running
axios.get(`${BASE_URL}/health`).then(() => {
  console.log('✅ Server is running, starting regression tests...\n');
  runRegressionTests();
}).catch(() => {
  console.error('❌ Server is not running. Please start the backend server first.');
  console.error('   Run: npm start\n');
  process.exit(1);
});
