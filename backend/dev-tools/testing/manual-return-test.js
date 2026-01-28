// Simple manual test for return with notes
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function test() {
  try {
    // Create item
    const item = await axios.post(`${BASE_URL}/items`, {
      name: 'Manual Test Item',
      category: 'Test',
      status: 'Available'
    });
    const itemId = item.data.data.id;
    console.log('Created item:', itemId);

    // Get user
    const users = await axios.get(`${BASE_URL}/users`);
    const userId = users.data.data[0].id;
    console.log('Using user:', userId);

    // Lend without notes
    const lendRes = await axios.post(`${BASE_URL}/lending/lend`, {
      itemId,
      userId
    });
    console.log('\nLent item - conditionNotes:', lendRes.data.data.log.conditionNotes);

    // Return WITH notes
    console.log('\n Returning with notes...');
    const returnRes = await axios.post(`${BASE_URL}/lending/return`, {
      itemId: itemId,
      returnConditionNotes: 'Test return notes here'
    });
    
    console.log('Return response log:', JSON.stringify(returnRes.data.data.log, null, 2));
    console.log('\nReturn conditionNotes:', returnRes.data.data.log.conditionNotes);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

test();
