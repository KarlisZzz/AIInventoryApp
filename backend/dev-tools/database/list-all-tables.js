const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('All tables in database:');
db.all("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name", (err, tables) => {
  if (err) {
    console.error('Error:', err);
  } else if (tables && tables.length > 0) {
    tables.forEach(t => console.log('  -', t.name));
  }
  db.close();
});
