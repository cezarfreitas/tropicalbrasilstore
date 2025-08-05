import { useState, useRef, useEffect } from "react";
import { Package } from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  fallbackIconSize?: "sm" | "md" | "lg";
  loading?: "lazy" | "eager";
  priority?: boolean;
  sizes?: string;
  // Optional product data for automatic image selection
  product?: {
    photo?: string;
    color_variants?: Array<{
      image_url?: string;
      images?: string[];
      is_main_catalog?: boolean;
    }>;
    available_colors?: Array<{
      image_url?: string;
      name?: string;
    }>;
  };
}

export function ProductImage({
  src,
  alt,
  className = "w-full h-full object-cover",
  fallbackIconSize = "md",
  loading = "lazy",
  priority = false,
  sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 25vw, 20vw",
  product,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [shouldLoad, setShouldLoad] = useState(priority || loading === "eager");
  const imgRef = useRef<HTMLImageElement>(null);

  // Function to get the best available image from product data
  const getBestAvailableImage = (): string | null => {
    if (!product) return null;

    // First try main product photo
    if (product.photo) {
      return getImageUrl(product.photo);
    }

    // Then try main catalog variant
    const mainVariant = product.color_variants?.find(v => v.is_main_catalog);
    if (mainVariant) {
      if (mainVariant.images && mainVariant.images.length > 0) {
        return getImageUrl(mainVariant.images[0]);
      }
      if (mainVariant.image_url) {
        return getImageUrl(mainVariant.image_url);
      }
    }

    // Try color_variants (WooCommerce style)
    const firstVariantWithImage = product.color_variants?.find(
      v => (v.images && v.images.length > 0) || v.image_url
    );
    if (firstVariantWithImage) {
      if (firstVariantWithImage.images && firstVariantWithImage.images.length > 0) {
        return getImageUrl(firstVariantWithImage.images[0]);
      }
      if (firstVariantWithImage.image_url) {
        return getImageUrl(firstVariantWithImage.image_url);
      }
    }

    // Try available_colors (Store API style)
    const firstColorWithImage = product.available_colors?.find(c => c.image_url);
    if (firstColorWithImage && firstColorWithImage.image_url) {
      console.log(`🔍 Using available_colors image: "${firstColorWithImage.image_url}" for "${alt}"`);
      return getImageUrl(firstColorWithImage.image_url);
    }

    console.log(`🔍 No image found for "${alt}"`, {
      hasPhoto: !!product.photo,
      color_variants: product.color_variants?.length || 0,
      available_colors: product.available_colors?.length || 0,
      available_colors_with_images: product.available_colors?.filter(c => c.image_url).length || 0
    });
    return null;
  };

  // Get the final image source to use
  const finalSrc = src ? getImageUrl(src) : getBestAvailableImage();

  // Debug log for troubleshooting (only when there are issues)
  if (!finalSrc || hasError) {
    console.log(
      `🖼️ ProductImage issue: alt="${alt}", originalSrc="${src}", finalSrc="${finalSrc}", hasError=${hasError}`,
      { product: product ? { id: product?.id, photo: product?.photo, color_variants: product?.color_variants?.length, available_colors: product?.available_colors?.length } : 'none' }
    );
  }

  const iconSizes = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-32 w-32",
  };

  // Intersection Observer for smart lazy loading
  useEffect(() => {
    if (shouldLoad || !finalSrc) return;

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
  }, [shouldLoad, finalSrc]);

  // Preload high priority images
  useEffect(() => {
    if (priority && finalSrc && shouldLoad) {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = finalSrc;
      document.head.appendChild(link);

      return () => {
        if (document.head.contains(link)) {
          document.head.removeChild(link);
        }
      };
    }
  }, [finalSrc, priority, shouldLoad]);

  const handleError = (event?: any) => {
    const errorDetails = {
      originalSrc: src,
      finalSrc,
      alt,
      currentSrc: event?.target?.currentSrc,
      complete: event?.target?.complete,
      naturalWidth: event?.target?.naturalWidth,
      naturalHeight: event?.target?.naturalHeight,
      errorType: event?.type,
      errorMessage: event?.message,
    };

    console.error(`❌ Image failed to load: "${finalSrc}"`, errorDetails);

    // Test if the URL is accessible
    if (finalSrc) {
      fetch(finalSrc, { method: "HEAD" })
        .then((response) => {
          console.log(
            `🔗 Image URL test for "${finalSrc}": ${response.status} ${response.statusText}`,
          );
        })
        .catch((fetchError) => {
          console.error(`🌐 Network error for "${finalSrc}":`, fetchError.message);
        });
    }

    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  if (!finalSrc || hasError) {
    return (
      <div className="flex items-center justify-center w-full h-full">
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
          src={finalSrc}
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
