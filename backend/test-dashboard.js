/**
 * Test Dashboard API Endpoint
 * 
 * Tests the new dashboard endpoint (User Story 5 - T119-T122)
 * 
 * Usage: node test-dashboard.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001';

async function testDashboardEndpoint() {
  console.log('='.repeat(80));
  console.log('Testing Dashboard API Endpoint (User Story 5)');
  console.log('='.repeat(80));
  
  try {
    console.log('\n1. GET /api/v1/dashboard - Retrieve dashboard data');
    const response = await axios.get(`${BASE_URL}/api/v1/dashboard`);
    
    console.log('✓ Status:', response.status);
    console.log('✓ Response structure:');
    console.log('  - data:', typeof response.data.data);
    console.log('  - message:', response.data.message);
    
    const { data } = response.data;
    
    console.log('\n✓ Dashboard data:');
    console.log('  - currentlyOut:', data.currentlyOut.length, 'items');
    console.log('  - allItems:', data.allItems.length, 'items');
    console.log('  - stats.totalItems:', data.stats.totalItems);
    console.log('  - stats.itemsOut:', data.stats.itemsOut);
    console.log('  - stats.itemsAvailable:', data.stats.itemsAvailable);
    
    if (data.currentlyOut.length > 0) {
      console.log('\n✓ Currently out items (first 3):');
      data.currentlyOut.slice(0, 3).forEach((item, idx) => {
        console.log(`  ${idx + 1}. ${item.name} (${item.category}) - Status: ${item.status}`);
      });
    } else {
      console.log('\n✓ No items currently out');
    }
    
    // Test with filters
    console.log('\n2. GET /api/v1/dashboard?status=Available - Filter by status');
    const filteredResponse = await axios.get(`${BASE_URL}/api/v1/dashboard?status=Available`);
    const filteredData = filteredResponse.data.data;
    
    console.log('✓ Filtered results:');
    console.log('  - allItems:', filteredData.allItems.length, 'items');
    console.log('  - All items have status "Available":', 
      filteredData.allItems.every(item => item.status === 'Available'));
    
    // Test with search
    console.log('\n3. GET /api/v1/dashboard?search=laptop - Search items');
    const searchResponse = await axios.get(`${BASE_URL}/api/v1/dashboard?search=laptop`);
    const searchData = searchResponse.data.data;
    
    console.log('✓ Search results:');
    console.log('  - allItems:', searchData.allItems.length, 'items matching "laptop"');
    
    console.log('\n' + '='.repeat(80));
    console.log('✓ All dashboard tests passed!');
    console.log('='.repeat(80));
    
  } catch (error) {
    console.error('\n✗ Test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.status, error.response.data);
    }
    process.exit(1);
  }
}

// Run tests
testDashboardEndpoint();
