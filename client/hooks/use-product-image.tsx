import { useMemo } from "react";
import { getImageUrl } from "@/lib/image-utils";

interface ProductData {
  id: number;
  photo?: string | null;
  available_colors?: Array<{
    image_url?: string | null;
    name?: string;
  }>;
  color_variants?: Array<{
    image_url?: string | null;
    images?: string[];
    is_main_catalog?: boolean;
  }>;
}

export function useProductImage(product: ProductData, selectedVariantImage?: string | null) {
  const imageUrl = useMemo(() => {
    // 1. Priority: Selected variant image (for color switching)
    if (selectedVariantImage) {
      const processedUrl = getImageUrl(selectedVariantImage);
      if (processedUrl) {
        console.log(`🖼️ Using selected variant image for ${product.id}: ${processedUrl}`);
        return processedUrl;
      }
    }

    // 2. Priority: Main product photo
    if (product.photo) {
      const processedUrl = getImageUrl(product.photo);
      if (processedUrl) {
        console.log(`🖼️ Using product photo for ${product.id}: ${processedUrl}`);
        return processedUrl;
      }
    }

    // 3. Priority: Main catalog variant (WooCommerce style)
    if (product.color_variants) {
      const mainVariant = product.color_variants.find(v => v.is_main_catalog);
      if (mainVariant) {
        if (mainVariant.images && mainVariant.images.length > 0) {
          const processedUrl = getImageUrl(mainVariant.images[0]);
          if (processedUrl) {
            console.log(`🖼️ Using main variant images[0] for ${product.id}: ${processedUrl}`);
            return processedUrl;
          }
        }
        if (mainVariant.image_url) {
          const processedUrl = getImageUrl(mainVariant.image_url);
          if (processedUrl) {
            console.log(`🖼️ Using main variant image_url for ${product.id}: ${processedUrl}`);
            return processedUrl;
          }
        }
      }

      // 4. Priority: First variant with image (WooCommerce style)
      const firstVariantWithImage = product.color_variants.find(
        v => (v.images && v.images.length > 0) || v.image_url
      );
      if (firstVariantWithImage) {
        if (firstVariantWithImage.images && firstVariantWithImage.images.length > 0) {
          const processedUrl = getImageUrl(firstVariantWithImage.images[0]);
          if (processedUrl) {
            console.log(`🖼️ Using first variant images[0] for ${product.id}: ${processedUrl}`);
            return processedUrl;
          }
        }
        if (firstVariantWithImage.image_url) {
          const processedUrl = getImageUrl(firstVariantWithImage.image_url);
          if (processedUrl) {
            console.log(`🖼️ Using first variant image_url for ${product.id}: ${processedUrl}`);
            return processedUrl;
          }
        }
      }
    }

    // 5. Priority: First available color with image (Store API style)
    if (product.available_colors) {
      const firstColorWithImage = product.available_colors.find(c => c.image_url);
      if (firstColorWithImage && firstColorWithImage.image_url) {
        const processedUrl = getImageUrl(firstColorWithImage.image_url);
        if (processedUrl) {
          console.log(`🖼️ Using available_colors image for ${product.id}: ${processedUrl}`);
          return processedUrl;
        }
      }
    }

    console.log(`🖼️ No image found for product ${product.id}`, {
      hasPhoto: !!product.photo,
      color_variants: product.color_variants?.length || 0,
      available_colors: product.available_colors?.length || 0,
      available_colors_with_images: product.available_colors?.filter(c => c.image_url).length || 0
    });
    return null;
  }, [
    product.id,
    product.photo,
    product.color_variants,
    product.available_colors,
    selectedVariantImage
  ]);

  return imageUrl;
}
