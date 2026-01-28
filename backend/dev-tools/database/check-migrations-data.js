const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

console.log('Applied migrations:');
db.all('SELECT name FROM SequelizeMeta ORDER BY name', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else if (rows && rows.length > 0) {
    rows.forEach(r => console.log('  -', r.name));
  } else {
    console.log('  (none)');
  }
  db.close();
});
