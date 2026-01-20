/**
 * Database Seed Script
 * 
 * Populates the database with sample data for development and testing.
 * 
 * Usage:
 *   npm run seed
 * 
 * Constitution Compliance:
 * - Uses async/await (Principle V)
 * - Transactions for data integrity (Principle III)
 * - Denormalized borrower data in LendingLog (FR-016)
 */

const { sequelize } = require('../../config/database');
const Item = require('../../models/Item');
const User = require('../../models/User');
const LendingLog = require('../../models/LendingLog');

/**
 * Sample Items (10 items across various categories)
 */
const sampleItems = [
  {
    name: 'Dell Latitude Laptop',
    description: 'High-performance laptop for development work. Intel i7, 16GB RAM, 512GB SSD.',
    category: 'Hardware',
    status: 'Available',
  },
  {
    name: 'Logitech Wireless Mouse',
    description: 'Ergonomic wireless mouse with precision tracking.',
    category: 'Accessories',
    status: 'Available',
  },
  {
    name: 'BenQ Monitor 27"',
    description: '27-inch 4K monitor with IPS panel. Perfect for design work.',
    category: 'Hardware',
    status: 'Lent',
  },
  {
    name: 'Mechanical Keyboard',
    description: 'Cherry MX Blue switches, RGB backlight. Great for typing.',
    category: 'Accessories',
    status: 'Available',
  },
  {
    name: 'Projector - Epson EB-X05',
    description: 'Portable projector for presentations. 3300 lumens, HDMI input.',
    category: 'Presentation',
    status: 'Available',
  },
  {
    name: 'HP LaserJet Printer',
    description: 'Black and white laser printer. Fast and reliable.',
    category: 'Office Equipment',
    status: 'Maintenance',
  },
  {
    name: 'iPad Pro 12.9"',
    description: 'Latest model with Apple Pencil. Ideal for design mockups.',
    category: 'Tablets',
    status: 'Lent',
  },
  {
    name: 'Whiteboard Markers (Pack of 10)',
    description: 'Assorted colors, dry-erase markers for brainstorming sessions.',
    category: 'Office Supplies',
    status: 'Available',
  },
  {
    name: 'Portable Hard Drive 2TB',
    description: 'External HDD for backups and file transfers. USB 3.0.',
    category: 'Storage',
    status: 'Available',
  },
  {
    name: 'Wireless Headphones - Sony WH-1000XM5',
    description: 'Noise-cancelling headphones with premium sound quality.',
    category: 'Accessories',
    status: 'Lent',
  },
];

/**
 * Sample Users (5 users with different roles)
 */
const sampleUsers = [
  {
    name: 'Alice Johnson',
    email: 'alice.johnson@company.com',
    role: 'Developer',
  },
  {
    name: 'Bob Smith',
    email: 'bob.smith@company.com',
    role: 'Designer',
  },
  {
    name: 'Carol Williams',
    email: 'carol.williams@company.com',
    role: 'Project Manager',
  },
  {
    name: 'David Brown',
    email: 'david.brown@company.com',
    role: 'QA Engineer',
  },
  {
    name: 'Eve Davis',
    email: 'eve.davis@company.com',
    role: 'DevOps Engineer',
  },
];

/**
 * Main seed function
 */
async function seedDatabase() {
  const transaction = await sequelize.transaction();

  try {
    console.log('🌱 Starting database seed...\n');

    // 1. Clear existing data (in correct order to respect foreign keys)
    console.log('📦 Clearing existing data...');
    await LendingLog.destroy({ where: {}, transaction });
    await Item.destroy({ where: {}, transaction });
    await User.destroy({ where: {}, transaction });
    console.log('✅ Existing data cleared\n');

    // 2. Insert Users
    console.log('👥 Creating users...');
    const users = await User.bulkCreate(sampleUsers, {
      transaction,
      returning: true,
    });
    console.log(`✅ Created ${users.length} users\n`);

    // 3. Insert Items
    console.log('📦 Creating items...');
    const items = await Item.bulkCreate(sampleItems, {
      transaction,
      returning: true,
    });
    console.log(`✅ Created ${items.length} items\n`);

    // 4. Create sample lending logs for "Lent" items (with denormalized borrower data per FR-016)
    console.log('📝 Creating lending logs...');
    
    const lentItems = items.filter(item => item.status === 'Lent');
    const lendingLogs = [];

    for (let i = 0; i < lentItems.length; i++) {
      const item = lentItems[i];
      const user = users[i % users.length]; // Cycle through users
      
      lendingLogs.push({
        itemId: item.id,
        userId: user.id,
        borrowerName: user.name,           // Denormalized per FR-016
        borrowerEmail: user.email,         // Denormalized per FR-016
        dateLent: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        dateReturned: null,                 // Still out
        conditionNotes: 'Item in good condition at lending time',
      });
    }

    if (lendingLogs.length > 0) {
      await LendingLog.bulkCreate(lendingLogs, { transaction });
      console.log(`✅ Created ${lendingLogs.length} lending logs\n`);
    }

    // 5. Create a few historical (returned) lending logs
    console.log('📜 Creating historical lending logs...');
    
    const availableItems = items.filter(item => item.status === 'Available').slice(0, 3);
    const historicalLogs = [];

    for (let i = 0; i < availableItems.length; i++) {
      const item = availableItems[i];
      const user = users[(i + 1) % users.length];
      const dateLent = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      const dateReturned = new Date(dateLent.getTime() + 7 * 24 * 60 * 60 * 1000); // Returned 7 days later
      
      historicalLogs.push({
        itemId: item.id,
        userId: user.id,
        borrowerName: user.name,           // Denormalized per FR-016
        borrowerEmail: user.email,         // Denormalized per FR-016
        dateLent,
        dateReturned,
        conditionNotes: 'Item returned in excellent condition. No issues reported.',
      });
    }

    if (historicalLogs.length > 0) {
      await LendingLog.bulkCreate(historicalLogs, { transaction });
      console.log(`✅ Created ${historicalLogs.length} historical lending logs\n`);
    }

    // 6. Commit transaction
    await transaction.commit();

    // 7. Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Database seeded successfully!\n');
    console.log('Summary:');
    console.log(`  • ${users.length} users created`);
    console.log(`  • ${items.length} items created`);
    console.log(`    - ${items.filter(i => i.status === 'Available').length} Available`);
    console.log(`    - ${items.filter(i => i.status === 'Lent').length} Lent`);
    console.log(`    - ${items.filter(i => i.status === 'Maintenance').length} Maintenance`);
    console.log(`  • ${lendingLogs.length + historicalLogs.length} lending logs created`);
    console.log(`    - ${lendingLogs.length} active loans`);
    console.log(`    - ${historicalLogs.length} returned items (history)`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('✨ You can now start the development server and see sample data!\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    console.error('Full error:', error);
    await transaction.rollback();
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seed if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed script failed:', error);
      process.exit(1);
    });
}

module.exports = { seedDatabase };
