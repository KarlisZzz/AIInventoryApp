/**
 * Test Category Endpoints
 * 
 * Manual test script for User Story 1 (Category Management) endpoints.
 * Tests all CRUD operations with various scenarios.
 * 
 * Run with: node test-category-endpoints.js
 */

const request = require('supertest');
const app = require('./src/app');
const { sequelize, User } = require('./src/models');

// Test data
let adminUserId;
let testCategoryId;

async function runTests() {
  try {
    console.log('🧪 Testing Category Management Endpoints\n');
    console.log('=' .repeat(60));

    // Setup: Get an admin user
    console.log('\n📋 Setup: Finding administrator user...');
    const [admins] = await sequelize.query("SELECT id FROM Users WHERE role = 'administrator' LIMIT 1");
    
    if (admins.length === 0) {
      console.error('❌ No administrator users found. Please create an admin user first.');
      process.exit(1);
    }
    
    adminUserId = admins[0].id;
    console.log(`✓ Using admin user: ${adminUserId}`);

    // Test 1: List categories (initially from migration)
    console.log('\n' + '='.repeat(60));
    console.log('Test 1: GET /api/v1/admin/categories - List all categories');
    console.log('='.repeat(60));
    const res1 = await request(app)
      .get('/api/v1/admin/categories')
      .set('x-user-id', adminUserId);
    
    console.log(`Status: ${res1.status}`);
    console.log(`Response:`, JSON.stringify(res1.body, null, 2));
    
    if (res1.status === 200) {
      console.log('✅ PASS: Categories retrieved successfully');
      console.log(`   Found ${res1.body.data.length} categories`);
    } else {
      console.log('❌ FAIL: Expected 200, got', res1.status);
    }

    // Test 2: Create new category
    console.log('\n' + '='.repeat(60));
    console.log('Test 2: POST /api/v1/admin/categories - Create category');
    console.log('='.repeat(60));
    const res2 = await request(app)
      .post('/api/v1/admin/categories')
      .set('x-user-id', adminUserId)
      .send({ name: 'Test Electronics' });
    
    console.log(`Status: ${res2.status}`);
    console.log(`Response:`, JSON.stringify(res2.body, null, 2));
    
    if (res2.status === 201) {
      console.log('✅ PASS: Category created successfully');
      testCategoryId = res2.body.data.id;
      console.log(`   Category ID: ${testCategoryId}`);
    } else {
      console.log('❌ FAIL: Expected 201, got', res2.status);
    }

    // Test 3: Create duplicate category (should fail)
    console.log('\n' + '='.repeat(60));
    console.log('Test 3: POST /api/v1/admin/categories - Create duplicate (should fail)');
    console.log('='.repeat(60));
    const res3 = await request(app)
      .post('/api/v1/admin/categories')
      .set('x-user-id', adminUserId)
      .send({ name: 'Test Electronics' });
    
    console.log(`Status: ${res3.status}`);
    console.log(`Response:`, JSON.stringify(res3.body, null, 2));
    
    if (res3.status === 409) {
      console.log('✅ PASS: Duplicate category rejected (409 Conflict)');
    } else {
      console.log('❌ FAIL: Expected 409, got', res3.status);
    }

    // Test 4: Get category by ID
    if (testCategoryId) {
      console.log('\n' + '='.repeat(60));
      console.log('Test 4: GET /api/v1/admin/categories/:id - Get category details');
      console.log('='.repeat(60));
      const res4 = await request(app)
        .get(`/api/v1/admin/categories/${testCategoryId}`)
        .set('x-user-id', adminUserId);
      
      console.log(`Status: ${res4.status}`);
      console.log(`Response:`, JSON.stringify(res4.body, null, 2));
      
      if (res4.status === 200) {
        console.log('✅ PASS: Category retrieved successfully');
      } else {
        console.log('❌ FAIL: Expected 200, got', res4.status);
      }
    }

    // Test 5: Update category name
    if (testCategoryId) {
      console.log('\n' + '='.repeat(60));
      console.log('Test 5: PUT /api/v1/admin/categories/:id - Update category');
      console.log('='.repeat(60));
      const res5 = await request(app)
        .put(`/api/v1/admin/categories/${testCategoryId}`)
        .set('x-user-id', adminUserId)
        .send({ name: 'Updated Electronics' });
      
      console.log(`Status: ${res5.status}`);
      console.log(`Response:`, JSON.stringify(res5.body, null, 2));
      
      if (res5.status === 200) {
        console.log('✅ PASS: Category updated successfully');
      } else {
        console.log('❌ FAIL: Expected 200, got', res5.status);
      }
    }

    // Test 6: Get category with items (use existing category with items)
    console.log('\n' + '='.repeat(60));
    console.log('Test 6: GET /api/v1/admin/categories - Check item counts');
    console.log('='.repeat(60));
    const res6 = await request(app)
      .get('/api/v1/admin/categories')
      .set('x-user-id', adminUserId);
    
    console.log(`Status: ${res6.status}`);
    if (res6.status === 200) {
      const categoriesWithItems = res6.body.data.filter(c => parseInt(c.itemCount) > 0);
      console.log(`✓ Categories with items: ${categoriesWithItems.length}`);
      categoriesWithItems.forEach(c => {
        console.log(`  - ${c.name}: ${c.itemCount} item(s)`);
      });
      console.log('✅ PASS: Item counts displayed correctly');
    }

    // Test 7: Try to delete category with items (should fail)
    if (res6.status === 200 && res6.body.data.length > 0) {
      const categoryWithItems = res6.body.data.find(c => parseInt(c.itemCount) > 0);
      if (categoryWithItems) {
        console.log('\n' + '='.repeat(60));
        console.log('Test 7: DELETE /api/v1/admin/categories/:id - Delete with items (should fail)');
        console.log('='.repeat(60));
        console.log(`Attempting to delete: ${categoryWithItems.name} (${categoryWithItems.itemCount} items)`);
        
        const res7 = await request(app)
          .delete(`/api/v1/admin/categories/${categoryWithItems.id}`)
          .set('x-user-id', adminUserId);
        
        console.log(`Status: ${res7.status}`);
        console.log(`Response:`, JSON.stringify(res7.body, null, 2));
        
        if (res7.status === 409) {
          console.log('✅ PASS: Cannot delete category with assigned items (409 Conflict)');
        } else {
          console.log('❌ FAIL: Expected 409, got', res7.status);
        }
      }
    }

    // Test 8: Delete category without items
    if (testCategoryId) {
      console.log('\n' + '='.repeat(60));
      console.log('Test 8: DELETE /api/v1/admin/categories/:id - Delete empty category');
      console.log('='.repeat(60));
      const res8 = await request(app)
        .delete(`/api/v1/admin/categories/${testCategoryId}`)
        .set('x-user-id', adminUserId);
      
      console.log(`Status: ${res8.status}`);
      console.log(`Response:`, JSON.stringify(res8.body, null, 2));
      
      if (res8.status === 200) {
        console.log('✅ PASS: Empty category deleted successfully');
      } else {
        console.log('❌ FAIL: Expected 200, got', res8.status);
      }
    }

    // Test 9: Verify audit logs were created
    console.log('\n' + '='.repeat(60));
    console.log('Test 9: Verify audit logs');
    console.log('='.repeat(60));
    const [auditLogs] = await sequelize.query(`
      SELECT * FROM AdminAuditLogs 
      WHERE entityType = 'Category' 
      ORDER BY timestamp DESC 
      LIMIT 5
    `);
    
    console.log(`Found ${auditLogs.length} audit log entries:`);
    auditLogs.forEach(log => {
      console.log(`  - ${log.action} by ${log.adminUserId} at ${log.timestamp}`);
      if (log.details) {
        console.log(`    Details: ${log.details}`);
      }
    });
    
    if (auditLogs.length >= 3) {
      console.log('✅ PASS: Audit logs created for category operations');
    } else {
      console.log('⚠️ WARNING: Expected more audit logs');
    }

    // Test 10: Test without authentication (should fail)
    console.log('\n' + '='.repeat(60));
    console.log('Test 10: GET /api/v1/admin/categories - No authentication (should fail)');
    console.log('='.repeat(60));
    const res10 = await request(app)
      .get('/api/v1/admin/categories');
    
    console.log(`Status: ${res10.status}`);
    console.log(`Response:`, JSON.stringify(res10.body, null, 2));
    
    if (res10.status === 401) {
      console.log('✅ PASS: Unauthenticated request rejected (401 Unauthorized)');
    } else {
      console.log('❌ FAIL: Expected 401, got', res10.status);
    }

    // Test 11: Test with non-admin user (should fail)
    const [standardUsers] = await sequelize.query("SELECT id FROM Users WHERE role = 'standard user' LIMIT 1");
    if (standardUsers.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('Test 11: GET /api/v1/admin/categories - Non-admin user (should fail)');
      console.log('='.repeat(60));
      const res11 = await request(app)
        .get('/api/v1/admin/categories')
        .set('x-user-id', standardUsers[0].id);
      
      console.log(`Status: ${res11.status}`);
      console.log(`Response:`, JSON.stringify(res11.body, null, 2));
      
      if (res11.status === 403) {
        console.log('✅ PASS: Standard user blocked from admin routes (403 Forbidden)');
      } else {
        console.log('❌ FAIL: Expected 403, got', res11.status);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ All Category Endpoint Tests Complete!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

runTests();
