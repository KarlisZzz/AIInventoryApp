const { sequelize } = require('./src/config/database');

async function checkTables() {
  try {
    // Get all table names
    const tables = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table'",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('Tables:', JSON.stringify(tables, null, 2));
    
    // Check LendingLogs table structure
    const columns = await sequelize.query(
      "PRAGMA table_info(LendingLogs)",
      { type: sequelize.QueryTypes.SELECT }
    );
    console.log('\nLendingLogs columns:', JSON.stringify(columns, null, 2));
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkTables();
