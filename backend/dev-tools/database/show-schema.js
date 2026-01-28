const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/inventory.db');

db.all(
  "SELECT sql FROM sqlite_master WHERE type='table' ORDER BY name",
  (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('All table schemas:\n');
      rows.forEach(r => {
        console.log(r.sql);
        console.log('\n---\n');
      });
    }
    db.close();
  }
);
