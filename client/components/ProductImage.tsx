import { useState, useRef, useEffect } from "react";
import { Package } from "lucide-react";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIconSize?: "sm" | "md" | "lg";
  loading?: "lazy" | "eager";
  priority?: boolean;
  sizes?: string;
}

export function ProductImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackIconSize = "md",
  loading = "lazy",
  priority = false,
  sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(priority || loading === "eager");
  const imgRef = useRef<HTMLImageElement>(null);

  // Debug log only for empty or problematic sources
  if (!src || src.trim() === "" || hasError) {
    console.log(
      `🖼️ ProductImage issue: src="${src}", alt="${alt}", hasError=${hasError}, shouldLoad=${shouldLoad}`,
    );
  }

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-32 w-32",
  };

  // Intersection Observer for smart lazy loading
  useEffect(() => {
    if (shouldLoad || !src) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: "50px", // Start loading 50px before image comes into view
        threshold: 0.1,
      },
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [shouldLoad, src]);

  // Preload high priority images
  useEffect(() => {
    if (priority && src && shouldLoad) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = src;
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [src, priority, shouldLoad]);

  const handleError = (event?: any) => {
    const errorDetails = {
      src,
      alt,
      currentSrc: event?.target?.currentSrc,
      complete: event?.target?.complete,
      naturalWidth: event?.target?.naturalWidth,
      naturalHeight: event?.target?.naturalHeight,
      errorType: event?.type,
      errorMessage: event?.message,
    };

    console.error(`❌ Image failed to load: "${src}"`, errorDetails);

    // Test if the URL is accessible
    if (src) {
      fetch(src, { method: 'HEAD' }).then(response => {
        console.log(`🔗 Image URL test for "${src}": ${response.status} ${response.statusText}`);
      }).catch(fetchError => {
        console.error(`🌐 Network error for "${src}":`, fetchError.message);
      });
    }

    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!src || hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-muted/50">
        <Package
          className={`${iconSizes[fallbackIconSize]} text-muted-foreground/50`}
        />
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative w-full h-full">
      {isLoading && shouldLoad && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div
            className={`${iconSizes[fallbackIconSize]} rounded bg-muted-foreground/20 animate-pulse`}
          />
        </div>
      )}
      {shouldLoad && (
        <img
          src={src}
          alt={alt}
          className={className}
          loading={loading}
          sizes={sizes}
          onError={handleError}
          onLoad={handleLoad}
          style={{
            display: hasError ? "none" : "block",
            transition: "opacity 0.2s ease-in-out",
            opacity: isLoading ? 0.7 : 1,
          }}
          decoding="async"
          fetchpriority={priority ? "high" : "auto"}
        />
      )}
    </div>
  );
}
