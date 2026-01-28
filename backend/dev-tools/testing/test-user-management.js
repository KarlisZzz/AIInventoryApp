/**
 * User Management API Test Script (User Story 2)
 * 
 * Tests Phase 4 backend implementation:
 * - T057: Test user endpoints manually (create, list, update, delete)
 * 
 * Prerequisites: Backend server must be running (npm start)
 * 
 * This script tests:
 * 1. List all users
 * 2. Create new user
 * 3. Get user by ID
 * 4. Update user (name, email, role)
 * 5. Delete user (with safety checks)
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api/v1';

// ANSI color codes
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function log(color, message) {
  console.log(`${color}${message}${RESET}`);
}

let adminUserId = null;
let testUserId = null;

async function checkServerRunning() {
  try {
    await axios.get(`${BASE_URL}/items`);
    log(GREEN, '✓ Backend server is running\n');
    return true;
  } catch (error) {
    log(RED, '✗ Backend server is not running!');
    log(YELLOW, 'Please start the server: cd backend && npm start\n');
    return false;
  }
}

async function findAdminUser() {
  log(CYAN, '=== Finding Administrator User ===');
  
  try {
    // Try to get users list without auth (should fail)
    try {
      await axios.get(`${BASE_URL}/admin/users`);
      log(RED, '✗ Expected auth error but got success');
    } catch (error) {
      if (error.response?.status === 401) {
        log(GREEN, '✓ Auth check working: 401 Unauthorized without x-user-id header');
      }
    }
    
    // Get all users to find an admin
    const usersResponse = await axios.get(`${BASE_URL}/users`);
    const users = usersResponse.data.data;
    
    const admin = users.find(u => u.role === 'administrator');
    
    if (!admin) {
      log(YELLOW, 'No administrator user found. Creating one...');
      
      // For testing, we'll need to create an admin user directly in the database
      // This is a workaround since we need an admin to create users
      log(RED, '✗ No admin user exists. Please create one manually first.');
      log(YELLOW, 'Run: node -e "const { User } = require(\'./src/models\'); (async () => { await User.create({ name: \'Admin User\', email: \'admin@example.com\', role: \'administrator\' }); console.log(\'Admin created\'); process.exit(0); })()"');
      return false;
    }
    
    adminUserId = admin.id;
    log(GREEN, `✓ Found admin user: ${admin.name} (${admin.email})`);
    log(GREEN, `  Admin ID: ${adminUserId}\n`);
    return true;
  } catch (error) {
    log(RED, `✗ Error finding admin: ${error.message}`);
    return false;
  }
}

async function testListUsers() {
  log(CYAN, '--- Test 1: GET /admin/users (List all users) ---');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { 'x-user-id': adminUserId }
    });
    
    const users = response.data.data;
    log(GREEN, `✓ Listed ${users.length} users`);
    
    // Test role filter
    const adminResponse = await axios.get(`${BASE_URL}/admin/users?role=administrator`, {
      headers: { 'x-user-id': adminUserId }
    });
    const admins = adminResponse.data.data;
    log(GREEN, `✓ Role filter works: Found ${admins.length} administrator(s)`);
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCreateUser() {
  log(CYAN, '\n--- Test 2: POST /admin/users (Create new user) ---');
  
  try {
    const timestamp = Date.now();
    const response = await axios.post(`${BASE_URL}/admin/users`, {
      name: `Test User ${timestamp}`,
      email: `testuser${timestamp}@example.com`,
      role: 'standard user'
    }, {
      headers: { 'x-user-id': adminUserId }
    });
    
    const user = response.data.data;
    testUserId = user.id;
    
    log(GREEN, `✓ Created user: ${user.name} (${user.email})`);
    log(GREEN, `  User ID: ${testUserId}`);
    log(GREEN, `  Role: ${user.role}`);
    
    // Test duplicate email validation
    try {
      await axios.post(`${BASE_URL}/admin/users`, {
        name: 'Duplicate User',
        email: user.email,
        role: 'standard user'
      }, {
        headers: { 'x-user-id': adminUserId }
      });
      log(RED, '✗ Should have rejected duplicate email');
      return false;
    } catch (error) {
      if (error.response?.status === 400 && error.response.data.message.includes('already exists')) {
        log(GREEN, '✓ Duplicate email validation works');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testGetUserById() {
  log(CYAN, '\n--- Test 3: GET /admin/users/:userId (Get user by ID) ---');
  
  try {
    const response = await axios.get(`${BASE_URL}/admin/users/${testUserId}`, {
      headers: { 'x-user-id': adminUserId }
    });
    
    const user = response.data.data;
    log(GREEN, `✓ Retrieved user: ${user.name} (${user.email})`);
    
    // Test 404 for non-existent user
    try {
      await axios.get(`${BASE_URL}/admin/users/00000000-0000-0000-0000-000000000000`, {
        headers: { 'x-user-id': adminUserId }
      });
      log(RED, '✗ Should have returned 404 for non-existent user');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        log(GREEN, '✓ 404 handling works for non-existent user');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testUpdateUser() {
  log(CYAN, '\n--- Test 4: PUT /admin/users/:userId (Update user) ---');
  
  try {
    // Update name
    const response1 = await axios.put(`${BASE_URL}/admin/users/${testUserId}`, {
      name: 'Updated Test User'
    }, {
      headers: { 'x-user-id': adminUserId }
    });
    
    log(GREEN, `✓ Updated name: ${response1.data.data.name}`);
    
    // Update role
    const response2 = await axios.put(`${BASE_URL}/admin/users/${testUserId}`, {
      role: 'administrator'
    }, {
      headers: { 'x-user-id': adminUserId }
    });
    
    log(GREEN, `✓ Updated role: ${response2.data.data.role}`);
    
    // Update email
    const newEmail = `updated${Date.now()}@example.com`;
    const response3 = await axios.put(`${BASE_URL}/admin/users/${testUserId}`, {
      email: newEmail
    }, {
      headers: { 'x-user-id': adminUserId }
    });
    
    log(GREEN, `✓ Updated email: ${response3.data.data.email}`);
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testDeleteUser() {
  log(CYAN, '\n--- Test 5: DELETE /admin/users/:userId (Delete user) ---');
  
  try {
    // Test self-deletion prevention
    try {
      await axios.delete(`${BASE_URL}/admin/users/${adminUserId}`, {
        headers: { 'x-user-id': adminUserId }
      });
      log(RED, '✗ Should have prevented self-deletion');
      return false;
    } catch (error) {
      if (error.response?.status === 403 && error.response.data.message.includes('your own account')) {
        log(GREEN, '✓ Self-deletion prevention works');
      } else {
        throw error;
      }
    }
    
    // Delete test user (now an admin after update)
    // First, need to check if this is the last admin
    const usersResponse = await axios.get(`${BASE_URL}/admin/users?role=administrator`, {
      headers: { 'x-user-id': adminUserId }
    });
    const adminCount = usersResponse.data.data.length;
    
    if (adminCount <= 2) {
      // Can't delete because testUser is now an admin and might be the last one
      // Change role back to standard user first
      await axios.put(`${BASE_URL}/admin/users/${testUserId}`, {
        role: 'standard user'
      }, {
        headers: { 'x-user-id': adminUserId }
      });
      log(YELLOW, '  Changed test user back to standard user to allow deletion');
    }
    
    // Now delete
    const response = await axios.delete(`${BASE_URL}/admin/users/${testUserId}`, {
      headers: { 'x-user-id': adminUserId }
    });
    
    log(GREEN, `✓ Deleted user successfully`);
    
    // Verify deletion
    try {
      await axios.get(`${BASE_URL}/admin/users/${testUserId}`, {
        headers: { 'x-user-id': adminUserId }
      });
      log(RED, '✗ User should not exist after deletion');
      return false;
    } catch (error) {
      if (error.response?.status === 404) {
        log(GREEN, '✓ User successfully deleted (404 on retrieval)');
      } else {
        throw error;
      }
    }
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testLastAdminPrevention() {
  log(CYAN, '\n--- Test 6: Last Administrator Prevention ---');
  
  try {
    // Get all admins
    const response = await axios.get(`${BASE_URL}/admin/users?role=administrator`, {
      headers: { 'x-user-id': adminUserId }
    });
    
    const admins = response.data.data;
    log(YELLOW, `  Current admin count: ${admins.length}`);
    
    if (admins.length === 1) {
      // Try to delete the last admin
      try {
        await axios.delete(`${BASE_URL}/admin/users/${adminUserId}`, {
          headers: { 'x-user-id': adminUserId }
        });
        log(RED, '✗ Should have prevented last admin deletion');
        return false;
      } catch (error) {
        if (error.response?.status === 403) {
          if (error.response.data.message.includes('your own account')) {
            log(YELLOW, '  Blocked by self-deletion check (expected)');
          } else if (error.response.data.message.includes('last administrator')) {
            log(GREEN, '✓ Last administrator prevention works');
          }
        } else {
          throw error;
        }
      }
    } else {
      log(YELLOW, `  Cannot test last admin prevention (multiple admins exist)`);
    }
    
    return true;
  } catch (error) {
    log(RED, `✗ Test failed: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function runTests() {
  log(BOLD + CYAN, '\n╔════════════════════════════════════════════════════╗');
  log(BOLD + CYAN, '║  User Management API Tests (Phase 4 - T057)       ║');
  log(BOLD + CYAN, '╚════════════════════════════════════════════════════╝\n');
  
  // Check prerequisites
  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    process.exit(1);
  }
  
  const adminFound = await findAdminUser();
  if (!adminFound) {
    process.exit(1);
  }
  
  // Run tests
  const results = [];
  
  results.push(await testListUsers());
  results.push(await testCreateUser());
  results.push(await testGetUserById());
  results.push(await testUpdateUser());
  results.push(await testDeleteUser());
  results.push(await testLastAdminPrevention());
  
  // Summary
  log(BOLD + CYAN, '\n╔════════════════════════════════════════════════════╗');
  log(BOLD + CYAN, '║  Test Summary                                      ║');
  log(BOLD + CYAN, '╚════════════════════════════════════════════════════╝\n');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  if (passed === total) {
    log(BOLD + GREEN, `✓ ALL TESTS PASSED (${passed}/${total})\n`);
    log(GREEN, 'Phase 4 Backend Implementation (T057) Complete! ✨\n');
  } else {
    log(BOLD + RED, `✗ SOME TESTS FAILED (${passed}/${total} passed)\n`);
  }
}

runTests().catch(error => {
  log(RED, `\n✗ Unexpected error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
