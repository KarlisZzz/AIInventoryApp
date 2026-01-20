/**
 * Debug: List all registered routes in the Express app
 */

const app = require('./src/app');
const express = require('express');

// Create a temporary server to initialize routes
const server = app.listen(0, () => {
  console.log('Registered routes:');
  console.log('==================');
  
  const routes = [];
  
  app._router.stack.forEach(middleware => {
    if (middleware.route) {
      // Route
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      routes.push(`${methods} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      // Router middleware
      middleware.handle.stack.forEach(handler => {
        if (handler.route) {
          const path = middleware.regexp.source
            .replace('\\/?', '')
            .replace('(?=\\/|$)', '')
            .replace(/\\\//g, '/')
            .replace(/\\/g, '')
            .replace('^', '')
            .replace('$', '');
          const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
          routes.push(`${methods} ${path}${handler.route.path}`);
        }
      });
    }
  });
  
  routes.forEach(route => console.log(route));
  console.log(`\nTotal: ${routes.length} routes`);
  
  // Check if dashboard route is there
  const dashboardRoutes = routes.filter(r => r.includes('dashboard'));
  console.log(`\nDashboard routes found: ${dashboardRoutes.length}`);
  dashboardRoutes.forEach(route => console.log('  -', route));
  
  server.close();
  process.exit(0);
});
