/**
 * Comprehensive Test: Multiple Lending History Entries
 * 
 * Creates multiple lending records to test chronological ordering
 * and verify all requirements for User Story 4
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3001/api/v1';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function pass(message) {
  console.log(`${GREEN}✓${RESET} ${message}`);
}

function fail(message) {
  console.log(`${RED}✗${RESET} ${message}`);
  process.exit(1);
}

function info(message) {
  console.log(`${CYAN}ℹ${RESET} ${message}`);
}

function section(message) {
  console.log(`\n${YELLOW}═══ ${message} ═══${RESET}`);
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testMultipleHistoryEntries() {
  console.log('\n' + '═'.repeat(80));
  console.log('User Story 4: Comprehensive History Test with Multiple Entries');
  console.log('═'.repeat(80));

  try {
    // Get available items
    section('1. Finding Available Item for Testing');
    const itemsRes = await axios.get(`${API_BASE}/items`);
    let testItem = itemsRes.data.data.find(item => item.status === 'Available');

    if (!testItem) {
      info('No available items found. Using first item and returning it if needed.');
      testItem = itemsRes.data.data[0];
      
      if (testItem.status === 'Lent') {
        info(`Returning item: ${testItem.name}`);
        await axios.post(`${API_BASE}/lending/return`, {
          itemId: testItem.id,
          returnConditionNotes: 'Returned for testing purposes'
        });
        
        // Refresh item status
        const updatedRes = await axios.get(`${API_BASE}/items/${testItem.id}`);
        testItem = updatedRes.data.data;
      }
    }

    pass(`Using item: ${testItem.name} (ID: ${testItem.id})`);

    // Get users
    section('2. Getting Users for Testing');
    const usersRes = await axios.get(`${API_BASE}/users`);
    const users = usersRes.data.data;
    
    if (users.length < 2) {
      fail('Need at least 2 users for testing. Please seed database.');
      return;
    }

    pass(`Found ${users.length} users`);

    // Get initial history
    section('3. Checking Initial History');
    const initialHistoryRes = await axios.get(`${API_BASE}/lending/history/${testItem.id}`);
    const initialHistory = initialHistoryRes.data.data;
    const initialCount = initialHistory.length;
    
    info(`Initial history entries: ${initialCount}`);

    // Create multiple lending/return cycles
    section('4. Creating Multiple Lending Cycles');
    
    for (let i = 0; i < 2; i++) {
      const user = users[i % users.length];
      
      info(`\nCycle ${i + 1}: Lending to ${user.name}`);
      
      // Lend the item
      const lendRes = await axios.post(`${API_BASE}/lending/lend`, {
        itemId: testItem.id,
        userId: user.id,
        conditionNotes: `Test lending cycle ${i + 1}`
      });
      
      pass(`  Lent successfully`);
      
      // Wait a moment to ensure different timestamps
      await sleep(100);
      
      // Return the item
      const returnRes = await axios.post(`${API_BASE}/lending/return`, {
        itemId: testItem.id,
        returnConditionNotes: `Test return cycle ${i + 1}`
      });
      
      pass(`  Returned successfully`);
      
      // Wait before next cycle
      await sleep(100);
    }

    // Get final history
    section('5. Verifying Complete History');
    const finalHistoryRes = await axios.get(`${API_BASE}/lending/history/${testItem.id}`);
    const finalHistory = finalHistoryRes.data.data;
    
    const expectedNewEntries = 2;
    const actualNewEntries = finalHistory.length - initialCount;
    
    if (actualNewEntries === expectedNewEntries) {
      pass(`Added ${actualNewEntries} new history entries (expected ${expectedNewEntries})`);
    } else {
      fail(`Expected ${expectedNewEntries} new entries, but got ${actualNewEntries}`);
    }

    // Verify chronological order
    section('6. Verifying Chronological Order (FR-021)');
    let isOrdered = true;
    
    for (let i = 1; i < finalHistory.length; i++) {
      const prevDate = new Date(finalHistory[i - 1].dateLent);
      const currDate = new Date(finalHistory[i].dateLent);
      
      if (prevDate < currDate) {
        isOrdered = false;
        fail(`Entry ${i} is out of order: ${prevDate.toISOString()} < ${currDate.toISOString()}`);
        break;
      }
    }
    
    if (isOrdered) {
      pass('All entries are in correct chronological order (most recent first)');
    }

    // Verify all entries have required fields
    section('7. Verifying Required Fields in All Entries');
    let allFieldsValid = true;
    
    finalHistory.forEach((entry, index) => {
      const missing = [];
      
      if (!entry.id) missing.push('id');
      if (!entry.itemId) missing.push('itemId');
      if (!entry.userId) missing.push('userId');
      if (!entry.borrowerName) missing.push('borrowerName');
      if (!entry.borrowerEmail) missing.push('borrowerEmail');
      if (!entry.dateLent) missing.push('dateLent');
      
      if (missing.length > 0) {
        fail(`Entry ${index} missing fields: ${missing.join(', ')}`);
        allFieldsValid = false;
      }
    });
    
    if (allFieldsValid) {
      pass(`All ${finalHistory.length} entries have required fields`);
    }

    // Display summary
    section('8. History Summary');
    console.log(`\nTotal history entries: ${finalHistory.length}`);
    console.log(`\nMost recent 3 entries:`);
    
    finalHistory.slice(0, 3).forEach((entry, index) => {
      const lentDate = new Date(entry.dateLent).toLocaleString();
      const returnDate = entry.dateReturned ? new Date(entry.dateReturned).toLocaleString() : 'Still out';
      
      console.log(`\n${index + 1}. Borrowed by: ${entry.borrowerName}`);
      console.log(`   Email: ${entry.borrowerEmail}`);
      console.log(`   Lent: ${lentDate}`);
      console.log(`   Returned: ${returnDate}`);
      if (entry.conditionNotes) {
        console.log(`   Notes: ${entry.conditionNotes}`);
      }
    });

    // Verify response envelope
    section('9. Verifying Response Envelope Format (FR-002-API)');
    if (finalHistoryRes.data.data && 
        finalHistoryRes.data.hasOwnProperty('error') && 
        finalHistoryRes.data.hasOwnProperty('message')) {
      pass('Response uses correct envelope format');
    } else {
      fail('Response envelope format incorrect');
    }

    section('✅ All Comprehensive Tests Passed!');
    console.log('\nUser Story 4 backend implementation verified with:');
    console.log('  ✓ Multiple history entries');
    console.log('  ✓ Chronological ordering');
    console.log('  ✓ Denormalized borrower fields');
    console.log('  ✓ Complete field validation');
    console.log('  ✓ Response envelope format');
    console.log('\n✓ Ready for frontend implementation (T106-T113)');

  } catch (error) {
    fail(`Test failed: ${error.message}`);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
    
    if (error.code === 'ECONNREFUSED') {
      console.error('\nℹ Make sure the backend server is running:');
      console.error('  cd backend && npm start');
    }
  }
}

// Run tests
testMultipleHistoryEntries();
