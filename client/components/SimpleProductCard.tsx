import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProductImage } from "@/components/ProductImage";
import { getImageUrl } from "@/lib/image-utils";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  photo?: string;
  category_name?: string;
  base_price?: number;
  suggested_price?: number;
  // available_colors comes from product_color_variants table with JOIN to colors
  available_colors?: Array<{
    id: number;
    name: string;
    hex_code?: string;
    image_url?: string; // This comes from product_color_variants.image_url column
  }>;
}

interface SimpleProductCardProps {
  product: Product;
  onProductClick: (productId: number) => void;
  onLoginClick: () => void;
  isAuthenticated: boolean;
  isApproved: boolean;
  index: number;
}

export function SimpleProductCard({
  product,
  onProductClick,
  onLoginClick,
  isAuthenticated,
  isApproved,
  index,
}: SimpleProductCardProps) {
  const [selectedColorImage, setSelectedColorImage] = useState<string | null>(
    null,
  );
  const [enhancedProductData, setEnhancedProductData] = useState<any>(null);

  // If no image available from listing API, try to fetch from individual product API
  useEffect(() => {
    const hasAnyImage = !!(
      product.photo ||
      (product.available_colors &&
        product.available_colors.some((c) => c.image_url))
    );

    if (!hasAnyImage && !enhancedProductData) {
      fetch(`/api/store/products/${product.id}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.variants && data.variants.length > 0) {
            setEnhancedProductData(data);
          }
        })
        .catch((error) => {
          console.error(
            `Failed to fetch enhanced data for product ${product.id}:`,
            error,
          );
        });
    }
  }, [
    product.id,
    product.photo,
    product.available_colors,
    enhancedProductData,
  ]);

  // EXACT same logic as ProductDetail page working example
  const selectedVariantImage = selectedColorImage;

  // This is the EXACT line that works in ProductDetail.tsx line 571-572:
  // <ProductImage src={getImageUrl(selectedVariantImage || product.photo)} />
  const finalImageSrc = getImageUrl(selectedVariantImage || product.photo);

  // Additional check for available_colors as fallback (for product_color_variants.image_url)
  let bestImageSrc = finalImageSrc;

  // Try available_colors from listing API
  if (
    !bestImageSrc &&
    product.available_colors &&
    product.available_colors.length > 0
  ) {
    const firstColorWithImage = product.available_colors.find(
      (c) => c.image_url,
    );
    if (firstColorWithImage && firstColorWithImage.image_url) {
      bestImageSrc = getImageUrl(firstColorWithImage.image_url);
    }
  }

  // Try enhanced data from individual product API (contains pcv.image_url)
  if (!bestImageSrc && enhancedProductData && enhancedProductData.variants) {
    const firstVariantWithImage = enhancedProductData.variants.find(
      (v) => v.image_url,
    );
    if (firstVariantWithImage && firstVariantWithImage.image_url) {
      bestImageSrc = getImageUrl(firstVariantWithImage.image_url);
    }
  }

  const handleColorClick = (colorImageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColorImage(colorImageUrl);
  };

  const getColorBackgroundColor = (color: any) => {
    if (color.hex_code) return color.hex_code;

    const colorMap: { [key: string]: string } = {
      branco: "#FFFFFF",
      white: "#FFFFFF",
      preto: "#000000",
      black: "#000000",
      azul: "#0066CC",
      blue: "#0066CC",
      vermelho: "#CC0000",
      red: "#CC0000",
      verde: "#228B22",
      green: "#228B22",
      amarelo: "#FFFF99",
      yellow: "#FFFF99",
      rosa: "#FF6699",
      pink: "#FF6699",
      roxo: "#9966CC",
      purple: "#9966CC",
      laranja: "#FF6600",
      orange: "#FF6600",
      marrom: "#996633",
      brown: "#996633",
      cinza: "#999999",
      gray: "#999999",
      grey: "#999999",
    };

    const colorName = color.name?.toLowerCase();
    return colorName && colorMap[colorName] ? colorMap[colorName] : "#E5E7EB";
  };

  return (
    <Card
      className="group cursor-pointer border border-gray-200 rounded-xl overflow-hidden bg-white hover:shadow-lg transition-all duration-300 hover:border-primary/40 hover:-translate-y-1"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Product Image Container - Optimized for square photos */}
        <div className="aspect-square relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
          <ProductImage
            src={bestImageSrc}
            alt={product.name}
            className="w-full h-full object-contain p-3 group-hover:scale-105 transition-transform duration-300"
            loading={index < 8 ? "eager" : "lazy"}
            product={{
              photo: product.photo,
              available_colors: product.available_colors,
            }}
          />

          {/* Image overlay for better contrast on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-300 pointer-events-none" />

          {/* Category Badge - Modern design */}
          {product.category_name && (
            <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm text-white px-2 py-1 text-xs font-medium rounded-full shadow-md">
              {product.category_name}
            </Badge>
          )}

          {/* Color Variants - Enhanced design */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="flex gap-1.5">
                {product.available_colors.slice(0, 3).map((color, idx) => (
                  <div
                    key={color.id}
                    className={`w-7 h-7 rounded-full border-2 border-white shadow-md cursor-pointer bg-gray-100 hover:scale-110 transition-transform duration-200 ${
                      idx > 1 ? 'hidden sm:block' : ''
                    }`}
                    title={color.name}
                    onClick={(e) =>
                      color.image_url && handleColorClick(color.image_url, e)
                    }
                    style={{ backgroundColor: getColorBackgroundColor(color) }}
                  >
                    {color.image_url ? (
                      <img
                        src={getImageUrl(color.image_url)}
                        alt={color.name}
                        className="w-full h-full object-contain rounded-full"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-xs font-bold text-white">
                          {color.name?.charAt(0)?.toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {/* Show count if more than 3 colors */}
                {product.available_colors.length > 3 && (
                  <div className="w-7 h-7 rounded-full bg-gray-800/80 backdrop-blur-sm border-2 border-white shadow-md flex items-center justify-center">
                    <span className="text-xs font-bold text-white">
                      +{product.available_colors.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quick view indicator on hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium text-gray-800 shadow-lg">
              Ver Detalhes
            </div>
          </div>
        </div>

        {/* Product Info - Better spacing and typography */}
        <div className="p-4 flex-1 flex flex-col">
          <h3 className="font-semibold text-sm text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-primary transition-colors duration-200">
            {product.name}
          </h3>

          {/* Pricing - Enhanced design */}
          {product.base_price && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-100">
              <PriceDisplay
                price={product.base_price}
                suggestedPrice={product.suggested_price}
                variant="default"
                onLoginClick={onLoginClick}
                className="[&>div:first-child]:text-base [&>div:first-child]:font-bold"
              />
            </div>
          )}

          {/* Add to Cart Button - Improved design */}
          <div className="mt-auto">
            {isAuthenticated && isApproved ? (
              <Button
                className="w-full bg-primary hover:bg-primary/90 text-white text-sm font-medium h-10 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 group-hover:scale-[1.02]"
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product.id);
                }}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ver Produto
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full border-gray-200 text-gray-600 hover:border-primary hover:text-primary text-sm font-medium h-10 rounded-lg transition-all duration-200"
                onClick={(e) => {
                  e.stopPropagation();
                  onProductClick(product.id);
                }}
              >
                Ver Detalhes
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
