/**
 * Performance Benchmark Suite
 * 
 * Tests performance requirements:
 * - SC-004: Dashboard load time < 2 seconds (FR-035)
 * - SC-005: Search response time < 1 second (FR-035)
 * 
 * Runs against representative dataset per FR-036
 * 
 * Usage: node backend/tests/performance/benchmark.js
 */

const axios = require('axios');

// Configuration
const CONFIG = {
  BASE_URL: process.env.API_URL || 'http://localhost:3001',
  API_PREFIX: '/api/v1',
  DASHBOARD_THRESHOLD_MS: 2000, // SC-004: 2 seconds
  SEARCH_THRESHOLD_MS: 1000,    // SC-005: 1 second
  WARMUP_REQUESTS: 3,            // Number of warmup requests before measurement
  TEST_ITERATIONS: 10,           // Number of test runs per endpoint
};

// Test results storage
const results = {
  dashboard: [],
  search: [],
  itemsList: [],
  lendingHistory: [],
};

/**
 * Measure response time for an HTTP request
 */
async function measureRequest(url, options = {}) {
  const startTime = Date.now();
  
  try {
    const response = await axios.get(url, {
      ...options,
      timeout: 5000,
    });
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: true,
      duration,
      status: response.status,
      dataSize: JSON.stringify(response.data).length,
    };
  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    return {
      success: false,
      duration,
      error: error.message,
    };
  }
}

/**
 * Run warmup requests (not counted in results)
 */
async function warmup(url, count = CONFIG.WARMUP_REQUESTS) {
  console.log(`  Running ${count} warmup requests...`);
  
  for (let i = 0; i < count; i++) {
    await measureRequest(url);
    // Small delay between warmup requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

/**
 * Test dashboard load time (SC-004: < 2 seconds)
 */
async function testDashboardLoad() {
  console.log('\n📊 Testing Dashboard Load Time (SC-004: < 2s)');
  console.log('='.repeat(50));
  
  const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/dashboard`;
  
  await warmup(url);
  
  console.log(`  Running ${CONFIG.TEST_ITERATIONS} test iterations...`);
  
  for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
    const result = await measureRequest(url);
    results.dashboard.push(result);
    
    process.stdout.write(`  [${i + 1}/${CONFIG.TEST_ITERATIONS}] ${result.duration}ms `);
    
    if (result.success) {
      if (result.duration < CONFIG.DASHBOARD_THRESHOLD_MS) {
        process.stdout.write('✓\n');
      } else {
        process.stdout.write('✗ (exceeded threshold)\n');
      }
    } else {
      process.stdout.write('✗ (failed)\n');
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Test search response time (SC-005: < 1 second)
 */
async function testSearchResponse() {
  console.log('\n🔍 Testing Search Response Time (SC-005: < 1s)');
  console.log('='.repeat(50));
  
  // Test various search queries
  const searchQueries = [
    'Laptop',      // Common prefix
    'Electronics', // Category
    'Test',        // Generic term
    'Monitor 1',   // Specific item
    'xyz',         // Rare/no results
  ];
  
  for (const query of searchQueries) {
    const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/items?search=${encodeURIComponent(query)}`;
    
    console.log(`\n  Query: "${query}"`);
    await warmup(url, 2);
    
    console.log(`  Running ${CONFIG.TEST_ITERATIONS} test iterations...`);
    
    const queryResults = [];
    
    for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
      const result = await measureRequest(url);
      queryResults.push(result);
      results.search.push({ ...result, query });
      
      process.stdout.write(`  [${i + 1}/${CONFIG.TEST_ITERATIONS}] ${result.duration}ms `);
      
      if (result.success) {
        if (result.duration < CONFIG.SEARCH_THRESHOLD_MS) {
          process.stdout.write('✓\n');
        } else {
          process.stdout.write('✗ (exceeded threshold)\n');
        }
      } else {
        process.stdout.write('✗ (failed)\n');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Calculate average for this query
    const avgDuration = queryResults.reduce((sum, r) => sum + r.duration, 0) / queryResults.length;
    console.log(`  Average: ${avgDuration.toFixed(2)}ms`);
  }
}

/**
 * Test items list endpoint
 */
async function testItemsList() {
  console.log('\n📋 Testing Items List Endpoint');
  console.log('='.repeat(50));
  
  const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/items`;
  
  await warmup(url);
  
  console.log(`  Running ${CONFIG.TEST_ITERATIONS} test iterations...`);
  
  for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
    const result = await measureRequest(url);
    results.itemsList.push(result);
    
    console.log(`  [${i + 1}/${CONFIG.TEST_ITERATIONS}] ${result.duration}ms ${result.success ? '✓' : '✗'}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Test lending history endpoint
 */
async function testLendingHistory() {
  console.log('\n📜 Testing Lending History Endpoint');
  console.log('='.repeat(50));
  
  // First, get a sample item ID
  const itemsUrl = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/items?limit=1`;
  const itemsResponse = await axios.get(itemsUrl);
  
  if (!itemsResponse.data.data || itemsResponse.data.data.length === 0) {
    console.log('  ⚠️  No items found, skipping history test');
    return;
  }
  
  const sampleItemId = itemsResponse.data.data[0].ItemID;
  const url = `${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/lending/history/${sampleItemId}`;
  
  await warmup(url);
  
  console.log(`  Running ${CONFIG.TEST_ITERATIONS} test iterations...`);
  
  for (let i = 0; i < CONFIG.TEST_ITERATIONS; i++) {
    const result = await measureRequest(url);
    results.lendingHistory.push(result);
    
    console.log(`  [${i + 1}/${CONFIG.TEST_ITERATIONS}] ${result.duration}ms ${result.success ? '✓' : '✗'}`);
    
    await new Promise(resolve => setTimeout(resolve, 200));
  }
}

/**
 * Calculate statistics for a result set
 */
function calculateStats(results) {
  if (results.length === 0) {
    return null;
  }
  
  const durations = results.map(r => r.duration).sort((a, b) => a - b);
  const successCount = results.filter(r => r.success).length;
  
  return {
    count: results.length,
    successRate: (successCount / results.length * 100).toFixed(2),
    min: Math.min(...durations),
    max: Math.max(...durations),
    avg: (durations.reduce((sum, d) => sum + d, 0) / durations.length).toFixed(2),
    median: durations[Math.floor(durations.length / 2)],
    p95: durations[Math.floor(durations.length * 0.95)],
    p99: durations[Math.floor(durations.length * 0.99)],
  };
}

/**
 * Display summary report
 */
function displaySummary() {
  console.log('\n' + '='.repeat(70));
  console.log('PERFORMANCE BENCHMARK SUMMARY');
  console.log('='.repeat(70));
  
  // Dashboard results
  console.log('\n📊 Dashboard Load Time (SC-004: < 2000ms)');
  console.log('-'.repeat(70));
  const dashboardStats = calculateStats(results.dashboard);
  if (dashboardStats) {
    console.log(`  Requests: ${dashboardStats.count}`);
    console.log(`  Success Rate: ${dashboardStats.successRate}%`);
    console.log(`  Min: ${dashboardStats.min}ms`);
    console.log(`  Max: ${dashboardStats.max}ms`);
    console.log(`  Average: ${dashboardStats.avg}ms`);
    console.log(`  Median: ${dashboardStats.median}ms`);
    console.log(`  95th Percentile: ${dashboardStats.p95}ms`);
    console.log(`  99th Percentile: ${dashboardStats.p99}ms`);
    
    const passed = parseFloat(dashboardStats.avg) < CONFIG.DASHBOARD_THRESHOLD_MS;
    console.log(`  Result: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
  }
  
  // Search results
  console.log('\n🔍 Search Response Time (SC-005: < 1000ms)');
  console.log('-'.repeat(70));
  const searchStats = calculateStats(results.search);
  if (searchStats) {
    console.log(`  Requests: ${searchStats.count}`);
    console.log(`  Success Rate: ${searchStats.successRate}%`);
    console.log(`  Min: ${searchStats.min}ms`);
    console.log(`  Max: ${searchStats.max}ms`);
    console.log(`  Average: ${searchStats.avg}ms`);
    console.log(`  Median: ${searchStats.median}ms`);
    console.log(`  95th Percentile: ${searchStats.p95}ms`);
    console.log(`  99th Percentile: ${searchStats.p99}ms`);
    
    const passed = parseFloat(searchStats.avg) < CONFIG.SEARCH_THRESHOLD_MS;
    console.log(`  Result: ${passed ? '✓ PASSED' : '✗ FAILED'}`);
  }
  
  // Items list results
  console.log('\n📋 Items List Endpoint');
  console.log('-'.repeat(70));
  const itemsStats = calculateStats(results.itemsList);
  if (itemsStats) {
    console.log(`  Average: ${itemsStats.avg}ms`);
    console.log(`  Median: ${itemsStats.median}ms`);
    console.log(`  Success Rate: ${itemsStats.successRate}%`);
  }
  
  // Lending history results
  console.log('\n📜 Lending History Endpoint');
  console.log('-'.repeat(70));
  const historyStats = calculateStats(results.lendingHistory);
  if (historyStats) {
    console.log(`  Average: ${historyStats.avg}ms`);
    console.log(`  Median: ${historyStats.median}ms`);
    console.log(`  Success Rate: ${historyStats.successRate}%`);
  }
  
  // Overall pass/fail
  console.log('\n' + '='.repeat(70));
  const dashboardPassed = dashboardStats && parseFloat(dashboardStats.avg) < CONFIG.DASHBOARD_THRESHOLD_MS;
  const searchPassed = searchStats && parseFloat(searchStats.avg) < CONFIG.SEARCH_THRESHOLD_MS;
  const allPassed = dashboardPassed && searchPassed;
  
  if (allPassed) {
    console.log('✓ ALL PERFORMANCE TESTS PASSED');
  } else {
    console.log('✗ SOME PERFORMANCE TESTS FAILED');
    if (!dashboardPassed) {
      console.log('  - Dashboard load time exceeded threshold');
    }
    if (!searchPassed) {
      console.log('  - Search response time exceeded threshold');
    }
  }
  console.log('='.repeat(70) + '\n');
  
  return allPassed;
}

/**
 * Main execution
 */
async function main() {
  console.log('Performance Benchmark Suite');
  console.log('Target: ' + CONFIG.BASE_URL);
  console.log('Test Iterations: ' + CONFIG.TEST_ITERATIONS);
  console.log('');
  
  try {
    // Check if server is running
    console.log('Checking server availability...');
    await axios.get(`${CONFIG.BASE_URL}${CONFIG.API_PREFIX}/items`, { timeout: 5000 });
    console.log('✓ Server is reachable\n');
    
    // Run tests
    await testDashboardLoad();
    await testSearchResponse();
    await testItemsList();
    await testLendingHistory();
    
    // Display summary
    const allPassed = displaySummary();
    
    // Exit with appropriate code
    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('\n✗ Benchmark failed:', error.message);
    console.error('\nMake sure:');
    console.error('  1. The backend server is running');
    console.error('  2. Test data has been generated (run generateTestData.js)');
    console.error('  3. The API_URL is correct');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { testDashboardLoad, testSearchResponse, calculateStats };
