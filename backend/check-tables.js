const db = require('./src/db/connection');

async function check() {
  await db.sequelize.authenticate();
  const [tables] = await db.sequelize.query('SELECT name FROM sqlite_master WHERE type="table"');
  console.log('Tables:', tables);
  process.exit(0);
}

check().catch(e => {
  console.error(e);
  process.exit(1);
});
