/**
 * ImageUpload Component
 * 
 * Reusable component for uploading images with preview and validation.
 * Validates file type (JPG, PNG, WebP) and size (max 5MB).
 * 
 * @see T018 - US1: Image Upload Component
 */

import { useState, useRef } from 'react';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onImageSelect: (file: File) => void;
  onImageRemove: () => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export default function ImageUpload({ 
  currentImageUrl, 
  onImageSelect, 
  onImageRemove,
  disabled = false 
}: ImageUploadProps) {
  // Construct full URL for existing images (only if it's a relative path)
  // Images are served from /uploads, not /api/v1
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
  const SERVER_BASE = API_BASE.replace(/\/api\/v1$/, '');
  const fullImageUrl = currentImageUrl && currentImageUrl.startsWith('/') 
    ? `${SERVER_BASE}${currentImageUrl}` 
    : currentImageUrl;
  
  const [preview, setPreview] = useState<string | null>(fullImageUrl || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return 'Invalid file type. Please upload a JPG, PNG, or WebP image.';
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return 'File size exceeds 5MB limit. Please choose a smaller image.';
    }

    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setPreview(null);
      return;
    }

    // Clear previous error
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Notify parent component
    onImageSelect(file);
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageRemove();
  };

  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-200">
        Item Image
      </label>

      {/* Preview or Upload Button */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Item preview"
            className="w-full h-48 object-cover rounded-lg border border-slate-700"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={handleChooseFile}
              disabled={disabled}
              className="px-3 py-1.5 text-sm bg-blue-500/20 text-blue-400 rounded-lg
                         hover:bg-blue-500/30 focus:outline-none focus:ring-2 focus:ring-blue-500
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Change image"
            >
              Change
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="px-3 py-1.5 text-sm bg-red-500/20 text-red-400 rounded-lg
                         hover:bg-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500
                         transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Remove image"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleChooseFile}
          disabled={disabled}
          className="w-full h-48 border-2 border-dashed border-slate-700 rounded-lg
                     bg-slate-800/50 hover:border-slate-600 hover:bg-slate-800
                     transition-colors flex flex-col items-center justify-center gap-2
                     disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Upload image"
        >
          <svg
            className="h-12 w-12 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="text-sm text-slate-400">Click to upload image</span>
          <span className="text-xs text-slate-500">JPG, PNG, WebP (max 5MB)</span>
        </button>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        disabled={disabled}
        className="hidden"
        aria-label="File input"
      />

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-400 flex items-center gap-1">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {/* Help text */}
      <p className="text-xs text-slate-500">
        Upload an image to help visually identify this item. Supported formats: JPG, PNG, WebP. Maximum size: 5MB.
      </p>
    </div>
  );
}
