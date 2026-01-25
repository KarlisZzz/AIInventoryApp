/**
 * PieChart Component Tests (T069)
 * 
 * Tests for the PieChart component covering:
 * - Basic rendering with data
 * - Arc path calculations
 * - Empty data handling
 * - Accessibility attributes
 * - Legend display
 * 
 * @see specs/003-dashboard-improvements/tasks.md (T069)
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PieChart, type PieChartData } from '../../components/PieChart';

describe('PieChart Component', () => {
  const mockData: PieChartData[] = [
    { label: 'Available', value: 10, color: 'rgb(34, 197, 94)' },
    { label: 'Lent', value: 5, color: 'rgb(234, 179, 8)' },
    { label: 'Maintenance', value: 2, color: 'rgb(239, 68, 68)' },
  ];

  describe('Rendering', () => {
    it('renders pie chart with title', () => {
      render(<PieChart data={mockData} title="Test Chart" />);
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
    });

    it('renders SVG element with correct dimensions', () => {
      render(<PieChart data={mockData} title="Test Chart" size={200} />);
      const svg = screen.getByRole('img', { name: 'Test Chart pie chart' });
      expect(svg).toHaveAttribute('width', '200');
      expect(svg).toHaveAttribute('height', '200');
      expect(svg).toHaveAttribute('viewBox', '0 0 200 200');
    });

    it('renders legend with all data labels', () => {
      render(<PieChart data={mockData} title="Test Chart" />);
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('Lent')).toBeInTheDocument();
      expect(screen.getByText('Maintenance')).toBeInTheDocument();
    });

    it('displays percentages in legend', () => {
      render(<PieChart data={mockData} title="Test Chart" />);
      // Total: 10 + 5 + 2 = 17
      // Available: 10/17 = 58.8%
      // Lent: 5/17 = 29.4%
      // Maintenance: 2/17 = 11.8%
      expect(screen.getByText(/58\.8%/)).toBeInTheDocument();
      expect(screen.getByText(/29\.4%/)).toBeInTheDocument();
      expect(screen.getByText(/11\.8%/)).toBeInTheDocument();
    });

    it('displays values in legend', () => {
      render(<PieChart data={mockData} title="Test Chart" />);
      expect(screen.getByText(/\(10\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(5\)/)).toBeInTheDocument();
      expect(screen.getByText(/\(2\)/)).toBeInTheDocument();
    });
  });

  describe('Arc Path Calculations', () => {
    it('renders correct number of path segments', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const paths = container.querySelectorAll('path');
      expect(paths).toHaveLength(mockData.length);
    });

    it('applies correct colors to segments', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const paths = container.querySelectorAll('path');
      
      expect(paths[0]).toHaveAttribute('fill', mockData[0].color);
      expect(paths[1]).toHaveAttribute('fill', mockData[1].color);
      expect(paths[2]).toHaveAttribute('fill', mockData[2].color);
    });

    it('generates valid SVG path strings', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const paths = container.querySelectorAll('path');
      
      paths.forEach(path => {
        const d = path.getAttribute('d');
        expect(d).toBeTruthy();
        expect(d).toMatch(/^M\s[\d\s.]+L\s[\d\s.]+A\s[\d\s.]+Z$/); // SVG path format
      });
    });
  });

  describe('Empty Data Handling', () => {
    it('renders empty state when data array is empty', () => {
      render(<PieChart data={[]} title="Empty Chart" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('renders empty state when all values are zero', () => {
      const zeroData: PieChartData[] = [
        { label: 'A', value: 0, color: 'red' },
        { label: 'B', value: 0, color: 'blue' },
      ];
      render(<PieChart data={zeroData} title="Zero Chart" />);
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('does not render SVG when data is empty', () => {
      const { container } = render(<PieChart data={[]} title="Empty Chart" />);
      const svg = container.querySelector('svg');
      expect(svg).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on SVG', () => {
      render(<PieChart data={mockData} title="Accessible Chart" />);
      const svg = screen.getByRole('img');
      expect(svg).toHaveAttribute('aria-label', 'Accessible Chart pie chart');
    });

    it('has ARIA labels on segments with percentages', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const paths = container.querySelectorAll('path[role="graphics-symbol"]');
      
      expect(paths[0]).toHaveAttribute('aria-label', 'Available: 58.8%');
      expect(paths[1]).toHaveAttribute('aria-label', 'Lent: 29.4%');
      expect(paths[2]).toHaveAttribute('aria-label', 'Maintenance: 11.8%');
    });

    it('hides legend color indicators from screen readers', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const colorBoxes = container.querySelectorAll('.w-3.h-3.rounded-sm');
      
      colorBoxes.forEach(box => {
        expect(box).toHaveAttribute('aria-hidden', 'true');
      });
    });
  });

  describe('Hover Effects', () => {
    it('applies hover classes to segments', () => {
      const { container } = render(<PieChart data={mockData} title="Test Chart" />);
      const paths = container.querySelectorAll('path');
      
      paths.forEach(path => {
        expect(path).toHaveClass('transition-opacity', 'hover:opacity-80', 'cursor-pointer');
      });
    });
  });

  describe('Single Data Point', () => {
    it('renders correctly with single data point', () => {
      const singleData: PieChartData[] = [
        { label: 'Only Item', value: 100, color: 'rgb(59, 130, 246)' },
      ];
      
      render(<PieChart data={singleData} title="Single Item" />);
      expect(screen.getByText('Only Item')).toBeInTheDocument();
      expect(screen.getByText(/100\.0%/)).toBeInTheDocument();
    });
  });

  describe('Large Numbers', () => {
    it('handles large values correctly', () => {
      const largeData: PieChartData[] = [
        { label: 'Type A', value: 1000000, color: 'red' },
        { label: 'Type B', value: 500000, color: 'blue' },
      ];
      
      render(<PieChart data={largeData} title="Large Numbers" />);
      expect(screen.getByText('Type A')).toBeInTheDocument();
      expect(screen.getByText(/66\.7%/)).toBeInTheDocument();
      expect(screen.getByText(/33\.3%/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small percentages', () => {
      const smallData: PieChartData[] = [
        { label: 'Major', value: 999, color: 'red' },
        { label: 'Minor', value: 1, color: 'blue' },
      ];
      
      render(<PieChart data={smallData} title="Small Percentage" />);
      expect(screen.getByText(/99\.9%/)).toBeInTheDocument();
      expect(screen.getByText(/0\.1%/)).toBeInTheDocument();
    });

    it('handles equal distribution', () => {
      const equalData: PieChartData[] = [
        { label: 'A', value: 25, color: 'red' },
        { label: 'B', value: 25, color: 'blue' },
        { label: 'C', value: 25, color: 'green' },
        { label: 'D', value: 25, color: 'yellow' },
      ];
      
      render(<PieChart data={equalData} title="Equal Split" />);
      const percentages = screen.getAllByText(/25\.0%/);
      expect(percentages).toHaveLength(4);
    });
  });
});
