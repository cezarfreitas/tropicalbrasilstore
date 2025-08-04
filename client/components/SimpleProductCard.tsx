import { useState } from "react";
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
  index
}: SimpleProductCardProps) {
  const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);

  // Use the same logic as ProductDetail page - get the best image to display
  const getDisplayImageSrc = (): string | null => {
    // Priority: selected color image > first available color > product photo
    if (selectedColorImage) {
      return getImageUrl(selectedColorImage);
    }

    // Check available_colors for first image (same as page product logic)
    if (product.available_colors && product.available_colors.length > 0) {
      const firstColorWithImage = product.available_colors.find(color =>
        color.image_url && color.image_url.trim() !== ''
      );
      if (firstColorWithImage) {
        return getImageUrl(firstColorWithImage.image_url);
      }
    }

    // Fallback to product photo
    if (product.photo && product.photo.trim()) {
      return getImageUrl(product.photo);
    }

    return null;
  };

  const handleColorClick = (colorImageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColorImage(colorImageUrl);
  };

  const getColorBackgroundColor = (color: any) => {
    if (color.hex_code) return color.hex_code;
    
    const colorMap: { [key: string]: string } = {
      branco: "#FFFFFF", white: "#FFFFFF",
      preto: "#000000", black: "#000000",
      azul: "#0066CC", blue: "#0066CC",
      vermelho: "#CC0000", red: "#CC0000",
      verde: "#228B22", green: "#228B22",
      amarelo: "#FFFF99", yellow: "#FFFF99",
      rosa: "#FF6699", pink: "#FF6699",
      roxo: "#9966CC", purple: "#9966CC",
      laranja: "#FF6600", orange: "#FF6600",
      marrom: "#996633", brown: "#996633",
      cinza: "#999999", gray: "#999999", grey: "#999999",
    };
    
    const colorName = color.name?.toLowerCase();
    return colorName && colorMap[colorName] ? colorMap[colorName] : "#E5E7EB";
  };

  return (
    <Card
      className="cursor-pointer border border-gray-200 rounded-lg overflow-hidden bg-white"
      onClick={() => onProductClick(product.id)}
      style={{ minHeight: "300px", display: "block" }}
    >
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="aspect-square relative bg-white" style={{ minHeight: "200px" }}>
          {displayImageUrl && !imageError ? (
            <img
              src={displayImageUrl}
              alt={product.name}
              className="w-full h-full object-contain p-2"
              loading={index < 8 ? "eager" : "lazy"}
              onError={handleImageError}
              style={{ display: "block" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-4xl text-gray-400">📦</div>
              <div className="text-sm text-gray-600 ml-2">
                {displayImageUrl ? "Erro ao carregar" : "Sem imagem"}
              </div>
            </div>
          )}

          {/* Category Badge */}
          {product.category_name && (
            <Badge className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 text-xs">
              {product.category_name}
            </Badge>
          )}

          {/* Color Variants - Simplificado */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-2 right-2">
              <div className="flex gap-1">
                {product.available_colors
                  .slice(0, 2)
                  .map((color) => (
                    <div
                      key={color.id}
                      className="w-6 h-6 rounded border-2 border-white cursor-pointer bg-gray-100"
                      title={color.name}
                      onClick={(e) =>
                        color.image_url &&
                        handleColorClick(color.image_url, e)
                      }
                      style={{ backgroundColor: getColorBackgroundColor(color) }}
                    >
                      {color.image_url ? (
                        <img
                          src={getLocalImageUrl(color.image_url)}
                          alt={color.name}
                          className="w-full h-full object-contain rounded"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-xs font-bold text-white">
                          {color.name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Product Info - Simplificado */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-gray-900 mb-2">
            {product.name}
          </h3>

          {/* Debug Info */}
          <div className="text-xs text-gray-500 mb-2 bg-gray-100 p-2 rounded">
            <div>ID: {product.id} | Colors: {product.available_colors?.length || 0}</div>
            <div>Photo: {product.photo || "null"}</div>
            <div>First color image: {product.available_colors?.find(c => c.image_url)?.image_url || "null"}</div>
            <div>Display URL: {displayImageUrl || "null"}</div>
            <div>Image loads: {displayImageUrl ? "✅" : "❌"}</div>
          </div>

          {/* Pricing */}
          {product.base_price && (
            <div className="bg-gray-50 rounded p-2 mb-2">
              <PriceDisplay
                price={product.base_price}
                suggestedPrice={product.suggested_price}
                variant="default"
                onLoginClick={onLoginClick}
              />
            </div>
          )}

          {/* Add to Cart Button */}
          {isAuthenticated && isApproved && (
            <Button
              className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium h-10 rounded"
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product.id);
              }}
            >
              Adicionar ao Carrinho
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
