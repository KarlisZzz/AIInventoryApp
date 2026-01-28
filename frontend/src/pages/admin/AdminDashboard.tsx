/**
 * AdminDashboard Component
 * 
 * Main admin dashboard showing system statistics and recent admin actions
 * Provides quick navigation to category and user management pages
 * 
 * Features:
 * - Statistics cards (users, categories, administrators)
 * - Recent admin actions list
 * - Quick action links
 * - Real-time data with React Query
 * 
 * @see specs/004-admin-management/spec.md (User Story 3 - Admin Dashboard)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  UsersIcon,
  FolderIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { getAdminDashboard } from '../../services/adminApi';
import { StatCardSkeleton, CardSkeleton } from '../../components/admin/SkeletonLoader';
import type { AdminDashboardData, AuditLogSummary } from '../../types/admin';

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconColor: string;
  iconBgColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, iconColor, iconBgColor }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`${iconBgColor} rounded-full p-3`}>
        <Icon className={`h-6 w-6 ${iconColor}`} />
      </div>
    </div>
  </div>
);

/**
 * Quick Action Card Component
 */
interface QuickActionProps {
  title: string;
  description: string;
  to: string;
  icon: React.ElementType;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ title, description, to, icon: Icon }) => (
  <Link
    to={to}
    className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all group"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-3 mb-2">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <ArrowRightIcon className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
    </div>
  </Link>
);

/**
 * Recent Action Item Component
 */
interface RecentActionItemProps {
  action: AuditLogSummary;
}

const RecentActionItem: React.FC<RecentActionItemProps> = ({ action }) => {
  // Format action text
  const getActionText = () => {
    const actionMap: Record<string, string> = {
      CREATE_CATEGORY: 'created category',
      UPDATE_CATEGORY: 'updated category',
      DELETE_CATEGORY: 'deleted category',
      CREATE_USER: 'created user',
      UPDATE_USER: 'updated user',
      DELETE_USER: 'deleted user',
    };
    return actionMap[action.action] || action.action;
  };

  // Format timestamp
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-start space-x-3 py-3 border-b border-gray-100 last:border-0">
      <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">
          <span className="font-medium">{action.admin?.name || 'Unknown'}</span>
          {' '}
          <span className="text-gray-600">{getActionText()}</span>
          {' '}
          <span className="font-medium text-gray-700">{action.entityType}</span>
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {formatTimestamp(action.timestamp)}
        </p>
      </div>
    </div>
  );
};

/**
 * AdminDashboard Component
 */
const AdminDashboard: React.FC = () => {
  // Fetch dashboard data
  const { data, isLoading, error } = useQuery<AdminDashboardData>({
    queryKey: ['adminDashboard'],
    queryFn: getAdminDashboard,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Overview of system statistics and recent administrative actions
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Actions</h2>
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Failed to load dashboard data</p>
        <p className="text-red-600 text-sm mt-1">
          {error instanceof Error ? error.message : 'Unknown error'}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Overview of system statistics and recent administrative actions
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total Users"
          value={data.totalUsers}
          icon={UsersIcon}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Categories"
          value={data.totalCategories}
          icon={FolderIcon}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Administrators"
          value={data.totalAdministrators}
          icon={ShieldCheckIcon}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <QuickActionCard
            title="Manage Categories"
            description="Create, edit, and organize item categories"
            to="/admin/categories"
            icon={FolderIcon}
          />
          <QuickActionCard
            title="Manage Users"
            description="Create and manage user accounts and roles"
            to="/admin/users"
            icon={UsersIcon}
          />
        </div>
      </div>

      {/* Recent Actions */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Actions</h2>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {data.recentActions.length === 0 ? (
            <div className="text-center py-8">
              <ClockIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No recent actions</p>
              <p className="text-sm text-gray-500 mt-1">
                Administrative actions will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              {data.recentActions.map((action) => (
                <RecentActionItem key={action.id} action={action} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
