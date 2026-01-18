# Quickstart Guide: Inventory & Lending Application

**Feature**: 001-inventory-lending  
**Last Updated**: 2026-01-18

This guide will get you up and running with the Inventory & Lending application in under 10 minutes.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: 18.x or higher ([Download](https://nodejs.org/))
- **npm**: 9.x or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **Code Editor**: VS Code recommended

**Verify installations**:
```bash
node --version   # Should be v18.x or higher
npm --version    # Should be v9.x or higher
git --version    # Any recent version
```

---

## Project Structure

```
inventory/
├── backend/          # Node.js + Express API
│   ├── src/
│   ├── data/         # SQLite database (created on first run)
│   └── package.json
├── frontend/         # React + Vite SPA
│   ├── src/
│   └── package.json
└── specs/            # Documentation (you are here)
```

---

## Setup Instructions

### Step 1: Clone Repository

```bash
# Navigate to your projects folder
cd C:\Projects\Learn\SpecKit\inventory

# If not already initialized, initialize git
git init
git checkout -b 001-inventory-lending
```

### Step 2: Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create environment file
copy .env.example .env

# Edit .env file with your preferred settings (optional)
# Default values work for local development

# Run database migrations
npm run migrate

# (Optional) Seed database with sample data
npm run seed

# Start development server
npm run dev
```

**Expected output**:
```
Server listening on port 3001
Database connected: ./data/inventory.db
Foreign key constraints: ENABLED
```

**Test the API**:
```bash
# In a new terminal
curl http://localhost:3001/api/v1/items
# Should return: {"data":[],"error":null,"message":"Items retrieved successfully"}
```

---

### Step 3: Frontend Setup

```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Create environment file
copy .env.example .env.local

# Edit .env.local if backend is on different port (optional)
# Default values work for local development

# Start development server
npm run dev
```

**Expected output**:
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open in browser**:
Navigate to [http://localhost:5173](http://localhost:5173)

You should see the Dashboard with empty state (no items yet).

---

## Verification Checklist

- [ ] Backend server running on `http://localhost:3001`
- [ ] Frontend dev server running on `http://localhost:5173`
- [ ] Database file created at `backend/data/inventory.db`
- [ ] Foreign keys enabled (check backend logs)
- [ ] API responds with envelope format `{ data, error, message }`
- [ ] Frontend loads without errors in browser console
- [ ] Dashboard page displays (even if empty)

---

## Common Issues & Solutions

### Issue: `EADDRINUSE` port already in use

**Solution**: Change port in `.env` file
```bash
# Backend .env
PORT=3002

# Restart server
npm run dev
```

### Issue: Database migration fails

**Solution**: Delete database and re-run migrations
```bash
cd backend
rm -rf data/inventory.db
npm run migrate
```

### Issue: Frontend can't connect to API

**Solution**: Check CORS and API URL
```bash
# Backend .env - ensure CORS_ORIGIN matches frontend URL
CORS_ORIGIN=http://localhost:5173

# Frontend .env.local - ensure API URL is correct
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Issue: `MODULE_NOT_FOUND` errors

**Solution**: Reinstall dependencies
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## Development Workflow

### Running Both Servers (Recommended)

**Terminal 1** (Backend):
```bash
cd backend
npm run dev
```

**Terminal 2** (Frontend):
```bash
cd frontend
npm run dev
```

### Running Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

### Linting & Formatting

```bash
# Backend
cd backend
npm run lint
npm run format

# Frontend
cd frontend
npm run lint
npm run format
```

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `DB_PATH` | `./data/inventory.db` | SQLite database file path |
| `NODE_ENV` | `development` | Environment mode |
| `API_VERSION` | `v1` | API version prefix |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |
| `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_BASE_URL` | `http://localhost:3001/api/v1` | Backend API endpoint |

---

## Next Steps

1. **Create your first item**: Use the Inventory page to add items
2. **Create users**: Use the seed script or manually insert users via SQL
3. **Test lending workflow**: 
   - Mark an item as Available
   - Click "Lend" and select a user
   - Verify item status changes to "Lent"
   - Click "Return" to complete the cycle
4. **View history**: Click "View History" on any item to see lending logs
5. **Explore dashboard**: See items currently out and summary cards

---

## API Documentation

Full API documentation available at:
- **OpenAPI Spec**: `specs/001-inventory-lending/contracts/api.yaml`
- **Postman Collection**: Import OpenAPI spec into Postman for interactive testing

---

## Support & Resources

- **Specification**: `specs/001-inventory-lending/spec.md`
- **Technical Plan**: `specs/001-inventory-lending/plan.md`
- **Tasks**: `specs/001-inventory-lending/tasks.md`
- **Data Model**: `specs/001-inventory-lending/data-model.md`
- **Constitution**: `.specify/memory/constitution.md`

---

## Troubleshooting Log

If you encounter issues, check the logs:

**Backend logs**:
```bash
cd backend
tail -f logs/app.log  # If logging to file
# Or check terminal output
```

**Frontend console**:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab for failed API calls

---

**Ready to develop?** Start with Phase 1 tasks in `tasks.md` (T001-T009) to initialize the project structure! 🚀
