import { Link, Outlet, useLocation } from 'react-router-dom';

/**
 * Layout Component
 * Provides consistent navigation and page structure across all pages
 * Applies Dark Blue/Grey theme with glassmorphism effects (T029a)
 */
const Layout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header Navigation */}
      <header className="bg-slate-800/50 border-b border-white/10 backdrop-blur-sm sticky top-0 z-40">
        <nav className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span className="text-xl font-bold text-slate-200 group-hover:text-blue-400 transition-colors">
                Inventory System
              </span>
            </Link>

            {/* Navigation Links */}
            <div className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/inventory"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/inventory') || location.pathname.startsWith('/inventory/')
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Inventory
              </Link>
              <Link
                to="/admin"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-blue-500 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                Admin
              </Link>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800/30 border-t border-white/10 py-6 mt-auto">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm text-slate-500">
            <p>
              &copy; {new Date().getFullYear()} Inventory Management System
            </p>
            <p>
              Built with React + TypeScript + Tailwind CSS
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
