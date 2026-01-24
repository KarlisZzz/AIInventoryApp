/**
 * DropdownMenu Component
 * 
 * A reusable dropdown menu with click-outside detection and keyboard support.
 * Used for card action menus in ItemCard and ItemList.
 * 
 * @see T035, T036, T037, T044 [US3]
 */

import { useEffect, useRef } from 'react';

// T037 [US3]: MenuItem interface definition
export interface MenuItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tooltip?: string;
  variant?: 'default' | 'danger';
  icon?: React.ReactNode;
}

interface DropdownMenuProps {
  items: MenuItem[];
  isOpen: boolean;
  onClose: () => void;
  triggerElement?: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export default function DropdownMenu({
  items,
  isOpen,
  onClose,
  triggerElement,
  position = 'bottom-right'
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  
  // T035 [US3]: Click-outside detection
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // T036 [US3]: Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // T044 [US3]: Close dropdown after action is selected
  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    
    item.onClick();
    onClose(); // Automatically close after action
  };

  if (!isOpen) return triggerElement || null;

  // Position classes
  const positionClasses = {
    'bottom-right': 'top-full right-0 mt-1',
    'bottom-left': 'top-full left-0 mt-1',
    'top-right': 'bottom-full right-0 mb-1',
    'top-left': 'bottom-full left-0 mb-1',
  };

  return (
    <div ref={menuRef} className="relative">
      {triggerElement}
      
      {/* Dropdown Menu */}
      <div
        className={`
          absolute ${positionClasses[position]} z-50
          min-w-[160px] py-1
          bg-slate-800 border border-slate-700 rounded-lg shadow-xl
          backdrop-blur-sm
        `}
        role="menu"
        aria-orientation="vertical"
      >
        {items.map((item, index) => {
          const variantClasses = {
            default: 'text-slate-200 hover:bg-slate-700/50',
            danger: 'text-red-400 hover:bg-red-500/10',
          };

          const classes = variantClasses[item.variant || 'default'];

          return (
            <button
              key={index}
              onClick={() => handleItemClick(item)}
              disabled={item.disabled}
              title={item.tooltip}
              className={`
                w-full px-4 py-2 text-left text-sm
                flex items-center gap-2
                transition-colors
                ${classes}
                ${item.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                disabled:hover:bg-transparent
              `}
              role="menuitem"
            >
              {item.icon && (
                <span className="flex-shrink-0">
                  {item.icon}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
