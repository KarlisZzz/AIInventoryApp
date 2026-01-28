/**
 * Integration tests for admin endpoints
 * Tests authentication, authorization, and CRUD operations for categories and users
 */

const request = require('supertest');
const app = require('../../src/app');
const { User, Category, Item, AdminAuditLog, sequelize } = require('../../src/models');

describe('Admin Category Endpoints', () => {
  let adminUser;
  let standardUser;
  let testCategory;

  beforeAll(async () => {
    // Database already initialized by global setup
    
    // Create test users
    adminUser = await User.create({
      email: 'admin@test.com',
      name: 'Admin User',
      role: 'administrator',
      active: true,
    });

    standardUser = await User.create({
      email: 'user@test.com',
      name: 'Standard User',
      role: 'standard user',
      active: true,
    });
  });

  beforeEach(async () => {
    // Clean up audit logs and categories before each test
    await AdminAuditLog.destroy({ where: {}, truncate: true });
    await Category.destroy({ where: {}, truncate: true, cascade: false });
  });

  describe('GET /api/v1/admin/categories', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('X-User-Id', standardUser.id)
        .expect(403);

      expect(res.body.message).toContain('administrator');
    });

    it('should return empty array when no categories exist', async () => {
      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should return all categories with item counts', async () => {
      // Create test categories
      const cat1 = await Category.create({ name: 'Electronics' });
      const cat2 = await Category.create({ name: 'Books' });

      // Create test items
      await Item.create({
        name: 'Laptop',
        description: 'Test laptop',
        categoryId: cat1.id,
      });
      await Item.create({
        name: 'Book',
        description: 'Test book',
        categoryId: cat2.id,
      });

      const res = await request(app)
        .get('/api/v1/admin/categories')
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0]).toHaveProperty('itemCount');
    });
  });

  describe('POST /api/v1/admin/categories', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .post('/api/v1/admin/categories')
        .send({ name: 'Test Category' })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post('/api/v1/admin/categories')
        .set('X-User-Id', standardUser.id)
        .send({ name: 'Test Category' })
        .expect(403);
    });

    it('should create a new category', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Electronics' })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Electronics');

      // Verify in database
      const category = await Category.findByPk(res.body.data.id);
      expect(category).toBeDefined();
      expect(category.name).toBe('Electronics');
    });

    it('should return 400 for missing name', async () => {
      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('X-User-Id', adminUser.id)
        .send({})
        .expect(400);

      expect(res.body.message).toContain('required');
    });

    it('should return 400 for duplicate category name', async () => {
      await Category.create({ name: 'Electronics' });

      const res = await request(app)
        .post('/api/v1/admin/categories')
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Electronics' })
        .expect(400);

      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/v1/admin/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({ name: 'Electronics' });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get(`/api/v1/admin/categories/${testCategory.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', standardUser.id)
        .expect(403);
    });

    it('should return category by id', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data.id).toBe(testCategory.id);
      expect(res.body.data.name).toBe('Electronics');
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .get('/api/v1/admin/categories/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .expect(404);
    });
  });

  describe('PUT /api/v1/admin/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({ name: 'Electronics' });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .put(`/api/v1/admin/categories/${testCategory.id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .put(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', standardUser.id)
        .send({ name: 'Updated' })
        .expect(403);
    });

    it('should update category name', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Electronic Devices' })
        .expect(200);

      expect(res.body.data.name).toBe('Electronic Devices');

      // Verify in database
      await testCategory.reload();
      expect(testCategory.name).toBe('Electronic Devices');
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .put('/api/v1/admin/categories/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should return 400 for duplicate name', async () => {
      await Category.create({ name: 'Books' });

      const res = await request(app)
        .put(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Books' })
        .expect(400);

      expect(res.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/v1/admin/categories/:id', () => {
    beforeEach(async () => {
      testCategory = await Category.create({ name: 'Electronics' });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .delete(`/api/v1/admin/categories/${testCategory.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .delete(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', standardUser.id)
        .expect(403);
    });

    it('should delete category with no items', async () => {
      await request(app)
        .delete(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(200);

      // Verify deletion
      const category = await Category.findByPk(testCategory.id);
      expect(category).toBeNull();
    });

    it('should return 404 for non-existent category', async () => {
      await request(app)
        .delete('/api/v1/admin/categories/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .expect(404);
    });

    it('should return 400 when category has assigned items', async () => {
      // Create an item with this category
      await Item.create({
        name: 'Laptop',
        description: 'Test laptop',
        categoryId: testCategory.id,
      });

      const res = await request(app)
        .delete(`/api/v1/admin/categories/${testCategory.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(400);

      expect(res.body.message).toContain('Cannot delete');
      expect(res.body.message).toContain('items');

      // Verify category still exists
      const category = await Category.findByPk(testCategory.id);
      expect(category).toBeDefined();
    });
  });
});

describe('Admin User Endpoints', () => {
  let adminUser;
  let adminUser2;
  let standardUser;
  let testUser;

  beforeAll(async () => {
    // Reuse existing database (already synced by previous test suite)
    
    // Get existing users from first test suite
    adminUser = await User.findOne({ where: { email: 'admin@test.com' } });
    standardUser = await User.findOne({ where: { email: 'user@test.com' } });
    
    // Create additional test user for this suite only if it doesn't exist
    adminUser2 = await User.findOne({ where: { email: 'admin2@test.com' } });
    if (!adminUser2) {
      adminUser2 = await User.create({
        email: 'admin2@test.com',
        name: 'Admin User 2',
        role: 'administrator',
        active: true,
      });
    }
  });

  beforeEach(async () => {
    // Clean up test users created during tests
    await User.destroy({ 
      where: { 
        email: {
          [require('sequelize').Op.notIn]: ['admin@test.com', 'admin2@test.com', 'user@test.com']
        }
      } 
    });
  });

  afterAll(async () => {
    // Clean up - connection closed by global teardown
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return 401 for unauthenticated requests', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .expect(401);

      expect(res.body.error).toBeDefined();
    });

    it('should return 403 for non-admin users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('X-User-Id', standardUser.id)
        .expect(403);

      expect(res.body.message).toContain('administrator');
    });

    it('should return all users', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users')
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
      expect(res.body.data[0]).not.toHaveProperty('password');
    });

    it('should filter users by role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/users?role=administrator')
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.every(u => u.role === 'administrator')).toBe(true);
    });
  });

  describe('POST /api/v1/admin/users', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .post('/api/v1/admin/users')
        .send({ name: 'Test User', email: 'test@test.com', role: 'standard user' })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .post('/api/v1/admin/users')
        .set('X-User-Id', standardUser.id)
        .send({ name: 'Test User', email: 'test@test.com', role: 'standard user' })
        .expect(403);
    });

    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'New User',
          email: 'newuser@test.com',
          role: 'standard user',
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data.name).toBe('New User');
      expect(res.body.data.role).toBe('standard user');
      expect(res.body.data).not.toHaveProperty('password');

      // Verify in database
      const user = await User.findByPk(res.body.data.id);
      expect(user).toBeDefined();
      expect(user.email).toBe('newuser@test.com');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Test User' })
        .expect(400);

      expect(res.body.error).toContain('required');
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/v1/admin/users')
        .set('X-User-Id', adminUser.id)
        .send({
          name: 'Duplicate User',
          email: 'admin@test.com',
          role: 'standard user',
        })
        .expect(400);

      expect(res.body.message).toContain('already');
      expect(res.body.message).toContain('exists');
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get(`/api/v1/admin/users/${standardUser.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .get(`/api/v1/admin/users/${standardUser.id}`)
        .set('X-User-Id', standardUser.id)
        .expect(403);
    });

    it('should return user by id', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/users/${standardUser.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(200);

      expect(res.body.data.id).toBe(standardUser.id);
      expect(res.body.data.email).toBe('user@test.com');
      expect(res.body.data).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .get('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .expect(404);
    });
  });

  describe('PUT /api/v1/admin/users/:id', () => {
    beforeEach(async () => {
      testUser = await User.create({
        email: 'testupdate@test.com',
        name: 'Test Update User',
        role: 'standard user',
        active: true,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .put(`/api/v1/admin/users/${testUser.id}`)
        .send({ name: 'Updated' })
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .put(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', standardUser.id)
        .send({ name: 'Updated' })
        .expect(403);
    });

    it('should update user name', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Updated Name' })
        .expect(200);

      expect(res.body.data.name).toBe('Updated Name');

      // Verify in database
      await testUser.reload();
      expect(testUser.name).toBe('Updated Name');
    });

    it('should update user role', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', adminUser.id)
        .send({ role: 'administrator' })
        .expect(200);

      expect(res.body.data.role).toBe('administrator');

      // Verify in database
      await testUser.reload();
      expect(testUser.role).toBe('administrator');
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .put('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .send({ name: 'Updated' })
        .expect(404);
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .put(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', adminUser.id)
        .send({ email: 'admin@test.com' })
        .expect(400);

      expect(res.body.message).toContain('already');
      expect(res.body.message).toContain('exists');
    });
  });

  describe('DELETE /api/v1/admin/users/:id', () => {
    beforeEach(async () => {
      testUser = await User.create({
        email: 'testdelete@test.com',
        name: 'Test Delete User',
        role: 'standard user',
        active: true,
      });
    });

    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .delete(`/api/v1/admin/users/${testUser.id}`)
        .expect(401);
    });

    it('should return 403 for non-admin users', async () => {
      await request(app)
        .delete(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', standardUser.id)
        .expect(403);
    });

    it('should deactivate user (set active = false)', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(200);

      // Verify user is deactivated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.active).toBe(false);
    });

    it('should return 404 for non-existent user', async () => {
      await request(app)
        .delete('/api/v1/admin/users/00000000-0000-0000-0000-000000000000')
        .set('X-User-Id', adminUser.id)
        .expect(404);
    });

    it('should return 400 for self-deletion attempt', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${adminUser.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(400);

      expect(res.body.message).toContain('Cannot delete your own account');
    });

    it('should return 400 when trying to delete last administrator', async () => {
      // First, deactivate adminUser2
      await adminUser2.update({ active: false });

      const res = await request(app)
        .delete(`/api/v1/admin/users/${adminUser.id}`)
        .set('X-User-Id', adminUser2.id)
        .expect(400);

      expect(res.body.message).toContain('last');
      expect(res.body.message).toContain('administrator');

      // Reactivate adminUser2 for other tests
      await adminUser2.update({ active: true });
    });

    it('should allow deletion of standard user even if only one admin exists', async () => {
      // Deactivate adminUser2
      await adminUser2.update({ active: false });

      await request(app)
        .delete(`/api/v1/admin/users/${testUser.id}`)
        .set('X-User-Id', adminUser.id)
        .expect(200);

      // Verify user is deactivated
      const updatedUser = await User.findByPk(testUser.id);
      expect(updatedUser.active).toBe(false);

      // Reactivate adminUser2 for other tests
      await adminUser2.update({ active: true });
    });
  });
});
