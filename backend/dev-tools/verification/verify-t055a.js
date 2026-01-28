/**
 * Verification Script: T055a - Deletion Prevention for Items with Lending History
 * 
 * Tests FR-008/FR-009: Verify that items with lending history cannot be deleted
 * even when their current status is "Available" (audit trail protection)
 * 
 * Test Scenario:
 * 1. Create a test item
 * 2. Create a test user
 * 3. Lend the item to the user
 * 4. Return the item (status becomes "Available" again)
 * 5. Attempt to delete the item
 * 6. Verify deletion is prevented with appropriate error message
 */

const { sequelize } = require('./src/config/database');
const Item = require('./src/models/Item');
const User = require('./src/models/User');
const LendingLog = require('./src/models/LendingLog');
const itemService = require('./src/services/itemService');
const lendingService = require('./src/services/lendingService');

async function runVerification() {
  console.log('🧪 T055a Verification: Deletion Prevention for Items with Lending History\n');
  console.log('=' .repeat(80));
  
  let testItem = null;
  let testUser = null;
  
  try {
    // Step 1: Create a test item
    console.log('\n📝 Step 1: Creating test item...');
    testItem = await itemService.createItem({
      name: 'Test Laptop for T055a',
      description: 'Test item to verify deletion prevention',
      category: 'Electronics',
      status: 'Available'
    });
    console.log(`✓ Created item: ${testItem.name} (ID: ${testItem.id})`);
    console.log(`  Status: ${testItem.status}`);
    
    // Step 2: Get or create a test user
    console.log('\n📝 Step 2: Getting test user...');
    testUser = await User.findOne({ where: { email: 'john@example.com' } });
    if (!testUser) {
      console.log('  Creating test user...');
      testUser = await User.create({
        name: 'John Doe',
        email: 'john@example.com'
      });
    }
    console.log(`✓ Using user: ${testUser.name} (ID: ${testUser.id})`);
    
    // Step 3: Lend the item
    console.log('\n📝 Step 3: Lending item to user...');
    const lendResult = await lendingService.lendItem(
      testItem.id, 
      testUser.id, 
      'Good condition - verification test'
    );
    console.log(`✓ Item lent successfully`);
    console.log(`  LendingLog ID: ${lendResult.log.id}`);
    console.log(`  Item Status: ${lendResult.item.status}`);
    
    // Verify item status changed to "Lent"
    const lentItem = await Item.findByPk(testItem.id);
    if (lentItem.status !== 'Lent') {
      throw new Error(`Expected status "Lent", got "${lentItem.status}"`);
    }
    
    // Step 4: Return the item
    console.log('\n📝 Step 4: Returning item...');
    const returnResult = await lendingService.returnItem(
      testItem.id, 
      'Returned in good condition - verification test'
    );
    console.log(`✓ Item returned successfully`);
    console.log(`  Item Status: ${returnResult.item.status}`);
    
    // Verify item status changed back to "Available"
    const returnedItem = await Item.findByPk(testItem.id);
    if (returnedItem.status !== 'Available') {
      throw new Error(`Expected status "Available", got "${returnedItem.status}"`);
    }
    console.log(`  ✓ Status confirmed: ${returnedItem.status}`);
    
    // Step 5: Check lending history exists
    console.log('\n📝 Step 5: Verifying lending history exists...');
    const historyCount = await LendingLog.count({ where: { itemId: testItem.id } });
    console.log(`✓ Found ${historyCount} lending record(s) for this item`);
    
    if (historyCount === 0) {
      throw new Error('No lending history found - test setup failed');
    }
    
    // Step 6: Attempt to delete the item (THIS SHOULD FAIL)
    console.log('\n📝 Step 6: Attempting to delete item with lending history...');
    console.log('  (This should be prevented by FR-009)');
    
    let deletionPrevented = false;
    let errorMessage = '';
    
    try {
      await itemService.deleteItem(testItem.id);
      console.log('❌ FAILURE: Item was deleted despite having lending history!');
    } catch (error) {
      deletionPrevented = true;
      errorMessage = error.message;
      console.log(`✓ Deletion prevented as expected`);
      console.log(`  Error message: "${errorMessage}"`);
    }
    
    // Step 7: Verify the item still exists in database
    console.log('\n📝 Step 7: Verifying item still exists in database...');
    const stillExists = await Item.findByPk(testItem.id);
    
    if (!stillExists) {
      console.log('❌ FAILURE: Item was deleted from database!');
      throw new Error('Item should still exist but was not found');
    }
    
    console.log(`✓ Item still exists in database`);
    console.log(`  Name: ${stillExists.name}`);
    console.log(`  Status: ${stillExists.status}`);
    
    // Step 8: Verify lending history is intact
    console.log('\n📝 Step 8: Verifying lending history is intact...');
    const historyAfterAttempt = await LendingLog.count({ where: { itemId: testItem.id } });
    console.log(`✓ Lending history count: ${historyAfterAttempt} record(s)`);
    
    if (historyAfterAttempt !== historyCount) {
      throw new Error('Lending history was modified during deletion attempt');
    }
    
    // Final verification
    console.log('\n' + '='.repeat(80));
    console.log('📊 VERIFICATION SUMMARY\n');
    
    const expectedErrorKeywords = ['lending history', 'audit trail'];
    const hasExpectedError = expectedErrorKeywords.some(keyword => 
      errorMessage.toLowerCase().includes(keyword)
    );
    
    if (deletionPrevented && hasExpectedError && stillExists && historyAfterAttempt > 0) {
      console.log('✅ T055a VERIFICATION PASSED\n');
      console.log('Results:');
      console.log(`  ✓ Deletion was prevented: ${deletionPrevented}`);
      console.log(`  ✓ Error message mentions audit/history: ${hasExpectedError}`);
      console.log(`  ✓ Item still exists: ${stillExists !== null}`);
      console.log(`  ✓ Lending history preserved: ${historyAfterAttempt > 0}`);
      console.log(`  ✓ Item status remains: ${stillExists.status}`);
      console.log('\nConclusion: FR-008 and FR-009 audit trail protection is working correctly.');
      console.log('Items with lending history cannot be deleted, even when Available.\n');
      return true;
    } else {
      console.log('❌ T055a VERIFICATION FAILED\n');
      console.log('Issues detected:');
      if (!deletionPrevented) console.log('  ✗ Deletion was not prevented');
      if (!hasExpectedError) console.log('  ✗ Error message does not mention audit/history');
      if (!stillExists) console.log('  ✗ Item was deleted from database');
      if (historyAfterAttempt === 0) console.log('  ✗ Lending history was lost');
      console.log('');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ Test execution failed with error:', error.message);
    console.error('\nStack trace:', error.stack);
    return false;
  } finally {
    // Cleanup: Delete test item if it exists and has no history
    // (For this test, we actually want to keep it to demonstrate protection)
    console.log('\n📝 Cleanup: Test item intentionally left in database to demonstrate protection.');
    console.log('   To manually clean up, delete the LendingLog record first, then the Item.\n');
  }
}

// Main execution
(async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.\n');
    
    const success = await runVerification();
    
    await sequelize.close();
    
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
