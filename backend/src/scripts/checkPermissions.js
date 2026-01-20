/**
 * Database File Permission Check Script
 * 
 * Verifies that the database file has appropriate permissions
 * and is stored outside the web root directory.
 * 
 * Security Requirement: T144
 * @see Phase 8: Security & Data Validation
 * 
 * Usage: node backend/src/scripts/checkPermissions.js
 */

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');

/**
 * ANSI color codes for terminal output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

/**
 * Check if database file exists and get its stats
 */
async function checkDatabaseFile() {
  console.log(`${colors.cyan}Database Security Check${colors.reset}`);
  console.log('='.repeat(60));
  console.log('');
  
  // Get database path from Sequelize config
  const dbPath = sequelize.options.storage || process.env.DB_PATH || './data/inventory.db';
  const absolutePath = path.resolve(dbPath);
  
  console.log(`Database Path: ${absolutePath}`);
  console.log('');
  
  // Check if file exists
  if (!fs.existsSync(absolutePath)) {
    console.log(`${colors.yellow}⚠ Database file does not exist yet${colors.reset}`);
    console.log(`  It will be created when migrations run.`);
    console.log('');
    return {
      exists: false,
      path: absolutePath,
    };
  }
  
  // Get file stats
  const stats = fs.statSync(absolutePath);
  const mode = stats.mode;
  
  // Convert mode to octal string
  const permissions = (mode & parseInt('777', 8)).toString(8);
  
  console.log(`${colors.cyan}File Information:${colors.reset}`);
  console.log(`  Size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`  Permissions: ${permissions} (octal)`);
  console.log(`  Owner: UID ${stats.uid}`);
  console.log(`  Created: ${stats.birthtime.toISOString()}`);
  console.log(`  Modified: ${stats.mtime.toISOString()}`);
  console.log('');
  
  return {
    exists: true,
    path: absolutePath,
    permissions,
    stats,
  };
}

/**
 * Check if database is outside web root
 */
function checkWebRootLocation(dbPath) {
  console.log(`${colors.cyan}Location Security:${colors.reset}`);
  
  // Common web root directories that should not contain the database
  const webRootPatterns = [
    /public/i,
    /static/i,
    /dist/i,
    /build/i,
    /assets/i,
    /www/i,
    /htdocs/i,
  ];
  
  const pathLower = dbPath.toLowerCase();
  const inWebRoot = webRootPatterns.some(pattern => pattern.test(pathLower));
  
  if (inWebRoot) {
    console.log(`${colors.red}✗ FAIL: Database appears to be in a web-accessible directory${colors.reset}`);
    console.log(`  This is a security risk. Move the database outside the web root.`);
    console.log('');
    return false;
  } else {
    console.log(`${colors.green}✓ PASS: Database is not in a common web root directory${colors.reset}`);
    console.log('');
    return true;
  }
}

/**
 * Check file permissions
 */
function checkPermissions(permissions) {
  console.log(`${colors.cyan}Permission Security:${colors.reset}`);
  
  // Recommended permissions: 600 (owner read/write only) or 644 (owner read/write, others read)
  const recommended = ['600', '640', '644'];
  const worldWritable = permissions.endsWith('6') || permissions.endsWith('7');
  const worldReadable = ['4', '5', '6', '7'].includes(permissions.slice(-1));
  
  const issues = [];
  
  if (worldWritable) {
    issues.push({
      severity: 'HIGH',
      message: 'Database is world-writable (insecure)',
      recommendation: 'Change permissions to 600 or 644',
    });
  }
  
  if (worldReadable && process.platform !== 'win32') {
    issues.push({
      severity: 'MEDIUM',
      message: 'Database is world-readable',
      recommendation: 'Consider changing permissions to 600 for maximum security',
    });
  }
  
  if (recommended.includes(permissions)) {
    console.log(`${colors.green}✓ PASS: Permissions are appropriate (${permissions})${colors.reset}`);
  } else if (issues.length === 0) {
    console.log(`${colors.yellow}⚠ WARNING: Permissions (${permissions}) are non-standard${colors.reset}`);
    console.log(`  Recommended: ${recommended.join(', ')}`);
  }
  
  // Display issues
  issues.forEach(issue => {
    const color = issue.severity === 'HIGH' ? colors.red : colors.yellow;
    console.log(`${color}✗ ${issue.severity}: ${issue.message}${colors.reset}`);
    console.log(`  ${issue.recommendation}`);
  });
  
  console.log('');
  return issues.length === 0;
}

/**
 * Provide remediation instructions
 */
function provideRemediation(dbPath) {
  console.log(`${colors.cyan}Remediation Steps:${colors.reset}`);
  console.log('');
  
  if (process.platform === 'win32') {
    console.log('Windows:');
    console.log('  1. Right-click the database file');
    console.log('  2. Select Properties > Security tab');
    console.log('  3. Ensure only your user account has access');
    console.log('  4. Remove "Everyone" and "Users" groups if present');
  } else {
    console.log('Linux/Mac:');
    console.log(`  chmod 600 "${dbPath}"`);
    console.log('  (Restricts access to owner only)');
    console.log('');
    console.log('Or for slightly less restrictive:');
    console.log(`  chmod 644 "${dbPath}"`);
    console.log('  (Owner can read/write, others can read)');
  }
  
  console.log('');
}

/**
 * Main execution
 */
async function main() {
  try {
    const fileInfo = await checkDatabaseFile();
    
    if (!fileInfo.exists) {
      console.log(`${colors.yellow}Run migrations to create the database file first.${colors.reset}`);
      process.exit(0);
    }
    
    const locationOk = checkWebRootLocation(fileInfo.path);
    const permissionsOk = checkPermissions(fileInfo.permissions);
    
    console.log('='.repeat(60));
    
    if (locationOk && permissionsOk) {
      console.log(`${colors.green}✓ All security checks passed!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}✗ Security issues detected${colors.reset}`);
      console.log('');
      provideRemediation(fileInfo.path);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}Error checking permissions:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { checkDatabaseFile, checkWebRootLocation, checkPermissions };
