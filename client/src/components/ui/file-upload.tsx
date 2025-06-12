import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { cn } from '../../lib/utils';
import { Button } from './button';
import { X, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Progress } from './progress';

interface FileUploadProps {
  value?: File | string;
  onChange: (file: File | string) => void;
  onError?: (error: string) => void;
  maxSize?: number; // in bytes
  accept?: Record<string, string[]>;
  className?: string;
  aspectRatio?: number; // width/height ratio for preview
  minWidth?: number; // minimum width in pixels
  minHeight?: number; // minimum height in pixels
  maxWidth?: number; // maximum width in pixels
  maxHeight?: number; // maximum height in pixels
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/webp': ['.webp']
};

export function FileUpload({
  value,
  onChange,
  onError,
  maxSize = MAX_FILE_SIZE,
  accept = ACCEPTED_FILE_TYPES,
  className,
  aspectRatio,
  minWidth = 100,
  minHeight = 100,
  maxWidth = 2000,
  maxHeight = 2000,
  disabled = false
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  console.log("[DEBUG] FileUpload component - value prop:", value);
  console.log("[DEBUG] FileUpload component - preview state:", preview);

  // Reset preview when value changes to string (URL)
  useEffect(() => {
    if (typeof value === 'string' && value) {
      setPreview(value);
      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setDimensions({ width: img.width, height: img.height });
      };
      img.src = value;
    } else if (!value) {
      setPreview(null);
      setDimensions(null);
    }
  }, [value]);

  // Handle file validation and preview
  const processFile = useCallback(async (file: File) => {
    // Reset states
    setError(null);
    setIsLoading(true);
    setDimensions(null);

    try {
      // Validate file size
      if (file.size > maxSize) {
        const errorMsg = `File size must be less than ${maxSize / (1024 * 1024)}MB`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Validate file type
      const fileType = file.type;
      if (!Object.keys(accept).includes(fileType)) {
        const errorMsg = 'Invalid file type. Please upload an image (JPEG, PNG, GIF, or WebP)';
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      // Create preview and get dimensions
      const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve({ width: img.width, height: img.height });
        };
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        img.src = URL.createObjectURL(file);
      });

      // Validate dimensions
      if (dimensions.width < minWidth || dimensions.height < minHeight) {
        const errorMsg = `Image dimensions must be at least ${minWidth}x${minHeight} pixels`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (dimensions.width > maxWidth || dimensions.height > maxHeight) {
        const errorMsg = `Image dimensions must not exceed ${maxWidth}x${maxHeight} pixels`;
        setError(errorMsg);
        onError?.(errorMsg);
        return;
      }

      if (aspectRatio) {
        const ratio = dimensions.width / dimensions.height;
        const tolerance = 0.1; // 10% tolerance
        if (Math.abs(ratio - aspectRatio) > tolerance) {
          const errorMsg = `Image aspect ratio must be ${aspectRatio.toFixed(2)} (width/height)`;
          setError(errorMsg);
          onError?.(errorMsg);
          return;
        }
      }

      setDimensions(dimensions);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);

      // Update form value
      onChange(file);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to process image';
      setError(errorMsg);
      onError?.(errorMsg);
      setIsLoading(false);
    }
  }, [maxSize, accept, onChange, onError, aspectRatio, minWidth, minHeight, maxWidth, maxHeight]);

  // Handle dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      processFile(acceptedFiles[0]);
    }
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
    disabled: disabled || isLoading
  });

  // Handle remove file
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreview(null);
    setDimensions(null);
    onChange('');
  };

  return (
    <div className={cn('w-full', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors relative',
          !disabled && !isLoading && 'cursor-pointer hover:border-primary/50 hover:bg-primary/5',
          isDragActive && !disabled && 'border-primary bg-primary/10',
          error && 'border-destructive hover:border-destructive/50 hover:bg-destructive/5',
          preview && 'border-transparent hover:border-transparent',
          (isLoading || disabled) && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} disabled={isLoading || disabled} />
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
        
        {preview ? (
          <div className="relative group">
            <div className="relative aspect-[4/3] w-full max-w-md mx-auto overflow-hidden rounded-lg bg-muted">
              <img
                src={preview}
                alt="Preview"
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>
            {dimensions && (
              <p className="mt-2 text-xs text-muted-foreground">
                {dimensions.width} × {dimensions.height} pixels
              </p>
            )}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleRemove}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              {isDragActive ? (
                <Upload className="h-6 w-6 text-primary" />
              ) : (
                <ImageIcon className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {isDragActive ? (
                <p>Drop the image here...</p>
              ) : (
                <div className="space-y-1">
                  <p>Drag & drop an image here, or click to select</p>
                  <div className="text-xs space-y-0.5">
                    <p>Max size: {maxSize / (1024 * 1024)}MB</p>
                    <p>Supported: JPEG, PNG, GIF, WebP</p>
                    {aspectRatio && (
                      <p>Aspect ratio: {aspectRatio.toFixed(2)} (width/height)</p>
                    )}
                    <p>Dimensions: {minWidth}×{minHeight} to {maxWidth}×{maxHeight} pixels</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-destructive">{error}</p>
      )}
    </div>
  );
} 