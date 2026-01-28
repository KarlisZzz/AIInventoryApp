/**
 * UserManagement Page
 * User Story 2: Manage User Accounts
 * Allows administrators to create, edit, and deactivate user accounts
 */

import React, { useState, useEffect } from 'react';
import { AdminCard } from '../../components/admin/AdminCard';
import { ConfirmDialog } from '../../components/admin/ConfirmDialog';
import { TableSkeleton } from '../../components/admin/SkeletonLoader';
import { UserGroupIcon, PlusIcon } from '@heroicons/react/24/outline';
import { 
  getUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../../services/adminApi';
import type { User, CreateUserRequest, UpdateUserRequest } from '../../types/admin';

/**
 * Role badge component with color coding
 */
const RoleBadge: React.FC<{ role: 'administrator' | 'standard user' }> = ({ role }) => {
  const isAdmin = role === 'administrator';
  const bgColor = isAdmin ? 'bg-blue-100' : 'bg-gray-100';
  const textColor = isAdmin ? 'text-blue-800' : 'text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {role === 'administrator' ? 'Administrator' : 'Standard User'}
    </span>
  );
};

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState<'all' | 'administrator' | 'standard user'>('all');
  
  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createData, setCreateData] = useState<CreateUserRequest>({
    email: '',
    name: '',
    role: 'standard user',
  });
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<UpdateUserRequest>({});
  const [editError, setEditError] = useState<string | null>(null);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
    userName: string;
    isSelf: boolean;
    isLastAdmin: boolean;
  }>({
    isOpen: false,
    userId: null,
    userName: '',
    isSelf: false,
    isLastAdmin: false,
  });

  // Get current user info from localStorage
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const currentUserId = currentUser.id;

  // Load users on mount
  useEffect(() => {
    loadUsers();
  }, [roleFilter]);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const filterParam = roleFilter === 'all' ? undefined : roleFilter;
      const data = await getUsers(filterParam);
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createData.email.trim() || !createData.name.trim()) {
      setCreateError('Email and name are required');
      return;
    }

    // Basic email validation
    if (!createData.email.includes('@')) {
      setCreateError('Please enter a valid email address');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError(null);
      
      await createUser(createData);
      setSuccessMessage(`User "${createData.name}" created successfully. Password sent to ${createData.email}`);
      setCreateData({ email: '', name: '', role: 'standard user' });
      setShowCreateForm(false);
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.error || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const startEdit = (user: User) => {
    setEditingId(user.id);
    setEditData({
      email: user.email,
      name: user.name,
      role: user.role,
    });
    setEditError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
    setEditError(null);
  };

  const handleEdit = async (userId: string) => {
    if (!editData.name?.trim()) {
      setEditError('Name is required');
      return;
    }

    if (editData.email && !editData.email.includes('@')) {
      setEditError('Please enter a valid email address');
      return;
    }

    try {
      setEditError(null);
      await updateUser(userId, editData);
      setSuccessMessage('User updated successfully');
      setEditingId(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const confirmDelete = (user: User) => {
    const isSelf = user.id === currentUserId;
    const adminCount = users.filter(u => u.role === 'administrator' && u.active).length;
    const isLastAdmin = user.role === 'administrator' && adminCount === 1;

    setDeleteConfirm({
      isOpen: true,
      userId: user.id,
      userName: user.name,
      isSelf,
      isLastAdmin,
    });
  };

  const handleDelete = async () => {
    if (!deleteConfirm.userId) return;

    try {
      await deleteUser(deleteConfirm.userId);
      setSuccessMessage(`User "${deleteConfirm.userName}" deactivated successfully`);
      setDeleteConfirm({ isOpen: false, userId: null, userName: '', isSelf: false, isLastAdmin: false });
      await loadUsers();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to deactivate user');
      setDeleteConfirm({ isOpen: false, userId: null, userName: '', isSelf: false, isLastAdmin: false });
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-gray-600">Create, edit, and manage user accounts</p>
        </div>
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded w-48 mb-6"></div>
        </div>
        <AdminCard title="Users">
          <TableSkeleton rows={8} cols={6} />
        </AdminCard>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="mt-2 text-gray-600">Create, edit, and manage user accounts</p>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Create User Form */}
      {!showCreateForm ? (
        <button
          onClick={() => setShowCreateForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          + Create New User
        </button>
      ) : (
        <AdminCard title="Create New User">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="userName"
                  value={createData.name}
                  onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                  placeholder="e.g., John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
              <div>
                <label htmlFor="userEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  id="userEmail"
                  value={createData.email}
                  onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                  placeholder="e.g., john.doe@example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isCreating}
                />
              </div>
            </div>
            <div>
              <label htmlFor="userRole" className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                id="userRole"
                value={createData.role}
                onChange={(e) => setCreateData({ ...createData, role: e.target.value as 'administrator' | 'standard user' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isCreating}
              >
                <option value="standard user">Standard User</option>
                <option value="administrator">Administrator</option>
              </select>
            </div>
            {createError && (
              <p className="text-sm text-red-600">{createError}</p>
            )}
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isCreating || !createData.name.trim() || !createData.email.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create User'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateData({ email: '', name: '', role: 'standard user' });
                  setCreateError(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                disabled={isCreating}
              >
                Cancel
              </button>
            </div>
          </form>
        </AdminCard>
      )}

      {/* Users List */}
      <AdminCard 
        title="Users"
        actions={
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Filter:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              <option value="administrator">Administrators</option>
              <option value="standard user">Standard Users</option>
            </select>
          </div>
        }
      >
        {users.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {roleFilter === 'all' 
                ? 'No users yet'
                : `No ${roleFilter}s found`}
            </h3>
            <p className="text-gray-500 mb-6">
              {roleFilter === 'all' 
                ? 'Get started by creating your first user account'
                : `Try adjusting your filter or create a new ${roleFilter}`}
            </p>
            {roleFilter !== 'all' && (
              <button
                onClick={() => setRoleFilter('all')}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" role="table" aria-label="Users table">
              <thead className="bg-gray-50">
                <tr role="row">
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" role="columnheader">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className={!user.active ? 'bg-gray-50' : ''} role="row">
                    <td className="px-6 py-4 whitespace-nowrap" role="cell">
                      {editingId === user.id ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div>
                          <span className="text-sm font-medium text-gray-900">{user.name}</span>
                          {user.id === currentUserId && (
                            <span className="ml-2 text-xs text-gray-500">(You)</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <input
                          type="email"
                          value={editData.email}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <span className="text-sm text-gray-500">{user.email}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === user.id ? (
                        <select
                          value={editData.role}
                          onChange={(e) => setEditData({ ...editData, role: e.target.value as 'administrator' | 'standard user' })}
                          className="px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="standard user">Standard User</option>
                          <option value="administrator">Administrator</option>
                        </select>
                      ) : (
                        <RoleBadge role={user.role} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === user.id ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleEdit(user.id)}
                            className="text-green-600 hover:text-green-900"
                            aria-label="Save user changes"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-900"
                            aria-label="Cancel editing"
                          >
                            Cancel
                          </button>
                          {editError && (
                            <span className="text-xs text-red-600">{editError}</span>
                          )}
                        </div>
                      ) : user.active ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => startEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            aria-label={`Edit user ${user.name}`}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(user)}
                            className="text-red-600 hover:text-red-900"
                            aria-label={`Deactivate user ${user.name}`}
                          >
                            Deactivate
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">Inactive</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        onClose={() => setDeleteConfirm({ isOpen: false, userId: null, userName: '', isSelf: false, isLastAdmin: false })}
        onConfirm={handleDelete}
        title="Deactivate User"
        message={
          deleteConfirm.isSelf
            ? 'You cannot deactivate your own account. Please ask another administrator to do this.'
            : deleteConfirm.isLastAdmin
            ? 'This is the last active administrator account. You must have at least one active administrator.'
            : `Are you sure you want to deactivate "${deleteConfirm.userName}"? They will no longer be able to log in.`
        }
        confirmText={deleteConfirm.isSelf || deleteConfirm.isLastAdmin ? 'OK' : 'Deactivate'}
        variant={deleteConfirm.isSelf || deleteConfirm.isLastAdmin ? 'warning' : 'danger'}
      />
    </div>
  );
};

export default UserManagement;
