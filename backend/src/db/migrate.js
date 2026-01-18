/**
 * Database Migration Runner
 * 
 * Executes Sequelize migrations to create and update database schema.
 * Runs all pending migrations in the correct order.
 * 
 * Usage:
 *   node src/db/migrate.js          # Run all pending migrations
 *   node src/db/migrate.js --down   # Rollback last migration
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

const { Sequelize } = require('sequelize');
const { Umzug, SequelizeStorage } = require('umzug');
const path = require('path');
const fs = require('fs');
const { sequelize, initializeDatabase } = require('../config/database');

/**
 * Get migration files from migrations directory
 */
function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort()
    .map(file => ({
      path: path.join(migrationsDir, file),
      name: file,
    }));
  return files;
}

/**
 * Configure Umzug migration runner
 */
const umzug = new Umzug({
  migrations: getMigrationFiles().map(({ path: filepath, name }) => ({
    name,
    path: filepath,
    up: async () => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const migration = require(filepath);
      return migration.up(sequelize.getQueryInterface(), Sequelize);
    },
    down: async () => {
      // eslint-disable-next-line global-require, import/no-dynamic-require
      const migration = require(filepath);
      return migration.down(sequelize.getQueryInterface(), Sequelize);
    },
  })),
  context: sequelize.getQueryInterface(),
  storage: new SequelizeStorage({ sequelize }),
  logger: console,
});

/**
 * Run all pending migrations
 * 
 * @returns {Promise<void>}
 */
async function runMigrations() {
  try {
    console.log('🚀 Starting database migrations...\n');
    
    // Initialize database connection first
    await initializeDatabase();
    
    // Get pending migrations
    const pending = await umzug.pending();
    
    if (pending.length === 0) {
      console.log('✓ No pending migrations');
      return;
    }
    
    console.log(`📋 Found ${pending.length} pending migration(s):\n`);
    pending.forEach((migration, index) => {
      console.log(`  ${index + 1}. ${migration.name}`);
    });
    console.log('');
    
    // Execute migrations
    const executed = await umzug.up();
    
    console.log(`\n✅ Successfully executed ${executed.length} migration(s)\n`);
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * Rollback last migration
 * 
 * @returns {Promise<void>}
 */
async function rollbackMigration() {
  try {
    console.log('🔄 Rolling back last migration...\n');
    
    await initializeDatabase();
    
    const executed = await umzug.executed();
    
    if (executed.length === 0) {
      console.log('✓ No migrations to rollback');
      return;
    }
    
    const lastMigration = executed[executed.length - 1];
    console.log(`📋 Rolling back: ${lastMigration.name}\n`);
    
    await umzug.down();
    
    console.log('\n✅ Migration rolled back successfully\n');
    
  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    console.error(error.stack);
    throw error;
  }
}

/**
 * Show migration status
 * 
 * @returns {Promise<void>}
 */
async function showStatus() {
  try {
    await initializeDatabase();
    
    const executed = await umzug.executed();
    const pending = await umzug.pending();
    
    console.log('\n📊 Migration Status\n');
    console.log('═'.repeat(50));
    
    if (executed.length > 0) {
      console.log('\n✅ Executed Migrations:');
      executed.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    } else {
      console.log('\n✅ Executed Migrations: None');
    }
    
    if (pending.length > 0) {
      console.log('\n⏳ Pending Migrations:');
      pending.forEach((migration, index) => {
        console.log(`  ${index + 1}. ${migration.name}`);
      });
    } else {
      console.log('\n⏳ Pending Migrations: None');
    }
    
    console.log('\n' + '═'.repeat(50) + '\n');
    
  } catch (error) {
    console.error('\n❌ Failed to get migration status:', error.message);
    throw error;
  }
}

/**
 * Close database connection
 */
async function closeConnection() {
  try {
    await sequelize.close();
  } catch (error) {
    console.error('Error closing database:', error.message);
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  let action;
  
  if (command === '--down' || command === 'down') {
    action = rollbackMigration();
  } else if (command === '--status' || command === 'status') {
    action = showStatus();
  } else {
    action = runMigrations();
  }
  
  action
    .then(() => closeConnection())
    .then(() => {
      console.log('Done');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      closeConnection().finally(() => {
        process.exit(1);
      });
    });
}

module.exports = {
  runMigrations,
  rollbackMigration,
  showStatus,
  umzug,
};
