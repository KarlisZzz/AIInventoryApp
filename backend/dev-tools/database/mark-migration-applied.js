const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Marking migration as applied...');

db.run(`INSERT INTO SequelizeMeta (name) VALUES ('20260119000001-add-borrower-denormalized-fields.js')`, (err) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('✓ Marked migration as applied');
  }
  db.close();
});
