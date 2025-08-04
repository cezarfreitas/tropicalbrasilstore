import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ShoppingCart } from "lucide-react";

interface Product {
  id: number;
  name: string;
  photo?: string;
  category_name?: string;
  base_price?: number;
  suggested_price?: number;
  available_colors?: Array<{
    id: number;
    name: string;
    hex_code?: string;
    image_url?: string;
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
  const [imageError, setImageError] = useState(false);

  // Simple local image URL construction
  const getLocalImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl) return null;
    
    // Se já é uma URL completa, use como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Se começa com /uploads/, construa URL completa
    if (imageUrl.startsWith('/uploads/')) {
      return `${window.location.origin}${imageUrl}`;
    }
    
    // Se é apenas um nome de arquivo, assuma que está em /uploads/products/
    if (!imageUrl.includes('/')) {
      return `${window.location.origin}/uploads/products/${imageUrl}`;
    }
    
    return imageUrl;
  };

  // Get the best image to display
  const getDisplayImage = (): string | null => {
    // Priority: selected color image > product photo > first color with image
    if (selectedColorImage) {
      return getLocalImageUrl(selectedColorImage);
    }
    
    if (product.photo && product.photo.trim()) {
      return getLocalImageUrl(product.photo);
    }
    
    if (product.available_colors) {
      const firstColorWithImage = product.available_colors.find(color => 
        color.image_url && color.image_url.trim()
      );
      if (firstColorWithImage) {
        return getLocalImageUrl(firstColorWithImage.image_url);
      }
    }
    
    return null;
  };

  const displayImageUrl = getDisplayImage();

  // Debug logging
  console.log(`🖼️ SimpleProductCard for product ${product.id} (${product.name}):`, {
    photo: product.photo,
    available_colors: product.available_colors?.length || 0,
    firstColorImage: product.available_colors?.find(c => c.image_url)?.image_url,
    displayImageUrl,
    selectedColorImage
  });

  const handleColorClick = (colorImageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedColorImage(colorImageUrl);
    setImageError(false);
  };

  const handleImageError = () => {
    console.error(`Failed to load image for product ${product.id}: ${displayImageUrl}`);
    setImageError(true);
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
      className="group cursor-pointer hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 relative border border-gray-200 hover:border-primary/40 rounded-lg sm:rounded-xl overflow-hidden bg-white active:scale-[0.98] sm:hover:-translate-y-1 touch-manipulation"
      onClick={() => onProductClick(product.id)}
    >
      <CardContent className="p-0 relative">
        {/* Product Image */}
        <div className="aspect-square relative overflow-hidden bg-white">
          {displayImageUrl && !imageError ? (
            <img
              src={displayImageUrl}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-all duration-300 p-2 sm:p-3"
              loading={index < 8 ? "eager" : "lazy"}
              onError={handleImageError}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <div className="text-4xl text-gray-400">📦</div>
            </div>
          )}

          {/* Category Badge */}
          {product.category_name && (
            <Badge
              variant="secondary"
              className="absolute top-1 left-1 sm:top-1.5 sm:left-1.5 text-[9px] sm:text-[10px] md:text-xs bg-primary text-white px-1 sm:px-1.5 py-0.5 rounded-full shadow-md font-medium"
            >
              {product.category_name}
            </Badge>
          )}

          {/* Color Variants */}
          {product.available_colors && product.available_colors.length > 0 && (
            <div className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5">
              <div className="flex gap-0.5 sm:gap-1">
                {product.available_colors
                  .slice(0, 2)
                  .map((color) => (
                    <div
                      key={color.id}
                      className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 rounded-md sm:rounded-lg border-2 border-white cursor-pointer active:scale-95 sm:hover:scale-110 transition-all duration-200 shadow-md sm:shadow-lg overflow-hidden bg-gray-100 touch-manipulation"
                      title={`${color.name}${color.hex_code ? ` (${color.hex_code})` : ""}`}
                      onClick={(e) =>
                        color.image_url &&
                        handleColorClick(color.image_url, e)
                      }
                    >
                      {color.image_url ? (
                        <img
                          src={getLocalImageUrl(color.image_url)}
                          alt={color.name}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const parent = e.currentTarget.parentElement;
                            if (parent) {
                              parent.style.backgroundColor = getColorBackgroundColor(color);
                              parent.innerHTML = `<span class="text-[6px] sm:text-[7px] lg:text-[8px] font-bold text-white">${color.name?.charAt(0)?.toUpperCase()}</span>`;
                            }
                          }}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-[6px] sm:text-[7px] lg:text-[8px] font-bold text-white rounded-lg"
                          style={{
                            backgroundColor: getColorBackgroundColor(color),
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

        {/* Product Info */}
        <div className="p-2 sm:p-2.5 md:p-3 space-y-1 sm:space-y-1.5 md:space-y-2">
          <div>
            <h3 className="font-medium text-xs sm:text-sm md:text-base text-gray-900 line-clamp-2 leading-tight">
              {product.name}
            </h3>
          </div>

          {/* Pricing */}
          {product.base_price && (
            <div className="bg-gray-50 rounded-md sm:rounded-lg p-1.5 sm:p-2">
              <PriceDisplay
                price={product.base_price}
                suggestedPrice={product.suggested_price}
                variant="default"
                className="[&>div:first-child]:text-sm [&>div:first-child]:sm:text-lg [&>div:first-child]:md:text-xl [&>div:first-child]:lg:text-2xl"
                onLoginClick={onLoginClick}
              />
            </div>
          )}

          {/* Add to Cart Button */}
          {isAuthenticated && isApproved && (
            <Button
              className="w-full bg-primary hover:bg-primary/90 active:bg-primary/80 text-white text-[10px] sm:text-xs md:text-sm lg:text-base font-medium h-8 sm:h-10 md:h-12 rounded-md sm:rounded-lg transition-all duration-200 active:scale-95 sm:hover:shadow-lg touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                onProductClick(product.id);
              }}
            >
              <span className="hidden sm:inline">
                Adicionar ao Carrinho
              </span>
              <span className="sm:hidden">Comprar</span>
            </Button>
          )}
        </div>

        {/* Add to Cart Icon - Mobile */}
        {isAuthenticated && isApproved && (
          <div
            className="sm:hidden absolute bottom-2 right-2 bg-primary hover:bg-primary/90 rounded-full p-1.5 shadow-lg transition-all duration-200 active:scale-95"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(product.id);
            }}
          >
            <ShoppingCart className="h-5 w-5 text-white" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
