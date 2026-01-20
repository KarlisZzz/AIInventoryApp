/**
 * UserSelect Component
 * 
 * Searchable dropdown for user selection during lending operations (User Story 2).
 * Provides real-time filtering by name or email.
 * 
 * @see specs/001-inventory-lending/spec.md (User Story 2)
 */

import { useState, useEffect, useMemo } from 'react';
import { getUsers, type User } from '../services/userService';

interface UserSelectProps {
  value: string | null;
  onChange: (userId: string | null) => void;
  error?: string;
  disabled?: boolean;
}

export default function UserSelect({ value, onChange, error, disabled = false }: UserSelectProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch all users on mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        setFetchError(null);
        const fetchedUsers = await getUsers();
        setUsers(fetchedUsers);
      } catch (err: any) {
        console.error('Failed to fetch users:', err);
        setFetchError(err.message || 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  // Filter users based on search term
  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const term = searchTerm.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [users, searchTerm]);

  // Get selected user details
  const selectedUser = useMemo(() => {
    return users.find((user) => user.id === value);
  }, [users, value]);

  const handleSelect = (userId: string) => {
    onChange(userId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="relative">
        <div className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500">
          Loading users...
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="relative">
        <div className="block w-full px-3 py-2 border border-red-300 rounded-md shadow-sm bg-red-50 text-red-700 text-sm">
          {fetchError}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select User <span className="text-red-500">*</span>
      </label>
      
      {/* Selected user display / trigger button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full px-3 py-2 text-left border rounded-md shadow-sm flex items-center justify-between ${
          error
            ? 'border-red-300 bg-red-50'
            : 'border-gray-300 bg-white hover:bg-gray-50'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span className={selectedUser ? 'text-gray-900' : 'text-gray-400'}>
          {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : 'Select a user...'}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown panel */}
      {isOpen && !disabled && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown content */}
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-gray-200">
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* User list */}
            <div className="overflow-y-auto max-h-48">
              {filteredUsers.length === 0 ? (
                <div className="px-3 py-4 text-sm text-gray-500 text-center">
                  {searchTerm ? 'No users found matching your search' : 'No users available'}
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleSelect(user.id)}
                    className={`w-full px-3 py-2 text-left hover:bg-blue-50 flex flex-col ${
                      user.id === value ? 'bg-blue-100' : ''
                    }`}
                  >
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                    <span className="text-xs text-gray-600">{user.email}</span>
                    <span className="text-xs text-gray-500">{user.role}</span>
                  </button>
                ))
              )}
            </div>

            {/* Clear button */}
            {value && (
              <div className="p-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleClear}
                  className="w-full px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
