/**
 * Direct Test Dashboard Logic
 */

const { User, Category, AdminAuditLog } = require('./src/models');

async function testDashboard() {
  try {
    console.log('Testing dashboard logic directly...\n');
    
    // Test each query separately
    console.log('1. Counting users...');
    const totalUsers = await User.count();
    console.log(`   ✓ Total users: ${totalUsers}`);
    
    console.log('2. Counting categories...');
    const totalCategories = await Category.count();
    console.log(`   ✓ Total categories: ${totalCategories}`);
    
    console.log('3. Counting administrators...');
    const totalAdministrators = await User.count({ where: { role: 'administrator' } });
    console.log(`   ✓ Total administrators: ${totalAdministrators}`);
    
    console.log('4. Fetching recent audit logs...');
    const recentActions = await AdminAuditLog.findAll({
      limit: 10,
      order: [['timestamp', 'DESC']],
      include: [{
        model: User,
        as: 'admin',
        attributes: ['id', 'name', 'email'],
      }],
    });
    console.log(`   ✓ Recent actions: ${recentActions.length}`);
    
    const dashboardData = {
      totalUsers,
      totalCategories,
      totalAdministrators,
      recentActions: recentActions.map(log => ({
        id: log.id,
        action: log.action,
        entityType: log.entityType,
        entityId: log.entityId,
        details: log.details,
        admin: log.admin ? {
          id: log.admin.id,
          name: log.admin.name,
          email: log.admin.email,
        } : null,
        timestamp: log.timestamp,
      })),
    };
    
    console.log('\n✓ Dashboard data assembled successfully!');
    console.log(JSON.stringify(dashboardData, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testDashboard();
