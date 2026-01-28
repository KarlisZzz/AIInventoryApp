/**
 * Dashboard Analytics API Tests (T072)
 * 
 * Tests for the dashboard analytics endpoint covering:
 * - Status distribution aggregation
 * - Category distribution aggregation
 * - Top borrower calculation
 * - Empty state handling
 * - Error handling
 * 
 * @see specs/003-dashboard-improvements/tasks.md (T072)
 * @see specs/003-dashboard-improvements/contracts/dashboard-analytics-api.yaml
 */

const request = require('supertest');
const { sequelize } = require('../src/config/database');
const { Item, LendingLog, User, Category, AdminAuditLog } = require('../src/models');
const app = require('../src/app');

describe('Dashboard Analytics API', () => {
  beforeAll(async () => {
    // Database already initialized by global setup
  });

  beforeEach(async () => {
    // Clean up database before each test
    // Delete in order respecting foreign key constraints
    await LendingLog.destroy({ where: {}, force: true });
    await Item.destroy({ where: {}, force: true });
    await AdminAuditLog.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
    await Category.destroy({ where: {}, force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/v1/dashboard/analytics', () => {
    it('returns 200 and analytics data structure', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data).toHaveProperty('statusDistribution');
      expect(response.body.data).toHaveProperty('categoryDistribution');
      expect(response.body.data).toHaveProperty('topBorrower');
    });

    it('returns empty distributions when no items exist', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.statusDistribution).toEqual({});
      expect(response.body.data.categoryDistribution).toEqual({});
      expect(response.body.data.topBorrower).toBeNull();
    });
  });

  describe('Status Distribution', () => {
    it('counts items by status correctly', async () => {
      // Create items with different statuses
      await Item.bulkCreate([
        { name: 'Item 1', category: 'Electronics', status: 'Available' },
        { name: 'Item 2', category: 'Electronics', status: 'Available' },
        { name: 'Item 3', category: 'Tools', status: 'Available' },
        { name: 'Item 4', category: 'Books', status: 'Lent' },
        { name: 'Item 5', category: 'Books', status: 'Lent' },
        { name: 'Item 6', category: 'Games', status: 'Maintenance' },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.statusDistribution).toEqual({
        Available: 3,
        Lent: 2,
        Maintenance: 1,
      });
    });

    it('handles single status correctly', async () => {
      await Item.bulkCreate([
        { name: 'Item 1', category: 'Tools', status: 'Available' },
        { name: 'Item 2', category: 'Tools', status: 'Available' },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.statusDistribution).toEqual({
        Available: 2,
      });
    });

    it('handles all statuses present', async () => {
      await Item.bulkCreate([
        { name: 'Item 1', category: 'A', status: 'Available' },
        { name: 'Item 2', category: 'B', status: 'Lent' },
        { name: 'Item 3', category: 'C', status: 'Maintenance' },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.statusDistribution).toEqual({
        Available: 1,
        Lent: 1,
        Maintenance: 1,
      });
    });
  });

  describe('Category Distribution', () => {
    it('counts items by category correctly', async () => {
      await Item.bulkCreate([
        { name: 'Laptop', category: 'Electronics', status: 'Available' },
        { name: 'Mouse', category: 'Electronics', status: 'Available' },
        { name: 'Keyboard', category: 'Electronics', status: 'Lent' },
        { name: 'Hammer', category: 'Tools', status: 'Available' },
        { name: 'Screwdriver', category: 'Tools', status: 'Maintenance' },
        { name: 'Book 1', category: 'Books', status: 'Available' },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.categoryDistribution).toEqual({
        Electronics: 3,
        Tools: 2,
        Books: 1,
      });
    });

    it('handles single category correctly', async () => {
      await Item.bulkCreate([
        { name: 'Item 1', category: 'Misc', status: 'Available' },
        { name: 'Item 2', category: 'Misc', status: 'Lent' },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.categoryDistribution).toEqual({
        Misc: 2,
      });
    });

    it('handles many categories', async () => {
      const categories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
      const items = categories.map((cat, i) => ({
        name: `Item ${i}`,
        category: cat,
        status: 'Available',
      }));

      await Item.bulkCreate(items);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      categories.forEach(cat => {
        expect(response.body.data.categoryDistribution[cat]).toBe(1);
      });
    });
  });

  describe('Top Borrower', () => {
    let user1, user2, user3;
    let item1, item2, item3, item4, item5;

    beforeEach(async () => {
      // Create users
      user1 = await User.create({ email: 'user1@test.com', name: 'Alice' });
      user2 = await User.create({ email: 'user2@test.com', name: 'Bob' });
      user3 = await User.create({ email: 'user3@test.com', name: 'Charlie' });

      // Create items
      item1 = await Item.create({ name: 'Item 1', category: 'A', status: 'Lent' });
      item2 = await Item.create({ name: 'Item 2', category: 'A', status: 'Lent' });
      item3 = await Item.create({ name: 'Item 3', category: 'A', status: 'Lent' });
      item4 = await Item.create({ name: 'Item 4', category: 'A', status: 'Lent' });
      item5 = await Item.create({ name: 'Item 5', category: 'A', status: 'Available' });
    });

    it('identifies borrower with most items', async () => {
      // Alice has 3 items, Bob has 1 item
      await LendingLog.bulkCreate([
        { itemId: item1.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item2.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item3.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item4.id, userId: user2.id, borrowerName: 'Bob', borrowerEmail: 'bob@test.com', dateLent: new Date(), dateReturned: null },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.topBorrower).toEqual({
        name: 'Alice',
        count: 3,
      });
    });

    it('returns null when no items are lent', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.topBorrower).toBeNull();
    });

    it('ignores returned items', async () => {
      // Alice has 2 unreturned, 1 returned
      // Bob has 1 unreturned
      await LendingLog.bulkCreate([
        { itemId: item1.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date('2024-01-01'), dateReturned: null },
        { itemId: item2.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date('2024-01-02'), dateReturned: null },
        { itemId: item3.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date('2024-01-03'), dateReturned: new Date('2024-01-10') },
        { itemId: item4.id, userId: user2.id, borrowerName: 'Bob', borrowerEmail: 'bob@test.com', dateLent: new Date('2024-01-05'), dateReturned: null },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.topBorrower).toEqual({
        name: 'Alice',
        count: 2,
      });
    });

    it('handles tie by returning one borrower', async () => {
      // Both have 2 items
      await LendingLog.bulkCreate([
        { itemId: item1.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item2.id, userId: user1.id, borrowerName: 'Alice', borrowerEmail: 'alice@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item3.id, userId: user2.id, borrowerName: 'Bob', borrowerEmail: 'bob@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: item4.id, userId: user2.id, borrowerName: 'Bob', borrowerEmail: 'bob@test.com', dateLent: new Date(), dateReturned: null },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.topBorrower).toBeTruthy();
      expect(response.body.data.topBorrower.count).toBe(2);
      expect(['Alice', 'Bob']).toContain(response.body.data.topBorrower.name);
    });

    it('handles single borrower', async () => {
      await LendingLog.create({
        itemId: item1.id,
        userId: user1.id,
        borrowerName: 'Alice',
        borrowerEmail: 'alice@test.com',
        dateLent: new Date(),
        dateReturned: null,
      });

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data.topBorrower).toEqual({
        name: 'Alice',
        count: 1,
      });
    });
  });

  describe('Combined Data', () => {
    it('returns all analytics data together', async () => {
      const user = await User.create({ email: 'user@test.com', name: 'John' });

      const items = await Item.bulkCreate([
        { name: 'Laptop', category: 'Electronics', status: 'Lent' },
        { name: 'Mouse', category: 'Electronics', status: 'Available' },
        { name: 'Book', category: 'Books', status: 'Lent' },
        { name: 'Hammer', category: 'Tools', status: 'Maintenance' },
      ]);

      await LendingLog.bulkCreate([
        { itemId: items[0].id, userId: user.id, borrowerName: 'John', borrowerEmail: 'john@test.com', dateLent: new Date(), dateReturned: null },
        { itemId: items[2].id, userId: user.id, borrowerName: 'John', borrowerEmail: 'john@test.com', dateLent: new Date(), dateReturned: null },
      ]);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      expect(response.body.data).toEqual({
        statusDistribution: {
          Lent: 2,
          Available: 1,
          Maintenance: 1,
        },
        categoryDistribution: {
          Electronics: 2,
          Books: 1,
          Tools: 1,
        },
        topBorrower: {
          name: 'John',
          count: 2,
        },
      });
    });
  });

  describe('Performance', () => {
    it('handles large dataset efficiently', async () => {
      const startTime = Date.now();

      // Create 500 items
      const items = [];
      for (let i = 0; i < 500; i++) {
        items.push({
          name: `Item ${i}`,
          category: `Category ${i % 10}`,
          status: ['Available', 'Lent', 'Maintenance'][i % 3],
        });
      }
      await Item.bulkCreate(items);

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(200);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete in under 1 second
      expect(duration).toBeLessThan(1000);

      // Verify correct counts
      expect(Object.keys(response.body.data.categoryDistribution)).toHaveLength(10);
      expect(Object.keys(response.body.data.statusDistribution).length).toBeGreaterThan(0);
    }, 10000); // 10 second timeout for this test
  });

  describe('Error Handling', () => {
    it('returns 500 on database error', async () => {
      // Mock sequelize.query to throw an error
      const originalQuery = sequelize.query.bind(sequelize);
      sequelize.query = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/v1/dashboard/analytics')
        .expect(500);

      expect(response.body).toHaveProperty('error');

      // Restore original query function
      sequelize.query = originalQuery;
    });
  });
});
