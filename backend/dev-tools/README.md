# Development Tools

This directory contains development, testing, and maintenance utilities for the backend.

## Structure

### `/database`
Database management and utility scripts:
- `check-*.js` - Database inspection and validation scripts
- `create-*.js` - Table and user creation scripts
- `fix-*.js` - Database repair and migration fix scripts
- `reset-database.js` - Complete database reset utility
- `setup-db.js` - Initial database setup
- `seed-data.js` - Sample data seeding
- `show-schema.js` - Schema visualization
- `view-items.js` - Quick data viewing utility

### `/verification`
Verification and validation scripts:
- `verify-*.js` - User story and phase verification scripts
- `verify-*.ps1` - PowerShell verification runners
- `validate-tasks.js` - Task validation utility

### `/testing`
Ad-hoc testing and debugging scripts:
- `test-*.js` - API endpoint testing scripts
- `test-*.ps1` - PowerShell test runners
- `manual-return-test.js` - Manual testing utilities
- `debug-return.log` - Debug logs

### Root Scripts
- `*.ps1` - PowerShell utilities (restart, quick-test, etc.)

## Usage

These scripts are for development use only and should not be deployed to production.

### Common Commands

```bash
# Database reset
node dev-tools/database/reset-database.js

# Seed sample data
node dev-tools/database/seed-data.js

# Verify user story implementation
node dev-tools/verification/verify-us4-complete.js

# Run specific API tests
node dev-tools/testing/test-dashboard.js
```

## Notes

- Most scripts require the backend server to be running
- Database scripts may require direct database access
- Verification scripts check against specification requirements
