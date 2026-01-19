/**
 * ItemForm Component
 * 
 * Form for creating and editing inventory items.
 * Includes validation for required fields and max lengths (T048).
 * 
 * @see T043, T048
 */

import { useState, useEffect } from 'react';
import type { Item, CreateItemData, UpdateItemData } from '../services/itemService';

interface ItemFormProps {
  item?: Item | null;
  onSubmit: (data: CreateItemData | UpdateItemData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ItemForm({ item, onSubmit, onCancel, isLoading = false }: ItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Available' | 'Lent' | 'Maintenance'>('Available');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form if editing existing item
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setCategory(item.category);
      setStatus(item.status);
    }
  }, [item]);

  // Validate form (T048)
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Item name is required';
    } else if (name.length > 100) {
      newErrors.name = 'Item name must not exceed 100 characters';
    }

    // Category validation
    if (!category.trim()) {
      newErrors.category = 'Category is required';
    } else if (category.length > 50) {
      newErrors.category = 'Category must not exceed 50 characters';
    }

    // Description validation
    if (description.length > 500) {
      newErrors.description = 'Description must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateItemData | UpdateItemData = {
      name: name.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      status,
    };

    try {
      await onSubmit(data);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-slate-200 mb-1">
          Item Name <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg bg-slate-800/50 text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${errors.name ? 'border-red-500' : 'border-slate-600'}`}
          placeholder="e.g., Dell XPS 15 Laptop"
          maxLength={100}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? 'name-error' : undefined}
        />
        {errors.name && (
          <p id="name-error" className="mt-1 text-sm text-red-400">
            {errors.name}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{name.length}/100 characters</p>
      </div>

      {/* Description Field */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-slate-200 mb-1">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading}
          rows={3}
          className={`w-full px-3 py-2 border rounded-lg bg-slate-800/50 text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed resize-none
                     ${errors.description ? 'border-red-500' : 'border-slate-600'}`}
          placeholder="Additional details about the item..."
          maxLength={500}
          aria-invalid={!!errors.description}
          aria-describedby={errors.description ? 'description-error' : undefined}
        />
        {errors.description && (
          <p id="description-error" className="mt-1 text-sm text-red-400">
            {errors.description}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{description.length}/500 characters</p>
      </div>

      {/* Category Field */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-slate-200 mb-1">
          Category <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          disabled={isLoading}
          className={`w-full px-3 py-2 border rounded-lg bg-slate-800/50 text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     ${errors.category ? 'border-red-500' : 'border-slate-600'}`}
          placeholder="e.g., Hardware, Tools, Kitchen"
          maxLength={50}
          aria-invalid={!!errors.category}
          aria-describedby={errors.category ? 'category-error' : undefined}
        />
        {errors.category && (
          <p id="category-error" className="mt-1 text-sm text-red-400">
            {errors.category}
          </p>
        )}
        <p className="mt-1 text-xs text-slate-400">{category.length}/50 characters</p>
      </div>

      {/* Status Field */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-200 mb-1">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'Available' | 'Lent' | 'Maintenance')}
          disabled={isLoading}
          className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800/50 text-slate-200
                     focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="Available">Available</option>
          <option value="Lent">Lent</option>
          <option value="Maintenance">Maintenance</option>
        </select>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1 px-4 py-2 bg-slate-700 text-slate-200 rounded-lg font-medium
                     hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
