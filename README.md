# Inventory & Lending Application

> A full-stack web application for managing physical inventory items with a lending workflow. Track items, lend equipment to users, and maintain complete audit trails.

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-ISC-blue.svg)](LICENSE)
[![Constitution](https://img.shields.io/badge/architecture-constitutional-purple)](.specify/memory/constitution.md)

---

## 🎯 Features

- **Item Management**: Create, edit, delete, and search inventory items
- **Lending Workflow**: Atomic lend/return operations with transaction integrity
- **Audit Trail**: Complete history of all lending transactions with denormalized user data
- **Dashboard**: Real-time overview of available items, items lent, and maintenance status
- **Dark Theme UI**: Professional glassmorphism design with high-contrast colors
- **RESTful API**: Versioned API with consistent response envelope

---

## 🏗️ Architecture

**Tech Stack:**
- **Backend**: Node.js 18+, Express 4.x, Sequelize 6.x, SQLite 3.x
- **Frontend**: React 18+, TypeScript, Vite 5.x, TanStack Query, Tailwind CSS
- **Testing**: Jest, Vitest, React Testing Library, MSW

**Design Principles:**
- Modular architecture (routes → controllers → services → models)
- Atomic transactions for all state-changing operations (Constitution Principle III)
- Component-based UI with React hooks only
- RESTful API with `/api/v1/` versioning

📖 **Full documentation**: [Project Constitution](.specify/memory/constitution.md)

---

## 📦 Project Structure

```
inventory/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── models/       # Sequelize models (Item, User, LendingLog)
│   │   ├── services/     # Business logic & transactions
│   │   ├── controllers/  # Request handlers
│   │   ├── routes/       # API endpoints
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── db/           # Migrations & seeds
│   │   └── server.js     # App entry point
│   └── package.json
│
├── frontend/             # React + TypeScript SPA
│   ├── src/
│   │   ├── api/          # Axios client
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # React Query hooks
│   │   └── main.tsx      # App entry point
│   └── package.json
│
└── specs/                # Feature specifications
    └── 001-inventory-lending/
        ├── spec.md           # Requirements (30 FRs, 10 SCs)
        ├── plan.md           # Technical implementation plan
        ├── tasks.md          # 185 atomic tasks
        ├── data-model.md     # Database schema & migrations
        ├── contracts/        # OpenAPI 3.0 spec
        ├── quickstart.md     # Setup guide (start here!)
        └── frontend-plan.md  # React architecture
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Git**: Latest version

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd inventory
   ```

2. **Backend Setup**:
   ```bash
   cd backend
   npm install
   copy .env.example .env
   npm run migrate
   npm run seed        # Optional: Add sample data
   npm run dev         # Start on http://localhost:3001
   ```

3. **Frontend Setup** (in a new terminal):
   ```bash
   cd frontend
   npm install
   copy .env.example .env.local
   npm run dev         # Start on http://localhost:5173
   ```

4. **Open in browser**: [http://localhost:5173](http://localhost:5173)

📖 **Detailed setup instructions**: [quickstart.md](specs/001-inventory-lending/quickstart.md)

---

## 📝 Environment Variables

### Backend (`.env`)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Database Configuration
# ⚠️ SECURITY: Store database file outside web root
DB_PATH=./data/inventory.db

# Security Configuration (Production)
# ENABLE_RATE_LIMITING=true
# ENABLE_CSRF_PROTECTION=true
# ENABLE_XSS_SANITIZATION=true
# MAX_REQUESTS_PER_MINUTE=100

# Optional: JWT secret for future authentication
# JWT_SECRET=<generate-secure-random-string>
```

**Security Best Practices**:
- **Database Location**: Store `DB_PATH` outside the web-accessible directory
- **File Permissions**: Ensure database file has restricted permissions (600 or 644)
- **Environment Files**: Never commit `.env` files to version control
- **Production**: Enable all security middleware in production environment

### Frontend (`.env.local`)

```bash
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

---

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

---

## 📚 API Documentation

**Base URL**: `http://localhost:3001/api/v1`

**Response Format**: All endpoints return:
```json
{
  "data": <payload>,
  "error": null | <error_object>,
  "message": "Success message"
}
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/items` | List all items |
| `POST` | `/items` | Create new item |
| `GET` | `/items/:id` | Get item details |
| `PUT` | `/items/:id` | Update item |
| `DELETE` | `/items/:id` | Delete item (if no history) |
| `POST` | `/items/:id/lend` | Lend item to user |
| `POST` | `/items/:id/return` | Return item |
| `GET` | `/items/:id/history` | Get lending history |
| `GET` | `/users` | List users (selection only) |
| `GET` | `/dashboard` | Dashboard summary |

📖 **Full API spec**: [contracts/api.yaml](specs/001-inventory-lending/contracts/api.yaml)

---

## 🎨 Design System

**Color Palette** (Constitution Principle VII):
- **Background**: `#0F172A` (Slate-900)
- **Surfaces**: `#1E293B` (Slate-800)
- **Primary**: `#3B82F6` (Blue-500)
- **Text**: `#94A3B8` (Slate-400)
- **Success**: `#10B981` (Green-500)
- **Warning**: `#F59E0B` (Amber-500)

**Glassmorphism Cards**: `bg-white/5 border-white/10 backdrop-blur-sm`

---

## 🏁 Development Workflow

### Running Both Servers

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

### Database Operations

```bash
cd backend
npm run migrate    # Run migrations
npm run seed       # Seed sample data
```

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Constitution](.specify/memory/constitution.md) | Core principles & tech stack |
| [Specification](specs/001-inventory-lending/spec.md) | Requirements & user stories |
| [Technical Plan](specs/001-inventory-lending/plan.md) | Architecture & decisions |
| [Tasks](specs/001-inventory-lending/tasks.md) | 185 implementation tasks |
| [Data Model](specs/001-inventory-lending/data-model.md) | Database schema |
| [Quickstart](specs/001-inventory-lending/quickstart.md) | Setup guide |
| [Frontend Plan](specs/001-inventory-lending/frontend-plan.md) | React architecture |

---

## 🤝 Contributing

1. Follow the [Constitution](.specify/memory/constitution.md) principles
2. Work from the [Tasks](specs/001-inventory-lending/tasks.md) list
3. All code must pass linting (`npm run lint`)
4. Write tests for new features
5. Use atomic git commits with descriptive messages

---

## 📋 Success Criteria

- ✅ **SC-001**: Item CRUD operations complete in <30s
- ✅ **SC-002**: Lending operation complete in <45s
- ✅ **SC-004**: Dashboard loads within 2 seconds
- ✅ **SC-005**: Search results appear within 1 second
- ✅ **SC-006**: 100% transaction atomicity (no partial updates)
- ✅ **SC-010**: Zero data integrity violations

---

## 📄 License

ISC License - see [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

Built following constitutional software development principles with:
- Modular architecture (Principle II)
- Atomic transaction integrity (Principle III)
- Clean code & async operations (Principle V)
- Component-based UI (Principle VI)
- Professional UX design (Principle VII)

---

**Version**: 1.0.0 | **Last Updated**: 2026-01-18

🚀 **Ready to develop?** Start with [quickstart.md](specs/001-inventory-lending/quickstart.md)
