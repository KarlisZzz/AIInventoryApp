/**
 * Fix AdminAuditLogs Table Schema
 */

const { sequelize } = require('./src/config/database');

async function fixAdminAuditLogs() {
  try {
    console.log('Fixing AdminAuditLogs table schema...\n');
    
    // Drop the table
    console.log('Dropping AdminAuditLogs table...');
    await sequelize.query('DROP TABLE IF EXISTS AdminAuditLogs');
    console.log('✓ Table dropped');
    
    // Recreate with correct schema
    console.log('\nRecreating AdminAuditLogs table with correct schema...');
    await sequelize.query(`
      CREATE TABLE AdminAuditLogs (
        id UUID NOT NULL PRIMARY KEY,
        adminUserId UUID NOT NULL REFERENCES Users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
        action TEXT NOT NULL CHECK(action IN ('CREATE_CATEGORY', 'UPDATE_CATEGORY', 'DELETE_CATEGORY', 'CREATE_USER', 'UPDATE_USER', 'DELETE_USER')),
        entityType VARCHAR(50) NOT NULL,
        entityId UUID NOT NULL,
        details TEXT,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Table created');
    
    // Create indexes
    console.log('\nCreating indexes...');
    await sequelize.query('CREATE INDEX idx_audit_admin_user ON AdminAuditLogs(adminUserId)');
    await sequelize.query('CREATE INDEX idx_audit_timestamp ON AdminAuditLogs(timestamp)');
    await sequelize.query('CREATE INDEX idx_audit_entity ON AdminAuditLogs(entityType, entityId)');
    await sequelize.query('CREATE INDEX idx_audit_action ON AdminAuditLogs(action)');
    console.log('✓ Indexes created');
    
    console.log('\n✓ AdminAuditLogs table fixed successfully!');
    
  } catch (error) {
    console.error('✗ Error:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

fixAdminAuditLogs()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
