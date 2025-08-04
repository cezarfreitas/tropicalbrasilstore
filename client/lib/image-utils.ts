/**
 * Convert local image URLs to absolute URLs for proper loading
 */
export function getImageUrl(imageUrl: string | null | undefined): string | null {
  console.log(`🔗 getImageUrl input: "${imageUrl}"`);

  if (!imageUrl || typeof imageUrl !== 'string') {
    console.log(`🔗 getImageUrl: invalid input, returning null`);
    return null;
  }

  // If it's already an absolute URL, return as is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    console.log(`🔗 getImageUrl: already absolute, returning: "${imageUrl}"`);
    return imageUrl;
  }

  // If it's a relative URL starting with /uploads/, convert to absolute
  if (imageUrl.startsWith('/uploads/')) {
    // Use current origin for absolute URL
    const absoluteUrl = `${window.location.origin}${imageUrl}`;
    console.log(`🔗 getImageUrl: converted relative to absolute: "${imageUrl}" -> "${absoluteUrl}"`);
    return absoluteUrl;
  }

  // If it's just a filename, assume it's in uploads/products/
  if (!imageUrl.startsWith('/') && !imageUrl.includes('/')) {
    const absoluteUrl = `${window.location.origin}/uploads/products/${imageUrl}`;
    console.log(`🔗 getImageUrl: converted filename to absolute: "${imageUrl}" -> "${absoluteUrl}"`);
    return absoluteUrl;
  }

  // Return as is for other cases
  console.log(`🔗 getImageUrl: returning as-is: "${imageUrl}"`);
  return imageUrl;
}

/**
 * Get main image from product or variants
 */
export function getMainProductImage(product: any): string | null {
  // First try product photo
  if (product.photo) {
    return getImageUrl(product.photo);
  }

  // Then try first variant with image
  if (product.color_variants && product.color_variants.length > 0) {
    for (const variant of product.color_variants) {
      if (variant.image_url) {
        return getImageUrl(variant.image_url);
      }
      if (variant.images && variant.images.length > 0) {
        return getImageUrl(variant.images[0]);
      }
    }
  }

  return null;
}
