/**
 * ItemForm Component
 * 
 * Form for creating and editing inventory items.
 * Includes validation for required fields and max lengths (T048).
 * Includes image upload capability (T021, T022).
 * 
 * @see T043, T048, T021, T022
 */

import { useState, useEffect } from 'react';
import type { Item, CreateItemData, UpdateItemData } from '../services/itemService';
import { uploadItemImage, deleteItemImage } from '../services/itemService';
import { getCategories } from '../services/adminApi';
import type { CategoryWithCount } from '../types/admin';
import ImageUpload from './ImageUpload';

interface ItemFormProps {
  item?: Item | null;
  onSubmit: (data: CreateItemData | UpdateItemData) => Promise<Item | void>;
  onCancel: () => void;
  onComplete?: () => void; // Called after all operations complete
  isLoading?: boolean;
}

export default function ItemForm({ item, onSubmit, onCancel, onComplete, isLoading = false }: ItemFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'Available' | 'Lent' | 'Maintenance'>('Available');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [shouldDeleteImage, setShouldDeleteImage] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsCategoriesLoading(true);
        const data = await getCategories();
        setCategories(data);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Populate form if editing existing item
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description || '');
      setCategory(item.category);
      setStatus(item.status);
      setImageFile(null);
      setShouldDeleteImage(false);
      setImageError(null);
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
      // Clear any previous image errors
      setImageError(null);
      
      // Submit the item data first
      const result = await onSubmit(data);

      // Get item ID from result (for new items) or existing item
      const itemId = (result as Item)?.id || item?.id;

      // If we have image operations to perform
      if (itemId && (imageFile || shouldDeleteImage)) {
        setIsImageLoading(true);

        try {
          // Delete image if requested
          if (shouldDeleteImage && item?.imageUrl) {
            await deleteItemImage(itemId);
          }

          // Upload new image if selected
          if (imageFile) {
            // Validate file before upload
            const validationError = validateImageFile(imageFile);
            if (validationError) {
              setImageError(validationError);
              setIsImageLoading(false);
              return; // Don't complete if image upload fails
            }

            await uploadItemImage(itemId, imageFile);
          }
        } catch (imageErr: any) {
          // Handle image-specific errors
          const errorMsg = parseImageError(imageErr);
          setImageError(errorMsg);
          setIsImageLoading(false);
          return; // Don't complete if image upload fails
        }

        setIsImageLoading(false);
      }

      // Signal completion after all operations
      if (onComplete) {
        onComplete();
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setIsImageLoading(false);
      throw error; // Re-throw to let parent handle
    }
  };

  // Validate image file
  const validateImageFile = (file: File): string | null => {
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Only JPG, PNG, and WebP images are allowed.';
    }

    if (file.size > MAX_SIZE) {
      return `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds 5MB limit.`;
    }

    return null;
  };

  // Parse image upload error into user-friendly message
  const parseImageError = (error: any): string => {
    const message = error?.message || error?.toString() || '';
    
    if (message.includes('FILE_TYPE_INVALID') || message.includes('file type')) {
      return 'Invalid file type. Only JPG, PNG, and WebP images are allowed.';
    }
    if (message.includes('LIMIT_FILE_SIZE') || message.includes('File too large')) {
      return 'Image file is too large. Maximum size is 5MB.';
    }
    if (message.includes('Network') || message.includes('network')) {
      return 'Network error. Please check your connection and try again.';
    }
    if (message.includes('404')) {
      return 'Item not found. Please refresh and try again.';
    }
    
    return 'Failed to upload image. Please try again.';
  };

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    setShouldDeleteImage(false);
  };

  const handleImageRemove = () => {
    setImageFile(null);
    if (item?.imageUrl) {
      setShouldDeleteImage(true);
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
        {isCategoriesLoading ? (
          <div className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-800/50 text-slate-400">
            Loading categories...
          </div>
        ) : categories.length > 0 ? (
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            disabled={isLoading}
            className={`w-full px-3 py-2 border rounded-lg bg-slate-800/50 text-slate-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed
                       ${errors.category ? 'border-red-500' : 'border-slate-600'}`}
            aria-invalid={!!errors.category}
            aria-describedby={errors.category ? 'category-error' : undefined}
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>
                {cat.name} ({cat.itemCount} items)
              </option>
            ))}
          </select>
        ) : (
          <div className="space-y-2">
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
            <p className="text-xs text-amber-400">
              No categories available. Enter a category name to create a new one.
            </p>
          </div>
        )}
        {errors.category && (
          <p id="category-error" className="mt-1 text-sm text-red-400">
            {errors.category}
          </p>
        )}
        {!isCategoriesLoading && categories.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            Select from {categories.length} existing categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        )}
      </div>

      {/* Image Upload Field (T021) */}
      <ImageUpload
        currentImageUrl={item?.imageUrl}
        onImageSelect={handleImageSelect}
        onImageRemove={handleImageRemove}
        disabled={isLoading || isImageLoading}
      />
      {imageError && (
        <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <svg className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-red-400">{imageError}</p>
        </div>
      )}
      {isImageLoading && (
        <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex items-start gap-2">
          <svg className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-sm text-blue-400">Uploading image...</p>
        </div>
      )}

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
          disabled={isLoading || isImageLoading}
          className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg font-medium
                     hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading || isImageLoading ? 'Saving...' : item ? 'Update Item' : 'Create Item'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading || isImageLoading}
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
