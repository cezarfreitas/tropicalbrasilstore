import { Card, CardContent } from "@/components/ui/card";

interface ProductSkeletonProps {
  count?: number;
}

function SingleProductSkeleton() {
  return (
    <Card className="overflow-hidden border border-gray-200 rounded-xl bg-white">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Image Skeleton - No margins */}
        <div className="aspect-square relative overflow-hidden bg-white">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />

          {/* Category Badge Skeleton - Smaller */}
          <div className="absolute top-1.5 left-1.5">
            <div className="h-4 w-12 bg-primary/20 rounded animate-pulse" />
          </div>

          {/* Variant Colors Skeleton - Smaller */}
          <div className="absolute bottom-1.5 right-1.5">
            <div className="flex gap-1">
              <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
              <div className="w-5 h-5 rounded-full bg-gray-300 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Info Skeleton - Reduced padding */}
        <div className="p-2.5 flex-1 flex flex-col space-y-2">
          {/* Product Name - Compact */}
          <div className="space-y-1">
            <div className="h-3.5 bg-gray-200 rounded animate-pulse w-4/5" />
            <div className="h-3.5 bg-gray-200 rounded animate-pulse w-3/5" />
          </div>

          {/* Price Container with cart icon - Compact */}
          <div className="bg-gray-50 rounded-md p-2 flex items-center justify-between">
            <div className="h-4 bg-primary/20 rounded animate-pulse w-16" />
            <div className="w-7 h-7 bg-primary/20 rounded-md animate-pulse flex-shrink-0" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductSkeleton({ count = 8 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 sm:gap-5 lg:gap-6">
      {Array.from({ length: count }, (_, index) => (
        <SingleProductSkeleton key={`skeleton-${index}`} />
      ))}
    </div>
  );
}
