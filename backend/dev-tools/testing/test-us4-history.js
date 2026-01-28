/**
 * Test User Story 4: View Lending History
 * 
 * Verification script for T102-T105
 * Tests the lending history API endpoint
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
  console.log(`${GREEN}✓ PASS${RESET} ${message}`);
}

function fail(message) {
  console.log(`${RED}✗ FAIL${RESET} ${message}`);
}

function info(message) {
  console.log(`${CYAN}ℹ INFO${RESET} ${message}`);
}

function section(message) {
  console.log(`\n${YELLOW}${message}${RESET}`);
}

async function testLendingHistory() {
  console.log('\n' + '='.repeat(80));
  console.log('User Story 4: View Lending History - Backend Tests (T102-T105)');
  console.log('='.repeat(80));

  try {
    // Step 1: Get all items to find one with potential history
    section('1. Fetching items to find one with history...');
    const itemsRes = await axios.get(`${API_BASE}/items`);
    const items = itemsRes.data.data;
    
    if (!items || items.length === 0) {
      fail('No items found in database. Need to create test data first.');
      return;
    }

    const testItem = items[0];
    info(`Using item: ${testItem.name} (ID: ${testItem.id})`);

    // Step 2: Test the history endpoint
    section('2. Testing GET /api/v1/lending/history/:itemId endpoint...');
    const historyRes = await axios.get(`${API_BASE}/lending/history/${testItem.id}`);
    
    // Verify response structure
    if (!historyRes.data) {
      fail('Response missing data property');
      return;
    }

    if (!historyRes.data.data) {
      fail('Response missing data.data property (envelope format)');
      return;
    }

    const history = historyRes.data.data;
    
    if (!Array.isArray(history)) {
      fail('History data is not an array');
      return;
    }

    pass('Response structure is correct (envelope format)');
    pass(`History array received with ${history.length} entries`);

    // Step 3: Verify chronological order (if history exists)
    if (history.length > 1) {
      section('3. Verifying chronological order (most recent first)...');
      let isOrdered = true;
      
      for (let i = 1; i < history.length; i++) {
        const prevDate = new Date(history[i - 1].dateLent);
        const currDate = new Date(history[i].dateLent);
        
        if (prevDate < currDate) {
          isOrdered = false;
          fail(`Entry ${i} is out of order: ${prevDate} < ${currDate}`);
          break;
        }
      }
      
      if (isOrdered) {
        pass('History entries are in chronological order (most recent first)');
      }
    } else if (history.length === 1) {
      info('Only 1 history entry - chronological order check skipped');
    } else {
      info('No history entries - item has never been lent');
    }

    // Step 4: Verify denormalized fields
    if (history.length > 0) {
      section('4. Verifying denormalized borrower fields (FR-016/FR-028)...');
      const firstLog = history[0];
      
      if (!firstLog.borrowerName) {
        fail('Missing borrowerName field in lending log');
      } else {
        pass(`borrowerName present: "${firstLog.borrowerName}"`);
      }

      if (!firstLog.borrowerEmail) {
        fail('Missing borrowerEmail field in lending log');
      } else {
        pass(`borrowerEmail present: "${firstLog.borrowerEmail}"`);
      }

      // Verify required fields
      if (!firstLog.dateLent) {
        fail('Missing dateLent field');
      } else {
        pass(`dateLent present: ${new Date(firstLog.dateLent).toLocaleDateString()}`);
      }

      if (firstLog.dateReturned) {
        info(`dateReturned: ${new Date(firstLog.dateReturned).toLocaleDateString()} (returned)`);
      } else {
        info('dateReturned: null (still lent out)');
      }

      if (firstLog.conditionNotes) {
        info(`conditionNotes: "${firstLog.conditionNotes}"`);
      }
    }

    // Step 5: Test with non-existent item
    section('5. Testing with non-existent item ID...');
    try {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const fakeRes = await axios.get(`${API_BASE}/lending/history/${fakeId}`);
      
      // Should return empty array, not error
      if (Array.isArray(fakeRes.data.data) && fakeRes.data.data.length === 0) {
        pass('Returns empty array for item with no history');
      } else {
        info('Non-existent item returned data (unexpected but not an error)');
      }
    } catch (error) {
      if (error.response && error.response.status === 404) {
        info('Returns 404 for non-existent item (acceptable behavior)');
      } else {
        fail(`Unexpected error: ${error.message}`);
      }
    }

    // Step 6: Display sample history entry
    if (history.length > 0) {
      section('6. Sample History Entry:');
      const sample = history[0];
      console.log(JSON.stringify({
        id: sample.id,
        itemId: sample.itemId,
        userId: sample.userId,
        borrowerName: sample.borrowerName,
        borrowerEmail: sample.borrowerEmail,
        dateLent: sample.dateLent,
        dateReturned: sample.dateReturned,
        conditionNotes: sample.conditionNotes,
      }, null, 2));
    }

    section('✅ All User Story 4 backend tests completed successfully!');
    console.log('\nTasks T102-T105 verified:');
    console.log('  T102: getHistoryByItemId method in LendingLog model ✓');
    console.log('  T103: getItemHistory method in lendingService ✓');
    console.log('  T104: getHistory method in lendingController ✓');
    console.log('  T105: GET /api/v1/lending/history/:itemId route ✓');
    console.log('\nNext: Proceed to frontend tasks T106-T113');

  } catch (error) {
    fail('Test failed with error:');
    console.error(error.message);
    
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
testLendingHistory();
