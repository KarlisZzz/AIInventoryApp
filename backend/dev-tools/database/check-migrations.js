const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'src', 'db', 'inventory.db');
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
  
  console.log('\nDatabase tables:');
  db.all(`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name`, (err, tables) => {
    if (err) {
      console.error('Error:', err);
    } else if (tables && tables.length > 0) {
      tables.forEach(t => console.log('  -', t.name));
    }
    db.close();
  });
});
