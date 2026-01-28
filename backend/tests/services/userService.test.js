/**
 * Unit tests for userService
 * Tests business logic for user CRUD operations and safety checks
 */

const { expect } = require('chai');
const sinon = require('sinon');
const userService = require('../../src/services/userService');
const { User, AdminAuditLog, sequelize } = require('../../src/models');
const emailService = require('../../src/services/emailService');

describe('userService', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('getAllUsers', () => {
    it('should return all users when no filter provided', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'administrator',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user@example.com',
          name: 'Standard User',
          role: 'standard user',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      sandbox.stub(User, 'findAll').resolves(mockUsers);

      const result = await userService.getAllUsers();

      expect(result).to.be.an('array').with.lengthOf(2);
      expect(User.findAll.calledOnce).to.be.true;
      const callArgs = User.findAll.getCall(0).args[0];
      expect(callArgs).to.have.property('where');
      expect(callArgs.order).to.deep.equal([['name', 'ASC']]);
    });

    it('should filter users by role when roleFilter provided', async () => {
      const mockAdmins = [
        {
          id: 'user-1',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'administrator',
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      ];

      sandbox.stub(User, 'findAll').resolves(mockAdmins);

      const result = await userService.getAllUsers({ roleFilter: 'administrator' });

      expect(result).to.be.an('array').with.lengthOf(1);
      expect(User.findAll.calledOnce).to.be.true;
      const callArgs = User.findAll.getCall(0).args[0];
      expect(callArgs.where).to.deep.equal({ role: 'administrator' });
      expect(callArgs.order).to.deep.equal([['name', 'ASC']]);
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'administrator',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sandbox.stub(User, 'findByPk').resolves(mockUser);

      const result = await userService.getUserById('user-1');

      expect(result).to.deep.equal(mockUser);
      expect(User.findByPk.calledOnce).to.be.true;
      const callArgs = User.findByPk.getCall(0).args;
      expect(callArgs[0]).to.equal('user-1');
      expect(callArgs[1]).to.have.property('attributes');
    });

    it('should return null when user not found', async () => {
      sandbox.stub(User, 'findByPk').resolves(null);

      const result = await userService.getUserById('non-existent');

      expect(result).to.be.null;
    });
  });

  describe('createUser', () => {
    it('should create user, send email, and log audit entry in transaction', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
      };

      const mockUser = {
        id: 'user-1',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'standard user',
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        toJSON: function() {
          return {
            id: this.id,
            email: this.email,
            name: this.name,
            role: this.role,
            active: this.active,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
          };
        }
      };

      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByEmail').resolves(null);
      sandbox.stub(User, 'create').resolves(mockUser);
      sandbox.stub(AdminAuditLog, 'create').resolves({});
      sandbox.stub(emailService, 'sendUserCreatedEmail').resolves();

      const data = {
        email: 'newuser@example.com',
        name: 'New User',
        role: 'standard user',
      };

      const result = await userService.createUser(data, 'admin-1');

      expect(result).to.have.property('user');
      expect(result).to.have.property('emailSent', true);
      expect(result).to.have.property('temporaryPassword');
      expect(result.user).to.include({
        email: 'newuser@example.com',
        name: 'New User',
        role: 'standard user',
      });
      expect(User.create.calledOnce).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(emailService.sendUserCreatedEmail.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should check email uniqueness', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      const mockExistingUser = {
        id: 'user-1',
        email: 'existing@example.com',
      };

      sandbox.stub(User, 'findByEmail').resolves(mockExistingUser);

      try {
        await userService.createUser({
          email: 'existing@example.com',
          name: 'Test User',
          role: 'standard user',
        }, 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Email address already exists');
      }
    });

    it('should rollback transaction on error', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };

      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByEmail').resolves(null);
      sandbox.stub(User, 'findOne').resolves(null);
      sandbox.stub(User, 'create').rejects(new Error('Database error'));

      try {
        await userService.createUser({
          email: 'newuser@example.com',
          name: 'New User',
          role: 'standard user',
        }, 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(mockTransaction.rollback.calledOnce).to.be.true;
      }
    });
  });

  describe('updateUser', () => {
    it('should update user and log audit entry in transaction', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Original Name',
        role: 'standard user',
        active: true,
        save: sandbox.stub().resolves(),
        toJSON: function() {
          return {
            id: this.id,
            email: this.email,
            name: 'Updated Name',
            role: this.role,
            active: this.active,
          };
        }
      };

      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByPk').resolves(mockUser);
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      const result = await userService.updateUser('user-1', {
        name: 'Updated Name',
      }, 'admin-1');

      expect(mockUser.name).to.equal('Updated Name');
      expect(mockUser.save.calledOnce).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should throw error when user not found', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByPk').resolves(null);

      try {
        await userService.updateUser('non-existent', { name: 'Test' }, 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('User not found');
      }
    });

    it('should check email uniqueness when updating email', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
      };

      const mockExistingUser = {
        id: 'user-2',
        email: 'existing@example.com',
      };

      sandbox.stub(User, 'findByPk').resolves(mockUser);
      sandbox.stub(User, 'findOne').resolves(mockExistingUser);

      try {
        await userService.updateUser('user-1', {
          email: 'existing@example.com',
        }, 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Email address already exists');
      }
    });
  });

  describe('deleteUser', () => {
    it('should prevent self-deletion', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      try {
        await userService.deleteUser('admin-1', 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Cannot delete your own account');
      }
    });

    it('should prevent deletion of last administrator', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      
      const mockUser = {
        id: 'user-1',
        role: 'administrator',
        active: true,
      };

      sandbox.stub(User, 'findByPk').resolves(mockUser);
      sandbox.stub(User, 'canDeleteAdmin').resolves({ canDelete: false, reason: 'Cannot delete the last administrator' });

      try {
        await userService.deleteUser('user-1', 'admin-2');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('Cannot delete the last administrator');
      }
    });

    it('should deactivate user and log audit entry in transaction', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Test User',
        role: 'standard user',
        active: true,
        update: sandbox.stub().resolves(),
      };

      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByPk').resolves(mockUser);
      sandbox.stub(User, 'canDeleteAdmin').resolves({ canDelete: true });
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      await userService.deleteUser('user-1', 'admin-1');

      expect(mockUser.update.calledOnce).to.be.true;
      expect(mockUser.update.calledWith({ active: false })).to.be.true;
      expect(AdminAuditLog.create.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should allow deletion of standard user even if only one admin exists', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        name: 'Standard User',
        role: 'standard user',
        active: true,
        update: sandbox.stub().resolves(),
      };

      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByPk').resolves(mockUser);
      sandbox.stub(User, 'canDeleteAdmin').resolves({ canDelete: true });
      sandbox.stub(AdminAuditLog, 'create').resolves({});

      await userService.deleteUser('user-1', 'admin-1');

      expect(mockUser.update.calledOnce).to.be.true;
      expect(mockTransaction.commit.calledOnce).to.be.true;
    });

    it('should throw error when user not found', async () => {
      const mockTransaction = {
        commit: sandbox.stub().resolves(),
        rollback: sandbox.stub().resolves(),
        uuid: 'transaction-uuid-123',
      };
      sandbox.stub(sequelize, 'transaction').resolves(mockTransaction);
      sandbox.stub(User, 'findByPk').resolves(null);

      try {
        await userService.deleteUser('non-existent', 'admin-1');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error.message).to.include('User not found');
      }
    });
  });
});
