/**
 * View Items Script
 * 
 * Displays all items from the database with their full details including imageUrl.
 * Useful for debugging and verifying what data is stored.
 * 
 * Usage: node view-items.js [limit]
 *   limit - Optional number of items to display (default: all)
 * 
 * Example:
 *   node view-items.js       # Show all items
 *   node view-items.js 5     # Show first 5 items
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const db = new sqlite3.Database(dbPath);

// Get limit from command line argument
const limit = process.argv[2] ? parseInt(process.argv[2]) : null;

console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║           INVENTORY DATABASE - ITEMS VIEWER                ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

// First, get the count
db.get('SELECT COUNT(*) as count FROM Items', (err, countRow) => {
  if (err) {
    console.error('❌ Error counting items:', err.message);
    db.close();
    return;
  }

  console.log(`📊 Total items in database: ${countRow.count}\n`);

  // Build query with optional limit
  let query = 'SELECT * FROM Items ORDER BY createdAt DESC';
  if (limit) {
    query += ` LIMIT ${limit}`;
    console.log(`🔍 Showing first ${limit} items...\n`);
  } else {
    console.log(`🔍 Showing all items...\n`);
  }

  // Fetch items
  db.all(query, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching items:', err.message);
      db.close();
      return;
    }

    if (rows.length === 0) {
      console.log('📭 No items found in database.\n');
      db.close();
      return;
    }

    // Display each item
    rows.forEach((item, index) => {
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📦 ITEM #${index + 1}`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`  🆔 ID:          ${item.id}`);
      console.log(`  📝 Name:        ${item.name}`);
      console.log(`  🏷️  Category:    ${item.category}`);
      console.log(`  📋 Description: ${item.description || '(none)'}`);
      console.log(`  🔄 Status:      ${item.status}`);
      console.log(`  🖼️  Image URL:   ${item.imageUrl || '(no image)'}`);
      console.log(`  📅 Created:     ${item.createdAt}`);
      console.log(`  🔄 Updated:     ${item.updatedAt}`);
      console.log('');
    });

    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`✅ Displayed ${rows.length} of ${countRow.count} items\n`);

    // Show summary of images
    const itemsWithImages = rows.filter(item => item.imageUrl).length;
    const itemsWithoutImages = rows.length - itemsWithImages;
    
    console.log('📊 IMAGE SUMMARY:');
    console.log(`   ✓ Items with images:    ${itemsWithImages}`);
    console.log(`   ✗ Items without images: ${itemsWithoutImages}\n`);

    // Close database
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      }
    });
  });
});
