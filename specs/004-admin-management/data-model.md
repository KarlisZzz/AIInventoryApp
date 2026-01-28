# Data Model: Admin Management Section

**Feature Branch**: `004-admin-management`  
**Date**: January 25, 2026  
**Related Documents**: [Feature Spec](spec.md) | [Research](research.md)

---

## Overview

This document defines the data models for admin management functionality, including the new `Category` entity (migrated from Item string field), updates to the `User` model for role standardization, and the new `AdminAuditLog` entity for audit trail tracking.

---

## Entity Relationship Diagram

```
┌─────────────────┐         ┌─────────────────┐
│   Category      │         │      User       │
├─────────────────┤         ├─────────────────┤
│ id (PK)         │         │ id (PK)         │
│ name (unique)   │         │ name            │
│ createdAt       │╲        │ email (unique)  │
│ updatedAt       │ ╲       │ role            │
└─────────────────┘  ╲      │ createdAt       │
                      ╲     │ updatedAt       │
                       ╲    └─────────────────┘
                        ╲           │
                         ╲          │ 1
                          ╲         │
                         ┌─╲────────┼──────────┐
                         │  ╲       │ performed│
                         │   ╲      │          │
                         │ N  ╲   N │          │
                         │     ╲    ↓          │
                    ┌────┴──────╲───────────┐  │
                    │    Item    ╲          │  │
                    ├─────────────╲─────────┤  │
                    │ id (PK)      ╲        │  │
                    │ name          ↓       │  │
                    │ description   ╲       │  │
                    │ categoryId(FK) ╲      │  │
                    │ status          ╲     │  │
                    │ imageUrl         ╲    │  │
                    │ createdAt         ╲   │  │
                    │ updatedAt          ╲  │  │
                    └────────────────────╲─┘  │
                                          ╲   │
                                           ╲  │
                                            ╲ ↓
                                   ┌─────────────────────┐
                                   │  AdminAuditLog      │
                                   ├─────────────────────┤
                                   │ id (PK)             │
                                   │ adminUserId (FK)    │
                                   │ action              │
                                   │ entityType          │
                                   │ entityId            │
                                   │ details (JSON)      │
                                   │ timestamp           │
                                   └─────────────────────┘
```

**Relationships**:
- `Category` → `Item`: One-to-Many (one category has many items)
- `User` (admin) → `AdminAuditLog`: One-to-Many (one admin performs many actions)
- `User` (existing): Already has One-to-Many with `LendingLog` (not shown)

---

## 1. Category Entity (NEW)

### Purpose
Represents organizational classifications for inventory items. Previously stored as a string field in Item, now a separate entity to enable CRUD operations and referential integrity (FR-001 to FR-007).

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique identifier |
| `name` | VARCHAR(50) | NOT NULL, UNIQUE (case-insensitive) | Category name (e.g., "Electronics", "Tools") |
| `createdAt` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record creation timestamp |
| `updatedAt` | TIMESTAMP | NOT NULL, DEFAULT NOW | Record last update timestamp |

### Validation Rules
- `name`: Required, 1-50 characters, unique (case-insensitive), no leading/trailing whitespace
- Duplicate check: `LOWER(name)` must be unique (FR-005)
- Cannot be deleted if any Items reference it (FR-004)

### Indexes
- Primary index: `id` (PRIMARY KEY - automatic)
- Unique index: `name` (case-insensitive via `COLLATE NOCASE` or application-level)
- Performance: Expected <1000 categories, all queries <2s (SC-006)

### Sequelize Model Definition

```javascript
// backend/src/models/Category.js
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
      name: 'idx_categories_name_lower',
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
```

### State Transitions
Categories have no state - they are simple master data entities. Lifecycle:
1. **Created**: Admin creates new category (FR-001)
2. **Updated**: Admin edits category name (FR-002)
3. **Deleted**: Admin deletes category (only if no items assigned) (FR-003, FR-004)

---

## 2. User Entity (UPDATED)

### Changes from Current Implementation

**Current**:
- `role`: STRING(50) with freeform values ("Admin", "Staff", "Member", "Borrower")
- No role-based access control

**Updated**:
- `role`: ENUM('administrator', 'standard user') with strict validation
- Standardized roles for authorization (FR-012)
- Cannot delete own account (FR-013)
- Cannot delete last administrator (FR-014)

### Schema (Changes Only)

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `role` | ENUM | NOT NULL, IN ('administrator', 'standard user') | User role for access control |

**Note**: All other User fields remain unchanged (id, name, email, createdAt, updatedAt).

### Validation Rules (Updated)
- `role`: Must be exactly "administrator" or "standard user" (case-sensitive)
- System-wide: At least one administrator must always exist (enforced in service layer)

### Updated Model Methods

```javascript
// backend/src/models/User.js (additions/changes only)

// Update enum values
role: {
  type: DataTypes.ENUM('administrator', 'standard user'),
  allowNull: false,
  defaultValue: 'standard user',
  validate: {
    isIn: {
      args: [['administrator', 'standard user']],
      msg: 'Role must be "administrator" or "standard user"',
    },
  },
  comment: 'User role for access control',
},

// Update instance method
User.prototype.isAdmin = function() {
  return this.role === 'administrator';
};

// New class method: Count administrators
User.countAdministrators = async function() {
  return await User.count({
    where: { role: 'administrator' },
  });
};

// New class method: Validate not removing last admin
User.canDeleteAdmin = async function(userId) {
  const user = await User.findByPk(userId);
  if (!user) return { canDelete: false, reason: 'User not found' };
  
  if (user.role !== 'administrator') {
    return { canDelete: true };
  }
  
  const adminCount = await User.countAdministrators();
  if (adminCount <= 1) {
    return { canDelete: false, reason: 'Cannot delete the last administrator' };
  }
  
  return { canDelete: true };
};
```

---

## 3. AdminAuditLog Entity (NEW)

### Purpose
Tracks all administrative actions for compliance and security auditing (FR-019). Provides immutable audit trail of who did what, when, and to which entity.

### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | PRIMARY KEY, NOT NULL | Unique identifier for log entry |
| `adminUserId` | UUID | FOREIGN KEY (User.id), NOT NULL, indexed | Administrator who performed the action |
| `action` | ENUM | NOT NULL | Action performed (see Action Types below) |
| `entityType` | VARCHAR(50) | NOT NULL | Type of entity affected ('User', 'Category') |
| `entityId` | UUID | NOT NULL | ID of the affected entity |
| `details` | JSON | NULL | Additional context (before/after state, reason, etc.) |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT NOW | When the action occurred |

### Action Types (ENUM)

| Action | Description | entityType | Example details |
|--------|-------------|------------|-----------------|
| `CREATE_CATEGORY` | Category created | Category | `{ name: "Electronics" }` |
| `UPDATE_CATEGORY` | Category name changed | Category | `{ oldName: "Electronic", newName: "Electronics" }` |
| `DELETE_CATEGORY` | Category deleted | Category | `{ name: "Obsolete", itemCount: 0 }` |
| `CREATE_USER` | User account created | User | `{ name: "John Doe", email: "john@example.com", role: "standard user" }` |
| `UPDATE_USER` | User info or role changed | User | `{ changes: { role: { from: "standard user", to: "administrator" } } }` |
| `DELETE_USER` | User account deactivated/removed | User | `{ name: "Jane Smith", email: "jane@example.com", role: "standard user" }` |

### Validation Rules
- `adminUserId`: Must reference valid User with role='administrator'
- `action`: Must be one of the defined enum values
- `entityType`: Currently 'User' or 'Category' (extensible for future entities)
- `entityId`: Must be valid UUID (not enforced as FK due to soft deletes)
- `details`: Optional JSON field, max 10KB recommended (not enforced at DB level)
- `timestamp`: Automatic, cannot be modified after creation

### Indexes
- Primary index: `id` (automatic)
- Index on `adminUserId` for querying "what did this admin do?"
- Index on `timestamp` for temporal queries
- Composite index on `(entityType, entityId)` for entity history

### Sequelize Model Definition

```javascript
// backend/src/models/AdminAuditLog.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AdminAuditLog = sequelize.define('AdminAuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
    comment: 'Unique identifier for the audit log entry',
  },
  
  adminUserId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id',
    },
    comment: 'Administrator who performed the action',
  },
  
  action: {
    type: DataTypes.ENUM(
      'CREATE_CATEGORY',
      'UPDATE_CATEGORY',
      'DELETE_CATEGORY',
      'CREATE_USER',
      'UPDATE_USER',
      'DELETE_USER'
    ),
    allowNull: false,
    comment: 'Type of administrative action performed',
  },
  
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      isIn: {
        args: [['Category', 'User']],
        msg: 'Entity type must be Category or User',
      },
    },
    comment: 'Type of entity affected by the action',
  },
  
  entityId: {
    type: DataTypes.UUID,
    allowNull: false,
    comment: 'ID of the entity affected (not enforced FK due to soft deletes)',
  },
  
  details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional context about the action (before/after states, etc.)',
  },
  
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When the action occurred',
  },
}, {
  tableName: 'AdminAuditLogs',
  timestamps: false, // Using custom timestamp field
  indexes: [
    {
      name: 'idx_audit_admin_user',
      fields: ['adminUserId'],
      comment: 'Query logs by administrator',
    },
    {
      name: 'idx_audit_timestamp',
      fields: ['timestamp'],
      comment: 'Query logs by time range',
    },
    {
      name: 'idx_audit_entity',
      fields: ['entityType', 'entityId'],
      comment: 'Query history of specific entity',
    },
  ],
});

/**
 * Class method: Log an admin action
 * @param {Object} params - Action details
 * @returns {Promise<AdminAuditLog>}
 */
AdminAuditLog.logAction = async function({ adminUserId, action, entityType, entityId, details }) {
  return await AdminAuditLog.create({
    adminUserId,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date(),
  });
};

/**
 * Class method: Get recent actions by admin
 * @param {string} adminUserId - Admin user UUID
 * @param {number} limit - Max results (default 100)
 * @returns {Promise<Array>}
 */
AdminAuditLog.getRecentByAdmin = async function(adminUserId, limit = 100) {
  return await AdminAuditLog.findAll({
    where: { adminUserId },
    order: [['timestamp', 'DESC']],
    limit,
    include: [{
      model: require('./User'),
      as: 'admin',
      attributes: ['name', 'email'],
    }],
  });
};

module.exports = AdminAuditLog;
```

### Retention Policy
**Not implemented in this feature** (out of scope), but recommended for future:
- Retain all logs for 90 days in primary database
- Archive logs older than 90 days to separate storage
- Legal/compliance may require longer retention

---

## 4. Item Entity (UPDATED)

### Changes from Current Implementation

**Current**:
- `category`: STRING(50) with freeform text values

**Updated**:
- Remove `category` STRING field
- Add `categoryId` UUID field with FOREIGN KEY constraint to Category table

### Schema Changes

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `categoryId` | UUID | FOREIGN KEY (Category.id), NOT NULL, indexed | Reference to Category entity |

**Removed**: `category` STRING(50)

### Updated Model Associations

```javascript
// backend/src/models/Item.js (additions/changes only)

// Add field
categoryId: {
  type: DataTypes.UUID,
  allowNull: false,
  references: {
    model: 'Categories',
    key: 'id',
  },
  comment: 'Reference to category (replaces string field)',
},

// Remove old field
// category: { ... } // DELETED

// Add association
Item.associate = function(models) {
  Item.belongsTo(models.Category, {
    foreignKey: 'categoryId',
    as: 'category',
  });
};

// Update search method to include category name
Item.search = async function(searchTerm) {
  const { Op } = require('sequelize');
  return await Item.findAll({
    where: {
      [Op.or]: [
        { name: { [Op.like]: `%${searchTerm}%` } },
        { description: { [Op.like]: `%${searchTerm}%` } },
        // Category search now via join
      ],
    },
    include: [{
      model: require('./Category'),
      as: 'category',
      where: {
        name: { [Op.like]: `%${searchTerm}%` },
      },
      required: false,
    }],
  });
};
```

---

## 5. Model Associations

### Define All Relationships

```javascript
// backend/src/models/index.js (additions)

const Category = require('./Category');
const Item = require('./Item');
const User = require('./User');
const AdminAuditLog = require('./AdminAuditLog');

// Category → Item (one-to-many)
Category.hasMany(Item, {
  foreignKey: 'categoryId',
  as: 'Items',
  onDelete: 'RESTRICT', // Prevent deletion if items exist
  onUpdate: 'CASCADE',
});

Item.belongsTo(Category, {
  foreignKey: 'categoryId',
  as: 'category',
});

// User (admin) → AdminAuditLog (one-to-many)
User.hasMany(AdminAuditLog, {
  foreignKey: 'adminUserId',
  as: 'auditLogs',
  onDelete: 'RESTRICT', // Preserve audit trail even if user deleted
});

AdminAuditLog.belongsTo(User, {
  foreignKey: 'adminUserId',
  as: 'admin',
});

module.exports = {
  Category,
  Item,
  User,
  AdminAuditLog,
  // ... existing exports
};
```

---

## 6. Database Migrations

### Migration 1: Create Categories Table and Migrate Data

**File**: `backend/src/db/migrations/YYYYMMDDHHMMSS-create-categories.js`

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Create Categories table
      await queryInterface.createTable('Categories', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: Sequelize.STRING(50),
          allowNull: false,
          unique: true,
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW,
        },
      }, { transaction });
      
      // Step 2: Extract unique categories from Items
      const [uniqueCategories] = await queryInterface.sequelize.query(
        'SELECT DISTINCT category FROM Items WHERE category IS NOT NULL',
        { transaction }
      );
      
      // Step 3: Insert categories
      const categoryInserts = uniqueCategories.map(({ category }) => ({
        id: Sequelize.UUIDV4(),
        name: category,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      if (categoryInserts.length > 0) {
        await queryInterface.bulkInsert('Categories', categoryInserts, { transaction });
      }
      
      // Step 4: Add categoryId column to Items (nullable for now)
      await queryInterface.addColumn('Items', 'categoryId', {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'Categories',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      }, { transaction });
      
      // Step 5: Populate categoryId based on category name
      await queryInterface.sequelize.query(`
        UPDATE Items
        SET categoryId = (
          SELECT id FROM Categories WHERE Categories.name = Items.category
        )
        WHERE category IS NOT NULL
      `, { transaction });
      
      // Step 6: Verify all items have categoryId
      const [itemsWithoutCategory] = await queryInterface.sequelize.query(
        'SELECT COUNT(*) as count FROM Items WHERE categoryId IS NULL',
        { transaction }
      );
      
      if (itemsWithoutCategory[0].count > 0) {
        throw new Error(`Migration failed: ${itemsWithoutCategory[0].count} items without category`);
      }
      
      // Step 7: Make categoryId NOT NULL
      await queryInterface.changeColumn('Items', 'categoryId', {
        type: Sequelize.UUID,
        allowNull: false,
      }, { transaction });
      
      // Step 8: Drop old category column
      await queryInterface.removeColumn('Items', 'category', { transaction });
      
      // Step 9: Create indexes
      await queryInterface.addIndex('Categories', ['name'], {
        name: 'idx_categories_name',
        unique: true,
        transaction,
      });
      
      await queryInterface.addIndex('Items', ['categoryId'], {
        name: 'idx_items_category_id',
        transaction,
      });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Restore category string column
      await queryInterface.addColumn('Items', 'category', {
        type: Sequelize.STRING(50),
        allowNull: true,
      }, { transaction });
      
      // Populate from categoryId
      await queryInterface.sequelize.query(`
        UPDATE Items
        SET category = (
          SELECT name FROM Categories WHERE Categories.id = Items.categoryId
        )
      `, { transaction });
      
      // Drop categoryId column
      await queryInterface.removeColumn('Items', 'categoryId', { transaction });
      
      // Drop Categories table
      await queryInterface.dropTable('Categories', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
```

### Migration 2: Standardize User Roles

**File**: `backend/src/db/migrations/YYYYMMDDHHMMSS-standardize-user-roles.js`

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Step 1: Update role values
      // Map any role containing 'admin' (case-insensitive) to 'administrator'
      await queryInterface.sequelize.query(`
        UPDATE Users
        SET role = 'administrator'
        WHERE LOWER(role) LIKE '%admin%'
      `, { transaction });
      
      // Map all other roles to 'standard user'
      await queryInterface.sequelize.query(`
        UPDATE Users
        SET role = 'standard user'
        WHERE role != 'administrator'
      `, { transaction });
      
      // Step 2: Verify at least one administrator exists
      const [adminCount] = await queryInterface.sequelize.query(
        "SELECT COUNT(*) as count FROM Users WHERE role = 'administrator'",
        { transaction }
      );
      
      if (adminCount[0].count === 0) {
        throw new Error('Migration failed: No administrators found after role standardization');
      }
      
      // Step 3: Change role column to ENUM (database-level constraint)
      // Note: SQLite doesn't support ENUM, so we use CHECK constraint
      await queryInterface.sequelize.query(`
        CREATE TABLE Users_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK(role IN ('administrator', 'standard user')),
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL
        )
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        INSERT INTO Users_new SELECT id, name, email, role, createdAt, updatedAt FROM Users
      `, { transaction });
      
      await queryInterface.sequelize.query('DROP TABLE Users', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE Users_new RENAME TO Users', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
  
  down: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Remove CHECK constraint by recreating table without it
      await queryInterface.sequelize.query(`
        CREATE TABLE Users_new (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL,
          createdAt DATETIME NOT NULL,
          updatedAt DATETIME NOT NULL
        )
      `, { transaction });
      
      await queryInterface.sequelize.query(`
        INSERT INTO Users_new SELECT * FROM Users
      `, { transaction });
      
      await queryInterface.sequelize.query('DROP TABLE Users', { transaction });
      await queryInterface.sequelize.query('ALTER TABLE Users_new RENAME TO Users', { transaction });
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
```

### Migration 3: Create AdminAuditLogs Table

**File**: `backend/src/db/migrations/YYYYMMDDHHMMSS-create-admin-audit-logs.js`

```javascript
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AdminAuditLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      adminUserId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      action: {
        type: Sequelize.ENUM(
          'CREATE_CATEGORY',
          'UPDATE_CATEGORY',
          'DELETE_CATEGORY',
          'CREATE_USER',
          'UPDATE_USER',
          'DELETE_USER'
        ),
        allowNull: false,
      },
      entityType: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      details: {
        type: Sequelize.JSON,
        allowNull: true,
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });
    
    // Create indexes
    await queryInterface.addIndex('AdminAuditLogs', ['adminUserId'], {
      name: 'idx_audit_admin_user',
    });
    
    await queryInterface.addIndex('AdminAuditLogs', ['timestamp'], {
      name: 'idx_audit_timestamp',
    });
    
    await queryInterface.addIndex('AdminAuditLogs', ['entityType', 'entityId'], {
      name: 'idx_audit_entity',
    });
  },
  
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AdminAuditLogs');
  },
};
```

---

## 7. Performance Considerations

### Query Optimization

**Category List with Item Counts** (FR-006, SC-006):
```sql
SELECT 
  c.id, 
  c.name, 
  COUNT(i.id) as itemCount
FROM Categories c
LEFT JOIN Items i ON i.categoryId = c.id
GROUP BY c.id, c.name
ORDER BY c.name ASC;
```
- Expected performance: <200ms for 1000 categories (meets SC-006 requirement of <2s)
- Index usage: Uses primary key on Categories, foreign key index on Items

**User List Query** (FR-015):
```sql
SELECT id, name, email, role, createdAt, updatedAt
FROM Users
ORDER BY name ASC;
```
- Expected performance: <100ms for 1000 users
- No joins needed, simple table scan with ORDER BY

### Data Volume Estimates

| Entity | Expected Count | Growth Rate | Storage per Record |
|--------|---------------|-------------|-------------------|
| Category | 10-100 | Very slow (static) | ~100 bytes |
| User | 5-500 | Slow (org growth) | ~200 bytes |
| AdminAuditLog | Unlimited | Fast (every admin action) | ~500 bytes (with JSON) |
| Item | 100-10,000 | Medium (inventory additions) | ~300 bytes |

**Storage Projections**:
- 100 categories × 100 bytes = 10 KB
- 500 users × 200 bytes = 100 KB
- 10,000 audit logs/year × 500 bytes = 5 MB/year
- **Total additional storage**: ~5 MB/year (negligible for SQLite)

---

## 8. Data Integrity Rules

### Foreign Key Constraints

1. **Items.categoryId → Categories.id**
   - `ON DELETE RESTRICT`: Cannot delete category if items exist (FR-004)
   - `ON UPDATE CASCADE`: Category ID changes propagate (unlikely in practice)

2. **AdminAuditLogs.adminUserId → Users.id**
   - `ON DELETE RESTRICT`: Cannot delete user if audit logs exist (preserve audit trail)
   - `ON UPDATE CASCADE`: User ID changes propagate (unlikely with UUID)

### Check Constraints

1. **Users.role**: Must be 'administrator' or 'standard user' (FR-012)
2. **Categories.name**: Length 1-50, no leading/trailing spaces
3. **AdminAuditLogs.action**: Must be one of defined enum values
4. **AdminAuditLogs.entityType**: Must be 'Category' or 'User'

### Business Logic Constraints (Service Layer)

1. **Last Administrator Rule** (FR-014):
   - At least one User with role='administrator' must exist at all times
   - Enforced in `UserService.deleteUser()` before transaction

2. **Self-Deletion Prevention** (FR-013):
   - Admin cannot delete their own account
   - Enforced in `UserService.deleteUser()` before transaction

3. **Category Uniqueness** (FR-005):
   - Case-insensitive name uniqueness
   - Enforced via database index + application-level check

---

## 9. Migration Testing Strategy

### Pre-Migration Validation
1. Backup database before running migrations
2. Verify existing data integrity (no null categories, valid roles)
3. Count records for comparison after migration

### Post-Migration Validation
1. Verify all Items have valid categoryId references
2. Verify no data loss (record counts match pre-migration)
3. Verify at least one administrator exists
4. Test foreign key constraints (attempt to delete category with items - should fail)
5. Test role-based authorization (admin vs standard user access)

### Rollback Testing
1. Run `down()` migration to rollback
2. Verify data restored to original state
3. Verify no orphaned records

---

**Status**: Data model complete. Ready for API contract generation (Phase 1 next step).
