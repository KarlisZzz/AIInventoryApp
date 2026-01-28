/**
 * Final Verification Test Suite - Tasks T164-T170
 * Tests all success criteria SC-001 through SC-010
 */

const axios = require('axios');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const API_URL = `${BASE_URL}/api/v1`;
const DB_PATH = path.join(__dirname, 'data', 'inventory.db');

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
  const symbol = status === 'PASS' ? '✓' : status === 'WARN' ? '⚠' : '✗';
  const color = status === 'PASS' ? 'green' : status === 'WARN' ? 'yellow' : 'red';
  log(`${symbol} ${testName}${details ? ': ' + details : ''}`, color);
  
  if (status === 'PASS') {
    results.passed.push(testName);
  } else if (status === 'FAIL') {
    results.failed.push(testName);
  } else {
    results.warnings.push(testName);
  }
}

function getDb() {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) reject(err);
      else resolve(db);
    });
  });
}

function queryDb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function runDb(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

// Measure operation time
async function measureTime(operation) {
  const start = Date.now();
  const result = await operation();
  const duration = Date.now() - start;
  return { result, duration };
}

// T164: Verify all success criteria SC-001 through SC-010
async function verifySC001_ItemOperations() {
  log('\n=== SC-001: Item CRUD Operations (<30 seconds each) ===', 'cyan');
  
  try {
    // Create
    const { duration: createTime } = await measureTime(async () => {
      return axios.post(`${API_URL}/items`, {
        Name: 'Test Item SC-001',
        Description: 'Test Description',
        Category: 'Test',
        Status: 'Available'
      });
    });
    logTest('SC-001a: Create item', createTime < 30000 ? 'PASS' : 'FAIL', `${createTime}ms`);
    
    // Get all items
    const { data: items } = await axios.get(`${API_URL}/items`);
    const testItem = items.data.find(item => item.Name === 'Test Item SC-001');
    
    if (!testItem) {
      logTest('SC-001b: Item created successfully', 'FAIL');
      return;
    }
    
    // Update
    const { duration: updateTime } = await measureTime(async () => {
      return axios.put(`${API_URL}/items/${testItem.ItemID}`, {
        Name: 'Test Item SC-001 Updated',
        Description: 'Updated Description',
        Category: 'Test Updated',
        Status: 'Available'
      });
    });
    logTest('SC-001c: Update item', updateTime < 30000 ? 'PASS' : 'FAIL', `${updateTime}ms`);
    
    // Delete
    const { duration: deleteTime } = await measureTime(async () => {
      return axios.delete(`${API_URL}/items/${testItem.ItemID}`);
    });
    logTest('SC-001d: Delete item', deleteTime < 30000 ? 'PASS' : 'FAIL', `${deleteTime}ms`);
    
  } catch (error) {
    logTest('SC-001: Item Operations', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function verifySC002_LendingOperation() {
  log('\n=== SC-002: Lending Operation (<45 seconds) ===', 'cyan');
  
  try {
    // Create test item
    const { data: itemResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Test Item SC-002',
      Description: 'For lending test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = itemResp.data.ItemID;
    
    // Get a user
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    if (!userId) {
      logTest('SC-002: Lending Operation', 'FAIL', 'No users available');
      return;
    }
    
    // Measure lending operation
    const { duration: lendTime } = await measureTime(async () => {
      return axios.post(`${API_URL}/lending/lend`, {
        ItemID: itemId,
        UserID: userId,
        ConditionNotes: 'Test lending'
      });
    });
    
    logTest('SC-002: Complete lending operation', lendTime < 45000 ? 'PASS' : 'FAIL', `${lendTime}ms`);
    
    // Cleanup
    await axios.post(`${API_URL}/lending/return`, { ItemID: itemId });
    await axios.delete(`${API_URL}/items/${itemId}`);
    
  } catch (error) {
    logTest('SC-002: Lending Operation', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function verifySC003_ReturnOperation() {
  log('\n=== SC-003: Return Operation (<30 seconds) ===', 'cyan');
  
  try {
    // Setup: Create and lend item
    const { data: itemResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Test Item SC-003',
      Description: 'For return test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = itemResp.data.ItemID;
    
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    await axios.post(`${API_URL}/lending/lend`, {
      ItemID: itemId,
      UserID: userId
    });
    
    // Measure return operation
    const { duration: returnTime } = await measureTime(async () => {
      return axios.post(`${API_URL}/lending/return`, {
        ItemID: itemId,
        ReturnConditionNotes: 'Test return'
      });
    });
    
    logTest('SC-003: Complete return operation', returnTime < 30000 ? 'PASS' : 'FAIL', `${returnTime}ms`);
    
    // Cleanup
    await axios.delete(`${API_URL}/items/${itemId}`).catch(() => {});
    
  } catch (error) {
    logTest('SC-003: Return Operation', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function verifySC004_DashboardLoadTime() {
  log('\n=== SC-004: Dashboard Load Time (<2 seconds) ===', 'cyan');
  
  try {
    const { duration } = await measureTime(async () => {
      return axios.get(`${API_URL}/dashboard`);
    });
    
    logTest('SC-004: Dashboard load time', duration < 2000 ? 'PASS' : 'FAIL', `${duration}ms`);
    
  } catch (error) {
    logTest('SC-004: Dashboard Load Time', 'FAIL', error.message);
  }
}

async function verifySC005_SearchResponseTime() {
  log('\n=== SC-005: Search Response Time (<1 second) ===', 'cyan');
  
  try {
    const { duration } = await measureTime(async () => {
      return axios.get(`${API_URL}/items?search=Test`);
    });
    
    logTest('SC-005: Search response time', duration < 1000 ? 'PASS' : 'FAIL', `${duration}ms`);
    
  } catch (error) {
    logTest('SC-005: Search Response Time', 'FAIL', error.message);
  }
}

async function verifySC006_TransactionAtomicity() {
  log('\n=== SC-006: Transaction Atomicity (100% rollback on failure) ===', 'cyan');
  
  try {
    const db = await getDb();
    
    // Create test item
    const { data: itemResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Test Item SC-006',
      Description: 'For atomicity test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = itemResp.data.ItemID;
    
    // Check initial state
    const initialItems = await queryDb(db, 'SELECT * FROM Items WHERE ItemID = ?', [itemId]);
    const initialStatus = initialItems[0].Status;
    
    // Try to lend with invalid user (should rollback)
    try {
      await axios.post(`${API_URL}/lending/lend`, {
        ItemID: itemId,
        UserID: 99999, // Invalid user
        ConditionNotes: 'Should fail'
      });
      logTest('SC-006: Transaction atomicity (invalid lend)', 'FAIL', 'Should have rejected invalid user');
    } catch (error) {
      // Check that item status didn't change
      const afterFailItems = await queryDb(db, 'SELECT * FROM Items WHERE ItemID = ?', [itemId]);
      const afterStatus = afterFailItems[0].Status;
      
      // Check no orphaned lending log
      const orphanedLogs = await queryDb(db, 
        'SELECT * FROM LendingLogs WHERE ItemID = ? AND DateReturned IS NULL', 
        [itemId]
      );
      
      if (afterStatus === initialStatus && orphanedLogs.length === 0) {
        logTest('SC-006a: Transaction rollback on failure', 'PASS', 'No partial updates');
      } else {
        logTest('SC-006a: Transaction rollback on failure', 'FAIL', 'Partial update detected');
      }
    }
    
    // Verify successful transaction completes fully
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    await axios.post(`${API_URL}/lending/lend`, {
      ItemID: itemId,
      UserID: userId
    });
    
    const lentItems = await queryDb(db, 'SELECT * FROM Items WHERE ItemID = ?', [itemId]);
    const lentLogs = await queryDb(db, 
      'SELECT * FROM LendingLogs WHERE ItemID = ? AND DateReturned IS NULL', 
      [itemId]
    );
    
    if (lentItems[0].Status === 'Lent' && lentLogs.length === 1) {
      logTest('SC-006b: Successful transaction completes fully', 'PASS');
    } else {
      logTest('SC-006b: Successful transaction completes fully', 'FAIL');
    }
    
    // Cleanup
    await axios.post(`${API_URL}/lending/return`, { ItemID: itemId });
    await axios.delete(`${API_URL}/items/${itemId}`);
    db.close();
    
  } catch (error) {
    logTest('SC-006: Transaction Atomicity', 'FAIL', error.message);
  }
}

async function verifySC007_LendingHistory() {
  log('\n=== SC-007: Lending History Display ===', 'cyan');
  
  try {
    // Create test item and perform multiple lend-return cycles
    const { data: itemResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Test Item SC-007',
      Description: 'For history test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = itemResp.data.ItemID;
    
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    // First cycle
    await axios.post(`${API_URL}/lending/lend`, { ItemID: itemId, UserID: userId });
    await axios.post(`${API_URL}/lending/return`, { ItemID: itemId });
    
    // Second cycle
    await axios.post(`${API_URL}/lending/lend`, { ItemID: itemId, UserID: userId });
    await axios.post(`${API_URL}/lending/return`, { ItemID: itemId });
    
    // Get history
    const { data: historyResp } = await axios.get(`${API_URL}/lending/history/${itemId}`);
    const history = historyResp.data;
    
    if (history.length >= 2) {
      logTest('SC-007a: All transactions displayed', 'PASS', `${history.length} records`);
    } else {
      logTest('SC-007a: All transactions displayed', 'FAIL', `Only ${history.length} records`);
    }
    
    // Verify all required fields
    const hasAllFields = history.every(log => 
      log.BorrowerName && log.DateLent && log.DateReturned
    );
    logTest('SC-007b: All fields present (Borrower, DateLent, DateReturned)', 
      hasAllFields ? 'PASS' : 'FAIL');
    
    // Cleanup
    await axios.delete(`${API_URL}/items/${itemId}`).catch(() => {});
    
  } catch (error) {
    logTest('SC-007: Lending History', 'FAIL', error.response?.data?.message || error.message);
  }
}

async function verifySC008_StatusAccuracy() {
  log('\n=== SC-008: Item Status Accuracy ===', 'cyan');
  
  try {
    const db = await getDb();
    
    // Check no Available items have active lending logs
    const availableWithLogs = await queryDb(db, `
      SELECT i.ItemID, i.Name, i.Status 
      FROM Items i 
      INNER JOIN LendingLogs ll ON i.ItemID = ll.ItemID 
      WHERE i.Status = 'Available' AND ll.DateReturned IS NULL
    `);
    
    if (availableWithLogs.length === 0) {
      logTest('SC-008a: Available items have no active loans', 'PASS');
    } else {
      logTest('SC-008a: Available items have no active loans', 'FAIL', 
        `${availableWithLogs.length} inconsistent records`);
    }
    
    // Check all Lent items have active lending logs
    const lentWithoutLogs = await queryDb(db, `
      SELECT i.ItemID, i.Name, i.Status 
      FROM Items i 
      LEFT JOIN LendingLogs ll ON i.ItemID = ll.ItemID AND ll.DateReturned IS NULL
      WHERE i.Status = 'Lent' AND ll.LogID IS NULL
    `);
    
    if (lentWithoutLogs.length === 0) {
      logTest('SC-008b: Lent items have active loans', 'PASS');
    } else {
      logTest('SC-008b: Lent items have active loans', 'FAIL', 
        `${lentWithoutLogs.length} inconsistent records`);
    }
    
    db.close();
    
  } catch (error) {
    logTest('SC-008: Status Accuracy', 'FAIL', error.message);
  }
}

async function verifySC009_UsabilityGoal() {
  log('\n=== SC-009: Lend-and-Return Cycle Success Rate ===', 'cyan');
  
  log('Note: SC-009 is a UX research goal requiring moderated usability testing.', 'yellow');
  log('For implementation verification, we test functional coverage instead:', 'yellow');
  
  try {
    let successCount = 0;
    const totalAttempts = 20;
    
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    for (let i = 0; i < totalAttempts; i++) {
      try {
        // Create item
        const { data: itemResp } = await axios.post(`${API_URL}/items`, {
          Name: `Test Item Cycle ${i}`,
          Description: 'Cycle test',
          Category: 'Test',
          Status: 'Available'
        });
        const itemId = itemResp.data.ItemID;
        
        // Lend
        await axios.post(`${API_URL}/lending/lend`, {
          ItemID: itemId,
          UserID: userId
        });
        
        // Return
        await axios.post(`${API_URL}/lending/return`, {
          ItemID: itemId
        });
        
        // Verify
        const { data: itemCheck } = await axios.get(`${API_URL}/items/${itemId}`);
        if (itemCheck.data.Status === 'Available') {
          successCount++;
        }
        
        // Cleanup
        await axios.delete(`${API_URL}/items/${itemId}`);
        
      } catch (error) {
        // Failure counted automatically
      }
    }
    
    const successRate = (successCount / totalAttempts) * 100;
    logTest('SC-009: Complete lend-and-return cycles', 
      successRate >= 95 ? 'PASS' : 'FAIL', 
      `${successRate.toFixed(1)}% success (${successCount}/${totalAttempts})`);
    
  } catch (error) {
    logTest('SC-009: Usability Goal', 'FAIL', error.message);
  }
}

async function verifySC010_DataIntegrity() {
  log('\n=== SC-010: Data Integrity (Zero violations) ===', 'cyan');
  
  try {
    const db = await getDb();
    
    // Check for orphaned lending logs
    const orphanedLogs = await queryDb(db, `
      SELECT ll.* 
      FROM LendingLogs ll 
      LEFT JOIN Items i ON ll.ItemID = i.ItemID 
      WHERE i.ItemID IS NULL
    `);
    logTest('SC-010a: No orphaned lending logs', 
      orphanedLogs.length === 0 ? 'PASS' : 'FAIL', 
      orphanedLogs.length > 0 ? `${orphanedLogs.length} orphaned` : '');
    
    // Check for missing references
    const missingUsers = await queryDb(db, `
      SELECT ll.* 
      FROM LendingLogs ll 
      LEFT JOIN Users u ON ll.UserID = u.UserID 
      WHERE u.UserID IS NULL
    `);
    logTest('SC-010b: No missing user references', 
      missingUsers.length === 0 ? 'PASS' : 'FAIL',
      missingUsers.length > 0 ? `${missingUsers.length} missing` : '');
    
    // Check for inconsistent status (covered in SC-008 but recheck)
    const inconsistent = await queryDb(db, `
      SELECT COUNT(*) as count FROM (
        SELECT i.ItemID FROM Items i 
        INNER JOIN LendingLogs ll ON i.ItemID = ll.ItemID 
        WHERE i.Status = 'Available' AND ll.DateReturned IS NULL
        UNION
        SELECT i.ItemID FROM Items i 
        LEFT JOIN LendingLogs ll ON i.ItemID = ll.ItemID AND ll.DateReturned IS NULL
        WHERE i.Status = 'Lent' AND ll.LogID IS NULL
      )
    `);
    logTest('SC-010c: No inconsistent item statuses', 
      inconsistent[0].count === 0 ? 'PASS' : 'FAIL');
    
    // Check for duplicate active loans
    const duplicateLoans = await queryDb(db, `
      SELECT ItemID, COUNT(*) as count 
      FROM LendingLogs 
      WHERE DateReturned IS NULL 
      GROUP BY ItemID 
      HAVING count > 1
    `);
    logTest('SC-010d: No duplicate active loans per item', 
      duplicateLoans.length === 0 ? 'PASS' : 'FAIL',
      duplicateLoans.length > 0 ? `${duplicateLoans.length} duplicates` : '');
    
    db.close();
    
  } catch (error) {
    logTest('SC-010: Data Integrity', 'FAIL', error.message);
  }
}

// T165: Complete lend-and-return cycle test (covered in SC-009)

// T166: Dashboard load test (covered in SC-004)

// T167: Concurrent lending test
async function testConcurrentLending() {
  log('\n=== T167: Concurrent Lending & Race Conditions ===', 'cyan');
  
  try {
    // Create test item
    const { data: itemResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Test Item Concurrent',
      Description: 'For concurrent test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = itemResp.data.ItemID;
    
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const user1 = usersResp.data[0]?.UserID;
    const user2 = usersResp.data[1]?.UserID || user1;
    
    // Attempt concurrent lending
    const results = await Promise.allSettled([
      axios.post(`${API_URL}/lending/lend`, { ItemID: itemId, UserID: user1 }),
      axios.post(`${API_URL}/lending/lend`, { ItemID: itemId, UserID: user2 }),
      axios.post(`${API_URL}/lending/lend`, { ItemID: itemId, UserID: user1 })
    ]);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    if (successful === 1 && failed === 2) {
      logTest('T167: Only one concurrent lend succeeds', 'PASS', 
        `1 success, ${failed} prevented`);
    } else {
      logTest('T167: Concurrent lending prevention', 'FAIL', 
        `${successful} succeeded, ${failed} failed`);
    }
    
    // Verify only one lending log exists
    const db = await getDb();
    const logs = await queryDb(db, 
      'SELECT * FROM LendingLogs WHERE ItemID = ? AND DateReturned IS NULL', 
      [itemId]
    );
    
    logTest('T167b: No duplicate lending logs', 
      logs.length === 1 ? 'PASS' : 'FAIL', 
      `${logs.length} active logs`);
    
    db.close();
    
    // Cleanup
    await axios.post(`${API_URL}/lending/return`, { ItemID: itemId }).catch(() => {});
    await axios.delete(`${API_URL}/items/${itemId}`).catch(() => {});
    
  } catch (error) {
    logTest('T167: Concurrent Lending', 'FAIL', error.message);
  }
}

// T168: Review error messages
async function reviewErrorMessages() {
  log('\n=== T168: Error Message Quality ===', 'cyan');
  
  const errorTests = [
    {
      name: 'Invalid item creation',
      test: async () => axios.post(`${API_URL}/items`, { Name: '' }),
      expectedPattern: /name.*required/i
    },
    {
      name: 'Lend already lent item',
      test: async () => {
        const { data: itemResp } = await axios.post(`${API_URL}/items`, {
          Name: 'Error Test Item',
          Description: 'Test',
          Category: 'Test',
          Status: 'Lent'
        });
        const result = await axios.post(`${API_URL}/lending/lend`, {
          ItemID: itemResp.data.ItemID,
          UserID: 1
        }).catch(err => err);
        await axios.delete(`${API_URL}/items/${itemResp.data.ItemID}`).catch(() => {});
        return result;
      },
      expectedPattern: /already|lent|not available/i
    },
    {
      name: 'Return available item',
      test: async () => {
        const { data: itemResp } = await axios.post(`${API_URL}/items`, {
          Name: 'Error Test Item 2',
          Description: 'Test',
          Category: 'Test',
          Status: 'Available'
        });
        const result = await axios.post(`${API_URL}/lending/return`, {
          ItemID: itemResp.data.ItemID
        }).catch(err => err);
        await axios.delete(`${API_URL}/items/${itemResp.data.ItemID}`).catch(() => {});
        return result;
      },
      expectedPattern: /not.*lent|cannot.*return/i
    }
  ];
  
  for (const test of errorTests) {
    try {
      await test.test();
      logTest(`T168: ${test.name}`, 'FAIL', 'Should have thrown error');
    } catch (error) {
      const message = error.response?.data?.message || error.response?.data?.error || error.message;
      const isUserFriendly = test.expectedPattern.test(message) && 
                             !message.includes('SQLITE') && 
                             !message.includes('SQL');
      logTest(`T168: ${test.name}`, isUserFriendly ? 'PASS' : 'WARN', 
        isUserFriendly ? 'Clear message' : message);
    }
  }
}

// T169: Accessibility test
async function testAccessibility() {
  log('\n=== T169: Accessibility Standards ===', 'cyan');
  
  log('Note: Full screen reader testing requires manual verification.', 'yellow');
  log('Automated checks for common accessibility issues:', 'yellow');
  
  // This would normally use tools like axe-core, but we can check basic requirements
  logTest('T169a: ARIA labels on forms', 'WARN', 
    'Manual verification required - check ItemForm, LendDialog, ReturnDialog');
  logTest('T169b: Keyboard navigation', 'WARN', 
    'Manual verification required - test Tab navigation through dialogs');
  logTest('T169c: Focus management', 'WARN', 
    'Manual verification required - verify focus trapping in modals');
  logTest('T169d: Screen reader announcements', 'WARN', 
    'Manual verification required - test with NVDA/JAWS');
}

// T170: Full regression test
async function fullRegressionTest() {
  log('\n=== T170: Full Regression Test (All 5 User Stories) ===', 'cyan');
  
  try {
    // US1: Item CRUD
    log('Testing US1: Item Management...', 'blue');
    const { data: createResp } = await axios.post(`${API_URL}/items`, {
      Name: 'Regression Test Item',
      Description: 'Full regression test',
      Category: 'Test',
      Status: 'Available'
    });
    const itemId = createResp.data.ItemID;
    logTest('US1a: Create item', 'PASS');
    
    await axios.put(`${API_URL}/items/${itemId}`, {
      Name: 'Regression Test Item Updated',
      Description: 'Updated',
      Category: 'Test',
      Status: 'Available'
    });
    logTest('US1b: Update item', 'PASS');
    
    const { data: searchResp } = await axios.get(`${API_URL}/items?search=Regression`);
    logTest('US1c: Search items', searchResp.data.length > 0 ? 'PASS' : 'FAIL');
    
    // US2: Lending
    log('Testing US2: Lending...', 'blue');
    const { data: usersResp } = await axios.get(`${API_URL}/users`);
    const userId = usersResp.data[0]?.UserID;
    
    await axios.post(`${API_URL}/lending/lend`, {
      ItemID: itemId,
      UserID: userId,
      ConditionNotes: 'Regression test lend'
    });
    logTest('US2a: Lend item', 'PASS');
    
    const { data: itemCheck1 } = await axios.get(`${API_URL}/items/${itemId}`);
    logTest('US2b: Item status changed to Lent', 
      itemCheck1.data.Status === 'Lent' ? 'PASS' : 'FAIL');
    
    // US3: Return
    log('Testing US3: Return...', 'blue');
    await axios.post(`${API_URL}/lending/return`, {
      ItemID: itemId,
      ReturnConditionNotes: 'Regression test return'
    });
    logTest('US3a: Return item', 'PASS');
    
    const { data: itemCheck2 } = await axios.get(`${API_URL}/items/${itemId}`);
    logTest('US3b: Item status changed to Available', 
      itemCheck2.data.Status === 'Available' ? 'PASS' : 'FAIL');
    
    // US4: History
    log('Testing US4: Lending History...', 'blue');
    const { data: historyResp } = await axios.get(`${API_URL}/lending/history/${itemId}`);
    logTest('US4a: View lending history', historyResp.data.length > 0 ? 'PASS' : 'FAIL');
    logTest('US4b: History contains complete cycle', 
      historyResp.data[0]?.DateReturned ? 'PASS' : 'FAIL');
    
    // US5: Dashboard
    log('Testing US5: Dashboard...', 'blue');
    const { data: dashResp } = await axios.get(`${API_URL}/dashboard`);
    logTest('US5a: Dashboard loads', 'PASS');
    logTest('US5b: Dashboard contains items', 
      dashResp.data?.items?.length > 0 ? 'PASS' : 'FAIL');
    
    // Cleanup
    await axios.delete(`${API_URL}/items/${itemId}`);
    logTest('Cleanup: Delete test item', 'PASS');
    
    log('\nRegression test complete!', 'green');
    
  } catch (error) {
    logTest('T170: Regression Test', 'FAIL', error.response?.data?.message || error.message);
  }
}

// Main execution
async function runAllTests() {
  log('╔══════════════════════════════════════════════════════╗', 'cyan');
  log('║   FINAL VERIFICATION TEST SUITE (T164-T170)         ║', 'cyan');
  log('║   Testing Success Criteria SC-001 through SC-010    ║', 'cyan');
  log('╚══════════════════════════════════════════════════════╝', 'cyan');
  
  // Check if server is running
  try {
    await axios.get(`${BASE_URL}/health`);
  } catch (error) {
    log('\n❌ Backend server is not running!', 'red');
    log('Please start the server with: cd backend && npm start', 'yellow');
    process.exit(1);
  }
  
  // T164: Run all success criteria tests
  await verifySC001_ItemOperations();
  await verifySC002_LendingOperation();
  await verifySC003_ReturnOperation();
  await verifySC004_DashboardLoadTime();
  await verifySC005_SearchResponseTime();
  await verifySC006_TransactionAtomicity();
  await verifySC007_LendingHistory();
  await verifySC008_StatusAccuracy();
  await verifySC009_UsabilityGoal();
  await verifySC010_DataIntegrity();
  
  // T165-T170: Additional verification tests
  await testConcurrentLending();
  await reviewErrorMessages();
  await testAccessibility();
  await fullRegressionTest();
  
  // Summary
  log('\n╔══════════════════════════════════════════════════════╗', 'cyan');
  log('║                   TEST SUMMARY                       ║', 'cyan');
  log('╚══════════════════════════════════════════════════════╝', 'cyan');
  
  log(`\n✓ PASSED: ${results.passed.length}`, 'green');
  log(`✗ FAILED: ${results.failed.length}`, 'red');
  log(`⚠ WARNINGS: ${results.warnings.length}`, 'yellow');
  
  if (results.failed.length > 0) {
    log('\nFailed tests:', 'red');
    results.failed.forEach(test => log(`  - ${test}`, 'red'));
  }
  
  if (results.warnings.length > 0) {
    log('\nWarnings (manual verification required):', 'yellow');
    results.warnings.forEach(test => log(`  - ${test}`, 'yellow'));
  }
  
  log('\n' + '═'.repeat(56), 'cyan');
  
  const exitCode = results.failed.length > 0 ? 1 : 0;
  process.exit(exitCode);
}

// Run tests
runAllTests().catch(error => {
  log(`\nUnexpected error: ${error.message}`, 'red');
  process.exit(1);
});
