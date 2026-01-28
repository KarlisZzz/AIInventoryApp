const { sequelize } = require('./src/config/database');

(async () => {
  try {
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    
    console.log('Tables in backend/data/inventory.db:');
    tables.forEach(t => console.log('  -', t.name));
    
    // Check for Users table specifically
    const hasUsers = tables.some(t => t.name === 'Users');
    console.log('\nUsers table exists:', hasUsers);
    
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
