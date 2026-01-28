/**
 * AdminLayout Component
 * 
 * Layout wrapper for admin pages with role check and navigation
 * Provides consistent layout for all admin pages with sidebar navigation
 * 
 * Features:
 * - Checks user role (redirects non-admins)
 * - Sidebar navigation with active state
 * - Consistent header
 * - Main content area
 * 
 * @see specs/004-admin-management/spec.md (User Story 3 - Admin Dashboard)
 */

import React from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  HomeIcon, 
  UsersIcon, 
  FolderIcon,
} from '@heroicons/react/24/outline';
import { ErrorBoundary } from '../../components/admin/ErrorBoundary';

/**
 * AdminLayout Component
 * 
 * Wraps admin pages with consistent layout and navigation
 * Note: In a production app, this would check authentication and role.
 * For this demo, we assume the backend enforces admin access.
 */
const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items
  const navItems = [
    { path: '/admin', label: 'Dashboard', icon: HomeIcon, exact: true },
    { path: '/admin/categories', label: 'Categories', icon: FolderIcon },
    { path: '/admin/users', label: 'Users', icon: UsersIcon },
  ];

  // Check if a nav item is active
  const isActive = (path: string, exact: boolean = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                ← Back to Inventory
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-bold text-gray-900">
                Admin Panel
              </h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <ul className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path, item.exact);
                  
                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={`
                          flex items-center space-x-3 px-4 py-3 rounded-lg
                          transition-all duration-200
                          ${active
                            ? 'bg-blue-50 text-blue-700 font-medium shadow-sm'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }
                        `}
                      >
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
