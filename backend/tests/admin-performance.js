/**
 * Admin Performance Test
 * Verifies category and user lists load in <2 seconds for 1000 entries (SC-006)
 * Tests: Response time for GET /admin/categories and GET /admin/users
 */

const axios = require('axios');
const { Category, User, sequelize } = require('../src/models');

const BASE_URL = 'http://localhost:3001/api/v1';
const ADMIN_USER_ID = '00d31d5b-2fc8-463b-be0c-44c60fba1797';

async function seedLargeDataset() {
  console.log('📦 Seeding large dataset for performance testing...');
  
  // Seed 1000 categories
  const categoryPromises = [];
  for (let i = 0; i < 1000; i++) {
    categoryPromises.push(
      Category.create({
        name: `Performance Test Category ${i + 1}`,
        createdBy: ADMIN_USER_ID,
      })
    );
  }
  await Promise.all(categoryPromises);
  console.log('✅ Created 1000 test categories');
  
  // Seed 1000 users
  const userPromises = [];
  for (let i = 0; i < 1000; i++) {
    userPromises.push(
      User.create({
        email: `perftest${i + 1}@example.com`,
        name: `Performance Test User ${i + 1}`,
        password: 'test123',
        role: i % 10 === 0 ? 'administrator' : 'standard user',
        active: true,
      })
    );
  }
  await Promise.all(userPromises);
  console.log('✅ Created 1000 test users');
}

async function cleanupTestData() {
  console.log('🧹 Cleaning up test data...');
  
  await Category.destroy({
    where: {
      name: {
        [sequelize.Sequelize.Op.like]: 'Performance Test Category%',
      },
    },
  });
  
  await User.destroy({
    where: {
      email: {
        [sequelize.Sequelize.Op.like]: 'perftest%@example.com',
      },
    },
    force: true,
  });
  
  console.log('✅ Test data cleaned up');
}

async function measureResponseTime(endpoint, headers) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(`${BASE_URL}${endpoint}`, { headers });
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: response.status === 200,
      duration,
      itemCount: response.data?.data?.length || response.data?.length || 0,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      success: false,
      duration: endTime - startTime,
      error: error.message,
    };
  }
}

async function runPerformanceTests() {
  console.log('⚡ Admin Performance Test (SC-006)\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Setup: Seed large dataset
    await seedLargeDataset();
    
    const headers = {
      'x-user-id': ADMIN_USER_ID,
      'Content-Type': 'application/json',
    };
    
    // Test 1: Category list performance
    console.log('\n📋 Test 1: Category List Performance (1000 entries)');
    console.log('-'.repeat(80));
    
    const categoryResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await measureResponseTime('/admin/categories', headers);
      categoryResults.push(result.duration);
      console.log(`   Run ${i + 1}: ${result.duration}ms (${result.itemCount} items)`);
    }
    
    const avgCategoryTime = categoryResults.reduce((a, b) => a + b, 0) / categoryResults.length;
    const maxCategoryTime = Math.max(...categoryResults);
    
    console.log(`\n   Average: ${avgCategoryTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxCategoryTime}ms`);
    console.log(`   Requirement: <2000ms (2 seconds)`);
    
    if (maxCategoryTime < 2000) {
      console.log(`   ✅ PASS - All responses under 2 seconds`);
      passed++;
    } else {
      console.log(`   ❌ FAIL - Exceeded 2 second threshold`);
      failed++;
    }
    
    // Test 2: User list performance
    console.log('\n📋 Test 2: User List Performance (1000 entries)');
    console.log('-'.repeat(80));
    
    const userResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await measureResponseTime('/admin/users', headers);
      userResults.push(result.duration);
      console.log(`   Run ${i + 1}: ${result.duration}ms (${result.itemCount} items)`);
    }
    
    const avgUserTime = userResults.reduce((a, b) => a + b, 0) / userResults.length;
    const maxUserTime = Math.max(...userResults);
    
    console.log(`\n   Average: ${avgUserTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxUserTime}ms`);
    console.log(`   Requirement: <2000ms (2 seconds)`);
    
    if (maxUserTime < 2000) {
      console.log(`   ✅ PASS - All responses under 2 seconds`);
      passed++;
    } else {
      console.log(`   ❌ FAIL - Exceeded 2 second threshold`);
      failed++;
    }
    
    // Test 3: Dashboard performance
    console.log('\n📋 Test 3: Dashboard Performance');
    console.log('-'.repeat(80));
    
    const dashboardResults = [];
    for (let i = 0; i < 5; i++) {
      const result = await measureResponseTime('/admin/dashboard', headers);
      dashboardResults.push(result.duration);
      console.log(`   Run ${i + 1}: ${result.duration}ms`);
    }
    
    const avgDashboardTime = dashboardResults.reduce((a, b) => a + b, 0) / dashboardResults.length;
    const maxDashboardTime = Math.max(...dashboardResults);
    
    console.log(`\n   Average: ${avgDashboardTime.toFixed(2)}ms`);
    console.log(`   Max: ${maxDashboardTime}ms`);
    console.log(`   Requirement: <2000ms (2 seconds)`);
    
    if (maxDashboardTime < 2000) {
      console.log(`   ✅ PASS - All responses under 2 seconds`);
      passed++;
    } else {
      console.log(`   ❌ FAIL - Exceeded 2 second threshold`);
      failed++;
    }
    
    // Cleanup
    await cleanupTestData();
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n✅ All performance tests passed! (SC-006 satisfied)\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some performance tests failed. Optimization needed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    await cleanupTestData();
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Check if server is running
axios.get(`${BASE_URL}/health`).then(() => {
  console.log('✅ Server is running, starting performance tests...\n');
  runPerformanceTests();
}).catch(() => {
  console.error('❌ Server is not running. Please start the backend server first.');
  console.error('   Run: npm start\n');
  process.exit(1);
});
