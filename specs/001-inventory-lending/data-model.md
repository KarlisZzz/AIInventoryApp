`# Data Model: Inventory Management with Lending Workflow

**Feature**: `001-inventory-lending`  
**Created**: 2026-01-17  
**Database Engine**: SQLite 3.x  
**ORM**: Sequelize 6.x

---

## Overview

This document defines the database schema for the Inventory & Lending application. The data model consists of three core entities: **Item** (inventory assets), **User** (staff/borrowers), and **LendingLog** (transaction history). The design enforces referential integrity through foreign key constraints and supports atomic transactions for all lending operations per Constitution Principle III.

**Key Principles**:
- Foreign key constraints enabled (`PRAGMA foreign_keys = ON`)
- Cascading rules: RESTRICT on delete (prevent orphaned records)
- Atomic transactions for all state-changing operations
- Audit trail preservation (immutable lending logs)

---

## Database Configuration

### SQLite Pragmas

```sql
PRAGMA foreign_keys = ON;           -- Enforce referential integrity (FR-030)
PRAGMA journal_mode = WAL;          -- Write-Ahead Logging for better concurrency
PRAGMA synchronous = NORMAL;        -- Balance between safety and performance
PRAGMA temp_store = MEMORY;         -- Faster temporary operations
PRAGMA cache_size = -64000;         -- 64MB cache (performance optimization)
```

### Sequelize Configuration

**File**: `backend/src/config/database.js`

```javascript
module.exports = {
  dialect: 'sqlite',
  storage: process.env.DB_PATH || './data/inventory.db',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Connection pool (SQLite uses single connection)
  pool: {
    max: 1,
    min: 1,
    acquire: 30000,
    idle: 10000
  },
  
  // Enable foreign keys and other pragmas
  dialectOptions: {
    // Foreign keys enforced at connection level
  },
  
  define: {
    timestamps: true,           // Adds createdAt, updatedAt
    underscored: false,         // Use camelCase (not snake_case)
    freezeTableName: true,      // Don't pluralize table names
  }
};
```

---

## Models

### 1. Item

Represents physical inventory assets that can be lent to users.

**Table Name**: `Items`

#### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| **id** | UUID | Primary Key, Default: `UUIDV4()` | Unique identifier for the item |
| **name** | STRING(100) | NOT NULL | Item name (e.g., "Dell Laptop", "Projector") |
| **description** | TEXT(500) | NULL | Detailed description of the item |
| **category** | STRING(50) | NOT NULL | Item category (e.g., "Hardware", "Tools", "Kitchen") |
| **status** | ENUM | NOT NULL, Default: 'Available' | Current item state: 'Available', 'Lent', 'Maintenance' |
| **createdAt** | TIMESTAMP | NOT NULL, Default: NOW | Record creation timestamp |
| **updatedAt** | TIMESTAMP | NOT NULL, Default: NOW | Last update timestamp |

#### Sequelize Model Definition

**File**: `backend/src/models/Item.js`

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Item = sequelize.define('Item', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Item name is required' },
      len: {
        args: [1, 100],
        msg: 'Item name must be between 1 and 100 characters'
      }
    }
  },
  
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 500],
        msg: 'Description must not exceed 500 characters'
      }
    }
  },
  
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Category is required' },
      len: {
        args: [1, 50],
        msg: 'Category must be between 1 and 50 characters'
      }
    }
  },
  
  status: {
    type: DataTypes.ENUM('Available', 'Lent', 'Maintenance'),
    allowNull: false,
    defaultValue: 'Available',
    validate: {
      isIn: {
        args: [['Available', 'Lent', 'Maintenance']],
        msg: 'Status must be Available, Lent, or Maintenance'
      }
    }
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'Items',
  timestamps: true,
  indexes: [
    { fields: ['status'] },                    // Fast filtering by status
    { fields: ['category'] },                  // Fast filtering by category
    { fields: ['name'] },                      // Fast text search
    { fields: ['status', 'category'] },        // Combined queries (dashboard)
  ]
});

module.exports = Item;
```

#### Business Rules

- **FR-001**: Name, Category, Status are required fields
- **FR-003**: All fields except ID are updatable
- **FR-004, FR-005**: Items with status "Lent" cannot be deleted
- **FR-007**: Status must be one of: "Available", "Lent", "Maintenance"
- **FR-014**: Items with status "Lent" or "Maintenance" cannot be lent

#### Status Transitions

```
Available ──lend──> Lent ──return──> Available
    ↓                                    ↑
    └──────────maintenance───────────────┘
```

---

### 2. User

Represents staff members and borrowers who can interact with inventory items.

**Table Name**: `Users`

#### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| **id** | UUID | Primary Key, Default: `UUIDV4()` | Unique identifier for the user |
| **name** | STRING(100) | NOT NULL | User's full name |
| **email** | STRING(255) | NOT NULL, UNIQUE | User's email address (unique) |
| **role** | STRING(50) | NOT NULL | User role (e.g., "Staff", "Admin", "Borrower") |
| **createdAt** | TIMESTAMP | NOT NULL, Default: NOW | Record creation timestamp |
| **updatedAt** | TIMESTAMP | NOT NULL, Default: NOW | Last update timestamp |

#### Sequelize Model Definition

**File**: `backend/src/models/User.js`

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'User name is required' },
      len: {
        args: [1, 100],
        msg: 'User name must be between 1 and 100 characters'
      }
    }
  },
  
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: {
      name: 'unique_email',
      msg: 'Email address already exists'
    },
    validate: {
      isEmail: { msg: 'Must be a valid email address' },
      notEmpty: { msg: 'Email is required' }
    }
  },
  
  role: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'Borrower',
    validate: {
      notEmpty: { msg: 'Role is required' },
      len: {
        args: [1, 50],
        msg: 'Role must be between 1 and 50 characters'
      }
    }
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'Users',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['email'] },       // Unique email constraint
    { fields: ['name'] },                      // Fast search by name
    { fields: ['role'] },                      // Filter by role
  ]
});

module.exports = User;
```

#### Business Rules

- **FR-008**: Name, Email, and Role are required fields
- **FR-009**: Email must be valid format and unique across all users
- **FR-010**: Users are selectable during lending operations
- **A-001**: User authentication/authorization handled separately (users pre-created)

---

### 3. LendingLog

Tracks the complete history of lending transactions. Each log entry represents one borrow-return cycle for a specific item and user.

**Table Name**: `LendingLogs`

#### Schema

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| **id** | UUID | Primary Key, Default: `UUIDV4()` | Unique identifier for the log entry |
| **itemId** | UUID | Foreign Key → `Items.id`, NOT NULL, ON DELETE: RESTRICT | Reference to the borrowed item |
| **userId** | UUID | Foreign Key → `Users.id`, NOT NULL, ON DELETE: RESTRICT | Reference to the borrower |
| **borrowerName** | STRING(100) | NOT NULL | Denormalized borrower name (captured at lend time for audit preservation per FR-016) |
| **borrowerEmail** | STRING(255) | NOT NULL | Denormalized borrower email (captured at lend time for audit preservation per FR-016) |
| **dateLent** | TIMESTAMP | NOT NULL, Default: NOW | When the item was lent out |
| **dateReturned** | TIMESTAMP | NULL | When the item was returned (NULL if still out) |
| **conditionNotes** | TEXT(1000) | NULL | Notes on item condition (at lend or return) |
| **createdAt** | TIMESTAMP | NOT NULL, Default: NOW | Record creation timestamp |
| **updatedAt** | TIMESTAMP | NOT NULL, Default: NOW | Last update timestamp |

#### Sequelize Model Definition

**File**: `backend/src/models/LendingLog.js`

```javascript
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const Item = require('./Item');
const User = require('./User');

const LendingLog = sequelize.define('LendingLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  
  itemId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Items',
      key: 'id'
    },
    onDelete: 'RESTRICT',        // Prevent item deletion if lending logs exist
    onUpdate: 'CASCADE',
  },
  
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    },
    onDelete: 'RESTRICT',        // Prevent user deletion if lending logs exist
    onUpdate: 'CASCADE',
  },
  
  borrowerName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Borrower name is required' },
      len: {
        args: [1, 100],
        msg: 'Borrower name must be 1-100 characters'
      }
    },
    comment: 'Denormalized from User.name at lend time for audit trail preservation (FR-016)'
  },
  
  borrowerEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: { msg: 'Borrower email must be valid format' },
      notEmpty: { msg: 'Borrower email is required' }
    },
    comment: 'Denormalized from User.email at lend time for audit trail preservation (FR-016)'
  },
  
  dateLent: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: { msg: 'Date lent must be a valid date' },
      notNull: { msg: 'Date lent is required' }
    }
  },
  
  dateReturned: {
    type: DataTypes.DATE,
    allowNull: true,
    validate: {
      isDate: { msg: 'Date returned must be a valid date' },
      isAfterLendDate(value) {
        if (value && this.dateLent && value < this.dateLent) {
          throw new Error('Date returned cannot be before date lent');
        }
      }
    }
  },
  
  conditionNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    validate: {
      len: {
        args: [0, 1000],
        msg: 'Condition notes must not exceed 1000 characters'
      }
    }
  },
  
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
  
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'LendingLogs',
  timestamps: true,
  indexes: [
    { fields: ['itemId'] },                    // Fast history lookup by item
    { fields: ['userId'] },                    // Fast lookup by borrower
    { fields: ['dateLent'] },                  // Chronological sorting
    { fields: ['dateReturned'] },              // Filter active loans (NULL)
    { fields: ['itemId', 'dateReturned'] },    // Active loans per item
  ]
});

module.exports = LendingLog;
```

#### Business Rules

- **FR-012**: LendingLog creation must be atomic with Item status update
- **FR-013**: dateLent is set to current timestamp when item is lent
- **FR-015**: Must reference valid Item ID and User ID (foreign keys)
- **FR-017**: dateReturned update must be atomic with Item status change
- **FR-018**: dateReturned is set to current timestamp when item is returned
- **FR-020**: All lending logs for an item must be retrievable (history)
- **FR-021**: Logs displayed in chronological order (most recent first)
- **FR-022**: User name, dateLent, dateReturned, conditionNotes displayed

#### Log States

- **Active Loan**: `dateReturned IS NULL` (item currently lent out)
- **Completed Loan**: `dateReturned IS NOT NULL` (item returned)
- **Immutable**: Once created, logs should not be deleted (audit trail)

---

## Associations

### Relationships

```
Item (1) ──── (N) LendingLog
User (1) ──── (N) LendingLog
```

**Explanation**:
- **Item → LendingLog**: One item can have many lending logs over time (1:N)
- **User → LendingLog**: One user can borrow many items over time (1:N)
- **LendingLog → Item**: Each log references exactly one item (N:1)
- **LendingLog → User**: Each log references exactly one user (N:1)

### Sequelize Association Setup

**File**: `backend/src/models/index.js`

```javascript
const Item = require('./Item');
const User = require('./User');
const LendingLog = require('./LendingLog');

// Item associations
Item.hasMany(LendingLog, {
  foreignKey: 'itemId',
  as: 'lendingLogs',
  onDelete: 'RESTRICT',
});

// User associations
User.hasMany(LendingLog, {
  foreignKey: 'userId',
  as: 'lendingLogs',
  onDelete: 'RESTRICT',
});

// LendingLog associations
LendingLog.belongsTo(Item, {
  foreignKey: 'itemId',
  as: 'item',
  onDelete: 'RESTRICT',
});

LendingLog.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'RESTRICT',
});

module.exports = {
  Item,
  User,
  LendingLog,
};
```

### Cascade Behavior

| Operation | Item Delete | User Delete | Item Update | User Update |
|-----------|-------------|-------------|-------------|-------------|
| **LendingLog** | RESTRICT | RESTRICT | CASCADE | CASCADE |

**RESTRICT**: Prevents deletion of Item/User if lending logs exist (preserves audit trail)  
**CASCADE**: Updates LendingLog foreign keys if Item/User ID changes (rarely needed with UUID)

---

## Migrations

### Migration Files

**Directory**: `backend/src/db/migrations/`

#### 001-create-items.js

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Items', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM('Available', 'Lent', 'Maintenance'),
        allowNull: false,
        defaultValue: 'Available',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('Items', ['status']);
    await queryInterface.addIndex('Items', ['category']);
    await queryInterface.addIndex('Items', ['name']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Items');
  }
};
```

#### 002-create-users.js

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
      },
      role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Borrower',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('Users', ['email'], { unique: true });
    await queryInterface.addIndex('Users', ['name']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('Users');
  }
};
```

#### 003-create-lending-logs.js

```javascript
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('LendingLogs', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      itemId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Items',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      },
      borrowerName: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: 'Denormalized from User.name at lend time (FR-016 audit preservation)',
      },
      borrowerEmail: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Denormalized from User.email at lend time (FR-016 audit preservation)',
      },
      dateLent: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      dateReturned: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      conditionNotes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add indexes
    await queryInterface.addIndex('LendingLogs', ['itemId']);
    await queryInterface.addIndex('LendingLogs', ['userId']);
    await queryInterface.addIndex('LendingLogs', ['dateLent']);
    await queryInterface.addIndex('LendingLogs', ['dateReturned']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('LendingLogs');
  }
};
```

---

## Business Logic Constraints

### Atomic Transactions (Constitution Principle III)

All lending operations MUST be wrapped in Sequelize transactions:

#### Lend Operation

**File**: `backend/src/services/lendingService.js`

```javascript
async lendItem(itemId, userId, conditionNotes) {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Verify item exists and is available
    const item = await Item.findByPk(itemId, { transaction });
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    if (item.status !== 'Available') {
      throw new ValidationError(`Item is currently ${item.status} and cannot be lent`);
    }
    
    // 2. Verify user exists and capture borrower details for denormalization
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // 3. Update item status (ATOMIC STEP 1)
    await item.update({ status: 'Lent' }, { transaction });
    
    // 4. Create lending log with denormalized borrower data (ATOMIC STEP 2, FR-016)
    const lendingLog = await LendingLog.create({
      itemId,
      userId,
      borrowerName: user.name,         // Denormalized for audit trail preservation
      borrowerEmail: user.email,       // Denormalized for audit trail preservation
      dateLent: new Date(),
      conditionNotes: conditionNotes || null,
    }, { transaction });
    
    // 5. Commit transaction
    await transaction.commit();
    
    return { item, lendingLog };
  } catch (error) {
    // Rollback on any failure
    await transaction.rollback();
    throw error;
  }
}
```

#### Return Operation

```javascript
async returnItem(itemId, conditionNotes) {
  const transaction = await sequelize.transaction();
  
  try {
    // 1. Verify item exists and is lent
    const item = await Item.findByPk(itemId, { transaction });
    if (!item) {
      throw new NotFoundError('Item not found');
    }
    if (item.status !== 'Lent') {
      throw new ValidationError(`Item is ${item.status} and cannot be returned`);
    }
    
    // 2. Find active lending log (dateReturned IS NULL)
    const lendingLog = await LendingLog.findOne({
      where: { itemId, dateReturned: null },
      transaction,
    });
    if (!lendingLog) {
      throw new NotFoundError('No active lending record found for this item');
    }
    
    // 3. Update item status (ATOMIC STEP 1)
    await item.update({ status: 'Available' }, { transaction });
    
    // 4. Update lending log (ATOMIC STEP 2)
    await lendingLog.update({
      dateReturned: new Date(),
      conditionNotes: conditionNotes || lendingLog.conditionNotes,
    }, { transaction });
    
    // 5. Commit transaction
    await transaction.commit();
    
    return { item, lendingLog };
  } catch (error) {
    // Rollback on any failure
    await transaction.rollback();
    throw error;
  }
}
```

### Availability Guards

**Pre-Lend Validation** (FR-014):
- Item status MUST be "Available"
- Item status "Lent" → Error: "Item is already lent out"
- Item status "Maintenance" → Error: "Item is under maintenance and unavailable"

**Pre-Return Validation** (FR-016, FR-019):
- Item status MUST be "Lent"
- Item status "Available" → Error: "Item is not currently lent out"
- Item status "Maintenance" → Error: "Item cannot be returned from maintenance status"

### Data Integrity Rules

**FR-030**: Foreign key constraints enforced:
```sql
-- LendingLog.itemId references Items.id (RESTRICT on delete)
-- LendingLog.userId references Users.id (RESTRICT on delete)
```

**Orphan Prevention**:
- Cannot delete Item if lending logs exist
- Cannot delete User if lending logs exist
- Ensures complete audit trail preservation

**Immutability**:
- LendingLog records should never be deleted (soft delete if needed)
- Provides tamper-proof audit trail for compliance

---

## Query Patterns

### Common Queries

#### Get All Available Items

```javascript
const availableItems = await Item.findAll({
  where: { status: 'Available' },
  order: [['name', 'ASC']],
});
```

#### Get Items Currently Lent (Dashboard)

```javascript
const lentItems = await Item.findAll({
  where: { status: 'Lent' },
  include: [{
    model: LendingLog,
    as: 'lendingLogs',
    where: { dateReturned: null },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'name', 'email'],
    }],
  }],
});
```

#### Get Lending History for Item

```javascript
const history = await LendingLog.findAll({
  where: { itemId },
  include: [{
    model: User,
    as: 'user',
    attributes: ['id', 'name', 'email'],
  }],
  order: [['dateLent', 'DESC']],  // Most recent first (FR-021)
});
```

#### Search Items by Name/Category

```javascript
const items = await Item.findAll({
  where: {
    [Op.or]: [
      { name: { [Op.like]: `%${searchTerm}%` } },
      { category: { [Op.like]: `%${searchTerm}%` } },
      { description: { [Op.like]: `%${searchTerm}%` } },
    ],
  },
});
```

---

## Performance Considerations

### Indexes

**Items Table**:
- `status` - Fast filtering for dashboard (items currently lent)
- `category` - Category-based searches
- `name` - Text search optimization
- Composite: `(status, category)` - Combined queries

**Users Table**:
- `email` (unique) - Fast login/lookup
- `name` - Search by borrower name

**LendingLogs Table**:
- `itemId` - History lookup by item (FR-020)
- `userId` - Borrowing history by user
- `dateLent` - Chronological sorting (FR-021)
- `dateReturned` - Filter active loans (NULL check)
- Composite: `(itemId, dateReturned)` - Active loan per item

### Expected Data Sizes

| Table | Estimated Rows | Growth Rate |
|-------|----------------|-------------|
| Items | 100 - 10,000 | Slow (new inventory) |
| Users | 10 - 100 | Very slow (staff turnover) |
| LendingLogs | 1,000 - 100,000+ | Linear (per transaction) |

**Database Size Estimate**: ~1KB per lending log → 100MB for 100K transactions

---

## Validation Summary

### Field Constraints

| Field | Max Length | Required | Unique | Format |
|-------|-----------|----------|--------|--------|
| Item.name | 100 | Yes | No | Text |
| Item.description | 500 | No | No | Text |
| Item.category | 50 | Yes | No | Text |
| Item.status | N/A | Yes | No | Enum |
| User.name | 100 | Yes | No | Text |
| User.email | 255 | Yes | Yes | Email format |
| User.role | 50 | Yes | No | Text |
| LendingLog.conditionNotes | 1000 | No | No | Text |

### Constitution Compliance

- ✅ **Principle III**: Transactions implemented in service layer
- ✅ **Principle IV**: Foreign keys enabled, RESTRICT on delete
- ✅ **FR-027, FR-028**: All lending/return operations use transactions
- ✅ **FR-029**: Rollback on failure ensures no partial updates
- ✅ **FR-030**: Foreign key constraints enforced

---

## Next Steps

1. ✅ Data model defined (this document)
2. ⏳ Implement Sequelize models in `backend/src/models/`
3. ⏳ Create migration files in `backend/src/db/migrations/`
4. ⏳ Run migrations: `npx sequelize-cli db:migrate`
5. ⏳ Test foreign key constraints and transactions
6. ⏳ Implement service layer with atomic operations

**Related Documents**:
- [spec.md](spec.md) - Feature specification
- [plan.md](plan.md) - Implementation plan
- [tasks.md](tasks.md) - Task breakdown (T010-T016 for database setup)
- [contracts/](contracts/) - API contracts (references these models)

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-01-17  
**Status**: Ready for implementation
