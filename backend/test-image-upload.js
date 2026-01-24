/**
 * Test Image Upload Functionality
 * 
 * Tests that image uploads correctly save imageUrl to the right item in database.
 * 
 * Usage: node test-image-upload.js [itemId] [imagePath]
 * 
 * Example:
 *   node test-image-upload.js
 *   node test-image-upload.js <uuid> ./test-image.jpg
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

const dbPath = path.join(__dirname, 'data', 'inventory.db');
const API_BASE = 'http://localhost:3001';

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${colors[color]}${symbol} ${message}${colors.reset}`);
}

function success(message) { log('green', '✓', message); }
function error(message) { log('red', '✗', message); }
function info(message) { log('blue', 'ℹ', message); }
function warn(message) { log('yellow', '⚠', message); }

// Get item from database
function getItemFromDB(itemId) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    db.get('SELECT * FROM Items WHERE id = ?', [itemId], (err, row) => {
      db.close();
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Upload image via API
function uploadImage(itemId, imagePath) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append('image', fs.createReadStream(imagePath));

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: `/api/v1/items/${itemId}/image`,
      method: 'POST',
      headers: form.getHeaders(),
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(response);
          } else {
            reject(new Error(response.message || 'Upload failed'));
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', reject);
    form.pipe(req);
  });
}

// Create a test image file
function createTestImage() {
  const testImagePath = path.join(__dirname, 'test-upload-image.png');
  
  // Create a simple 1x1 PNG image (smallest valid PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, // IEND chunk
    0x42, 0x60, 0x82
  ]);
  
  fs.writeFileSync(testImagePath, pngData);
  return testImagePath;
}

async function runTest() {
  console.log('\n╔════════════════════════════════════════════════════════════╗');
  console.log('║          IMAGE UPLOAD DATABASE TEST                        ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const args = process.argv.slice(2);
  let itemId = args[0];
  let imagePath = args[1];

  try {
    // Step 1: Find or use provided item
    if (!itemId) {
      info('No item ID provided, finding first available item...');
      const db = new sqlite3.Database(dbPath);
      itemId = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM Items LIMIT 1', [], (err, row) => {
          db.close();
          if (err) reject(err);
          else if (!row) reject(new Error('No items found in database'));
          else resolve(row.id);
        });
      });
      success(`Using item: ${itemId}`);
    }

    // Step 2: Get item before upload
    info('Fetching item data before upload...');
    const itemBefore = await getItemFromDB(itemId);
    if (!itemBefore) {
      error(`Item not found: ${itemId}`);
      process.exit(1);
    }
    success(`Found item: "${itemBefore.name}"`);
    info(`  Category: ${itemBefore.category}`);
    info(`  Status: ${itemBefore.status}`);
    info(`  Current imageUrl: ${itemBefore.imageUrl || '(none)'}`);

    // Step 3: Create or use test image
    if (!imagePath) {
      info('No image path provided, creating test image...');
      imagePath = createTestImage();
      success(`Created test image: ${imagePath}`);
    } else if (!fs.existsSync(imagePath)) {
      error(`Image file not found: ${imagePath}`);
      process.exit(1);
    }

    // Step 4: Upload image
    info(`Uploading image to item ${itemId}...`);
    const uploadResponse = await uploadImage(itemId, imagePath);
    success('Image uploaded successfully!');
    info(`  API Response: ${JSON.stringify(uploadResponse.data, null, 2)}`);

    // Step 5: Wait a moment for DB write
    await new Promise(resolve => setTimeout(resolve, 500));

    // Step 6: Get item after upload
    info('Fetching item data after upload...');
    const itemAfter = await getItemFromDB(itemId);
    
    // Step 7: Verify results
    console.log('\n' + '─'.repeat(60));
    console.log('VERIFICATION RESULTS');
    console.log('─'.repeat(60) + '\n');

    let allPassed = true;

    // Check 1: imageUrl was set
    if (itemAfter.imageUrl) {
      success(`imageUrl was saved: ${itemAfter.imageUrl}`);
    } else {
      error('imageUrl is still null in database!');
      allPassed = false;
    }

    // Check 2: Correct item was updated
    if (itemAfter.id === itemBefore.id) {
      success(`Correct item was updated (ID: ${itemAfter.id})`);
    } else {
      error(`Wrong item updated! Expected ${itemBefore.id}, got ${itemAfter.id}`);
      allPassed = false;
    }

    // Check 3: Other fields unchanged
    if (itemAfter.name === itemBefore.name &&
        itemAfter.category === itemBefore.category &&
        itemAfter.status === itemBefore.status) {
      success('Other item fields remain unchanged');
    } else {
      warn('Some other fields were modified');
      allPassed = false;
    }

    // Check 4: imageUrl format
    if (itemAfter.imageUrl && itemAfter.imageUrl.startsWith('/uploads/items/item-')) {
      success(`imageUrl format is correct: ${itemAfter.imageUrl}`);
    } else if (itemAfter.imageUrl) {
      warn(`imageUrl format may be incorrect: ${itemAfter.imageUrl}`);
    }

    // Check 5: Image file exists
    if (itemAfter.imageUrl) {
      const imageDiskPath = path.join(__dirname, 'data', itemAfter.imageUrl);
      if (fs.existsSync(imageDiskPath)) {
        success(`Image file exists on disk: ${imageDiskPath}`);
        const stats = fs.statSync(imageDiskPath);
        info(`  File size: ${stats.size} bytes`);
      } else {
        error(`Image file NOT found on disk: ${imageDiskPath}`);
        allPassed = false;
      }
    }

    // Check 6: Verify no other items were affected
    info('Checking no other items were affected...');
    const db = new sqlite3.Database(dbPath);
    const otherItems = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, name, imageUrl FROM Items WHERE id != ? AND imageUrl = ?',
        [itemId, itemAfter.imageUrl],
        (err, rows) => {
          db.close();
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    if (otherItems.length === 0) {
      success('No other items have the same imageUrl');
    } else {
      error(`${otherItems.length} other item(s) have the same imageUrl!`);
      otherItems.forEach(item => {
        console.log(`  - ${item.name} (${item.id})`);
      });
      allPassed = false;
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    if (allPassed) {
      success('ALL TESTS PASSED! ✨');
      console.log('\nThe image upload is working correctly:');
      console.log(`  • Image saved to correct item (${itemBefore.name})`);
      console.log(`  • imageUrl stored in database: ${itemAfter.imageUrl}`);
      console.log(`  • File exists on disk`);
      console.log(`  • No other items affected`);
    } else {
      error('SOME TESTS FAILED');
      console.log('\nPlease review the errors above.');
    }
    console.log('═'.repeat(60) + '\n');

    // Cleanup test image if we created it
    if (!args[1] && fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      info('Cleaned up test image');
    }

    process.exit(allPassed ? 0 : 1);

  } catch (err) {
    error(`Test failed: ${err.message}`);
    console.error(err);
    process.exit(1);
  }
}

// Check if server is running
http.get(`${API_BASE}/api/v1/items`, (res) => {
  runTest();
}).on('error', () => {
  error('Backend server is not running on http://localhost:3001');
  info('Please start the server first: npm run dev');
  process.exit(1);
});
