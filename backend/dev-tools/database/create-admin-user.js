/**
 * Create Admin User Script
 * 
 * Creates an administrator user for testing purposes
 */

const { User } = require('./src/models');

async function createAdminUser() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'administrator' }
    });

    if (existingAdmin) {
      console.log('✓ Admin user already exists:', existingAdmin.name);
      console.log('  Email:', existingAdmin.email);
      console.log('  ID:', existingAdmin.id);
      return existingAdmin;
    }

    // Create new admin user
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@inventory.local',
      role: 'administrator'
    });

    console.log('✓ Admin user created successfully!');
    console.log('  Name:', admin.name);
    console.log('  Email:', admin.email);
    console.log('  ID:', admin.id);
    console.log('  Role:', admin.role);
    
    return admin;
  } catch (error) {
    console.error('✗ Error creating admin user:', error.message);
    process.exit(1);
  }
}

createAdminUser()
  .then(() => {
    console.log('\n✓ Setup complete');
    process.exit(0);
  })
  .catch(error => {
    console.error('✗ Setup failed:', error);
    process.exit(1);
  });
