// Setup database tables
const { sequelize } = require('./src/db/connection');
// Load models to register them with Sequelize
require('./src/models');

async function setupDatabase() {
  try {
    console.log('🔧 Setting up database...');
    
    // Force sync to create tables
    await sequelize.sync({ force: true });
    console.log('✓ Tables created successfully');
    
    // Verify tables exist
    const [tables] = await sequelize.query('SELECT name FROM sqlite_master WHERE type="table"');
    console.log('✓ Tables in database:', tables.map(t => t.name).join(', '));
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Error setting up database:', error.message);
    process.exit(1);
  }
}

setupDatabase();
