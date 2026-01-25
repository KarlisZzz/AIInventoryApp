/**
 * DashboardAnalytics Component
 * 
 * Displays visual analytics for the dashboard including:
 * - Status distribution pie chart
 * - Category distribution pie chart
 * - Top borrower information card
 * 
 * Uses React Query for data fetching with 5-minute cache stale time.
 * 
 * @see specs/003-dashboard-improvements/spec.md (User Story 1)
 * @see T011, T012, T013, T014, T015, T016, T017
 */

import { useQuery } from '@tanstack/react-query';
import { fetchDashboardAnalytics, type DashboardAnalytics } from '../services/dashboardService';
import { PieChart, type PieChartData } from './PieChart';
import LoadingSpinner from './LoadingSpinner';

// Constitutional color palette for status (muted)
const STATUS_COLORS: Record<string, string> = {
  available: 'rgb(34, 197, 94)', // green-500
  Available: 'rgb(34, 197, 94)', // green-500
  out: 'rgb(234, 179, 8)', // yellow-500
  Lent: 'rgb(234, 179, 8)', // yellow-500
  maintenance: 'rgb(239, 68, 68)', // red-500
  Maintenance: 'rgb(239, 68, 68)', // red-500
  retired: 'rgb(100, 116, 139)', // slate-500
  Retired: 'rgb(100, 116, 139)', // slate-500
};

// Varied constitutional colors for categories
const CATEGORY_COLORS = [
  'rgb(59, 130, 246)', // blue-500
  'rgb(168, 85, 247)', // purple-500
  'rgb(236, 72, 153)', // pink-500
  'rgb(20, 184, 166)', // teal-500
  'rgb(249, 115, 22)', // orange-500
  'rgb(14, 165, 233)', // sky-500
  'rgb(132, 204, 22)', // lime-500
  'rgb(251, 146, 60)', // orange-400
];

/**
 * Transform status distribution data for pie chart
 */
function transformStatusData(statusDistribution: Record<string, number>): PieChartData[] {
  return Object.entries(statusDistribution).map(([status, count]) => ({
    label: status.charAt(0).toUpperCase() + status.slice(1),
    value: count,
    color: STATUS_COLORS[status] || 'rgb(148, 163, 184)', // slate-400 fallback
  }));
}

/**
 * Transform category distribution data for pie chart
 */
function transformCategoryData(categoryDistribution: Record<string, number>): PieChartData[] {
  const entries = Object.entries(categoryDistribution);
  return entries.map(([category, count], index) => ({
    label: category.charAt(0).toUpperCase() + category.slice(1),
    value: count,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }));
}

export function DashboardAnalytics() {
  // Fetch analytics data with React Query (5-minute stale time)
  const { data, isLoading, isError, error, refetch } = useQuery<DashboardAnalytics>({
    queryKey: ['dashboardAnalytics'],
    queryFn: fetchDashboardAnalytics,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  // Loading state with skeleton UI
  if (isLoading) {
    return (
      <div className="glass-card p-6" aria-live="polite" aria-busy="true">
        <h2 className="text-2xl font-bold text-slate-200 mb-6">Analytics Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Status Distribution Skeleton */}
          <div className="flex flex-col items-center">
            <div className="h-6 w-40 bg-slate-700/50 rounded animate-pulse mb-4" />
            <div className="w-[200px] h-[200px] bg-slate-700/30 rounded-full animate-pulse" />
            <div className="flex flex-col gap-2 w-full mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Category Distribution Skeleton */}
          <div className="flex flex-col items-center">
            <div className="h-6 w-40 bg-slate-700/50 rounded animate-pulse mb-4" />
            <div className="w-[200px] h-[200px] bg-slate-700/30 rounded-full animate-pulse" />
            <div className="flex flex-col gap-2 w-full mt-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-4 w-24 bg-slate-700/50 rounded animate-pulse" />
                  <div className="h-4 w-16 bg-slate-700/50 rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>

          {/* Top Borrower Skeleton */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-full max-w-xs">
              <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse mb-4 mx-auto" />
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="w-16 h-16 bg-slate-700/50 rounded-full animate-pulse mx-auto mb-4" />
                <div className="h-6 w-32 bg-slate-700/50 rounded animate-pulse mb-2 mx-auto" />
                <div className="h-4 w-40 bg-slate-700/50 rounded animate-pulse mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="glass-card p-6 bg-red-500/10 border-red-500/50" role="alert">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-red-400 font-semibold mb-1">Failed to Load Analytics</h3>
            <p className="text-red-300/80 text-sm">
              {error instanceof Error ? error.message : 'Unable to retrieve dashboard analytics. Please try again.'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/50"
              aria-label="Retry loading analytics"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No data
  if (!data) {
    return null;
  }

  // Transform data for pie charts
  const statusData = transformStatusData(data.statusDistribution);
  const categoryData = transformCategoryData(data.categoryDistribution);

  return (
    <div className="glass-card p-6 animate-fadeIn">
      <h2 className="text-2xl font-bold text-slate-200 mb-6">Analytics Overview</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Status Distribution Chart */}
        <div className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: '100ms' }}>
          <PieChart
            data={statusData}
            title="Status Distribution"
            size={200}
          />
        </div>

        {/* Category Distribution Chart */}
        <div className="flex flex-col items-center animate-fadeIn" style={{ animationDelay: '200ms' }}>
          <PieChart
            data={categoryData}
            title="Category Distribution"
            size={200}
          />
        </div>

        {/* Top Borrower Card */}
        <div className="flex flex-col items-center justify-center animate-fadeIn" style={{ animationDelay: '300ms' }}>
          <div className="w-full max-w-xs">
            <h3 className="text-lg font-semibold text-slate-200 mb-4 text-center">
              Top Borrower
            </h3>
            {data.topBorrower ? (
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-xl font-bold text-slate-200 mb-2">
                  {data.topBorrower.name}
                </p>
                <p className="text-sm text-slate-400">
                  Currently borrowing{' '}
                  <span className="font-semibold text-blue-400">
                    {data.topBorrower.count}
                  </span>{' '}
                  {data.topBorrower.count === 1 ? 'item' : 'items'}
                </p>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-slate-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-slate-400">No items currently lent</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
