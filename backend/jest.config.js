module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js', // Exclude server entry point
    '!**/node_modules/**'
  ],
  coverageReporters: ['text', 'lcov', 'html', 'clover'],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  globalSetup: '<rootDir>/tests/globalSetup.js',
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testTimeout: 10000,
  maxWorkers: 1 // Run tests serially to avoid database conflicts
};
