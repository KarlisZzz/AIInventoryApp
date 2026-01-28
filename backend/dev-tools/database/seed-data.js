// Seed test data for inventory system
const { sequelize } = require('./src/db/connection');
const { User, Item, LendingLog } = require('./src/models');

async function seedData() {
  try {
    console.log('🌱 Seeding database with test data...');
    
    // Create test users
    const user1 = await User.create({
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Staff'
    });

    const user2 = await User.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Staff'
    });

    console.log('✓ Created 2 test users');

    // Create test items
    const items = await Item.bulkCreate([
      {
        name: 'Dell XPS 15 Laptop',
        description: 'High-performance laptop with 16GB RAM and 512GB SSD',
        category: 'Electronics',
        quantity: 3,
        condition: 'Excellent',
        userId: user1.id,
        imageUrl: null
      },
      {
        name: 'HP LaserJet Printer',
        description: 'Network printer with duplex printing',
        category: 'Electronics',
        quantity: 2,
        condition: 'Good',
        userId: user1.id,
        imageUrl: null
      },
      {
        name: 'Office Chair - Ergonomic',
        description: 'Adjustable height and lumbar support',
        category: 'Furniture',
        quantity: 5,
        condition: 'Good',
        userId: user2.id,
        imageUrl: null
      },
      {
        name: 'Standing Desk',
        description: 'Electric height-adjustable desk',
        category: 'Furniture',
        quantity: 2,
        condition: 'Excellent',
        userId: user2.id,
        imageUrl: null
      },
      {
        name: 'Whiteboard - Large',
        description: '6ft x 4ft magnetic whiteboard',
        category: 'Office Supplies',
        quantity: 4,
        condition: 'Good',
        userId: user1.id,
        imageUrl: null
      },
      {
        name: 'Conference Phone',
        description: 'Polycom conference phone system',
        category: 'Electronics',
        quantity: 3,
        condition: 'Good',
        userId: user2.id,
        imageUrl: null
      },
      {
        name: 'Projector - Full HD',
        description: 'Epson projector with HDMI and wireless',
        category: 'Electronics',
        quantity: 2,
        condition: 'Excellent',
        userId: user1.id,
        imageUrl: null
      },
      {
        name: 'Monitor - 27 inch',
        description: 'Dell UltraSharp 4K monitor',
        category: 'Electronics',
        quantity: 8,
        condition: 'Excellent',
        userId: user2.id,
        imageUrl: null
      }
    ]);

    console.log(`✓ Created ${items.length} test items`);

    console.log('\n✅ Database seeded successfully!');
    console.log(`   - ${items.length} items`);
    console.log(`   - 2 users`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedData();
