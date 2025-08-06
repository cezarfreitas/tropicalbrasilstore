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
  onColorVariantClick: (
    productId: number,
    imageUrl: string,
    event: React.MouseEvent,
  ) => void;
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
  const productImageUrl = useProductImage(
    product,
    selectedVariantImages[product.id],
  );

  return (
    <Card
      key={product.id}
      className="group cursor-pointer hover:shadow-md transition-all duration-200 relative border border-gray-200 hover:border-gray-300 rounded-lg overflow-hidden bg-white active:scale-[0.99] touch-manipulation"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-0 relative">
        {/* Product Image - Otimizado para mobile */}
        <div className="aspect-square relative overflow-hidden bg-white">
          {productImageUrl ? (
            <img
              src={productImageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-102 transition-all duration-200 p-1.5 sm:p-2"
              loading={index < 8 ? "eager" : "lazy"}
              onError={(e) => {
                console.error(
                  `Failed to load image for product ${product.id}: ${productImageUrl}`,
                );
                e.currentTarget.style.display = "none";
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
              className="absolute top-1 left-1 text-[8px] sm:text-[9px] bg-primary text-white px-1 py-0.5 rounded font-medium"
            >
              {product.category_name}
            </Badge>
          )}

          {/* Variant Thumbnails - Mobile friendly */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-1 right-1">
              <div className="flex gap-0.5">
                {product.available_colors.slice(0, 2).map((color) => (
                  <div
                    key={color.id}
                    className="w-4 h-4 sm:w-5 sm:h-5 rounded border border-white cursor-pointer active:scale-95 transition-all duration-200 overflow-hidden bg-gray-100 touch-manipulation"
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
                          e.currentTarget.style.display = "none";
                          e.currentTarget.parentElement!.style.backgroundColor =
                            getColorValue(color);
                        }}
                      />
                    ) : (
                      <div
                        className="w-full h-full rounded"
                        style={{
                          backgroundColor: getColorValue(color),
                        }}
                      ></div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Responsivo */}
        <div className="p-1.5 sm:p-2 space-y-1">
          <div>
            <h3 className="font-medium text-xs sm:text-sm text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </div>

          {/* Pricing - Mobile friendly */}
          {product.base_price && (
            <div className="bg-gray-50 rounded p-1">
              <PriceDisplay
                price={product.base_price || 0}
                className="text-[10px] sm:text-xs font-semibold text-primary"
              />
            </div>
          )}

          {/* Stock indicator */}
          <div className="flex items-center gap-1">
            <div
              className={`w-1.5 h-1.5 rounded-full ${
                product.total_stock > 0 ? "bg-green-500" : "bg-orange-500"
              }`}
            />
            <span className="text-[9px] sm:text-[10px] text-gray-600">
              {product.total_stock > 0 ? "Em estoque" : "Consulte"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
