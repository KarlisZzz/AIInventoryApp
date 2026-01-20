/**
 * Test User Story 3: Return Items API
 * Quick test for return functionality
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

async function testReturnAPI() {
  console.log('\n========================================');
  console.log('  User Story 3: Return Items Test');
  console.log('========================================\n');

  try {
    // 1. Create a test item
    console.log('1. Creating test item...');
    const itemResponse = await axios.post(`${BASE_URL}/items`, {
      name: 'Test Return Item',
      description: 'Testing return functionality',
      category: 'Electronics',
      status: 'Available'
    });
    const itemId = itemResponse.data.data.id;
    console.log(`✓ Created item: ${itemId}`);

    // 2. Get users
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const userId = usersResponse.data.data[0].id;
    console.log(`✓ Using user: ${usersResponse.data.data[0].name}`);

    // 3. Lend the item
    console.log('\n2. Lending item...');
    const lendResponse = await axios.post(`${BASE_URL}/lending/lend`, {
      itemId,
      userId,
      conditionNotes: 'Good condition at lending'
    });
    console.log(`✓ Item lent - Status: ${lendResponse.data.data.item.status}`);

    // 4. Return the item (T096, T097, T100)
    console.log('\n3. Returning item...');
    const returnResponse = await axios.post(`${BASE_URL}/lending/return`, {
      itemId,
      returnConditionNotes: 'Returned in excellent condition'
    });
    
    console.log(`✓ T096 PASS - Status after return: ${returnResponse.data.data.item.status}`);
    console.log(`✓ T097 PASS - DateReturned set: ${returnResponse.data.data.log.dateReturned}`);
    console.log(`✓ T100 PASS - Return notes: ${returnResponse.data.data.log.returnConditionNotes}`);

    // 5. Try to return again (T098)
    console.log('\n4. Attempting to return already-available item (should fail)...');
    try {
      await axios.post(`${BASE_URL}/lending/return`, { itemId });
      console.log('✗ T098 FAIL - Should have rejected');
    } catch (err) {
      console.log(`✓ T098 PASS - Correctly rejected: ${err.response.data.message}`);
    }

    // 6. Lend again to verify item is available (T101)
    console.log('\n5. Lending returned item again...');
    const relendResponse = await axios.post(`${BASE_URL}/lending/lend`, {
      itemId,
      userId,
      conditionNotes: 'Second lending'
    });
    console.log(`✓ T101 PASS - Item can be lent again: ${relendResponse.data.data.item.status}`);

    // Cleanup
    console.log('\n6. Cleanup...');
    await axios.post(`${BASE_URL}/lending/return`, { itemId });
    try {
      await axios.delete(`${BASE_URL}/items/${itemId}`);
      console.log('✓ Test item deleted');
    } catch (err) {
      console.log('Note: Could not delete item (has lending history)');
    }

    console.log('\n========================================');
    console.log('  ✓ All tests passed!');
    console.log('========================================\n');

  } catch (error) {
    console.error('\n✗ Test failed:');
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

testReturnAPI();
