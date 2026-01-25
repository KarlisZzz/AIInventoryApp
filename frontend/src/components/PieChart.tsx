/**
 * PieChart Component
 * 
 * Renders an interactive SVG pie chart with legend for visualizing data distributions.
 * Uses trigonometry to calculate arc paths for each segment.
 * 
 * @see specs/003-dashboard-improvements/spec.md (User Story 1)
 * @see T009, T010
 */

import { useMemo } from 'react';

export interface PieChartData {
  label: string;
  value: number;
  color: string;
}

interface PieChartProps {
  data: PieChartData[];
  title: string;
  size?: number;
}

/**
 * Calculate SVG arc path for a pie chart segment
 * 
 * @param centerX - X coordinate of circle center
 * @param centerY - Y coordinate of circle center
 * @param radius - Radius of the circle
 * @param startAngle - Starting angle in degrees (0 = top)
 * @param endAngle - Ending angle in degrees
 * @returns SVG path string
 */
function calculateArcPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngle: number,
  endAngle: number
): string {
  // Convert angles to radians and adjust so 0 degrees is at the top
  const startRad = ((startAngle - 90) * Math.PI) / 180;
  const endRad = ((endAngle - 90) * Math.PI) / 180;

  // Calculate start and end points
  const x1 = centerX + radius * Math.cos(startRad);
  const y1 = centerY + radius * Math.sin(startRad);
  const x2 = centerX + radius * Math.cos(endRad);
  const y2 = centerY + radius * Math.sin(endRad);

  // Determine if arc should be large (>180 degrees)
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  // Build SVG path: Move to center, Line to start, Arc to end, Close path
  return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
}

export function PieChart({ data, title, size = 200 }: PieChartProps) {
  // Calculate total value for percentage calculations
  const total = useMemo(() => data.reduce((sum, item) => sum + item.value, 0), [data]);

  // Calculate arc segments with memoization for performance
  const segments = useMemo(() => {
    if (total === 0) return [];

    let currentAngle = 0;
    return data.map((item) => {
      const percentage = (item.value / total) * 100;
      const angle = (item.value / total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angle;
      
      const path = calculateArcPath(
        size / 2,
        size / 2,
        size / 2 - 10,
        startAngle,
        endAngle
      );

      currentAngle = endAngle;

      return {
        ...item,
        path,
        percentage: percentage.toFixed(1),
        startAngle,
        endAngle,
      };
    });
  }, [data, total, size]);

  // Handle empty data
  if (total === 0 || data.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
        <div 
          className="flex items-center justify-center bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg"
          style={{ width: size, height: size }}
        >
          <p className="text-slate-400 text-sm">No data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <h3 className="text-lg font-semibold text-slate-200">{title}</h3>
      
      {/* SVG Pie Chart */}
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="drop-shadow-lg"
        role="img"
        aria-label={`${title} pie chart`}
      >
        {segments.map((segment, index) => (
          <path
            key={`${segment.label}-${index}`}
            d={segment.path}
            fill={segment.color}
            stroke="rgba(255, 255, 255, 0.2)"
            strokeWidth="2"
            className="transition-opacity hover:opacity-80 cursor-pointer"
            aria-label={`${segment.label}: ${segment.percentage}%`}
            role="graphics-symbol"
          />
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-col gap-2 w-full">
        {segments.map((segment, index) => (
          <div
            key={`legend-${segment.label}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
              />
              <span className="text-slate-300">{segment.label}</span>
            </div>
            <span className="text-slate-400 font-medium">
              {segment.percentage}% ({segment.value})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
