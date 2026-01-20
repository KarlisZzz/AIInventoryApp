/**
 * Performance Test Runner
 * 
 * Complete performance testing workflow:
 * 1. Generate test dataset (500 items, 50 users, 1000 lending logs)
 * 2. Run performance benchmarks
 * 3. Verify all thresholds met
 * 
 * Per FR-035 to FR-038
 * 
 * Usage: node backend/tests/performance/run-tests.js
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration
const BACKEND_DIR = path.join(__dirname, '..', '..');
const SCRIPTS_DIR = path.join(BACKEND_DIR, 'src', 'scripts');
const PERF_DIR = path.join(BACKEND_DIR, 'tests', 'performance');

/**
 * Run a command and return a promise
 */
function runCommand(command, args, cwd) {
  return new Promise((resolve, reject) => {
    console.log(`\n$ ${command} ${args.join(' ')}\n`);
    
    const proc = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    
    proc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}`));
      } else {
        resolve();
      }
    });
    
    proc.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('='.repeat(70));
  console.log('PERFORMANCE TEST SUITE');
  console.log('='.repeat(70));
  
  try {
    // Step 1: Generate test dataset
    console.log('\n📝 Step 1: Generating test dataset...');
    console.log('-'.repeat(70));
    await runCommand('node', [path.join(SCRIPTS_DIR, 'generateTestData.js')], BACKEND_DIR);
    
    // Step 2: Run performance benchmarks
    console.log('\n📊 Step 2: Running performance benchmarks...');
    console.log('-'.repeat(70));
    await runCommand('node', [path.join(PERF_DIR, 'benchmark.js')], BACKEND_DIR);
    
    // Success
    console.log('\n' + '='.repeat(70));
    console.log('✓ PERFORMANCE TEST SUITE COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\nAll requirements met:');
    console.log('  ✓ FR-035: Performance benchmarking implemented');
    console.log('  ✓ FR-036: Test dataset generated (500 items, 50 users, 1000 logs)');
    console.log('  ✓ FR-037: Response time logging enabled');
    console.log('  ✓ FR-038: Automated test execution with pass/fail thresholds');
    console.log('  ✓ SC-004: Dashboard load < 2s');
    console.log('  ✓ SC-005: Search response < 1s');
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Performance test suite failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('  1. Ensure backend server is running (npm start)');
    console.error('  2. Check database connection');
    console.error('  3. Review error logs above');
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}

module.exports = { runCommand };
