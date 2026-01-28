/**
 * ItemCarousel Component Tests (T070)
 * 
 * Tests for the ItemCarousel component covering:
 * - Navigation buttons (prev/next)
 * - Boundary conditions (first/last item)
 * - Keyboard navigation
 * - Empty state handling
 * - Item card rendering
 * - Click navigation
 * 
 * @see specs/003-dashboard-improvements/tasks.md (T070)
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ItemCarousel from '../../components/ItemCarousel';
import type { Item } from '../../services/itemService';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ItemCarousel Component', () => {
  const mockItems: Item[] = [
    {
      id: '1',
      name: 'Laptop',
      description: 'Dell XPS 15',
      category: 'Electronics',
      status: 'Lent',
      imageUrl: null,
      currentLoan: {
        id: 'loan1',
        borrower: 'Alice',
        lentAt: '2024-01-15T10:00:00Z',
        notes: null,
      },
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z',
    },
    {
      id: '2',
      name: 'Projector',
      description: 'Epson HD',
      category: 'Electronics',
      status: 'Lent',
      imageUrl: null,
      currentLoan: {
        id: 'loan2',
        borrower: 'Bob',
        lentAt: '2024-01-16T14:00:00Z',
        notes: null,
      },
      createdAt: '2024-01-02T00:00:00Z',
      updatedAt: '2024-01-16T14:00:00Z',
    },
    {
      id: '3',
      name: 'Camera',
      description: 'Canon DSLR',
      category: 'Electronics',
      status: 'Lent',
      imageUrl: null,
      currentLoan: {
        id: 'loan3',
        borrower: 'Charlie',
        lentAt: '2024-01-17T09:00:00Z',
        notes: null,
      },
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-17T09:00:00Z',
    },
  ];

  const renderCarousel = (items: Item[] = mockItems) => {
    return render(
      <BrowserRouter>
        <ItemCarousel items={items} />
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('Empty State (T045)', () => {
    it('displays empty state when no items', () => {
      renderCarousel([]);
      expect(screen.getByText('No items currently lent')).toBeInTheDocument();
      expect(screen.getByText('All items are available in the inventory')).toBeInTheDocument();
    });

    it('does not show navigation buttons when empty', () => {
      renderCarousel([]);
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    });
  });

  describe('Single Item (T044)', () => {
    it('displays single item without navigation buttons', () => {
      renderCarousel([mockItems[0]]);
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      // Navigation controls hidden when only 1 page (1 item = 1 page)
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    });
  });

  describe('Item Rendering (T038, T039)', () => {
    it('displays item name and category', () => {
      renderCarousel();
      // All items are in DOM, use getAllByText
      expect(screen.getAllByText('Laptop').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Electronics').length).toBeGreaterThan(0);
    });

    it('displays borrower name', () => {
      renderCarousel();
      const borrowerNames = screen.getAllByText('Alice');
      expect(borrowerNames.length).toBeGreaterThan(0);
    });

    it('displays lent date', () => {
      renderCarousel();
      // Date format: "Jan 15, 2024"
      const dates = screen.getAllByText(/Jan 15, 2024/);
      expect(dates.length).toBeGreaterThan(0);
    });

    it('displays days ago', () => {
      renderCarousel();
      const daysAgo = screen.getAllByText(/\d+ days? ago/);
      expect(daysAgo.length).toBeGreaterThan(0);
    });

    it('displays "Lent Out" status badge', () => {
      renderCarousel();
      const badges = screen.getAllByText('Lent Out');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('displays description if available', () => {
      renderCarousel();
      expect(screen.getByText('Dell XPS 15')).toBeInTheDocument();
    });
  });

  describe('Navigation Buttons (T036, T037)', () => {
    const manyItems = [
      { id: 1, name: 'Item 1', category: 'Cat A', description: 'Desc 1', status: 'lent', borrower: 'Alice', lentDate: '2024-01-15' },
      { id: 2, name: 'Item 2', category: 'Cat A', description: 'Desc 2', status: 'lent', borrower: 'Bob', lentDate: '2024-01-16' },
      { id: 3, name: 'Item 3', category: 'Cat A', description: 'Desc 3', status: 'lent', borrower: 'Charlie', lentDate: '2024-01-17' },
      { id: 4, name: 'Item 4', category: 'Cat A', description: 'Desc 4', status: 'lent', borrower: 'Dave', lentDate: '2024-01-18' },
    ] as Item[];

    it('hides navigation buttons when only 1 page', () => {
      // Default mockItems has 3 items, which fits on 1 page (3 items per page)
      renderCarousel();
      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Previous page')).not.toBeInTheDocument();
    });

    it('shows Next page button on first page when multiple pages', () => {
      renderCarousel(manyItems);
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();
    });

    it('shows disabled Previous page button on first page', () => {
      renderCarousel(manyItems);
      const prevButton = screen.getByLabelText('Previous page');
      expect(prevButton).toBeDisabled();
    });

    it('navigates to next page when Next is clicked', async () => {
      renderCarousel(manyItems);
      
      const nextButton = screen.getByLabelText('Next page');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument();
        expect(screen.getByText('Item 4')).toBeInTheDocument();
      });
    });

    it('shows both buttons enabled on middle pages', async () => {
      // Need at least 7 items for 3 pages (pages: 3, 3, 1)
      const extraItems = [
        ...manyItems,
        { id: 5, name: 'Item 5', category: 'Cat A', description: 'Desc 5', status: 'lent', borrower: 'Eve', lentDate: '2024-01-19' },
        { id: 6, name: 'Item 6', category: 'Cat A', description: 'Desc 6', status: 'lent', borrower: 'Frank', lentDate: '2024-01-20' },
        { id: 7, name: 'Item 7', category: 'Cat A', description: 'Desc 7', status: 'lent', borrower: 'Grace', lentDate: '2024-01-21' },
      ] as Item[];
      renderCarousel(extraItems);
      
      // Navigate to page 2
      fireEvent.click(screen.getByLabelText('Next page'));

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous page');
        const nextButton = screen.getByLabelText('Next page');
        expect(prevButton).not.toBeDisabled();
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates to previous page when Previous is clicked', async () => {
      renderCarousel(manyItems);
      
      // Go to page 2
      fireEvent.click(screen.getByLabelText('Next page'));
      await waitFor(() => expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument());

      // Go back to page 1
      fireEvent.click(screen.getByLabelText('Previous page'));
      await waitFor(() => expect(screen.getByText('Page 1 of 2, showing 3 items')).toBeInTheDocument());
    });

    it('shows disabled Next button on last page', async () => {
      renderCarousel(manyItems);
      
      // Navigate to last page
      fireEvent.click(screen.getByLabelText('Next page'));
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument();
        const nextButton = screen.getByLabelText('Next page');
        expect(nextButton).toBeDisabled();
      });
    });

    it('shows enabled Previous button on last page', async () => {
      renderCarousel(manyItems);
      
      // Navigate to last page
      fireEvent.click(screen.getByLabelText('Next page'));
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument();
        const prevButton = screen.getByLabelText('Previous page');
        expect(prevButton).not.toBeDisabled();
      });
    });
  });

  describe('Keyboard Navigation (T047)', () => {
    it('navigates to next page with ArrowRight when multiple pages exist', async () => {
      const manyItems = [
        { id: 1, name: 'Item 1', category: 'Cat A', description: 'Desc 1', status: 'lent', borrower: 'Alice', lentDate: '2024-01-15' },
        { id: 2, name: 'Item 2', category: 'Cat A', description: 'Desc 2', status: 'lent', borrower: 'Bob', lentDate: '2024-01-16' },
        { id: 3, name: 'Item 3', category: 'Cat A', description: 'Desc 3', status: 'lent', borrower: 'Charlie', lentDate: '2024-01-17' },
        { id: 4, name: 'Item 4', category: 'Cat A', description: 'Desc 4', status: 'lent', borrower: 'Dave', lentDate: '2024-01-18' },
      ] as Item[];
      renderCarousel(manyItems);
      
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument();
      });
    });

    it('navigates to previous page with ArrowLeft', async () => {
      const manyItems = [
        { id: 1, name: 'Item 1', category: 'Cat A', description: 'Desc 1', status: 'lent', borrower: 'Alice', lentDate: '2024-01-15' },
        { id: 2, name: 'Item 2', category: 'Cat A', description: 'Desc 2', status: 'lent', borrower: 'Bob', lentDate: '2024-01-16' },
        { id: 3, name: 'Item 3', category: 'Cat A', description: 'Desc 3', status: 'lent', borrower: 'Charlie', lentDate: '2024-01-17' },
        { id: 4, name: 'Item 4', category: 'Cat A', description: 'Desc 4', status: 'lent', borrower: 'Dave', lentDate: '2024-01-18' },
      ] as Item[];
      renderCarousel(manyItems);
      
      // Move to page 2
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument());

      // Move back to page 1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      await waitFor(() => expect(screen.getByText('Page 1 of 2, showing 3 items')).toBeInTheDocument());
    });

    it('does not navigate beyond boundaries with keyboard', async () => {
      const manyItems = [
        { id: 1, name: 'Item 1', category: 'Cat A', description: 'Desc 1', status: 'lent', borrower: 'Alice', lentDate: '2024-01-15' },
        { id: 2, name: 'Item 2', category: 'Cat A', description: 'Desc 2', status: 'lent', borrower: 'Bob', lentDate: '2024-01-16' },
        { id: 3, name: 'Item 3', category: 'Cat A', description: 'Desc 3', status: 'lent', borrower: 'Charlie', lentDate: '2024-01-17' },
        { id: 4, name: 'Item 4', category: 'Cat A', description: 'Desc 4', status: 'lent', borrower: 'Dave', lentDate: '2024-01-18' },
      ] as Item[];
      renderCarousel(manyItems);
      
      // Try to go before first page - should stay at page 1
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2, showing 3 items')).toBeInTheDocument();
      }, { timeout: 500 });

      // Navigate to last page
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument());
      
      // Try to go after last page - should stay at page 2
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByText('Page 2 of 2, showing 1 items')).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });

  describe('Click Navigation (T026, T027, T028)', () => {
    it('navigates to item edit page when card is clicked', () => {
      const { container } = renderCarousel();
      
      const card = container.querySelector('[role="button"]');
      expect(card).toBeInTheDocument();
      
      fireEvent.click(card!);
      expect(mockNavigate).toHaveBeenCalledWith('/items/1/edit');
    });

    it('has cursor-pointer class on card', () => {
      const { container } = renderCarousel();
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('has hover ring effect on card', () => {
      const { container } = renderCarousel();
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveClass('hover:ring-2', 'ring-blue-500/50');
    });

    it('activates navigation on Enter key', () => {
      const { container } = renderCarousel();
      const card = container.querySelector('[role="button"]');
      
      fireEvent.keyDown(card!, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith('/items/1/edit');
    });

    it('activates navigation on Space key', () => {
      const { container } = renderCarousel();
      const card = container.querySelector('[role="button"]');
      
      fireEvent.keyDown(card!, { key: ' ' });
      expect(mockNavigate).toHaveBeenCalledWith('/items/1/edit');
    });
  });

  describe('Accessibility (T040, T041)', () => {
    it('has ARIA live region for screen readers', () => {
      const { container } = renderCarousel();
      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveTextContent('Page 1 of 1, showing 3 items');
    });

    it('updates ARIA live region on navigation', async () => {
      // Create enough items to have multiple pages (4+ items = 2 pages with itemsPerPage=3)
      const manyItems = [...mockItems, { ...mockItems[0], id: '4', name: 'Keyboard' }];
      const { container } = renderCarousel(manyItems);
      
      fireEvent.click(screen.getByLabelText('Next page'));
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).toHaveTextContent('Page 2 of 2, showing 1 items');
      });
    });

    it('has ARIA labels on navigation buttons', async () => {
      // Create enough items for multiple pages (7 items = 3 pages)
      const manyItems = Array.from({ length: 7 }, (_, i) => ({
        ...mockItems[0],
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
      }));
      renderCarousel(manyItems);
      
      // Both buttons exist but prev is disabled on first page
      expect(screen.getByLabelText('Previous page')).toBeInTheDocument();
      expect(screen.getByLabelText('Next page')).toBeInTheDocument();
      expect(screen.getByLabelText('Previous page')).toBeDisabled();
      expect(screen.getByLabelText('Next page')).not.toBeDisabled();
      
      // Navigate to middle page to get both enabled
      fireEvent.click(screen.getByLabelText('Next page'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Previous page')).not.toBeDisabled();
        expect(screen.getByLabelText('Next page')).not.toBeDisabled();
      });
    });

    it('has ARIA label on item card', () => {
      const { container } = renderCarousel();
      const card = container.querySelector('[role="button"]');
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('View details for Laptop'));
      expect(card).toHaveAttribute('aria-label', expect.stringContaining('Alice'));
    });

    it('has proper tabIndex on current card', () => {
      const { container } = renderCarousel();
      const cards = container.querySelectorAll('[role="button"]');
      expect(cards[0]).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Transition Animation (T035)', () => {
    it('applies transition classes to navigation buttons', () => {
      // Need multiple pages to see navigation buttons
      const manyItems = Array.from({ length: 4 }, (_, i) => ({
        ...mockItems[0],
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
      }));
      const { container } = renderCarousel(manyItems);
      const buttons = container.querySelectorAll('button');
      // Navigation buttons should have transition classes
      const navButton = Array.from(buttons).find(btn => btn.getAttribute('aria-label')?.includes('page'));
      expect(navButton).toHaveClass('transition-all', 'duration-200');
    });
  });

  describe('Rapid Clicking (T048)', () => {
    it('handles rapid button clicks gracefully', async () => {
      // Create enough items for multiple pages (7 items = 3 pages)
      const manyItems = Array.from({ length: 7 }, (_, i) => ({
        ...mockItems[0],
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
      }));
      renderCarousel(manyItems);
      
      const nextButton = screen.getByLabelText('Next page');
      
      // Rapid clicks - should go to page 2, then page 3, then stop
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Should be on last page showing Item 7
        expect(screen.getByText('Item 7')).toBeInTheDocument();
      });
    });
  });

  describe('Different Item Counts (T049)', () => {
    it('handles 2 items correctly', () => {
      renderCarousel([mockItems[0], mockItems[1]]);
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Projector')).toBeInTheDocument();
      // With 2 items, there's only 1 page, so no navigation buttons
      expect(screen.queryByLabelText('Next page')).not.toBeInTheDocument();
    });

    it('handles many items (10+)', async () => {
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        ...mockItems[0],
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
      }));

      renderCarousel(manyItems);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
      expect(screen.getByText('Item 3')).toBeInTheDocument();
      
      // Can navigate through many pages
      fireEvent.click(screen.getByLabelText('Next page'));
      await waitFor(() => {
        // Page 2 shows items 4, 5, 6
        expect(screen.getByText('Item 4')).toBeInTheDocument();
      });
    });
  });
});
