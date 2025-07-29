import { Card, CardContent } from "@/components/ui/card";

interface ProductSkeletonProps {
  count?: number;
}

function SingleProductSkeleton() {
  return (
    <Card className="overflow-hidden border border-border/50">
      <CardContent className="p-0">
        {/* Image Skeleton */}
        <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
          <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted/50 to-muted animate-pulse" />
          {/* Category Badge Skeleton */}
          <div className="absolute top-1 left-1 sm:top-2 sm:left-2">
            <div className="h-4 sm:h-5 w-12 sm:w-16 bg-muted-foreground/20 rounded animate-pulse" />
          </div>
          {/* Colors Skeleton - Mobile */}
          <div className="absolute bottom-1 right-1 sm:hidden">
            <div className="flex gap-1 bg-white/80 rounded-full px-1.5 py-1">
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 animate-pulse" />
              <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="p-2 sm:p-4 space-y-2 sm:space-y-3">
          {/* Product Name */}
          <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-3/4" />
          
          {/* Price and Colors */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              {/* Price */}
              <div className="h-4 sm:h-6 bg-primary/20 rounded animate-pulse w-20 sm:w-24" />
              
              {/* Colors - Desktop */}
              <div className="hidden sm:flex items-center gap-1">
                <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />
                <div className="w-4 h-4 rounded-full bg-muted-foreground/30 animate-pulse" />
              </div>
            </div>
            
            {/* Suggested Price */}
            <div className="h-3 bg-muted-foreground/20 rounded animate-pulse w-16 sm:w-20" />
          </div>

          {/* Add to Cart Button - Desktop */}
          <div className="hidden sm:block mt-2">
            <div className="h-8 bg-primary/20 rounded animate-pulse w-full" />
          </div>
        </div>

        {/* Add to Cart Icon - Mobile */}
        <div className="sm:hidden absolute bottom-2 right-2">
          <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse" />
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
