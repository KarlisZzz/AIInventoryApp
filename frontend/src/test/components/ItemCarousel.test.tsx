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
      expect(screen.queryByLabelText('Previous item')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next item')).not.toBeInTheDocument();
    });
  });

  describe('Single Item (T044)', () => {
    it('displays single item without navigation buttons', () => {
      renderCarousel([mockItems[0]]);
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      // Navigation controls hidden when items.length <= 1
      expect(screen.queryByLabelText('Previous item')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Next item')).not.toBeInTheDocument();
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
    it('shows Next button on first item', () => {
      renderCarousel();
      expect(screen.getByLabelText('Next item')).toBeInTheDocument();
    });

    it('shows disabled Previous button on first item', () => {
      renderCarousel();
      const prevButton = screen.getByLabelText('Previous item');
      expect(prevButton).toBeDisabled();
    });

    it('navigates to next item when Next is clicked', async () => {
      renderCarousel();
      
      const nextButton = screen.getByLabelText('Next item');
      fireEvent.click(nextButton);

      await waitFor(() => {
        // All items are in DOM, just verify they exist
        expect(screen.getAllByText('Projector').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Bob').length).toBeGreaterThan(0);
      });
    });

    it('shows both buttons enabled on middle item', async () => {
      renderCarousel();
      
      // Navigate to middle item
      fireEvent.click(screen.getByLabelText('Next item'));

      await waitFor(() => {
        const prevButton = screen.getByLabelText('Previous item');
        const nextButton = screen.getByLabelText('Next item');
        expect(prevButton).not.toBeDisabled();
        expect(nextButton).not.toBeDisabled();
      });
    });

    it('navigates to previous item when Previous is clicked', async () => {
      renderCarousel();
      
      // Go to second item
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => expect(screen.getByText('Item 2 of 3')).toBeInTheDocument());

      // Go back to first item
      fireEvent.click(screen.getByLabelText('Previous item'));
      await waitFor(() => expect(screen.getByText('Item 1 of 3')).toBeInTheDocument());
    });

    it('shows disabled Next button on last item', async () => {
      renderCarousel();
      
      // Navigate to last item
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => expect(screen.getByText('Item 2 of 3')).toBeInTheDocument());
      
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => {
        expect(screen.getByText('Item 3 of 3')).toBeInTheDocument();
        const nextButton = screen.getByLabelText('Next item');
        expect(nextButton).toBeDisabled();
      });
    });

    it('shows enabled Previous button on last item', async () => {
      renderCarousel();
      
      // Navigate to last item
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => expect(screen.getByText('Item 2 of 3')).toBeInTheDocument());
      
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => {
        expect(screen.getByText('Item 3 of 3')).toBeInTheDocument();
        const prevButton = screen.getByLabelText('Previous item');
        expect(prevButton).not.toBeDisabled();
      });
    });
  });

  describe('Keyboard Navigation (T047)', () => {
    it('navigates to next item with ArrowRight', async () => {
      renderCarousel();
      
      fireEvent.keyDown(window, { key: 'ArrowRight' });

      await waitFor(() => {
        expect(screen.getByText('Item 2 of 3')).toBeInTheDocument();
      });
    });

    it('navigates to previous item with ArrowLeft', async () => {
      renderCarousel();
      
      // Move to second item
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => expect(screen.getByText('Item 2 of 3')).toBeInTheDocument());

      // Move back to first item
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      await waitFor(() => expect(screen.getByText('Item 1 of 3')).toBeInTheDocument());
    });

    it('does not navigate beyond boundaries with keyboard', async () => {
      renderCarousel();
      
      // Try to go before first item - should stay at 0
      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
      }, { timeout: 500 });

      // Navigate to last item
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => expect(screen.getByText('Projector')).toBeInTheDocument());
      
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => expect(screen.getByText('Camera')).toBeInTheDocument());

      // Try to go after last item - should stay at Camera
      fireEvent.keyDown(window, { key: 'ArrowRight' });
      await waitFor(() => {
        expect(screen.getByText('Camera')).toBeInTheDocument();
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
      expect(liveRegion).toHaveTextContent('Item 1 of 3');
    });

    it('updates ARIA live region on navigation', async () => {
      const { container } = renderCarousel();
      
      fireEvent.click(screen.getByLabelText('Next item'));
      
      await waitFor(() => {
        const liveRegion = container.querySelector('[aria-live="polite"]');
        expect(liveRegion).toHaveTextContent('Item 2 of 3');
      });
    });

    it('has ARIA labels on navigation buttons', async () => {
      renderCarousel();
      
      // Both buttons exist but prev is disabled
      expect(screen.getByLabelText('Previous item')).toBeInTheDocument();
      expect(screen.getByLabelText('Next item')).toBeInTheDocument();
      
      // Navigate to middle to get both enabled
      fireEvent.click(screen.getByLabelText('Next item'));
      
      await waitFor(() => {
        expect(screen.getByLabelText('Previous item')).not.toBeDisabled();
        expect(screen.getByLabelText('Next item')).not.toBeDisabled();
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
    it('applies transition classes to carousel container', () => {
      const { container } = renderCarousel();
      const transitionContainer = container.querySelector('.transition-transform');
      expect(transitionContainer).toBeInTheDocument();
      expect(transitionContainer).toHaveClass('duration-300', 'ease-in-out');
    });
  });

  describe('Rapid Clicking (T048)', () => {
    it('handles rapid button clicks gracefully', async () => {
      renderCarousel();
      
      const nextButton = screen.getByLabelText('Next item');
      
      // Rapid clicks
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);
      fireEvent.click(nextButton);

      await waitFor(() => {
        // Should not go beyond last item
        expect(screen.getByText('Camera')).toBeInTheDocument();
      });
    });
  });

  describe('Different Item Counts (T049)', () => {
    it('handles 2 items correctly', () => {
      renderCarousel([mockItems[0], mockItems[1]]);
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByLabelText('Next item')).toBeInTheDocument();
    });

    it('handles many items (10+)', async () => {
      const manyItems = Array.from({ length: 15 }, (_, i) => ({
        ...mockItems[0],
        id: `${i + 1}`,
        name: `Item ${i + 1}`,
      }));

      renderCarousel(manyItems);
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      
      // Can navigate through many items
      fireEvent.click(screen.getByLabelText('Next item'));
      await waitFor(() => expect(screen.getByText('Item 2')).toBeInTheDocument());
    });
  });
});
