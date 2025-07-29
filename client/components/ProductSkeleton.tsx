import { Card, CardContent } from "@/components/ui/card";

interface ProductSkeletonProps {
  count?: number;
}

function SingleProductSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/50 rounded-lg sm:rounded-xl">
      <CardContent className="p-0 relative">
        {/* Image Skeleton */}
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />

          {/* Category Badge Skeleton */}
          <div className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5">
            <div className="h-4 w-12 sm:w-16 bg-primary/20 rounded-full animate-pulse" />
          </div>

          {/* Variant Colors Skeleton */}
          <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5">
            <div className="flex gap-0.5 sm:gap-1">
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-md sm:rounded-lg bg-gray-300 animate-pulse" />
              <div className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 rounded-md sm:rounded-lg bg-gray-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 md:space-y-2">
          {/* Product Name */}
          <div className="h-3 sm:h-4 bg-gray-200 rounded animate-pulse w-4/5" />

          {/* Price Container */}
          <div className="bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2">
            <div className="h-4 sm:h-5 bg-primary/20 rounded animate-pulse w-16 sm:w-20" />
          </div>

          {/* Add to Cart Button */}
          <div className="h-8 sm:h-10 md:h-12 bg-primary/20 rounded-md sm:rounded-lg animate-pulse w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductSkeleton({ count = 8 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: count }, (_, index) => (
        <SingleProductSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
