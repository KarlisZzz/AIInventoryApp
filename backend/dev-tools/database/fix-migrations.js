const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Removing invalid migration records...');

const migrations = [
  '20260117000002-create-users.js',
  '20260117000003-create-lending-logs.js',
  '20260119000001-add-borrower-denormalized-fields.js',
  '20260125000002-standardize-user-roles.js',
  '20260125000003-create-admin-audit-logs.js'
];

db.run(`DELETE FROM SequelizeMeta WHERE name IN (${migrations.map(() => '?').join(',')})`, migrations, (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✓ Removed migration records for:', migrations.join(', '));
  }
  db.close();
});
