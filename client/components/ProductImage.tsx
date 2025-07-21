import { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIconSize?: 'sm' | 'md' | 'lg';
  loading?: 'lazy' | 'eager';
}

export function ProductImage({ 
  src, 
  alt, 
  className = "w-full h-full object-cover", 
  fallbackIconSize = 'md',
  loading = 'lazy'
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-32 w-32'
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/50">
        <Package className={`${iconSizes[fallbackIconSize]} text-muted-foreground/50`} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 animate-pulse">
          <div className={`${iconSizes[fallbackIconSize]} rounded bg-muted-foreground/20`} />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={className}
        loading={loading}
        onError={handleError}
        onLoad={handleLoad}
        style={{ display: hasError ? 'none' : 'block' }}
      />
    </div>
  );
}
