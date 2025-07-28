import { useState, useEffect } from "react";
import { ProductImage } from "./ProductImage";

interface ProductVariant {
  id: number;
  size_id: number;
  color_id: number;
  stock: number;
  price_override?: number;
  image_url?: string;
  size?: string;
  color_name?: string;
  hex_code?: string;
}

interface VariantImageProps {
  variants: ProductVariant[];
  selectedColorId?: number;
  selectedSizeId?: number;
  fallbackImageUrl?: string;
  productName: string;
  className?: string;
  priority?: boolean;
}

export function VariantImage({
  variants,
  selectedColorId,
  selectedSizeId,
  fallbackImageUrl,
  productName,
  className = "w-full h-full object-cover",
  priority = false,
}: VariantImageProps) {
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>();

  useEffect(() => {
    // Find the specific variant based on selected color and size
    let targetVariant = variants.find(
      (v) => 
        v.color_id === selectedColorId && 
        v.size_id === selectedSizeId &&
        v.image_url
    );

    // If no exact match, try to find any variant with the selected color
    if (!targetVariant && selectedColorId) {
      targetVariant = variants.find(
        (v) => v.color_id === selectedColorId && v.image_url
      );
    }

    // If still no match, find any variant with an image
    if (!targetVariant) {
      targetVariant = variants.find((v) => v.image_url);
    }

    // Set the image URL based on priority: variant image > fallback > undefined
    if (targetVariant?.image_url) {
      setCurrentImageUrl(targetVariant.image_url);
    } else if (fallbackImageUrl) {
      setCurrentImageUrl(fallbackImageUrl);
    } else {
      setCurrentImageUrl(undefined);
    }
  }, [variants, selectedColorId, selectedSizeId, fallbackImageUrl]);

  const getAltText = () => {
    const colorName = variants.find(v => v.color_id === selectedColorId)?.color_name;
    const sizeName = variants.find(v => v.size_id === selectedSizeId)?.size;
    
    let altText = productName;
    if (colorName) altText += ` - ${colorName}`;
    if (sizeName) altText += ` - Tamanho ${sizeName}`;
    
    return altText;
  };

  return (
    <ProductImage
      src={currentImageUrl}
      alt={getAltText()}
      className={className}
      priority={priority}
      fallbackIconSize="lg"
    />
  );
}
