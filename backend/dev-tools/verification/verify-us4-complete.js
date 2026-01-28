/**
 * User Story 4 Verification Tests (T114-T118)
 * Tests lending history display with chronological order, filtering, and denormalized data
 */

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'http://localhost:3001/api/v1';
const DB_PATH = path.join(__dirname, 'data', 'inventory.db');

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function header(message) {
  console.log('\n' + '='.repeat(80));
  log(message, 'cyan');
  console.log('='.repeat(80));
}

// Helper to check if server is running
async function checkServer() {
  try {
    await axios.get(`${BASE_URL}/items`);
    return true;
  } catch (error) {
    return false;
  }
}

// Helper to query database directly
function queryDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READONLY);
    db.all(sql, params, (err, rows) => {
      db.close();
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to execute database changes
function execDb(sql, params = []) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH);
    db.run(sql, params, function(err) {
      db.close();
      if (err) reject(err);
      else resolve(this);
    });
  });
}

// Setup test data: Create item with multiple lending history records
async function setupTestData() {
  header('Setting up test data for US4 verification');
  
  try {
    // Create a test item with multiple lending transactions
    log('Creating test item for history verification...', 'yellow');
    const itemResponse = await axios.post(`${BASE_URL}/items`, {
      name: 'US4 Test Laptop',
      description: 'Test item for history verification',
      category: 'Electronics',
      status: 'Available'
    });
    const testItemId = itemResponse.data.data.id;
    log(`✓ Created test item: ${testItemId}`, 'green');

    // Create another item with no history
    const noHistoryResponse = await axios.post(`${BASE_URL}/items`, {
      name: 'US4 Never Lent Item',
      description: 'Item with no lending history',
      category: 'Books',
      status: 'Available'
    });
    const noHistoryItemId = noHistoryResponse.data.data.id;
    log(`✓ Created never-lent item: ${noHistoryItemId}`, 'green');

    // Get users for lending
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data.data;
    
    if (users.length < 2) {
      throw new Error('Need at least 2 users for testing');
    }

    // Create multiple lending transactions with delays for chronological testing
    log('\nCreating multiple lending transactions...', 'yellow');
    
    // Transaction 1 (oldest)
    await axios.post(`${BASE_URL}/lending/lend`, {
      itemId: testItemId,
      userId: users[0].id,
      conditionNotes: 'First loan - excellent condition'
    });
    log('✓ Created transaction 1', 'green');
    
    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return transaction 1
    await axios.post(`${BASE_URL}/lending/return`, {
      itemId: testItemId,
      returnConditionNotes: 'Returned in good condition'
    });
    log('✓ Returned transaction 1', 'green');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Transaction 2
    await axios.post(`${BASE_URL}/lending/lend`, {
      itemId: testItemId,
      userId: users[1].id,
      conditionNotes: 'Second loan - good condition'
    });
    log('✓ Created transaction 2', 'green');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return transaction 2
    await axios.post(`${BASE_URL}/lending/return`, {
      itemId: testItemId,
      returnConditionNotes: 'All accessories included'
    });
    log('✓ Returned transaction 2', 'green');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Transaction 3 (newest - still lent)
    await axios.post(`${BASE_URL}/lending/lend`, {
      itemId: testItemId,
      userId: users[0].id,
      conditionNotes: 'Third loan - latest transaction'
    });
    log('✓ Created transaction 3 (active)', 'green');

    // Get the denormalized borrower name for verification
    const logs = await queryDb(
      'SELECT borrowerName, borrowerEmail FROM LendingLogs WHERE itemId = ? ORDER BY dateLent DESC LIMIT 1',
      [testItemId]
    );
    
    return {
      testItemId,
      noHistoryItemId,
      users,
      expectedBorrowerName: logs[0]?.borrowerName || 'Unknown',
      expectedBorrowerEmail: logs[0]?.borrowerEmail || 'unknown@test.com'
    };
  } catch (error) {
    log(`✗ Setup failed: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    throw error;
  }
}

// T114: Test chronological order (newest first)
async function testChronologicalOrder(testData) {
  header('T114: View history - confirm chronological order (newest first)');
  
  try {
    const response = await axios.get(`${BASE_URL}/lending/history/${testData.testItemId}`);
    const history = response.data.data;
    
    log(`Retrieved ${history.length} history records`, 'yellow');
    
    if (history.length < 3) {
      throw new Error(`Expected at least 3 history records, got ${history.length}`);
    }

    // Check chronological order (newest first)
    let previousDate = null;
    let isChronological = true;
    
    for (let i = 0; i < history.length; i++) {
      const record = history[i];
      const currentDate = new Date(record.dateLent);
      
      log(`  [${i + 1}] ${record.borrowerName} - Lent: ${record.dateLent} - Returned: ${record.dateReturned || 'Active'}`, 'blue');
      
      if (previousDate && currentDate > previousDate) {
        isChronological = false;
        log(`    ✗ Order violation: Record ${i + 1} is newer than record ${i}`, 'red');
      }
      
      previousDate = currentDate;
    }

    if (isChronological) {
      log('\n✓ T114 PASS: History is in correct chronological order (newest first)', 'green');
      return true;
    } else {
      throw new Error('History is not in chronological order');
    }
  } catch (error) {
    log(`✗ T114 FAIL: ${error.message}`, 'red');
    return false;
  }
}

// T115: Test all fields displayed correctly
async function testAllFieldsDisplayed(testData) {
  header('T115: Confirm all fields displayed correctly (BorrowerName, DateLent, DateReturned, ConditionNotes)');
  
  try {
    const response = await axios.get(`${BASE_URL}/lending/history/${testData.testItemId}`);
    const history = response.data.data;
    
    let allFieldsValid = true;
    
    for (let i = 0; i < history.length; i++) {
      const record = history[i];
      log(`\nRecord ${i + 1}:`, 'yellow');
      log(`  borrowerName: ${record.borrowerName || 'MISSING'}`, record.borrowerName ? 'green' : 'red');
      log(`  borrowerEmail: ${record.borrowerEmail || 'MISSING'}`, record.borrowerEmail ? 'green' : 'red');
      log(`  dateLent: ${record.dateLent || 'MISSING'}`, record.dateLent ? 'green' : 'red');
      log(`  dateReturned: ${record.dateReturned || 'NULL (Active)'}`, 'blue');
      log(`  conditionNotes: ${record.conditionNotes || 'NULL'}`, 'blue');
      
      // Validate required fields
      if (!record.borrowerName) {
        log('  ✗ Missing borrowerName (denormalized field)', 'red');
        allFieldsValid = false;
      }
      if (!record.borrowerEmail) {
        log('  ✗ Missing borrowerEmail (denormalized field)', 'red');
        allFieldsValid = false;
      }
      if (!record.dateLent) {
        log('  ✗ Missing dateLent', 'red');
        allFieldsValid = false;
      }
      
      // Validate data types
      if (record.dateLent && isNaN(new Date(record.dateLent).getTime())) {
        log('  ✗ Invalid dateLent format', 'red');
        allFieldsValid = false;
      }
      if (record.dateReturned && isNaN(new Date(record.dateReturned).getTime())) {
        log('  ✗ Invalid dateReturned format', 'red');
        allFieldsValid = false;
      }
    }

    if (allFieldsValid) {
      log('\n✓ T115 PASS: All fields are present and correctly formatted', 'green');
      return true;
    } else {
      throw new Error('Some fields are missing or invalid');
    }
  } catch (error) {
    log(`✗ T115 FAIL: ${error.message}`, 'red');
    return false;
  }
}

// T116: Test never-lent item
async function testNoHistoryItem(testData) {
  header('T116: View history for never-lent item - confirm "No lending history" handling');
  
  try {
    const response = await axios.get(`${BASE_URL}/lending/history/${testData.noHistoryItemId}`);
    const history = response.data.data;
    
    log(`Retrieved ${history.length} history records`, 'yellow');
    
    if (history.length === 0) {
      log('✓ T116 PASS: No history returned for never-lent item (API returns empty array)', 'green');
      log('  Frontend should display "No lending history available" message', 'blue');
      return true;
    } else {
      throw new Error(`Expected 0 history records, got ${history.length}`);
    }
  } catch (error) {
    log(`✗ T116 FAIL: ${error.message}`, 'red');
    return false;
  }
}

// T117: Test date range filtering
async function testDateRangeFiltering(testData) {
  header('T117: Filter history by date range - confirm only matching transactions shown');
  
  try {
    // Get all history first
    const allHistoryResponse = await axios.get(`${BASE_URL}/lending/history/${testData.testItemId}`);
    const allHistory = allHistoryResponse.data.data;
    
    if (allHistory.length < 2) {
      throw new Error('Need at least 2 history records to test filtering');
    }

    log(`Total history records: ${allHistory.length}`, 'yellow');
    
    // Get the date of the second transaction
    const middleRecord = allHistory[Math.floor(allHistory.length / 2)];
    const filterDate = new Date(middleRecord.dateLent);
    
    // Create date range: from middle date to now
    const startDate = filterDate.toISOString().split('T')[0];
    const endDate = new Date().toISOString().split('T')[0];
    
    log(`\nTesting filter: ${startDate} to ${endDate}`, 'yellow');
    
    // Test with date range query parameters
    const filteredResponse = await axios.get(
      `${BASE_URL}/lending/history/${testData.testItemId}?startDate=${startDate}&endDate=${endDate}`
    );
    const filteredHistory = filteredResponse.data.data;
    
    log(`Filtered history records: ${filteredHistory.length}`, 'yellow');
    
    // Verify all filtered records are within date range
    let allInRange = true;
    for (const record of filteredHistory) {
      const recordDate = new Date(record.dateLent);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1); // Include end date
      
      if (recordDate < start || recordDate >= end) {
        log(`  ✗ Record outside range: ${record.dateLent}`, 'red');
        allInRange = false;
      } else {
        log(`  ✓ Record in range: ${record.dateLent}`, 'green');
      }
    }

    if (filteredHistory.length <= allHistory.length && allInRange) {
      log('\n✓ T117 PASS: Date range filtering works correctly', 'green');
      return true;
    } else {
      throw new Error('Date range filtering produced incorrect results');
    }
  } catch (error) {
    log(`✗ T117 FAIL: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

// T118: Test denormalized borrower name preservation
async function testDenormalizedBorrowerName(testData) {
  header('T118: Verify denormalized BorrowerName field (audit trail preservation)');
  
  try {
    // Get history from API
    const apiResponse = await axios.get(`${BASE_URL}/lending/history/${testData.testItemId}`);
    const apiHistory = apiResponse.data.data;
    
    // Get history directly from database
    const dbHistory = await queryDb(
      `SELECT id, borrowerName, borrowerEmail, userId 
       FROM LendingLogs 
       WHERE itemId = ? 
       ORDER BY dateLent DESC`,
      [testData.testItemId]
    );
    
    log(`Comparing API response with database records...`, 'yellow');
    
    let allMatch = true;
    for (let i = 0; i < dbHistory.length; i++) {
      const dbRecord = dbHistory[i];
      const apiRecord = apiHistory[i];
      
      log(`\nRecord ${i + 1}:`, 'yellow');
      log(`  DB borrowerName: ${dbRecord.borrowerName}`, 'blue');
      log(`  API borrowerName: ${apiRecord.borrowerName}`, 'blue');
      log(`  DB borrowerEmail: ${dbRecord.borrowerEmail}`, 'blue');
      log(`  API borrowerEmail: ${apiRecord.borrowerEmail}`, 'blue');
      
      if (dbRecord.borrowerName !== apiRecord.borrowerName) {
        log('  ✗ borrowerName mismatch between DB and API', 'red');
        allMatch = false;
      }
      if (dbRecord.borrowerEmail !== apiRecord.borrowerEmail) {
        log('  ✗ borrowerEmail mismatch between DB and API', 'red');
        allMatch = false;
      }
      
      // Verify denormalized fields exist in database
      if (!dbRecord.borrowerName || !dbRecord.borrowerEmail) {
        log('  ✗ Denormalized fields missing in database', 'red');
        allMatch = false;
      } else {
        log('  ✓ Denormalized fields present and consistent', 'green');
      }
    }

    // Additional test: Verify these are truly denormalized (not JOINed)
    log('\nVerifying denormalization (fields stored in LendingLogs table)...', 'yellow');
    const tableInfo = await queryDb('PRAGMA table_info(LendingLogs)');
    const hasBorrowerName = tableInfo.some(col => col.name === 'borrowerName');
    const hasBorrowerEmail = tableInfo.some(col => col.name === 'borrowerEmail');
    
    log(`  BorrowerName column exists: ${hasBorrowerName}`, hasBorrowerName ? 'green' : 'red');
    log(`  BorrowerEmail column exists: ${hasBorrowerEmail}`, hasBorrowerEmail ? 'green' : 'red');

    if (allMatch && hasBorrowerName && hasBorrowerEmail) {
      log('\n✓ T118 PASS: Denormalized BorrowerName and BorrowerEmail fields work correctly', 'green');
      log('  Audit trail is preserved even if user data changes', 'blue');
      return true;
    } else {
      throw new Error('Denormalized fields are not properly implemented');
    }
  } catch (error) {
    log(`✗ T118 FAIL: ${error.message}`, 'red');
    if (error.response) {
      log(`Response: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
    return false;
  }
}

// Main execution
async function runTests() {
  console.log('\n');
  log('╔═══════════════════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║              USER STORY 4 VERIFICATION TESTS (T114-T118)                      ║', 'cyan');
  log('║                 View Lending History Feature                                  ║', 'cyan');
  log('╚═══════════════════════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Check if server is running
  log('\nChecking if backend server is running...', 'yellow');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    log('✗ Backend server is not running on http://localhost:3001', 'red');
    log('  Please start the server with: npm start', 'yellow');
    process.exit(1);
  }
  
  log('✓ Backend server is running', 'green');

  let testData;
  try {
    testData = await setupTestData();
  } catch (error) {
    log('\n✗ Failed to setup test data. Cannot proceed with tests.', 'red');
    process.exit(1);
  }

  // Run all verification tests
  const results = {
    T114: false,
    T115: false,
    T116: false,
    T117: false,
    T118: false
  };

  results.T114 = await testChronologicalOrder(testData);
  results.T115 = await testAllFieldsDisplayed(testData);
  results.T116 = await testNoHistoryItem(testData);
  results.T117 = await testDateRangeFiltering(testData);
  results.T118 = await testDenormalizedBorrowerName(testData);

  // Summary
  header('VERIFICATION SUMMARY');
  const passed = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([task, pass]) => {
    log(`  ${task}: ${pass ? '✓ PASS' : '✗ FAIL'}`, pass ? 'green' : 'red');
  });
  
  console.log('\n' + '='.repeat(80));
  if (passed === total) {
    log(`\n✓ ALL TESTS PASSED (${passed}/${total})`, 'green');
    log('\n🎉 User Story 4 verification complete!', 'green');
    log('All lending history features are working correctly:', 'green');
    log('  • Chronological ordering (newest first)', 'blue');
    log('  • All fields displayed correctly', 'blue');
    log('  • Empty history handling', 'blue');
    log('  • Date range filtering', 'blue');
    log('  • Denormalized audit trail preservation', 'blue');
  } else {
    log(`\n✗ SOME TESTS FAILED (${passed}/${total} passed)`, 'red');
    log('Please review the failed tests above and fix the issues.', 'yellow');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
