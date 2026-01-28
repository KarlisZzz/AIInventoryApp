/**
 * Repair Database - Recreate Missing Tables
 * 
 * This script recreates the Users, LendingLogs, and AdminAuditLogs tables
 * that should have been created by migrations but are missing.
 */

const { sequelize } = require('./src/config/database');
const { QueryInterface } = require('sequelize');

async function repairDatabase() {
  const queryInterface = sequelize.getQueryInterface();
  
  try {
    console.log('🔧 Repairing database - Creating missing tables...\n');
    
    // Check which tables are missing
    const [tables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table'"
    );
    const tableNames = tables.map(t => t.name);
    
    console.log('Existing tables:', tableNames.join(', '));
    console.log('');
    
    // Create Users table if missing
    if (!tableNames.includes('Users')) {
      console.log('Creating Users table...');
      await queryInterface.createTable('Users', {
        id: {
          type: sequelize.Sequelize.UUID,
          defaultValue: sequelize.Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        name: {
          type: sequelize.Sequelize.STRING(100),
          allowNull: false,
        },
        email: {
          type: sequelize.Sequelize.STRING(255),
          allowNull: false,
          unique: true,
        },
        role: {
          type: sequelize.Sequelize.ENUM('administrator', 'standard user'),
          allowNull: false,
          defaultValue: 'standard user',
        },
        createdAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      console.log('✓ Users table created');
    }
    
    // Create LendingLogs table if missing
    if (!tableNames.includes('LendingLogs')) {
      console.log('Creating LendingLogs table...');
      await queryInterface.createTable('LendingLogs', {
        id: {
          type: sequelize.Sequelize.UUID,
          defaultValue: sequelize.Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        itemId: {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Items',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        borrowerId: {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        borrowerName: {
          type: sequelize.Sequelize.STRING(100),
          allowNull: false,
        },
        borrowerEmail: {
          type: sequelize.Sequelize.STRING(255),
          allowNull: false,
        },
        lentById: {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        lentByName: {
          type: sequelize.Sequelize.STRING(100),
          allowNull: false,
        },
        lentAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        returnedAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: true,
        },
        returnedById: {
          type: sequelize.Sequelize.UUID,
          allowNull: true,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        returnedByName: {
          type: sequelize.Sequelize.STRING(100),
          allowNull: true,
        },
        notes: {
          type: sequelize.Sequelize.TEXT,
          allowNull: true,
        },
        createdAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        updatedAt: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      console.log('✓ LendingLogs table created');
    }
    
    // Create AdminAuditLogs table if missing
    if (!tableNames.includes('AdminAuditLogs')) {
      console.log('Creating AdminAuditLogs table...');
      await queryInterface.createTable('AdminAuditLogs', {
        id: {
          type: sequelize.Sequelize.UUID,
          defaultValue: sequelize.Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false,
        },
        adminUserId: {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id',
          },
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        },
        action: {
          type: sequelize.Sequelize.ENUM(
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
          type: sequelize.Sequelize.STRING(50),
          allowNull: false,
        },
        entityId: {
          type: sequelize.Sequelize.UUID,
          allowNull: false,
        },
        details: {
          type: sequelize.Sequelize.JSON,
          allowNull: true,
        },
        timestamp: {
          type: sequelize.Sequelize.DATE,
          allowNull: false,
          defaultValue: sequelize.Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      });
      console.log('✓ AdminAuditLogs table created');
    }
    
    console.log('\n✓ Database repair complete!');
    console.log('\nCurrent tables:');
    const [newTables] = await sequelize.query(
      "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
    );
    newTables.forEach(t => console.log('  -', t.name));
    
  } catch (error) {
    console.error('✗ Error repairing database:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

repairDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
