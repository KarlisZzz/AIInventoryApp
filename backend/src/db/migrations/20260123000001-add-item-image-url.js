/**
 * Migration: Add ImageURL Column to Items Table
 * 
 * Adds imageUrl column to Items table to support image upload functionality.
 * The column is nullable to allow existing items to remain valid.
 * 
 * @see specs/002-item-ui-enhancements/data-model.md
 */

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Add imageUrl column to Items table
    await queryInterface.addColumn('Items', 'imageUrl', {
      type: Sequelize.STRING(500),
      allowNull: true,
      comment: 'Relative path or URL to uploaded image (e.g., "/uploads/items/item-1234567890-abc.jpg")',
    });

    console.log('✓ Added imageUrl column to Items table');
  },

  down: async (queryInterface) => {
    // Remove imageUrl column from Items table
    await queryInterface.removeColumn('Items', 'imageUrl');
    
    console.log('✓ Removed imageUrl column from Items table (rollback)');
  },
};
