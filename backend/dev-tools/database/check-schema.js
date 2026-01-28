// Quick database query to check imageUrl column
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

db.all('PRAGMA table_info(Items);', [], (err, columns) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    return;
  }
  
  console.log('\n📋 Items table schema:');
  columns.forEach(col => {
    console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'NOT NULL' : 'nullable'})`);
  });
  
  console.log('\n📊 Checking imageUrl values...');
  db.all('SELECT id, name, imageUrl FROM Items LIMIT 5;', [], (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      rows.forEach(row => {
        console.log(`\n  ID: ${row.id}`);
        console.log(`  Name: ${row.name}`);
        console.log(`  imageUrl: ${row.imageUrl || '(null)'}`);
      });
    }
    db.close();
  });
});
