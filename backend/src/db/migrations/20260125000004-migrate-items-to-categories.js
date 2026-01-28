/**
 * Migration: Migrate Items to use Category foreign key
 * 
 * - Adds categoryId foreign key column to Items table
 * - Migrates existing category strings to Category records
 * - Removes old category string column
 * 
 * @see specs/004-admin-management/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting Items to Categories migration...');
    
    // Step 1: Add categoryId column (nullable for now)
    await queryInterface.addColumn('Items', 'categoryId', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'Categories',
        key: 'id',
      },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    });
    console.log('✓ Added categoryId column to Items');

    // Step 2: Get all distinct category values from Items
    const [distinctCategories] = await queryInterface.sequelize.query(`
      SELECT DISTINCT category FROM Items WHERE category IS NOT NULL AND category != ''
    `);
    
    console.log(`✓ Found ${distinctCategories.length} distinct categories`);

    // Step 3: For each distinct category, create a Category record if it doesn't exist
    for (const row of distinctCategories) {
      const categoryName = row.category;
      
      // Check if category already exists
      const [existing] = await queryInterface.sequelize.query(`
        SELECT id FROM Categories WHERE LOWER(name) = LOWER(?)
      `, {
        replacements: [categoryName],
      });

      let categoryId;
      if (existing.length > 0) {
        categoryId = existing[0].id;
        console.log(`  - Category "${categoryName}" already exists`);
      } else {
        // Create new category
        const crypto = require('crypto');
        categoryId = crypto.randomUUID();
        
        await queryInterface.sequelize.query(`
          INSERT INTO Categories (id, name, createdAt, updatedAt)
          VALUES (?, ?, datetime('now'), datetime('now'))
        `, {
          replacements: [categoryId, categoryName],
        });
        console.log(`  - Created category "${categoryName}"`);
      }

      // Update all items with this category string to use the categoryId
      await queryInterface.sequelize.query(`
        UPDATE Items SET categoryId = ? WHERE category = ?
      `, {
        replacements: [categoryId, categoryName],
      });
    }
    console.log('✓ Migrated all items to use categoryId');

    // Step 4: Remove the old category column
    // SQLite doesn't support DROP COLUMN directly, so we need to recreate the table
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    
    try {
      // Create new Items table without category column
      await queryInterface.sequelize.query(`
        CREATE TABLE Items_new (
          id TEXT PRIMARY KEY NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          categoryId TEXT,
          status TEXT NOT NULL CHECK(status IN ('Available', 'Lent', 'Maintenance')) DEFAULT 'Available',
          imageUrl VARCHAR(255),
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (categoryId) REFERENCES Categories(id) ON DELETE RESTRICT ON UPDATE CASCADE
        )
      `);

      // Copy data from old table to new table
      await queryInterface.sequelize.query(`
        INSERT INTO Items_new (id, name, description, categoryId, status, imageUrl, createdAt, updatedAt)
        SELECT id, name, description, categoryId, status, imageUrl, createdAt, updatedAt
        FROM Items
      `);

      // Drop old table
      await queryInterface.sequelize.query('DROP TABLE Items');

      // Rename new table to original name
      await queryInterface.sequelize.query('ALTER TABLE Items_new RENAME TO Items');

      // Recreate indexes
      await queryInterface.addIndex('Items', ['status'], {
        name: 'idx_items_status',
      });

      await queryInterface.addIndex('Items', ['categoryId'], {
        name: 'idx_items_categoryId',
      });

      await queryInterface.addIndex('Items', ['name'], {
        name: 'idx_items_name',
      });

      console.log('✓ Removed old category column');
    } finally {
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }

    console.log('✅ Items to Categories migration complete');
  },

  down: async (queryInterface, Sequelize) => {
    console.log('Reverting Items to Categories migration...');
    
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    
    try {
      // Create Items table with category column back
      await queryInterface.sequelize.query(`
        CREATE TABLE Items_old (
          id TEXT PRIMARY KEY NOT NULL,
          name VARCHAR(100) NOT NULL,
          description TEXT,
          category VARCHAR(50) NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('Available', 'Lent', 'Maintenance')) DEFAULT 'Available',
          imageUrl VARCHAR(255),
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Copy data and convert categoryId back to category string
      await queryInterface.sequelize.query(`
        INSERT INTO Items_old (id, name, description, category, status, imageUrl, createdAt, updatedAt)
        SELECT 
          i.id, 
          i.name, 
          i.description, 
          COALESCE(c.name, 'Uncategorized') as category,
          i.status, 
          i.imageUrl, 
          i.createdAt, 
          i.updatedAt
        FROM Items i
        LEFT JOIN Categories c ON i.categoryId = c.id
      `);

      await queryInterface.sequelize.query('DROP TABLE Items');
      await queryInterface.sequelize.query('ALTER TABLE Items_old RENAME TO Items');

      // Recreate indexes
      await queryInterface.addIndex('Items', ['status'], {
        name: 'idx_items_status',
      });

      await queryInterface.addIndex('Items', ['category'], {
        name: 'idx_items_category',
      });

      await queryInterface.addIndex('Items', ['name'], {
        name: 'idx_items_name',
      });

      console.log('✓ Reverted to category string column');
    } finally {
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }

    console.log('✅ Migration reverted');
  },
};
