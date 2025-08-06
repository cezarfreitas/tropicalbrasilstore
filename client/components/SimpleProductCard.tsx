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

  // Remove problematic fetch to avoid AbortError issues
  // Products should have proper images from the main API

  // Simplified image logic without enhanced data fetch
  const selectedVariantImage = selectedColorImage;
  const finalImageSrc = getImageUrl(selectedVariantImage || product.photo);

  // Try available_colors as fallback
  let bestImageSrc = finalImageSrc;
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

  // Handle product click - check authentication first
  const handleProductClick = () => {
    if (isAuthenticated) {
      onProductClick(product.id);
    } else {
      onLoginClick();
    }
  };

  return (
    <Card
      className="group cursor-pointer border border-gray-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-all duration-200 hover:border-gray-300"
      onClick={handleProductClick}
    >
      <CardContent className="p-0 h-full flex flex-col">
        {/* Product Image Container - No margins, optimized for square photos */}
        <div className="aspect-square relative bg-white overflow-hidden">
          <ProductImage
            src={bestImageSrc}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-200"
            loading={index < 8 ? "eager" : "lazy"}
            product={{
              photo: product.photo,
              available_colors: product.available_colors,
            }}
          />

          {/* Category Badge - Smaller, more compact */}
          {product.category_name && (
            <Badge className="absolute top-1 left-1 bg-primary text-white px-1 py-0.5 text-[8px] font-medium rounded">
              {product.category_name}
            </Badge>
          )}

          {/* Color Variants - Smaller and positioned closer to edge */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-1 right-1">
              <div className="flex gap-0.5">
                {product.available_colors.slice(0, 3).map((color, idx) => (
                  <div
                    key={color.id}
                    className={`w-4 h-4 rounded-full border border-white cursor-pointer bg-gray-100 transition-transform duration-200 ${
                      idx > 1 ? "hidden sm:block" : ""
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
                      <div className="w-full h-full rounded-full"></div>
                    )}
                  </div>
                ))}
                {/* Show count if more than 3 colors */}
                {product.available_colors.length > 3 && (
                  <div className="w-4 h-4 rounded-full bg-gray-800/80 border border-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">
                      +{product.available_colors.length - 3}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Reduced padding and spacing */}
        <div className="p-1.5 flex-1 flex flex-col">
          <h3 className="font-medium text-xs text-gray-900 mb-1.5 line-clamp-2 leading-tight">
            {product.name}
          </h3>

          {/* Pricing with cart icon - Compact design */}
          {product.base_price && (
            <div className="bg-gray-50 rounded p-1.5 flex items-center justify-between">
              <div className="flex-1">
                <PriceDisplay
                  price={product.base_price}
                  suggestedPrice={product.suggested_price}
                  variant="default"
                  onLoginClick={onLoginClick}
                  className="[&>div:first-child]:text-xs [&>div:first-child]:font-semibold"
                />
              </div>

              {/* Cart Icon Button */}
              {isAuthenticated && isApproved && (
                <button
                  className="ml-1.5 p-1 bg-primary hover:bg-primary/90 text-white rounded transition-colors duration-200 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleProductClick();
                  }}
                  title="Adicionar ao carrinho"
                >
                  <ShoppingCart className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
