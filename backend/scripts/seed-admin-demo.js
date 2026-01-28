/**
 * Admin Seed Data Script
 * Creates sample categories and admin users for demo purposes
 * Safe to run multiple times (checks for existing data)
 */

const { User, Category, sequelize } = require('../src/models');

async function seedAdminData() {
  console.log('🌱 Seeding Admin Demo Data\n');
  console.log('='.repeat(80));
  
  try {
    // Check if we already have sample data
    const existingCategories = await Category.count();
    const existingUsers = await User.count({ where: { role: 'administrator' } });
    
    if (existingCategories >= 5 && existingUsers >= 2) {
      console.log('✅ Sample data already exists');
      console.log(`   Categories: ${existingCategories}`);
      console.log(`   Administrators: ${existingUsers}`);
      console.log('\n💡 Run this script again to add more data, or use reset-database.js to start fresh.\n');
      return;
    }
    
    // Create admin users if needed
    if (existingUsers < 2) {
      console.log('\n📋 Creating Admin Users...');
      console.log('-'.repeat(80));
      
      const admins = [
        {
          email: 'admin@inventory.local',
          name: 'System Administrator',
          password: 'admin123',
          role: 'administrator',
          active: true,
        },
        {
          email: 'manager@inventory.local',
          name: 'Inventory Manager',
          password: 'manager123',
          role: 'administrator',
          active: true,
        },
      ];
      
      for (const adminData of admins) {
        const [user, created] = await User.findOrCreate({
          where: { email: adminData.email },
          defaults: adminData,
        });
        
        if (created) {
          console.log(`✅ Created admin: ${user.name} (${user.email})`);
        } else {
          console.log(`⏭️  Already exists: ${user.name} (${user.email})`);
        }
      }
    }
    
    // Create standard users for testing
    console.log('\n📋 Creating Standard Users...');
    console.log('-'.repeat(80));
    
    const standardUsers = [
      {
        email: 'john.doe@inventory.local',
        name: 'John Doe',
        password: 'user123',
        role: 'standard user',
        active: true,
      },
      {
        email: 'jane.smith@inventory.local',
        name: 'Jane Smith',
        password: 'user123',
        role: 'standard user',
        active: true,
      },
      {
        email: 'bob.wilson@inventory.local',
        name: 'Bob Wilson',
        password: 'user123',
        role: 'standard user',
        active: true,
      },
    ];
    
    for (const userData of standardUsers) {
      const [user, created] = await User.findOrCreate({
        where: { email: userData.email },
        defaults: userData,
      });
      
      if (created) {
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`⏭️  Already exists: ${user.name} (${user.email})`);
      }
    }
    
    // Get an admin user for category creation
    const adminUser = await User.findOne({ where: { role: 'administrator' } });
    
    if (!adminUser) {
      console.log('❌ No admin user found to create categories');
      return;
    }
    
    // Create sample categories
    console.log('\n📋 Creating Sample Categories...');
    console.log('-'.repeat(80));
    
    const categories = [
      'Electronics',
      'Furniture',
      'Office Supplies',
      'Books & Media',
      'Tools & Equipment',
      'Kitchen Appliances',
      'Sports Equipment',
      'Art Supplies',
      'Medical Supplies',
      'Cleaning Supplies',
    ];
    
    for (const categoryName of categories) {
      const [category, created] = await Category.findOrCreate({
        where: { name: categoryName },
        defaults: {
          name: categoryName,
          createdBy: adminUser.id,
        },
      });
      
      if (created) {
        console.log(`✅ Created category: ${category.name}`);
      } else {
        console.log(`⏭️  Already exists: ${category.name}`);
      }
    }
    
    // Summary
    const finalCategoryCount = await Category.count();
    const finalUserCount = await User.count();
    const finalAdminCount = await User.count({ where: { role: 'administrator' } });
    
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 Seed Data Summary:');
    console.log(`   Total Users: ${finalUserCount} (${finalAdminCount} administrators)`);
    console.log(`   Total Categories: ${finalCategoryCount}`);
    
    console.log('\n🔐 Sample Login Credentials:');
    console.log('   Admin: admin@inventory.local / admin123');
    console.log('   Manager: manager@inventory.local / manager123');
    console.log('   Standard: john.doe@inventory.local / user123');
    
    console.log('\n✅ Demo data seeded successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run seeder
seedAdminData();
