/**
 * Test Dashboard Endpoint
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_ID = '00d31d5b-2fc8-463b-be0c-44c60fba1797';

async function testDashboard() {
  try {
    console.log('Testing dashboard endpoint...\n');
    
    const response = await axios.get(`${BASE_URL}/admin/dashboard`, {
      headers: { 'x-user-id': ADMIN_ID }
    });
    
    console.log('✓ Success!');
    console.log('\nDashboard data:');
    console.log(JSON.stringify(response.data.data, null, 2));
    
  } catch (error) {
    console.error('✗ Error testing dashboard:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testDashboard();
