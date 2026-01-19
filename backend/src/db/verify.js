const { getConnection } = require('./connection');

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  try {
    const sequelize = await getConnection();
    
    // Check tables
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    );
    
    console.log('✓ Tables found:', tables.map(t => t.name).join(', '));
    
    // Check foreign keys
    const [fkResults] = await sequelize.query('PRAGMA foreign_keys');
    const fkEnabled = fkResults && fkResults.foreign_keys === 1;
    
    console.log('✓ Foreign key constraints:', fkEnabled ? 'ENABLED' : 'DISABLED');
    
    // Check row counts
    for (const table of tables) {
      const [countResults] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      console.log(`  - ${table.name}: ${countResults[0].count} rows`);
    }
    
    console.log('\n✅ Database verification complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database verification failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyDatabase();
