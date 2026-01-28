/**
 * UserManagement Component Tests
 * Tests for user management page including CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import UserManagement from '../../pages/admin/UserManagement';
import * as adminApi from '../../services/adminApi';

// Mock the admin API
vi.mock('../../services/adminApi');

const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@test.com',
    name: 'Admin User',
    role: 'administrator' as const,
    active: true,
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'user-2',
    email: 'standard@test.com',
    name: 'Standard User',
    role: 'standard user' as const,
    active: true,
    createdAt: '2026-01-21T10:00:00.000Z',
    updatedAt: '2026-01-21T10:00:00.000Z',
  },
];

describe('UserManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage for current user
    localStorage.setItem('user', JSON.stringify({ id: 'user-1', name: 'Admin User' }));
  });

  it('displays loading skeleton while fetching users', () => {
    vi.mocked(adminApi.getUsers).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('displays users in a table', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('standard@test.com')).toBeInTheDocument();
    });
  });

  it('displays empty state when no users exist', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No users yet')).toBeInTheDocument();
    });
  });

  it('shows create user form when button is clicked', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ Create New User')).toBeInTheDocument();
    });

    const createButton = screen.getByText('+ Create New User');
    await user.click(createButton);

    expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('Role *')).toBeInTheDocument();
  });

  it('creates a new user', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue([]);
    vi.mocked(adminApi.createUser).mockResolvedValue({
      id: 'user-new',
      email: 'newuser@test.com',
      name: 'New User',
      role: 'standard user',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ Create New User')).toBeInTheDocument();
    });

    const createButton = screen.getByText('+ Create New User');
    await user.click(createButton);

    const nameInput = screen.getByLabelText('Name *');
    const emailInput = screen.getByLabelText('Email *');
    const submitButton = screen.getByRole('button', { name: /create user/i });

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'newuser@test.com');
    await user.click(submitButton);

    await waitFor(() => {
      expect(adminApi.createUser).toHaveBeenCalledWith({
        name: 'New User',
        email: 'newuser@test.com',
        role: 'standard user',
      });
    });
  });

  it.skip('shows validation error when creating user with invalid email', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ Create New User')).toBeInTheDocument();
    });

    const createButton = screen.getByText('+ Create New User');
    await user.click(createButton);

    const nameInput = screen.getByLabelText('Name *');
    const emailInput = screen.getByLabelText('Email *');
    const submitButton = screen.getByRole('button', { name: /create user/i });

    await user.type(nameInput, 'New User');
    await user.type(emailInput, 'invalidemail');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('edits an existing user', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue(mockUsers);
    vi.mocked(adminApi.updateUser).mockResolvedValue({
      ...mockUsers[1],
      name: 'Updated User',
    });

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('standard@test.com')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByLabelText(/Edit user/);
    await user.click(editButtons[1]);

    await waitFor(() => {
      expect(screen.getByDisplayValue('standard@test.com')).toBeInTheDocument();
    });

    const inputs = screen.getAllByDisplayValue('Standard User');
    const nameInput = inputs[0]; // First one is the name input, second is the select option
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated User');

    const saveButton = screen.getByLabelText('Save user changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(adminApi.updateUser).toHaveBeenCalled();
    });
  });

  it('shows confirmation dialog when deactivating user', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('standard@test.com')).toBeInTheDocument();
    });

    const deactivateButtons = screen.getAllByLabelText(/Deactivate user/);
    await user.click(deactivateButtons[1]);

    await waitFor(() => {
      expect(screen.getByText('Deactivate User')).toBeInTheDocument();
    });
  });

  it('filters users by role', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getUsers).mockResolvedValue(mockUsers);

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin User')).toBeInTheDocument();
    });

    const filterSelect = screen.getByDisplayValue('All Users');
    await user.selectOptions(filterSelect, 'administrator');

    await waitFor(() => {
      expect(adminApi.getUsers).toHaveBeenCalledWith('administrator');
    });
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(adminApi.getUsers).mockRejectedValue({
      response: { data: { error: 'Failed to load users' } },
    });

    render(
      <BrowserRouter>
        <UserManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load users')).toBeInTheDocument();
    });
  });
});
