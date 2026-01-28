const { sequelize } = require('./src/config/database');

async function verifySchema() {
  try {
    console.log('Verifying Phase 2 database schema...\n');
    
    // Check Users table
    const [users] = await sequelize.query('PRAGMA table_info(Users)');
    console.log('✓ Users table columns:');
    users.forEach(r => console.log(`  - ${r.name}: ${r.type}`));
    
    // Check Categories table
    const [categories] = await sequelize.query('PRAGMA table_info(Categories)');
    console.log('\n✓ Categories table columns:');
    categories.forEach(r => console.log(`  - ${r.name}: ${r.type}`));
    
    // Check Items table
    const [items] = await sequelize.query('PRAGMA table_info(Items)');
    console.log('\n✓ Items table columns:');
    items.forEach(r => console.log(`  - ${r.name}: ${r.type}`));
    
    // Check AdminAuditLogs table
    const [auditLogs] = await sequelize.query('PRAGMA table_info(AdminAuditLogs)');
    console.log('\n✓ AdminAuditLogs table columns:');
    auditLogs.forEach(r => console.log(`  - ${r.name}: ${r.type}`));
    
    // Check foreign keys
    const [itemFKs] = await sequelize.query('PRAGMA foreign_key_list(Items)');
    console.log('\n✓ Items foreign keys:');
    if (itemFKs && itemFKs.length > 0) {
      itemFKs.forEach(fk => console.log(`  - ${fk.from} -> ${fk.table}.${fk.to}`));
    } else {
      console.log('  - None found');
    }
    
    const [auditFKs] = await sequelize.query('PRAGMA foreign_key_list(AdminAuditLogs)');
    console.log('\n✓ AdminAuditLogs foreign keys:');
    if (auditFKs && auditFKs.length > 0) {
      auditFKs.forEach(fk => console.log(`  - ${fk.from} -> ${fk.table}.${fk.to}`));
    } else {
      console.log('  - None found');
    }
    
    console.log('\n✅ Phase 2 schema verification complete!');
  } catch (error) {
    console.error('❌ Schema verification failed:', error.message);
  } finally {
    await sequelize.close();
  }
}

verifySchema();
