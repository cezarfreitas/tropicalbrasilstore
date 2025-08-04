import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ProductImage } from "@/components/ProductImage";
import { PriceDisplay } from "@/components/PriceDisplay";
import { useProductImage } from "@/hooks/use-product-image";
import { getImageUrl } from "@/lib/image-utils";

interface ProductCardProps {
  product: any;
  index: number;
  selectedVariantImages: Record<number, string>;
  onProductClick: (productId: number) => void;
  onColorVariantClick: (productId: number, imageUrl: string, event: React.MouseEvent) => void;
  getColorValue: (color: any) => string;
}

export function ProductCard({
  product,
  index,
  selectedVariantImages,
  onProductClick,
  onColorVariantClick,
  getColorValue,
}: ProductCardProps) {
  const productImageUrl = useProductImage(product, selectedVariantImages[product.id]);

  return (
    <Card
      key={product.id}
      className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative border border-gray-200 hover:border-primary/40 rounded-lg sm:rounded-xl overflow-hidden bg-white active:scale-[0.98] sm:hover:-translate-y-1 touch-manipulation"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-0 relative">
        {/* Product Image - Otimizado para mobile */}
        <div className="aspect-square relative overflow-hidden bg-white">
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300 p-2 sm:p-3"
              loading={index < 8 ? "eager" : "lazy"}
              onError={(e) => {
                console.error(`Failed to load image for product ${product.id}: ${productImageUrl}`);
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-4xl text-gray-400">📦</div>
            </div>
          )}

          {/* Category Badge - Mobile otimizado */}
          {product.category_name && (
            <Badge
              variant="secondary"
              className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[9px] sm:text-[10px] md:text-xs bg-primary text-white px-1 sm:px-1.5 py-0.5 rounded-full shadow-md font-medium"
            >
              {product.category_name}
            </Badge>
          )}

          {/* Variant Thumbnails - Mobile friendly */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5">
              <div className="flex gap-0.5 sm:gap-1">
                {product.available_colors.slice(0, 2).map((color) => (
                  <div
                    key={color.id}
                    className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-md sm:rounded-lg border-2 border-white cursor-pointer active:scale-95 sm:hover:scale-110 transition-all duration-200 shadow-md sm:shadow-lg overflow-hidden bg-gray-100 touch-manipulation"
                    title={`${color.name}${color.hex_code ? ` (${color.hex_code})` : ""}`}
                    onClick={(e) =>
                      color.image_url &&
                      onColorVariantClick(product.id, color.image_url, e)
                    }
                  >
                    {color.image_url ? (
                      <img
                        src={getImageUrl(color.image_url)}
                        alt={color.name}
                        className="w-full h-full object-contain"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement!.style.backgroundColor = getColorValue(color);
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-[6px] sm:text-[7px] lg:text-[8px] font-bold text-white rounded-lg"
                        style={{
                          backgroundColor: getColorValue(color),
                        }}
                      >
                        {color.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Responsivo */}
        <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 md:space-y-2">
          <div>
            <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </div>

          {/* Pricing - Mobile friendly */}
          {product.base_price && (
            <div className="bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2">
              <PriceDisplay
                basePrice={product.base_price}
                className="text-[10px] sm:text-xs md:text-sm font-semibold text-primary"
              />
            </div>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <div
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                product.total_stock > 0 ? "bg-green-500" : "bg-orange-500"
              }`}
            />
            <span className="text-[9px] sm:text-[10px] md:text-xs text-gray-600">
              {product.total_stock > 0 ? "Em estoque" : "Consulte disponibilidade"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
