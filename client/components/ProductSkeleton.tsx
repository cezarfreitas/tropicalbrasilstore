import { Card, CardContent } from "@/components/ui/card";

interface ProductSkeletonProps {
  count?: number;
}

function SingleProductSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200 rounded-xl bg-white">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Skeleton - Optimized for square photos */}
        <div className="aspect-square relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />

          {/* Category Badge Skeleton */}
          <div className="absolute top-3 left-3">
            <div className="h-5 w-16 bg-primary/20 rounded-full animate-pulse" />
          </div>

          {/* Variant Colors Skeleton */}
          <div className="absolute bottom-3 right-3">
            <div className="flex gap-1.5">
              <div className="w-7 h-7 rounded-full bg-gray-300 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-300 animate-pulse" />
              <div className="w-7 h-7 rounded-full bg-gray-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="p-4 flex-1 flex flex-col space-y-3">
          {/* Product Name - Two lines */}
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-4/5" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/5" />
          </div>

          {/* Price Container */}
          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div className="h-5 bg-primary/20 rounded animate-pulse w-20" />
          </div>

          {/* Add to Cart Button */}
          <div className="mt-auto">
            <div className="h-10 bg-primary/20 rounded-lg animate-pulse w-full" />
          </div>
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
