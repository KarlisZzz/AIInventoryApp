/**
 * Unit tests for categoryService
 * Tests business logic for category CRUD operations
 */

const { expect } = require('chai');
const sinon = require('sinon');
const categoryService = require('../../src/services/categoryService');
const { Category, Item, AdminAuditLog, sequelize } = require('../../src/models');

describe('categoryService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getAllCategories', () => {
    it('should return all categories with item counts', async () => {
      const mockCategories = [
        {
          id: 'cat-1',
          name: 'Electronics',
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: 5,
        },
        {
          id: 'cat-2',
          name: 'Books',
          createdAt: new Date(),
          updatedAt: new Date(),
          itemCount: 3,
        }
      ];

      // Mock Category.findAll to return raw results
      sandbox.stub(Category, 'findAll').resolves(mockCategories);

      const result = await categoryService.getAllCategories();

      expect(result).to.be.an('array').with.lengthOf(2);
      expect(result[0]).to.include({ name: 'Electronics', itemCount: 5 });
      expect(result[1]).to.include({ name: 'Books', itemCount: 3 });
    });
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            items: [],
          };
        }
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);

      const result = await categoryService.getCategoryById('cat-1');

      expect(result).to.have.property('itemCount', 0);
      expect(result).to.not.have.property('items');
      expect(Category.findByPk.calledWith('cat-1')).to.be.true;
    });

    it('should return null when category not found', async () => {
      sandbox.stub(Category, 'findByPk').resolves(null);

      const result = await categoryService.getCategoryById('non-existent');

      expect(result).to.be.null;
    });
  });

  describe('createCategory', () => {
    it('should create category and log audit entry in transaction', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);

      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        }
      };

      sandbox.stub(Category, 'findOne').resolves(null);
      sandbox.stub(Category, 'create').resolves(mockCategory);
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      const result = await categoryService.createCategory('Electronics', 'admin-user-1');

      // Compare using toJSON to avoid comparing methods
      expect(result).to.deep.equal(mockCategory.toJSON());
      expect(Category.create.calledOnce).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should check for duplicate category names', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);
      sandbox.stub(Category, 'findOne').resolves({ id: 'existing', name: 'Electronics' });

      try {
        await categoryService.createCategory('Electronics', 'admin-user-1');
        expect.fail('Should have thrown error for duplicate name');
      } catch (err) {
        expect(err.message).to.include('already exists');
      }
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);
      sandbox.stub(Category, 'findOne').resolves(null);
      sandbox.stub(Category, 'create').rejects(new Error('Database error'));

      try {
        await categoryService.createCategory('Electronics', 'admin-user-1');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(mockTransaction.rollback.calledOnce).to.be.true;
      }
    });
  });

  describe('updateCategory', () => {
    it('should update category and log audit entry in transaction', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);

      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        save: sandbox.stub().resolves(),
        reload: sandbox.stub().resolves(),
        toJSON: function() {
          return {
            id: this.id,
            name: this.name,
          };
        }
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);
      sandbox.stub(Category, 'findOne').resolves(null); // No duplicate
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      const result = await categoryService.updateCategory('cat-1', 'Electronic Devices', 'admin-user-1');

      expect(mockCategory.name).to.equal('Electronic Devices');
      expect(mockCategory.save.calledOnce).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should throw error if category not found', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);
      sandbox.stub(Category, 'findByPk').resolves(null);

      try {
        await categoryService.updateCategory('non-existent', 'New Name', 'admin-user-1');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err.message).to.include('not found');
      }
    });

    it('should check for duplicate names excluding current category', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(sequelize, 'where').returnsArg(0);
      sandbox.stub(sequelize, 'fn').returnsArg(1);
      sandbox.stub(sequelize, 'col').returnsArg(0);

      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);
      sandbox.stub(Category, 'findOne').resolves({ id: 'cat-2', name: 'Books' });

      try {
        await categoryService.updateCategory('cat-1', 'Books', 'admin-user-1');
        expect.fail('Should have thrown error for duplicate name');
      } catch (err) {
        expect(err.message).to.include('already exists');
        expect(mockTransaction.rollback.calledOnce).to.be.true;
      }
    });
  });

  describe('deleteCategory', () => {
    it('should delete category with no assigned items and log audit entry', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);

      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        items: [], // No items assigned
        destroy: sandbox.stub().resolves(),
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      await categoryService.deleteCategory('cat-1', 'admin-user-1');

      expect(mockCategory.destroy.calledOnce).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should throw error if category not found', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(Category, 'findByPk').resolves(null);

      try {
        await categoryService.deleteCategory('non-existent', 'admin-user-1');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err.message).to.include('not found');
      }
    });

    it('should throw error if category has assigned items', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        items: [{id: 'item-1'}, {id: 'item-2'}, {id: 'item-3'}, {id: 'item-4'}, {id: 'item-5'}], // Has 5 items
        destroy: sandbox.stub().resolves(),
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);

      try {
        await categoryService.deleteCategory('cat-1', 'admin-user-1');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(err.message).to.include('Cannot delete category');
        expect(err.message).to.include('5');
        expect(mockTransaction.rollback.calledOnce).to.be.true;
      }
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);

      const mockCategory = {
        id: 'cat-1',
        name: 'Electronics',
        items: [], // No items
        destroy: sandbox.stub().rejects(new Error('Database error')),
      };

      sandbox.stub(Category, 'findByPk').resolves(mockCategory);

      try {
        await categoryService.deleteCategory('cat-1', 'admin-user-1');
        expect.fail('Should have thrown error');
      } catch (err) {
        expect(mockTransaction.rollback.calledOnce).to.be.true;
      }
    });
  });
});
