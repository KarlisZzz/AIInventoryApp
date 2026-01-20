import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import ItemDetail from './pages/ItemDetail';

/**
 * Main App Component
 * Configures React Router with all application routes
 * Wraps app in ErrorBoundary for global error handling
 * 
 * Routes:
 * - / : Dashboard (summary and quick actions) - User Story 5
 * - /inventory : Inventory list with search and filters
 * - /inventory/:itemId : Item detail page with lending history
 * 
 * @see T130
 */
function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
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
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
