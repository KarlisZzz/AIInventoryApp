/**
 * Lending Service
 * 
 * Business logic for lending operations with atomic transaction integrity.
 * Implements FR-012 through FR-019 for lending workflow.
 * 
 * @see specs/001-inventory-lending/data-model.md
 * @see specs/001-inventory-lending/spec.md
 */

const { sequelize } = require('../config/database');
const Item = require('../models/Item');
const User = require('../models/User');
const LendingLog = require('../models/LendingLog');

/**
 * Lend an item to a user (atomic operation)
 * 
 * This operation must be atomic per FR-031:
 * 1. Validate item exists and is Available
 * 2. Validate user exists
 * 3. Update item status to "Lent"
 * 4. Create lending log with denormalized borrower info (FR-016/FR-019)
 * 
 * All operations happen within a transaction that commits only if all succeed.
 * 
 * @param {string} itemId - UUID of the item to lend
 * @param {string} userId - UUID of the user borrowing the item
 * @param {string} [conditionNotes] - Optional notes on item condition
 * @returns {Promise<{item: Item, log: LendingLog}>} Updated item and new lending log
 * @throws {Error} If validation fails or transaction cannot complete
 */
async function lendItem(itemId, userId, conditionNotes = null) {
  // Input validation
  if (!itemId) {
    throw new Error('Item ID is required');
  }
  if (!userId) {
    throw new Error('User ID is required');
  }

  const transaction = await sequelize.transaction();

  try {
    // 1. Fetch and validate item
    const item = await Item.findByPk(itemId, { transaction });
    
    if (!item) {
      await transaction.rollback();
      throw new Error('Item not found');
    }

    // FR-014: Prevent lending items with status "Lent" or "Maintenance"
    if (item.status === 'Lent') {
      await transaction.rollback();
      throw new Error('Cannot lend item that is already lent out');
    }

    if (item.status === 'Maintenance') {
      await transaction.rollback();
      throw new Error('Cannot lend item that is under maintenance');
    }

    // 2. Fetch and validate user
    const user = await User.findByPk(userId, { transaction });
    
    if (!user) {
      await transaction.rollback();
      throw new Error('User not found');
    }

    // 3. Update item status to "Lent" (FR-012)
    await item.update({ status: 'Lent' }, { transaction });

    // 4. Create lending log with denormalized borrower info (FR-016/FR-019)
    const lendingLog = await LendingLog.create({
      itemId: item.id,
      userId: user.id,
      borrowerName: user.name,      // Denormalized for audit trail preservation
      borrowerEmail: user.email,    // Denormalized for audit trail preservation
      dateLent: new Date(),         // FR-013: Current timestamp
      conditionNotes,
    }, { transaction });

    // Commit transaction - all operations successful
    await transaction.commit();

    return {
      item,
      log: lendingLog,
    };

  } catch (error) {
    // Rollback on any error (FR-031: Transaction integrity)
    if (!transaction.finished || transaction.finished === 'rollback') {
      // Transaction already rolled back in validation checks
    } else if (transaction.finished !== 'commit') {
      await transaction.rollback();
    }

    // Re-throw known validation errors
    if (error.message.includes('not found') || 
        error.message.includes('Cannot lend') ||
        error.message.includes('required')) {
      throw error;
    }

    // Wrap unexpected errors
    throw new Error(`Failed to lend item: ${error.message}`);
  }
}

/**
 * Get all lending logs for a specific item (FR-020)
 * 
 * Returns lending history in chronological order, most recent first (FR-021).
 * 
 * @param {string} itemId - UUID of the item
 * @returns {Promise<LendingLog[]>} Array of lending logs
 */
async function getItemLendingHistory(itemId) {
  if (!itemId) {
    throw new Error('Item ID is required');
  }

  try {
    const logs = await LendingLog.findAll({
      where: { itemId },
      order: [['dateLent', 'DESC']],  // Most recent first (FR-021)
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'name', 'category'],
        },
      ],
    });

    return logs;
  } catch (error) {
    throw new Error(`Failed to fetch lending history: ${error.message}`);
  }
}

/**
 * Get all currently lent items
 * 
 * @returns {Promise<Item[]>} Array of items with status "Lent"
 */
async function getCurrentlyLentItems() {
  try {
    const items = await Item.findAll({
      where: { status: 'Lent' },
      order: [['name', 'ASC']],
    });

    return items;
  } catch (error) {
    throw new Error(`Failed to fetch lent items: ${error.message}`);
  }
}

/**
 * Get all active lending logs (items still out)
 * 
 * @returns {Promise<LendingLog[]>} Array of lending logs where dateReturned is NULL
 */
async function getActiveLendings() {
  try {
    const logs = await LendingLog.findAll({
      where: { dateReturned: null },
      order: [['dateLent', 'DESC']],
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['id', 'name', 'category', 'status'],
        },
      ],
    });

    return logs;
  } catch (error) {
    throw new Error(`Failed to fetch active lendings: ${error.message}`);
  }
}

module.exports = {
  lendItem,
  getItemLendingHistory,
  getCurrentlyLentItems,
  getActiveLendings,
};
