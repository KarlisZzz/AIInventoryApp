/**
 * Migration: Add Denormalized Borrower Fields to LendingLog
 * 
 * Adds borrowerName and borrowerEmail fields to LendingLogs table for audit trail
 * preservation as specified in FR-016 and FR-019.
 * 
 * @see specs/001-inventory-lending/data-model.md
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Add borrowerName column
    await queryInterface.addColumn('LendingLogs', 'borrowerName', {
      type: Sequelize.STRING(100),
      allowNull: false,
      defaultValue: 'Unknown',  // For existing records (if any)
      comment: 'Denormalized from User.name at lend time for audit trail preservation (FR-016)',
    });
    
    // Add borrowerEmail column
    await queryInterface.addColumn('LendingLogs', 'borrowerEmail', {
      type: Sequelize.STRING(255),
      allowNull: false,
      defaultValue: 'unknown@example.com',  // For existing records (if any)
      comment: 'Denormalized from User.email at lend time for audit trail preservation (FR-016)',
    });
    
    console.log('✓ Added borrowerName and borrowerEmail columns to LendingLogs');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('LendingLogs', 'borrowerEmail');
    await queryInterface.removeColumn('LendingLogs', 'borrowerName');
    console.log('✓ Removed borrowerName and borrowerEmail columns from LendingLogs');
  }
};
