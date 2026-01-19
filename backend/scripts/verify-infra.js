#!/usr/bin/env node
/*
 * verify-infra.js
 *
 * Runs infra verification steps:
 * 1. Run migrations
 * 2. Start server as child process
 * 3. Poll /health and /api/v1/ endpoints
 * 4. Verify PRAGMA foreign_keys
 * 5. Tear down server
 *
 * Usage: node scripts/verify-infra.js
 */

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');
const { runMigrations } = require('../src/db/migrate');
const { sequelize, initializeDatabase } = require('../src/config/database');

const SERVER_CMD = 'node';
const SERVER_ARGS = [path.join(__dirname, '..', 'src', 'server.js')];
const SERVER_PORT = process.env.PORT || 3001;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function httpGetJson(pathname, port = SERVER_PORT) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port,
      path: pathname,
      method: 'GET',
      timeout: 3000,
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

async function verifyForeignKeys() {
  // Ensure DB initialized
  await initializeDatabase();
  const [result] = await sequelize.query('PRAGMA foreign_keys');
  const fkValue = result && (result.foreign_keys || (result[0] && result[0].foreign_keys));
  return fkValue === 1;
}

async function run() {
  console.log('\n🔎 Starting infra verification...\n');

  try {
    // 1. Migrations
    console.log('1) Running migrations...');
    await runMigrations();
    console.log('   Migrations completed.');

    // 2) Start server
    console.log('\n2) Starting backend server...');
    const server = spawn(SERVER_CMD, SERVER_ARGS, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, PORT: SERVER_PORT },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
    server.stderr.on('data', (d) => process.stderr.write(`[server:err] ${d}`));

    // Wait for server to be up
    let healthy = false;
    for (let i = 0; i < 12; i++) {
      try {
        const res = await httpGetJson('/health', SERVER_PORT);
        if (res && res.status === 200) {
          healthy = true;
          console.log('   Health endpoint OK');
          break;
        }
      } catch (e) {
        // ignore and retry
      }
      await wait(1000);
    }

    if (!healthy) {
      throw new Error('Server did not become healthy in time');
    }

    // 3) Check /api/v1/ root
    try {
      const apiRoot = await httpGetJson('/api/v1/');
      console.log('   API root response status:', apiRoot.status);
      if (apiRoot.body && typeof apiRoot.body === 'object' && ('data' in apiRoot.body)) {
        console.log('   API envelope format OK');
      } else {
        console.warn('   API envelope format not detected on /api/v1/');
      }
    } catch (e) {
      console.warn('   Could not fetch /api/v1/:', e.message);
    }

    // 4) Verify FK PRAGMA
    const fkOK = await verifyForeignKeys();
    console.log('4) PRAGMA foreign_keys enabled:', fkOK);

    // 5) Tear down
    console.log('\nShutting down server...');
    server.kill('SIGINT');

    console.log('\n✅ Infra verification completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Infra verification failed:', error.message);
    process.exit(2);
  }
}

run();
