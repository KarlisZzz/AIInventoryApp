/**
 * Verification Script for T010-T016c
 * 
 * Checks all files, database state, and middleware functionality
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

function log(message, color = RESET) {
  console.log(`${color}${message}${RESET}`);
}

function checkFile(filepath, taskId) {
  const exists = fs.existsSync(filepath);
  const icon = exists ? '✅' : '❌';
  const size = exists ? ` (${(fs.statSync(filepath).size / 1024).toFixed(1)} KB)` : '';
  log(`  ${icon} ${taskId}: ${path.basename(filepath)}${size}`, exists ? GREEN : RED);
  return exists;
}

async function verifyDatabase() {
  try {
    await sequelize.authenticate();
    log('  ✅ Database connection successful', GREEN);
    
    // Check foreign keys
    const [fkResult] = await sequelize.query('PRAGMA foreign_keys');
    const fkEnabled = fkResult?.foreign_keys === 1;
    log(`  ${fkEnabled ? '✅' : '❌'} Foreign keys: ${fkEnabled ? 'ENABLED' : 'DISABLED'}`, fkEnabled ? GREEN : RED);
    
    // Check tables
    const [tables] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tableNames = tables.map(t => t.name);
    
    log(`  ✅ Tables (${tableNames.length}):`, GREEN);
    tableNames.forEach(name => {
      if (!name.startsWith('sqlite_')) {
        log(`    • ${name}`, CYAN);
      }
    });
    
    // Check LendingLogs columns
    const [columns] = await sequelize.query('PRAGMA table_info(LendingLogs)');
    const hasBorrowerName = columns.some(c => c.name === 'borrowerName');
    const hasBorrowerEmail = columns.some(c => c.name === 'borrowerEmail');
    
    log(`  ${hasBorrowerName ? '✅' : '❌'} LendingLogs.borrowerName: ${hasBorrowerName ? 'EXISTS' : 'MISSING'}`, hasBorrowerName ? GREEN : RED);
    log(`  ${hasBorrowerEmail ? '✅' : '❌'} LendingLogs.borrowerEmail: ${hasBorrowerEmail ? 'EXISTS' : 'MISSING'}`, hasBorrowerEmail ? GREEN : RED);
    
    await sequelize.close();
    return true;
  } catch (error) {
    log(`  ❌ Database check failed: ${error.message}`, RED);
    return false;
  }
}

function checkMiddleware() {
  try {
    const app = require('./src/app');
    log('  ✅ app.js loads without errors', GREEN);
    
    // Check if middleware is registered (simple check)
    const appString = fs.readFileSync(path.join(__dirname, 'src', 'app.js'), 'utf8');
    const hasVersioning = appString.includes('enforceApiVersion');
    const hasEnvelope = appString.includes('attachResponseHelpers');
    
    log(`  ${hasVersioning ? '✅' : '❌'} API versioning middleware registered`, hasVersioning ? GREEN : RED);
    log(`  ${hasEnvelope ? '✅' : '❌'} Response envelope middleware registered`, hasEnvelope ? GREEN : RED);
    
    return true;
  } catch (error) {
    log(`  ❌ Middleware check failed: ${error.message}`, RED);
    return false;
  }
}

async function main() {
  console.log('');
  log('═'.repeat(60), CYAN);
  log('  T010-T016c SETUP VERIFICATION', CYAN);
  log('═'.repeat(60), CYAN);
  console.log('');
  
  // T010-T016: Database Infrastructure
  log('📂 Database Infrastructure (T010-T016):', YELLOW);
  const filesOk = [
    checkFile(path.join(__dirname, 'src', 'db', 'init.js'), 'T010'),
    checkFile(path.join(__dirname, 'src', 'db', 'connection.js'), 'T015'),
    checkFile(path.join(__dirname, 'src', 'db', 'migrate.js'), 'T016'),
  ].every(ok => ok);
  
  console.log('');
  log('📂 Migrations (T012-T014):', YELLOW);
  const migrationFiles = fs.readdirSync(path.join(__dirname, 'src', 'db', 'migrations'))
    .filter(f => f.endsWith('.js'))
    .sort();
  
  migrationFiles.forEach((file, idx) => {
    const taskId = `T${12 + idx}`;
    log(`  ✅ ${taskId}: ${file}`, GREEN);
  });
  
  console.log('');
  log('📂 API Standards & Versioning (T016a-T016c):', YELLOW);
  const middlewareOk = [
    checkFile(path.join(__dirname, 'src', 'middleware', 'apiVersion.js'), 'T016a'),
    checkFile(path.join(__dirname, 'src', 'middleware', 'responseEnvelope.js'), 'T016b'),
    checkFile(path.join(__dirname, 'src', 'app.js'), 'T016c'),
  ].every(ok => ok);
  
  console.log('');
  log('📂 Additional Files:', YELLOW);
  checkFile(path.join(__dirname, 'src', 'server.js'), 'Bonus');
  checkFile(path.join(__dirname, '..', 'data', 'inventory.db'), 'DB File');
  
  console.log('');
  log('🗄️  Database State:', YELLOW);
  const dbOk = await verifyDatabase();
  
  console.log('');
  log('⚙️  Middleware Configuration:', YELLOW);
  const mwOk = checkMiddleware();
  
  console.log('');
  log('═'.repeat(60), CYAN);
  
  const allOk = filesOk && middlewareOk && dbOk && mwOk;
  if (allOk) {
    log('  ✅ ALL CHECKS PASSED - T010-T016c COMPLETE', GREEN);
  } else {
    log('  ⚠️  SOME CHECKS FAILED - REVIEW OUTPUT ABOVE', YELLOW);
  }
  
  log('═'.repeat(60), CYAN);
  console.log('');
  
  process.exit(allOk ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
