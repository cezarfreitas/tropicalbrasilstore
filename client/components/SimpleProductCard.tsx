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
  console.log(`🎨 RENDERING SimpleProductCard for product ${product.id}: ${product.name}`);

  const [selectedColorImage, setSelectedColorImage] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  // Simple local image URL construction
  const getLocalImageUrl = (imageUrl: string | null | undefined): string | null => {
    if (!imageUrl || typeof imageUrl !== 'string' || imageUrl.trim() === '') {
      console.log(`❌ Invalid image URL: ${imageUrl}`);
      return null;
    }

    const trimmedUrl = imageUrl.trim();

    // Se já é uma URL completa, use como está
    if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
      console.log(`🌐 Using absolute URL: ${trimmedUrl}`);
      return trimmedUrl;
    }

    // Se começa com /uploads/, construa URL completa
    if (trimmedUrl.startsWith('/uploads/')) {
      const fullUrl = `${window.location.origin}${trimmedUrl}`;
      console.log(`📁 Converting local path to full URL: ${trimmedUrl} -> ${fullUrl}`);
      return fullUrl;
    }

    // Se é apenas um nome de arquivo, assuma que está em /uploads/products/
    if (!trimmedUrl.includes('/')) {
      const fullUrl = `${window.location.origin}/uploads/products/${trimmedUrl}`;
      console.log(`📋 Converting filename to full URL: ${trimmedUrl} -> ${fullUrl}`);
      return fullUrl;
    }

    console.log(`🔧 Using URL as-is: ${trimmedUrl}`);
    return trimmedUrl;
  };

  // Get the best image to display - PRIORITY: color variants from product_color_variants table
  const getDisplayImage = (): string | null => {
    console.log(`🎯 Getting display image for product ${product.id}:`);
    console.log(`📊 Product data:`, {
      photo: product.photo,
      available_colors_count: product.available_colors?.length || 0,
      available_colors: product.available_colors
    });

    // Priority: selected color image > first available color (from product_color_variants) > product photo
    if (selectedColorImage) {
      console.log(`✅ Using selected color image: ${selectedColorImage}`);
      return getLocalImageUrl(selectedColorImage);
    }

    // MAIN PRIORITY: Check available_colors (comes from product_color_variants.image_url)
    if (product.available_colors && product.available_colors.length > 0) {
      console.log(`🎨 Checking ${product.available_colors.length} available colors (from product_color_variants)`);
      const firstColorWithImage = product.available_colors.find(color => {
        const hasImage = color.image_url && color.image_url.trim() !== '';
        console.log(`  - Color ${color.name}: ${color.image_url || 'no image'} (${hasImage ? 'valid' : 'invalid'})`);
        return hasImage;
      });

      if (firstColorWithImage) {
        console.log(`✅ Using color variant image from product_color_variants: ${firstColorWithImage.name} -> ${firstColorWithImage.image_url}`);
        return getLocalImageUrl(firstColorWithImage.image_url);
      }
    }

    // Fallback to product photo if no color variants have images
    if (product.photo && product.photo.trim()) {
      console.log(`📷 Fallback to product photo: ${product.photo}`);
      return getLocalImageUrl(product.photo);
    }

    console.log(`❌ No image found for product ${product.id} - no available_colors with image_url and no product photo`);
    return null;
  };

  const displayImageUrl = getDisplayImage();

  // Debug logging - focus on product_color_variants data
  console.log(`🖼️ SimpleProductCard for product ${product.id} (${product.name}):`, {
    photo: product.photo,
    available_colors_count: product.available_colors?.length || 0,
    color_variants_with_images: product.available_colors?.filter(c => c.image_url).length || 0,
    first_color_image: product.available_colors?.find(c => c.image_url)?.image_url,
    all_color_images: product.available_colors?.map(c => ({name: c.name, image_url: c.image_url})) || [],
    final_display_url: displayImageUrl,
    selected_color_image: selectedColorImage
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
          <div className="text-xs text-gray-500 mb-2">
            ID: {product.id} | Colors: {product.available_colors?.length || 0} |
            Image: {displayImageUrl ? "✅" : "❌"}
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
