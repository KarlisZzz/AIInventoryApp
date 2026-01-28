# Database Reset Script - Quick Reference

## Reset Database to Initial Data

**WARNING**: This will DELETE ALL existing data and restore the initial seed data.

### Quick Command

```powershell
# From the backend directory
node reset-database.js
```

or

```powershell
npm run reset
```

### What It Does

1. ✓ Clears all lending logs
2. ✓ Clears all items
3. ✓ Clears all users
4. ✓ Recreates 5 sample users
5. ✓ Recreates 10 sample items (various categories and statuses)
6. ✓ Creates active lending logs for "Lent" items
7. ✓ Creates historical lending logs for testing

### Initial Data Summary

**Users (5)**:
- Alice Johnson (Developer)
- Bob Smith (Designer)
- Carol Williams (Project Manager)
- David Brown (QA Engineer)
- Eve Davis (DevOps Engineer)

**Items (10)**:
- 6 Available items
- 3 Lent items (with active lending logs)
- 1 Maintenance item

**Lending History**:
- 3 active loans (items currently lent out)
- 3 returned items (historical lending logs)

### Example Output

```
🌱 Starting database seed...

📦 Clearing existing data...
✅ Existing data cleared

👥 Creating users...
✅ Created 5 users

📦 Creating items...
✅ Created 10 items

📝 Creating lending logs...
✅ Created 3 lending logs

📜 Creating historical lending logs...
✅ Created 3 historical lending logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉 Database seeded successfully!

Summary:
  • 5 users created
  • 10 items created
    - 6 Available
    - 3 Lent
    - 1 Maintenance
  • 6 lending logs created
    - 3 active loans
    - 3 returned items (history)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Adding to package.json

Add this to your `scripts` section in `package.json`:

```json
"reset": "node reset-database.js"
```

Then you can run:
```powershell
npm run reset
```
