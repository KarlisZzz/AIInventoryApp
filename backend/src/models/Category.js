const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the category',
  },
  
  name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: {
      name: 'unique_category_name',
      msg: 'Category name already exists',
    },
    validate: {
      notEmpty: {
        msg: 'Category name is required',
      },
      len: {
        args: [1, 50],
        msg: 'Category name must be between 1 and 50 characters',
      },
      // Custom validator for whitespace
      noLeadingTrailingSpace(value) {
        if (value !== value.trim()) {
          throw new Error('Category name cannot have leading or trailing spaces');
        }
      },
    },
    comment: 'Category name (e.g., "Electronics", "Tools", "Kitchen")',
  },
}, {
  tableName: 'Categories',
  timestamps: true,
  indexes: [
    {
      fields: [sequelize.fn('LOWER', sequelize.col('name'))],
      unique: true,
      comment: 'Enforce case-insensitive uniqueness',
    },
  ],
});

/**
 * Class method: Get category with item count
 * @returns {Promise<Array>} Categories with itemCount
 */
Category.findAllWithItemCount = async function() {
  const { Item } = require('./index');
  return await Category.findAll({
    attributes: [
      'id',
      'name',
      'createdAt',
      'updatedAt',
      [sequelize.fn('COUNT', sequelize.col('Items.id')), 'itemCount'],
    ],
    include: [{
      model: Item,
      attributes: [],
      required: false,
    }],
    group: ['Category.id', 'Category.name', 'Category.createdAt', 'Category.updatedAt'],
    order: [['name', 'ASC']],
    raw: true,
  });
};

/**
 * Class method: Check if category can be deleted
 * @param {string} categoryId - Category UUID
 * @returns {Promise<{ canDelete: boolean, itemCount: number }>}
 */
Category.checkDeletable = async function(categoryId) {
  const { Item } = require('./index');
  const category = await Category.findByPk(categoryId, {
    include: [{
      model: Item,
      attributes: ['id'],
    }],
  });
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  const itemCount = category.Items ? category.Items.length : 0;
  return {
    canDelete: itemCount === 0,
    itemCount,
  };
};

module.exports = Category;
