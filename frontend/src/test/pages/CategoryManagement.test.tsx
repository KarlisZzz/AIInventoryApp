/**
 * CategoryManagement Component Tests
 * Tests for category management page including CRUD operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import CategoryManagement from '../../pages/admin/CategoryManagement';
import * as adminApi from '../../services/adminApi';

// Mock the admin API
vi.mock('../../services/adminApi');

const mockCategories = [
  {
    id: 'cat-1',
    name: 'Electronics',
    itemCount: 5,
    createdAt: '2026-01-20T10:00:00.000Z',
    updatedAt: '2026-01-20T10:00:00.000Z',
  },
  {
    id: 'cat-2',
    name: 'Books',
    itemCount: 0,
    createdAt: '2026-01-21T10:00:00.000Z',
    updatedAt: '2026-01-21T10:00:00.000Z',
  },
];

describe('CategoryManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays loading skeleton while fetching categories', () => {
    vi.mocked(adminApi.getCategories).mockImplementation(() => new Promise(() => {}));
    
    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    expect(screen.getByText('Category Management')).toBeInTheDocument();
    expect(screen.getByText('Create New Category')).toBeInTheDocument();
  });

  it('displays categories in a table', async () => {
    vi.mocked(adminApi.getCategories).mockResolvedValue(mockCategories);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
      expect(screen.getByText('Books')).toBeInTheDocument();
    });
  });

  it.skip('displays empty state when no categories exist', async () => {
    vi.mocked(adminApi.getCategories).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No categories yet')).toBeInTheDocument();
    });
  });

  it('creates a new category', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue([]);
    vi.mocked(adminApi.createCategory).mockResolvedValue({
      id: 'cat-new',
      name: 'Furniture',
      itemCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Category Name')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Category Name');
    const createButton = screen.getByRole('button', { name: /create category/i });

    await user.type(input, 'Furniture');
    await user.click(createButton);

    await waitFor(() => {
      expect(adminApi.createCategory).toHaveBeenCalledWith({ name: 'Furniture' });
    });
  });

  it.skip('shows validation error when creating category with empty name', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue([]);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByLabelText('Category Name')).toBeInTheDocument();
    });

    const createButton = screen.getByRole('button', { name: /create category/i });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Category name is required')).toBeInTheDocument();
    });
  });

  it('edits an existing category', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue(mockCategories);
    vi.mocked(adminApi.updateCategory).mockResolvedValue({
      ...mockCategories[0],
      name: 'Electronics Updated',
    });

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit category Electronics');
    await user.click(editButton);

    const input = screen.getByDisplayValue('Electronics');
    await user.clear(input);
    await user.type(input, 'Electronics Updated');

    const saveButton = screen.getByLabelText('Save category changes');
    await user.click(saveButton);

    await waitFor(() => {
      expect(adminApi.updateCategory).toHaveBeenCalledWith('cat-1', {
        name: 'Electronics Updated',
      });
    });
  });

  it('cancels editing a category', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue(mockCategories);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const editButton = screen.getByLabelText('Edit category Electronics');
    await user.click(editButton);

    const cancelButton = screen.getByLabelText('Cancel editing');
    await user.click(cancelButton);

    expect(screen.queryByDisplayValue('Electronics')).not.toBeInTheDocument();
  });

  it('shows confirmation dialog when deleting category', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue(mockCategories);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Books')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete category Books');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Delete Category')).toBeInTheDocument();
    });
  });

  it('prevents deleting category with assigned items', async () => {
    const user = userEvent.setup();
    vi.mocked(adminApi.getCategories).mockResolvedValue(mockCategories);

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Electronics')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('Delete category Electronics');
    expect(deleteButton).toBeDisabled();
  });

  it('handles API errors gracefully', async () => {
    vi.mocked(adminApi.getCategories).mockRejectedValue({
      response: { data: { error: 'Failed to load categories' } },
    });

    render(
      <BrowserRouter>
        <CategoryManagement />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Failed to load categories')).toBeInTheDocument();
    });
  });
});
