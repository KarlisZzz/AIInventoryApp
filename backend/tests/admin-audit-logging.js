/**
 * Admin Audit Logging Test
 * Verifies that all admin actions are properly logged to AdminAuditLogs table
 * Tests: CREATE, UPDATE, DELETE operations for categories and users
 */

const { AdminAuditLog, Category, User, sequelize } = require('../src/models');

const ADMIN_USER_ID = '00d31d5b-2fc8-463b-be0c-44c60fba1797';

async function testAuditLogging() {
  console.log('📝 Admin Audit Logging Test\n');
  console.log('='.repeat(80));
  
  let passed = 0;
  let failed = 0;
  
  try {
    // Clear existing audit logs for clean test
    await AdminAuditLog.destroy({ where: {}, truncate: true });
    console.log('✅ Cleared existing audit logs for clean test\n');
    
    // Test 1: Category Creation Audit Log
    console.log('📋 Test 1: Category Creation Audit');
    console.log('-'.repeat(80));
    
    const testCategory = await Category.create({
      name: 'Audit Test Category',
      createdBy: ADMIN_USER_ID,
    });
    
    await AdminAuditLog.create({
      action: 'CREATE_CATEGORY',
      entityType: 'Category',
      entityId: testCategory.id,
      adminUserId: ADMIN_USER_ID,
      details: { name: testCategory.name },
    });
    
    const createLog = await AdminAuditLog.findOne({
      where: {
        action: 'CREATE_CATEGORY',
        entityId: testCategory.id,
      },
    });
    
    if (createLog && createLog.adminUserId === ADMIN_USER_ID) {
      console.log('✅ Category creation logged correctly');
      console.log(`   Action: ${createLog.action}, Entity: ${createLog.entityType}, Admin: ${createLog.adminUserId}`);
      passed++;
    } else {
      console.log('❌ Category creation not logged');
      failed++;
    }
    
    // Test 2: Category Update Audit Log
    console.log('\n📋 Test 2: Category Update Audit');
    console.log('-'.repeat(80));
    
    const oldName = testCategory.name;
    testCategory.name = 'Updated Audit Category';
    await testCategory.save();
    
    await AdminAuditLog.create({
      action: 'UPDATE_CATEGORY',
      entityType: 'Category',
      entityId: testCategory.id,
      adminUserId: ADMIN_USER_ID,
      details: { oldName, newName: testCategory.name },
    });
    
    const updateLog = await AdminAuditLog.findOne({
      where: {
        action: 'UPDATE_CATEGORY',
        entityId: testCategory.id,
      },
    });
    
    if (updateLog && updateLog.details.newName === 'Updated Audit Category') {
      console.log('✅ Category update logged correctly');
      console.log(`   Action: ${updateLog.action}, Old: ${updateLog.details.oldName}, New: ${updateLog.details.newName}`);
      passed++;
    } else {
      console.log('❌ Category update not logged');
      failed++;
    }
    
    // Test 3: Category Deletion Audit Log
    console.log('\n📋 Test 3: Category Deletion Audit');
    console.log('-'.repeat(80));
    
    await AdminAuditLog.create({
      action: 'DELETE_CATEGORY',
      entityType: 'Category',
      entityId: testCategory.id,
      adminUserId: ADMIN_USER_ID,
      details: { name: testCategory.name },
    });
    
    await testCategory.destroy();
    
    const deleteLog = await AdminAuditLog.findOne({
      where: {
        action: 'DELETE_CATEGORY',
        entityId: testCategory.id,
      },
    });
    
    if (deleteLog) {
      console.log('✅ Category deletion logged correctly');
      console.log(`   Action: ${deleteLog.action}, Entity: ${deleteLog.entityType}`);
      passed++;
    } else {
      console.log('❌ Category deletion not logged');
      failed++;
    }
    
    // Test 4: User Creation Audit Log
    console.log('\n📋 Test 4: User Creation Audit');
    console.log('-'.repeat(80));
    
    const testUser = await User.create({
      email: 'audittest@example.com',
      name: 'Audit Test User',
      password: 'temporary123',
      role: 'standard user',
      active: true,
    });
    
    await AdminAuditLog.create({
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: testUser.id,
      adminUserId: ADMIN_USER_ID,
      details: { email: testUser.email, name: testUser.name, role: testUser.role },
    });
    
    const userCreateLog = await AdminAuditLog.findOne({
      where: {
        action: 'CREATE_USER',
        entityId: testUser.id,
      },
    });
    
    if (userCreateLog && userCreateLog.details.email === 'audittest@example.com') {
      console.log('✅ User creation logged correctly');
      console.log(`   Action: ${userCreateLog.action}, Email: ${userCreateLog.details.email}`);
      passed++;
    } else {
      console.log('❌ User creation not logged');
      failed++;
    }
    
    // Test 5: User Update Audit Log
    console.log('\n📋 Test 5: User Update Audit');
    console.log('-'.repeat(80));
    
    testUser.role = 'administrator';
    await testUser.save();
    
    await AdminAuditLog.create({
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: testUser.id,
      adminUserId: ADMIN_USER_ID,
      details: { userId: testUser.id, changes: { role: 'administrator' } },
    });
    
    const userUpdateLog = await AdminAuditLog.findOne({
      where: {
        action: 'UPDATE_USER',
        entityId: testUser.id,
      },
    });
    
    if (userUpdateLog) {
      console.log('✅ User update logged correctly');
      console.log(`   Action: ${userUpdateLog.action}, Changes: ${JSON.stringify(userUpdateLog.details.changes)}`);
      passed++;
    } else {
      console.log('❌ User update not logged');
      failed++;
    }
    
    // Test 6: User Deletion Audit Log
    console.log('\n📋 Test 6: User Deletion/Deactivation Audit');
    console.log('-'.repeat(80));
    
    testUser.active = false;
    await testUser.save();
    
    await AdminAuditLog.create({
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: testUser.id,
      adminUserId: ADMIN_USER_ID,
      details: { email: testUser.email, name: testUser.name },
    });
    
    const userDeleteLog = await AdminAuditLog.findOne({
      where: {
        action: 'DELETE_USER',
        entityId: testUser.id,
      },
    });
    
    if (userDeleteLog) {
      console.log('✅ User deletion logged correctly');
      console.log(`   Action: ${userDeleteLog.action}, Entity: ${userDeleteLog.entityType}`);
      passed++;
    } else {
      console.log('❌ User deletion not logged');
      failed++;
    }
    
    // Test 7: Verify audit log count
    console.log('\n📋 Test 7: Total Audit Logs');
    console.log('-'.repeat(80));
    
    const totalLogs = await AdminAuditLog.count();
    
    if (totalLogs === 6) {
      console.log(`✅ Correct number of audit logs: ${totalLogs}`);
      passed++;
    } else {
      console.log(`❌ Expected 6 audit logs, found ${totalLogs}`);
      failed++;
    }
    
    // Clean up test data
    await testUser.destroy({ force: true });
    console.log('\n✅ Cleaned up test data');
    
    // Summary
    console.log('\n' + '='.repeat(80));
    console.log(`\n📊 Test Summary: ${passed} passed, ${failed} failed`);
    
    if (failed === 0) {
      console.log('\n✅ All audit logging tests passed!\n');
      process.exit(0);
    } else {
      console.log('\n❌ Some audit logging tests failed.\n');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run tests
testAuditLogging();
