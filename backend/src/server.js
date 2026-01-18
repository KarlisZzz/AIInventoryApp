/**
 * Server Entry Point
 * 
 * Starts the Express server and initializes database connection.
 * 
 * @see Constitution Principle IV - Data Integrity
 */

require('dotenv').config();
const app = require('./app');
const { getConnection } = require('./db/connection');

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

/**
 * Start the server
 */
async function startServer() {
  try {
    // Initialize database connection
    console.log('🔌 Initializing database connection...');
    await getConnection();
    console.log('✓ Database connection ready\n');
    
    // Start Express server
    const server = app.listen(PORT, HOST, () => {
      console.log('🚀 Server started successfully!');
      console.log(`   - Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - Listening on: http://${HOST}:${PORT}`);
      console.log(`   - API Version: ${process.env.API_VERSION || 'v1'}`);
      console.log(`   - Health check: http://localhost:${PORT}/health`);
      console.log(`   - API endpoint: http://localhost:${PORT}/api/v1/\n`);
    });
    
    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      server.close(async () => {
        console.log('✓ HTTP server closed');
        
        // Connection cleanup is handled by connection.js SIGINT/SIGTERM handlers
        console.log('✓ Shutdown complete');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('⚠️ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Start the server
startServer();
