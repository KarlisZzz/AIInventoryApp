const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./data/inventory.db');

db.get('SELECT * FROM Items WHERE status = ? LIMIT 1', ['Lent'], (err, row) => {
  if (err) console.error(err);
  console.log(JSON.stringify(row, null, 2));
  db.close();
});
