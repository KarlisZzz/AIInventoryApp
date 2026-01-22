/**
 * Database Reset Script
 * 
 * Resets the database to initial seed data by:
 * 1. Clearing all existing data
 * 2. Running the seed script to populate initial data
 * 
 * Usage:
 *   node reset-database.js
 * 
 * WARNING: This will DELETE ALL DATA in the database!
 */

const { seedDatabase } = require('./src/db/seeds/initial-data');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║          DATABASE RESET TO INITIAL DATA               ║');
console.log('╚════════════════════════════════════════════════════════╝');
console.log('');
console.log('⚠️  WARNING: This will DELETE ALL existing data!');
console.log('');

// Run the seed function (which already clears data first)
seedDatabase()
  .then(() => {
    console.log('✅ Database reset complete - restored to initial data');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Database reset failed:', error.message);
    process.exit(1);
  });
