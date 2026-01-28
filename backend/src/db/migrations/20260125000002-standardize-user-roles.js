/**
 * Migration: Standardize User Roles
 * 
 * Migrates existing user roles to standardized ENUM values:
 * - Maps existing roles to 'administrator' or 'standard user'
 * - Changes role column from STRING to ENUM
 * - Ensures at least one administrator exists
 * 
 * @see specs/004-admin-management/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Step 1: Disable foreign key constraints temporarily (SQLite-specific)
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    
    try {
      // Step 2: Map existing roles to new standardized roles
      // Existing roles: "Admin", "Staff", "Member", "Borrower"
      // New roles: "administrator", "standard user"
      
      // Map Admin/Staff to administrator, Member/Borrower to standard user
      await queryInterface.sequelize.query(`
        UPDATE Users 
        SET role = CASE 
          WHEN role IN ('Admin', 'Staff', 'administrator') THEN 'administrator'
          ELSE 'standard user'
        END
      `);

      // Step 3: Ensure at least one administrator exists
      const [results] = await queryInterface.sequelize.query(`
        SELECT COUNT(*) as count FROM Users WHERE role = 'administrator'
      `);
      
      const adminCount = results[0].count;
      if (adminCount === 0) {
        // Create a default administrator if none exists
        console.log('⚠ No administrators found, creating default admin user');
        const crypto = require('crypto');
        const defaultAdminId = crypto.randomUUID();
        
        await queryInterface.sequelize.query(`
          INSERT INTO Users (id, name, email, role, createdAt, updatedAt)
          VALUES (
            '${defaultAdminId}',
            'System Administrator',
            'admin@example.com',
            'administrator',
            datetime('now'),
            datetime('now')
          )
        `);
        console.log('✓ Default administrator created (email: admin@example.com)');
      }

      // Step 4: SQLite doesn't support ALTER COLUMN with ENUM directly
      // We need to recreate the table with the new column type
      
      // Drop the temp table if it exists (from previous failed migration)
      await queryInterface.sequelize.query('DROP TABLE IF EXISTS Users_new');
      
      // Create temporary table with new schema
      await queryInterface.sequelize.query(`
        CREATE TABLE Users_new (
          id TEXT PRIMARY KEY NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK(role IN ('administrator', 'standard user')) DEFAULT 'standard user',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Copy data from old table to new table
      await queryInterface.sequelize.query(`
        INSERT INTO Users_new (id, name, email, role, createdAt, updatedAt)
        SELECT id, name, email, role, createdAt, updatedAt
        FROM Users
      `);

      // Drop old table
      await queryInterface.sequelize.query('DROP TABLE Users');

      // Rename new table to original name
      await queryInterface.sequelize.query('ALTER TABLE Users_new RENAME TO Users');

      // Recreate indexes
      await queryInterface.addIndex('Users', ['email'], {
        name: 'idx_users_email',
        unique: true,
      });

      await queryInterface.addIndex('Users', ['name'], {
        name: 'idx_users_name',
      });

      await queryInterface.addIndex('Users', ['role'], {
        name: 'idx_users_role',
      });

      console.log('✓ User roles standardized to "administrator" and "standard user"');
    } finally {
      // Step 5: Re-enable foreign key constraints
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Disable foreign key constraints temporarily
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    
    try {
      // Revert to STRING(50) role field
      await queryInterface.sequelize.query(`
        CREATE TABLE Users_old (
          id TEXT PRIMARY KEY NOT NULL,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          role VARCHAR(50) NOT NULL DEFAULT 'Borrower',
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await queryInterface.sequelize.query(`
        INSERT INTO Users_old (id, name, email, role, createdAt, updatedAt)
        SELECT id, name, email, role, createdAt, updatedAt
        FROM Users
      `);

      await queryInterface.sequelize.query('DROP TABLE Users');
      await queryInterface.sequelize.query('ALTER TABLE Users_old RENAME TO Users');

      // Recreate indexes
      await queryInterface.addIndex('Users', ['email'], {
        name: 'idx_users_email',
        unique: true,
      });

      await queryInterface.addIndex('Users', ['name'], {
        name: 'idx_users_name',
      });

      await queryInterface.addIndex('Users', ['role'], {
        name: 'idx_users_role',
      });

      console.log('✓ User roles reverted to STRING type');
    } finally {
      // Re-enable foreign key constraints
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    }
  },
};
