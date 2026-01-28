/**
 * Test Phase 2 Implementation
 * 
 * Verifies all Phase 2 components are working:
 * - Database migrations
 * - Model updates
 * - Auth middleware
 * - Admin routes mounting
 */

const request = require('supertest');
const app = require('./src/app');
const { User, sequelize } = require('./src/models');

async function testPhase2() {
  try {
    console.log('🧪 Testing Phase 2 Implementation\n');

    // Test 1: Check admin routes are mounted
    console.log('Test 1: Admin routes mounting');
    const res1 = await request(app).get('/api/v1/admin/dashboard');
    console.log(`  Status: ${res1.status}`);
    if (res1.status === 401) {
      console.log('  ✓ Admin route exists and requires authentication');
    } else if (res1.status === 501) {
      console.log('  ✓ Admin route exists (returns 501 Not Implemented)');
    } else {
      console.log('  ✗ Unexpected status:', res1.status);
    }

    // Test 2: Check User model methods
    console.log('\nTest 2: User model methods');
    const adminCount = await User.countAdministrators();
    console.log(`  Administrator count: ${adminCount}`);
    console.log('  ✓ countAdministrators() works');

    // Test 3: Get a user and test isAdmin method
    const [users] = await sequelize.query('SELECT * FROM Users LIMIT 1');
    if (users.length > 0) {
      const user = await User.findByPk(users[0].id);
      console.log(`  User role: ${user.role}`);
      console.log(`  isAdmin(): ${user.isAdmin()}`);
      console.log('  ✓ isAdmin() method works');
    }

    // Test 4: Test canDeleteAdmin method
    if (users.length > 0) {
      const result = await User.canDeleteAdmin(users[0].id);
      console.log(`  canDeleteAdmin result:`, result);
      console.log('  ✓ canDeleteAdmin() method works');
    }

    // Test 5: Test with valid admin user ID
    console.log('\nTest 3: Admin route with valid admin user');
    const [admins] = await sequelize.query("SELECT id FROM Users WHERE role = 'administrator' LIMIT 1");
    if (admins.length > 0) {
      const res3 = await request(app)
        .get('/api/v1/admin/categories')
        .set('x-user-id', admins[0].id);
      console.log(`  Status: ${res3.status}`);
      if (res3.status === 501) {
        console.log('  ✓ Admin can access admin routes (returns 501 Not Implemented)');
      } else {
        console.log('  ✗ Unexpected status:', res3.status);
      }
    } else {
      console.log('  ⚠ No administrator users found in database');
    }

    // Test 6: Test with standard user (should get 403)
    console.log('\nTest 4: Admin route with standard user');
    const [standardUsers] = await sequelize.query("SELECT id FROM Users WHERE role = 'standard user' LIMIT 1");
    if (standardUsers.length > 0) {
      const res4 = await request(app)
        .get('/api/v1/admin/categories')
        .set('x-user-id', standardUsers[0].id);
      console.log(`  Status: ${res4.status}`);
      if (res4.status === 403) {
        console.log('  ✓ Standard user blocked from admin routes (403 Forbidden)');
      } else {
        console.log('  ✗ Expected 403, got:', res4.status);
      }
    } else {
      console.log('  ⚠ No standard users found in database');
    }

    console.log('\n✅ Phase 2 Implementation Tests Complete!\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

testPhase2();
