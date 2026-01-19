require('dotenv').config();
const { sequelize } = require('./src/db/connection');

async function createTables() {
  try {
    await sequelize.sync({ force: true });
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('✓ Tables created:', tables.map(t => t.name).join(', '));
    console.log('✓ Database file:', sequelize.options.storage);
    process.exit(0);
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  }
}

createTables();
