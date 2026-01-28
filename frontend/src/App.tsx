import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { ToastProvider } from './components/ToastContainer';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ItemDetail from './pages/ItemDetail';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import CategoryManagement from './pages/admin/CategoryManagement';
import UserManagement from './pages/admin/UserManagement';

/**
 * Main App Component
 * Configures React Router with all application routes
 * Wraps app in ErrorBoundary for global error handling
 * Provides Toast notifications globally (T154, T163)
 * 
 * Routes:
 * - / : Dashboard (summary and quick actions) - User Story 5
 * - /inventory : Inventory list with search and filters
 * - /inventory/:itemId : Item detail page with lending history
 * - /admin : Admin dashboard (User Story 3)
 * - /admin/categories : Admin category management (User Story 1)
 * - /admin/users : Admin user management (User Story 2)
 * 
 * @see T130, T154, T163
 */
function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          {/* Skip to main content link for accessibility (T159) */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>
          
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="inventory/:itemId" element={<ItemDetail />} />
              
              {/* 404 Not Found */}
              <Route path="*" element={
                <div className="container mx-auto px-4 py-16 text-center">
                  <h1 className="text-6xl font-bold text-slate-200 mb-4">404</h1>
                  <p className="text-xl text-slate-400 mb-8">Page not found</p>
                  <a href="/" className="btn-primary inline-block">
                    Go to Dashboard
                  </a>
                </div>
              } />
            </Route>
            
            {/* Admin Routes with AdminLayout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="users" element={<UserManagement />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
