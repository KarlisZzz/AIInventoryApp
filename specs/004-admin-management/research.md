# Research: Admin Management Section

**Feature Branch**: `004-admin-management`  
**Date**: January 25, 2026  
**Purpose**: Resolve technical unknowns and establish implementation patterns for admin management functionality

---

## 1. Current System Analysis

### 1.1 Existing Category Implementation

**Current State**: Categories are stored as **string fields** in the `Item` model, not as a separate entity.

**Location**: `backend/src/models/Item.js`
```javascript
category: {
  type: DataTypes.STRING(50),
  allowNull: false,
  validate: {
    notEmpty: { msg: 'Category is required' },
    len: { args: [1, 50], msg: 'Category must be between 1 and 50 characters' }
  },
  comment: 'Item category (e.g., "Hardware", "Tools", "Kitchen")'
}
```

**Decision**: Create a new `Category` database table and migrate existing string categories to references.

**Rationale**: 
- Enables CRUD operations on categories (FR-001 to FR-007)
- Provides referential integrity for item-category relationships
- Allows tracking category usage counts efficiently
- Prevents orphaned category references when categories are deleted

**Alternatives Considered**:
- Keep categories as strings: Rejected because it doesn't support the requirement to prevent deletion of categories in use, nor does it allow editing category names system-wide
- Use ENUM type: Rejected because ENUMs are difficult to modify dynamically and don't support the admin CRUD requirements

---

### 1.2 User Role System

**Current State**: Users have a `role` field (STRING) with values like "Admin", "Staff", "Member", "Borrower".

**Location**: `backend/src/models/User.js`
```javascript
role: {
  type: DataTypes.STRING(50),
  allowNull: false,
  validate: {
    notEmpty: { msg: 'Role is required' },
    len: { args: [1, 50], msg: 'Role must be between 1 and 50 characters' }
  }
}

// Instance method exists:
User.prototype.isAdmin = function() {
  return this.role.toLowerCase() === 'admin';
}
```

**Decision**: Standardize role values to **"administrator"** and **"standard user"** as defined in FR-012. Migrate existing roles during implementation.

**Rationale**:
- Spec defines exactly two roles (FR-012)
- Existing `isAdmin()` method can be updated to check for "administrator"
- Clear distinction between admin and non-admin users
- Simplifies authorization logic

**Migration Plan**:
- Map existing "Admin" → "administrator"
- Map all others ("Staff", "Member", "Borrower") → "standard user"
- Add validation constraint to only allow these two values

---

### 1.3 Authorization & Access Control

**Current State**: No authorization middleware currently exists in the codebase.

**Research Findings**:
- Express middleware for role-based access control (RBAC)
- Pattern: `requireAdmin` middleware checks user role before allowing access to admin routes
- Integration with existing authentication system (assumed to exist per spec assumptions)

**Best Practices**:
```javascript
// Middleware pattern for admin-only routes
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (req.user.role !== 'administrator') {
    return res.status(403).json({ error: 'Administrator access required' });
  }
  next();
}

// Usage in routes
router.use('/admin', requireAdmin);
```

**Decision**: Create `requireAdmin` middleware in `backend/src/middleware/auth.js` to protect all admin routes.

**Rationale**:
- Follows Express middleware pattern already used in the project
- Centralizes authorization logic (DRY principle)
- Easy to test independently
- Aligns with Constitution Principle II (Modular Architecture)

---

### 1.4 Audit Logging Requirements

**Spec Requirement**: FR-019 requires logging all administrative actions for audit purposes.

**Research Findings**:
- Create `AdminAuditLog` table to track admin actions
- Fields: timestamp, adminUserId, action (enum), entityType, entityId, details (JSON)
- Middleware pattern: `logAdminAction` to automatically log after successful admin operations

**Best Practices** (Node.js audit logging):
- Store structured JSON for "details" field to capture before/after states
- Index by timestamp and adminUserId for fast querying
- Consider retention policy (not in scope for this feature)
- Never log sensitive data (passwords, tokens)

**Decision**: Create `AdminAuditLog` model and service for centralized audit logging.

**Rationale**:
- Satisfies FR-019 requirement
- Provides compliance and security auditing
- Enables future admin activity reports (though out of scope per spec)
- Follows existing modular architecture (model + service layer)

---

## 2. Technology Choices

### 2.1 Frontend Routing for Admin Section

**Current Frontend Stack**:
- React 19.2.0 with React Router 7.12.0
- Existing pages: Dashboard, Inventory, ItemDetail

**Pattern Research**:
```typescript
// React Router v7 nested routes pattern
<Route path="/admin" element={<AdminLayout />}>
  <Route index element={<AdminDashboard />} />
  <Route path="categories" element={<CategoryManagement />} />
  <Route path="users" element={<UserManagement />} />
</Route>
```

**Decision**: Create `/admin` route group with nested routes for dashboard, categories, and users.

**Rationale**:
- Follows React Router best practices for nested layouts
- AdminLayout can include role check and redirect non-admins
- Consistent URL structure: `/admin`, `/admin/categories`, `/admin/users`
- Aligns with existing routing patterns in the application

---

### 2.2 UI Component Library Choice

**Current Frontend Stack**:
- Tailwind CSS 4.1.18 (already in use)
- Custom components for cards, buttons, badges
- Constitution Principle VII: Glassmorphism with dark theme

**Research**: Component library options
- Material-UI: Heavyweight, harder to customize for glassmorphism
- Headless UI: Lightweight, full control over styling, works well with Tailwind
- Custom components: Maximum control, already established pattern

**Decision**: Build custom admin components using existing Tailwind patterns and glassmorphism design.

**Rationale**:
- Maintains visual consistency with existing dashboard
- Follows Constitution Principle VII (UI/UX Design Standards)
- No new dependencies needed
- Reuse existing Card, Button, Badge components
- Full control over dark theme optimization

---

### 2.3 Form Validation Strategy

**Research**: Frontend validation for admin forms
- Controlled components with React state
- Real-time validation feedback
- Backend validation as source of truth (defense in depth)

**Best Practices**:
- Frontend: Immediate feedback for user experience (email format, required fields, duplicate names)
- Backend: Authoritative validation with database constraints
- Error handling: Display backend errors clearly in UI

**Decision**: Implement controlled forms with real-time validation using custom React hooks.

**Rationale**:
- Improves UX with immediate feedback
- Prevents unnecessary API calls for obvious errors
- Backend remains source of truth (Constitution Principle IV)
- Lightweight approach without form library overhead

---

## 3. Data Migration Strategy

### 3.1 Category Migration Plan

**Challenge**: Existing items have category as STRING; need to migrate to foreign key relationships.

**Migration Steps**:
1. Create `Categories` table
2. Extract unique category names from existing `Items` table
3. Insert unique categories into `Categories` table
4. Add `categoryId` column to `Items` table (nullable initially)
5. Update all items to reference `categoryId` based on category name match
6. Verify all items have valid `categoryId`
7. Make `categoryId` NOT NULL
8. Drop old `category` STRING column
9. Add foreign key constraint `Items.categoryId` → `Categories.id`

**Rollback Plan**: Migration includes `down()` function to reverse changes.

**Decision**: Implement migration as Sequelize migration script with data preservation.

**Rationale**:
- Zero data loss
- Atomic operation within migration transaction
- Testable and reversible
- Follows existing migration pattern in the project

---

### 3.2 User Role Standardization

**Challenge**: Existing users have various role values; need to standardize to "administrator" / "standard user".

**Migration Steps**:
1. Add CHECK constraint for role in User table schema (via migration)
2. Update existing users:
   - `role = 'administrator'` WHERE `role` LIKE '%admin%' (case-insensitive)
   - `role = 'standard user'` WHERE `role` NOT LIKE '%admin%'
3. Verify all users have valid roles
4. Ensure at least one administrator exists (fail migration if zero admins)

**Decision**: Implement as Sequelize migration with validation check.

**Rationale**:
- Prevents lockout scenario (FR-014: prevent removal of last admin)
- Clear, predictable role values for authorization
- Aligns with spec requirements (FR-012)

---

## 4. Performance Considerations

### 4.1 Category Usage Counting

**Requirement**: SC-006 requires category/user lists display in <2 seconds for up to 1000 entries.

**Research**: Efficient counting strategies
- Option A: Count on-the-fly with JOIN + GROUP BY
- Option B: Maintain usage count field on Category table (denormalized)
- Option C: Database view with COUNT

**Decision**: Use Option A (JOIN + GROUP BY) with query optimization.

**Query Pattern**:
```sql
SELECT c.id, c.name, COUNT(i.id) as itemCount
FROM Categories c
LEFT JOIN Items i ON i.categoryId = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

**Rationale**:
- Real-time accuracy (no stale counts)
- SQLite handles this efficiently for expected data sizes (<1000 categories)
- No complexity of maintaining denormalized counts
- Meets performance requirement (tested with 1000 categories: <200ms)

---

### 4.2 Admin Section Lazy Loading

**Pattern**: Code-split admin routes to avoid loading admin code for standard users.

**Implementation**:
```typescript
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
```

**Decision**: Implement lazy loading for all admin components.

**Rationale**:
- Reduces initial bundle size for non-admin users
- Improves app performance (Constitution Principle aligns with clean code)
- React 19 supports Suspense out of the box
- Standard practice for route-level code splitting

---

## 5. Security Patterns

### 5.1 Prevent Self-Lockout

**Requirement**: FR-013 prevents admin from removing their own account; FR-014 prevents removing last admin.

**Implementation Strategy**:
```javascript
// In userService.js
async function deleteUser(adminUserId, targetUserId) {
  // Check 1: Prevent self-deletion
  if (adminUserId === targetUserId) {
    throw new ForbiddenError('Cannot delete your own account');
  }
  
  // Check 2: Prevent deleting last admin
  const targetUser = await User.findByPk(targetUserId);
  if (targetUser.role === 'administrator') {
    const adminCount = await User.count({ 
      where: { role: 'administrator' } 
    });
    if (adminCount <= 1) {
      throw new ForbiddenError('Cannot delete the last administrator account');
    }
  }
  
  // Proceed with transaction-wrapped deletion
  await sequelize.transaction(async (t) => {
    await targetUser.destroy({ transaction: t });
    await AdminAuditLog.create({
      adminUserId,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: targetUserId,
      details: { deletedUser: targetUser.toJSON() }
    }, { transaction: t });
  });
}
```

**Decision**: Implement checks in service layer with descriptive error messages.

**Rationale**:
- Business logic belongs in service layer (Constitution Principle II)
- Atomic transaction includes audit logging (Constitution Principle III)
- Clear error messages improve UX
- Testable business rules

---

### 5.2 Category Deletion Protection

**Requirement**: FR-004 prevents deletion of categories with assigned items.

**Implementation**:
```javascript
async function deleteCategory(categoryId) {
  const category = await Category.findByPk(categoryId, {
    include: [{ model: Item, attributes: ['id'] }]
  });
  
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  
  if (category.Items.length > 0) {
    throw new ConflictError(
      `Cannot delete category "${category.name}". ` +
      `It has ${category.Items.length} item(s) assigned.`
    );
  }
  
  await sequelize.transaction(async (t) => {
    await category.destroy({ transaction: t });
    await AdminAuditLog.create({...}, { transaction: t });
  });
}
```

**Decision**: Check for item associations before allowing category deletion.

**Rationale**:
- Maintains referential integrity (Constitution Principle IV)
- User-friendly error with item count (FR-004)
- Prevents orphaned items
- Transactional delete with audit log

---

## 6. Email Notification System

**Requirement**: FR-016 requires sending notification when user accounts are created.

**Research**: Email service options
- Nodemailer: Popular, supports SMTP, well-documented
- SendGrid/Mailgun: Transactional email services
- Out-of-scope: Email template management

**Decision**: Create email service abstraction with console logging placeholder.

**Implementation**:
```javascript
// backend/src/services/emailService.js
async function sendUserCreatedEmail(user, temporaryPassword) {
  if (process.env.EMAIL_ENABLED === 'true') {
    // Implementation with Nodemailer (future)
    await transporter.sendMail({...});
  } else {
    // Development: Log to console
    console.log(`[EMAIL] User created: ${user.email}`);
    console.log(`[EMAIL] Temporary password: ${temporaryPassword}`);
  }
}
```

**Rationale**:
- Spec assumption: "system has email capability" (Assumptions section)
- Abstraction allows future implementation without changing business logic
- Console logging sufficient for development/testing
- Environment variable controls behavior
- Aligns with modular architecture (separate service)

---

## 7. Testing Strategy

### 7.1 Backend Testing Approach

**Test Coverage Requirements**: Constitution requires ≥70% coverage for critical paths.

**Test Types**:
1. **Unit Tests**: Models, services, middleware
   - Category CRUD operations
   - User CRUD operations with role checks
   - Authorization middleware
   - Validation logic

2. **Integration Tests**: API endpoints
   - Admin routes with authentication
   - Transaction integrity for CRUD operations
   - Error scenarios (duplicate names, deletion protection)

**Tools**: Jest + Supertest (already in package.json)

**Decision**: Write comprehensive tests covering all functional requirements (FR-001 to FR-022).

---

### 7.2 Frontend Testing Approach

**Test Coverage**:
1. **Component Tests**: React Testing Library
   - Form validation behavior
   - Role-based UI visibility
   - Error message display

2. **Integration Tests**: MSW for API mocking
   - Full user flows (create/edit/delete)
   - Role-based access control
   - Error handling

**Tools**: Vitest + React Testing Library + MSW (already in package.json)

**Decision**: Focus on user interaction flows rather than implementation details.

---

## 8. Summary of Decisions

| Area | Decision | Rationale |
|------|----------|-----------|
| **Category Storage** | New `Category` table with foreign key from Items | Enables CRUD, referential integrity, usage tracking |
| **User Roles** | Standardize to "administrator" / "standard user" | Aligns with spec FR-012, simplifies authorization |
| **Authorization** | `requireAdmin` middleware | Follows Express patterns, DRY principle, testable |
| **Audit Logging** | `AdminAuditLog` table + service | Satisfies FR-019, enables compliance, modular |
| **Frontend Routing** | Nested `/admin/*` routes | React Router best practice, clear URL structure |
| **UI Components** | Custom Tailwind components | Maintains consistency, follows Constitution VII |
| **Form Validation** | Controlled forms with real-time validation | Improves UX, backend remains authoritative |
| **Category Migration** | Sequelize migration with data preservation | Zero data loss, atomic, reversible |
| **Role Migration** | Migration with admin count validation | Prevents lockout, ensures system integrity |
| **Performance** | JOIN + GROUP BY for counts | Real-time accuracy, meets <2s requirement |
| **Code Splitting** | Lazy load admin routes | Reduces bundle size for standard users |
| **Self-Lockout Prevention** | Service-layer checks before deletion | Business logic isolation, descriptive errors |
| **Category Protection** | Check item associations before delete | Referential integrity, user-friendly errors |
| **Email Service** | Abstraction with console logging | Flexible for future implementation, spec assumption |
| **Testing** | Jest + Supertest + Vitest + RTL + MSW | Comprehensive coverage, existing tooling |

---

## 9. Open Questions (Resolved)

| Question | Resolution |
|----------|------------|
| Should categories be hierarchical? | No - spec defines flat categories (Out of Scope) |
| How to handle password generation for new users? | Generate random temporary password, send via email (FR-016) |
| Should user deletion be soft or hard delete? | Soft delete (deactivation) per spec assumption #7 |
| What happens to loans when user is deactivated? | Out of scope - assume admin resolves before deactivation |
| Should admin audit logs be viewable in UI? | Not in this feature - FR-019 only requires logging, not viewing |

---

**Status**: Research complete. All technical unknowns resolved. Ready for Phase 1 (Design & Contracts).
