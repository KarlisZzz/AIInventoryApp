/**
 * Dashboard Service
 * 
 * Business logic for dashboard analytics aggregation and data retrieval.
 * Provides methods for computing status/category distributions and identifying
 * top borrowers.
 * 
 * @see specs/003-dashboard-improvements/data-model.md
 * @see specs/003-dashboard-improvements/contracts/dashboard-analytics-api.yaml
 */

const { Item, LendingLog, User } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * Get aggregated analytics for dashboard visualization
 * 
 * Computes three key metrics:
 * 1. Status distribution - count of items by status
 * 2. Category distribution - count of items by category
 * 3. Top borrower - user with most items currently borrowed
 * 
 * @returns {Promise<Object>} Analytics data
 * @returns {Object} analytics.statusDistribution - Item counts by status
 * @returns {Object} analytics.categoryDistribution - Item counts by category
 * @returns {Object|null} analytics.topBorrower - Top borrower {name, count} or null
 * 
 * @see T005 - Implement analytics aggregation logic
 */
async function getAnalytics() {
  try {
    // Query 1: Status distribution
    const statusDistribution = {};
    const statusResults = await Item.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Convert array to object { status: count }
    statusResults.forEach(row => {
      statusDistribution[row.status] = parseInt(row.count, 10);
    });
    
    // Query 2: Category distribution
    const categoryDistribution = {};
    const categoryResults = await Item.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    
    // Convert array to object { category: count }
    categoryResults.forEach(row => {
      categoryDistribution[row.category] = parseInt(row.count, 10);
    });
    
    // Query 3: Top borrower (user with most items currently borrowed)
    // Find the most recent unreturned lending log for each item (status = "Lent")
    const topBorrowerResult = await LendingLog.findAll({
      attributes: [
        'borrowerName',
        [sequelize.fn('COUNT', sequelize.col('LendingLog.id')), 'count']
      ],
      include: [{
        model: Item,
        as: 'item',
        attributes: [],
        where: { status: 'Lent' },
        required: true
      }],
      where: { dateReturned: null },
      group: ['borrowerName'],
      order: [[sequelize.fn('COUNT', sequelize.col('LendingLog.id')), 'DESC']],
      limit: 1,
      raw: true
    });
    
    const topBorrower = topBorrowerResult.length > 0
      ? {
          name: topBorrowerResult[0].borrowerName,
          count: parseInt(topBorrowerResult[0].count, 10)
        }
      : null;
    
    return {
      statusDistribution,
      categoryDistribution,
      topBorrower
    };
  } catch (error) {
    console.error('Error in getAnalytics:', error);
    throw new Error(`Failed to retrieve dashboard analytics: ${error.message}`);
  }
}

/**
 * Get items currently lent out with borrower information
 * 
 * Returns items with status "Lent" along with the current lending log
 * that includes borrower name and lent-out date. Items are ordered by
 * lent-out date (earliest first) to support carousel display.
 * 
 * This fixes the "Unknown Borrower" and "Unknown Date" issue by properly
 * joining with LendingLog table.
 * 
 * @returns {Promise<Array>} Items with embedded currentLoan data
 * 
 * @see T007 - Fix items-out query to include loan relationship
 */
async function getItemsCurrentlyOut() {
  try {
    const items = await Item.findAll({
      where: { status: 'Lent' },
      include: [{
        model: LendingLog,
        as: 'lendingLogs',
        where: { dateReturned: null },
        required: true,
        separate: false
      }]
    });
    
    // Transform and sort the data
    const itemsWithLoan = items.map(item => {
      const itemData = item.toJSON();
      const currentLog = itemData.lendingLogs && itemData.lendingLogs.length > 0
        ? itemData.lendingLogs.sort((a, b) => new Date(b.dateLent) - new Date(a.dateLent))[0]
        : null;
      
      return {
        ...itemData,
        currentLoan: currentLog ? {
          id: currentLog.id,
          borrower: currentLog.borrowerName,
          lentAt: currentLog.dateLent,
          notes: currentLog.conditionNotes || null
        } : null,
        // Remove the lendingLogs array to keep response clean
        lendingLogs: undefined
      };
    });
    
    // Sort by lent date (earliest first) for carousel display
    return itemsWithLoan.sort((a, b) => {
      if (!a.currentLoan || !b.currentLoan) return 0;
      return new Date(a.currentLoan.lentAt) - new Date(b.currentLoan.lentAt);
    });
  } catch (error) {
    console.error('Error in getItemsCurrentlyOut:', error);
    throw new Error(`Failed to retrieve items currently out: ${error.message}`);
  }
}

module.exports = {
  getAnalytics,
  getItemsCurrentlyOut,
};
