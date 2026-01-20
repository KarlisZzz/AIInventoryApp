/**
 * Test Data Generator
 * 
 * Generates representative test dataset for performance benchmarking:
 * - 500 items
 * - 50 users
 * - 1000 lending logs
 * 
 * Per FR-036: Performance tests require minimum dataset size
 * 
 * Usage: node backend/src/scripts/generateTestData.js
 */

const { sequelize } = require('../config/database');
const { Item, User, LendingLog } = require('../models');

// Configuration
const CONFIG = {
  ITEMS: 500,
  USERS: 50,
  LENDING_LOGS: 1000,
};

// Sample data
const CATEGORIES = ['Electronics', 'Tools', 'Furniture', 'Sports', 'Office Supplies', 'Books', 'Equipment'];
const ITEM_PREFIXES = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Desk', 'Chair', 'Drill', 'Hammer', 'Projector', 'Camera'];
const STATUSES = ['Available', 'Lent', 'Maintenance'];
const DOMAINS = ['example.com', 'test.org', 'demo.net', 'sample.io'];

/**
 * Generate random integer between min and max (inclusive)
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random date between start and end dates
 */
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

/**
 * Get random element from array
 */
function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate users
 */
async function generateUsers() {
  console.log(`Generating ${CONFIG.USERS} users...`);
  const users = [];
  
  for (let i = 1; i <= CONFIG.USERS; i++) {
    users.push({
      name: `User ${i}`,
      email: `user${i}@${randomElement(DOMAINS)}`,
      role: i <= 5 ? 'Admin' : 'Member',
    });
  }
  
  await User.bulkCreate(users);
  console.log(`✓ Created ${CONFIG.USERS} users`);
}

/**
 * Generate items
 */
async function generateItems() {
  console.log(`Generating ${CONFIG.ITEMS} items...`);
  const items = [];
  
  for (let i = 1; i <= CONFIG.ITEMS; i++) {
    const prefix = randomElement(ITEM_PREFIXES);
    const category = randomElement(CATEGORIES);
    
    items.push({
      name: `${prefix} ${i}`,
      description: `Test item ${i} for performance testing - ${category} category`,
      category: category,
      status: 'Available', // Start all as Available
    });
  }
  
  await Item.bulkCreate(items);
  console.log(`✓ Created ${CONFIG.ITEMS} items`);
}

/**
 * Generate lending logs
 */
async function generateLendingLogs() {
  console.log(`Generating ${CONFIG.LENDING_LOGS} lending logs...`);
  
  // Get all users and items
  const users = await User.findAll();
  const items = await Item.findAll();
  
  if (users.length === 0 || items.length === 0) {
    throw new Error('Users and items must be created before generating lending logs');
  }
  
  const logs = [];
  const now = new Date();
  const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
  
  // Track which items are currently lent
  const currentlyLentItems = new Set();
  
  for (let i = 0; i < CONFIG.LENDING_LOGS; i++) {
    // Randomly select item and user
    let item;
    let maxRetries = 50;
    
    // For the last 20% of logs, allow some to be currently active (not returned)
    const shouldBeActive = i >= CONFIG.LENDING_LOGS * 0.8 && currentlyLentItems.size < items.length * 0.2;
    
    // Find an item that isn't currently lent (unless we want an active loan)
    do {
      item = randomElement(items);
      maxRetries--;
      if (maxRetries === 0) break;
    } while (currentlyLentItems.has(item.id) && !shouldBeActive);
    
    if (maxRetries === 0) continue; // Skip if can't find suitable item
    
    const user = randomElement(users);
    const dateLent = randomDate(oneYearAgo, now);
    
    // Determine if this loan should be returned
    let dateReturned = null;
    if (!shouldBeActive || Math.random() > 0.5) {
      // Most loans are returned within 1-30 days
      const returnDelay = randomInt(1, 30) * 24 * 60 * 60 * 1000;
      dateReturned = new Date(dateLent.getTime() + returnDelay);
      
      // Don't return in the future
      if (dateReturned > now) {
        dateReturned = now;
      }
    } else {
      // This item is currently lent
      currentlyLentItems.add(item.id);
    }
    
    logs.push({
      itemId: item.id,
      userId: user.id,
      borrowerName: user.name,
      borrowerEmail: user.email,
      dateLent: dateLent,
      dateReturned: dateReturned,
      conditionNotes: i % 10 === 0 ? `Test condition note ${i}` : null,
    });
  }
  
  await LendingLog.bulkCreate(logs);
  console.log(`✓ Created ${logs.length} lending logs (${currentlyLentItems.size} currently active)`);
  
  // Update item statuses for currently lent items
  if (currentlyLentItems.size > 0) {
    await Item.update(
      { status: 'Lent' },
      { where: { id: Array.from(currentlyLentItems) } }
    );
    console.log(`✓ Updated ${currentlyLentItems.size} items to 'Lent' status`);
  }
  
  // Set some random items to Maintenance
  const maintenanceCount = Math.floor(CONFIG.ITEMS * 0.05); // 5% in maintenance
  const availableItems = items.filter(item => !currentlyLentItems.has(item.id));
  const maintenanceItems = availableItems.slice(0, maintenanceCount);
  
  if (maintenanceItems.length > 0) {
    await Item.update(
      { status: 'Maintenance' },
      { where: { id: maintenanceItems.map(item => item.id) } }
    );
    console.log(`✓ Updated ${maintenanceItems.length} items to 'Maintenance' status`);
  }
}

/**
 * Clear existing test data
 */
async function clearTestData() {
  console.log('Clearing existing test data...');
  
  // Disable foreign key checks temporarily
  await sequelize.query('PRAGMA foreign_keys = OFF');
  
  await LendingLog.destroy({ where: {}, force: true });
  await Item.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  
  // Re-enable foreign key checks
  await sequelize.query('PRAGMA foreign_keys = ON');
  
  console.log('✓ Cleared all test data');
}

/**
 * Display statistics
 */
async function displayStatistics() {
  console.log('\n=== Database Statistics ===');
  
  const itemCount = await Item.count();
  const userCount = await User.count();
  const logCount = await LendingLog.count();
  
  const itemsByStatus = await Item.findAll({
    attributes: [
      'status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count']
    ],
    group: ['status'],
    raw: true
  });
  
  const activeLending = await LendingLog.count({
    where: { dateReturned: null }
  });
  
  console.log(`Items: ${itemCount}`);
  console.log(`Users: ${userCount}`);
  console.log(`Lending Logs: ${logCount}`);
  console.log(`Active Loans: ${activeLending}`);
  console.log('\nItems by Status:');
  itemsByStatus.forEach(stat => {
    console.log(`  ${stat.status}: ${stat.count}`);
  });
  console.log('===========================\n');
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('Test Data Generator');
    console.log('===================\n');
    
    // Initialize database connection
    await sequelize.authenticate();
    console.log('✓ Database connected\n');
    
    // Clear existing data
    await clearTestData();
    
    // Generate test data
    console.log('\nGenerating test data...\n');
    await generateUsers();
    await generateItems();
    await generateLendingLogs();
    
    // Display statistics
    await displayStatistics();
    
    console.log('✓ Test data generation complete!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Error generating test data:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { generateUsers, generateItems, generateLendingLogs, clearTestData };
