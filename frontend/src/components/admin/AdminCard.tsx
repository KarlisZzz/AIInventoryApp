/**
 * AdminCard Component
 * Reusable card component with glassmorphism styling for admin pages
 */

import React from 'react';

interface AdminCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

/**
 * AdminCard - A reusable card component with glassmorphism styling
 * @param title - Optional card title
 * @param children - Card content
 * @param className - Additional CSS classes
 * @param actions - Optional action buttons/elements for the header
 */
export const AdminCard: React.FC<AdminCardProps> = ({ 
  title, 
  children, 
  className = '',
  actions 
}) => {
  return (
    <div 
      className={`bg-white/80 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 ${className}`}
    >
      {(title || actions) && (
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          {actions && <div className="flex gap-2">{actions}</div>}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
};

export default AdminCard;
