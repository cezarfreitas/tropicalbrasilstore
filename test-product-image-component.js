// Test script to verify ProductImage component logic
console.log('🧪 Testing ProductImage Component Logic...');

// Mock product data similar to product 649
const mockProduct649 = {
  id: 649,
  name: "Logo",
  photo: null, // No main photo
  color_variants: [
    {
      id: 787,
      color_name: "Areia/café",
      image_url: "/uploads/products/product-1754273096747-655259694.png",
      images: null,
      is_main_catalog: false, // Not marked as main
      active: true
    }
  ]
};

// Simulate the getImageUrl function
function getImageUrl(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
        return null;
    }

    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
        return imageUrl;
    }

    if (imageUrl.startsWith('/uploads/')) {
        return `${window.location.origin}${imageUrl}`;
    }

    if (!imageUrl.startsWith('/') && !imageUrl.includes('/')) {
        return `${window.location.origin}/uploads/products/${imageUrl}`;
    }

    return imageUrl;
}

// Simulate the getBestAvailableImage function from ProductImage component
function getBestAvailableImage(product) {
    if (!product) return null;

    // First try main product photo
    if (product.photo) {
        return getImageUrl(product.photo);
    }

    // Then try main catalog variant
    const mainVariant = product.color_variants?.find(v => v.is_main_catalog);
    if (mainVariant) {
        if (mainVariant.images && mainVariant.images.length > 0) {
            return getImageUrl(mainVariant.images[0]);
        }
        if (mainVariant.image_url) {
            return getImageUrl(mainVariant.image_url);
        }
    }

    // Finally try first variant with image
    const firstVariantWithImage = product.color_variants?.find(
        v => (v.images && v.images.length > 0) || v.image_url
    );
    if (firstVariantWithImage) {
        if (firstVariantWithImage.images && firstVariantWithImage.images.length > 0) {
            return getImageUrl(firstVariantWithImage.images[0]);
        }
        if (firstVariantWithImage.image_url) {
            return getImageUrl(firstVariantWithImage.image_url);
        }
    }

    return null;
}

// Test the logic
console.log('\n📋 Product 649 Test Results:');
console.log('Input product:', mockProduct649);

const bestImage = getBestAvailableImage(mockProduct649);
console.log('Best available image:', bestImage);

// Test different scenarios
const scenarios = [
    {
        name: "Product with main photo",
        product: {
            ...mockProduct649,
            photo: "/uploads/products/main-photo.jpg"
        }
    },
    {
        name: "Product with main catalog variant",
        product: {
            ...mockProduct649,
            color_variants: [{
                ...mockProduct649.color_variants[0],
                is_main_catalog: true
            }]
        }
    },
    {
        name: "Product with variant images array",
        product: {
            ...mockProduct649,
            color_variants: [{
                ...mockProduct649.color_variants[0],
                images: ["/uploads/products/image1.jpg", "/uploads/products/image2.jpg"]
            }]
        }
    },
    {
        name: "Product with no images",
        product: {
            ...mockProduct649,
            photo: null,
            color_variants: []
        }
    }
];

console.log('\n🔄 Testing different scenarios:');
scenarios.forEach((scenario, index) => {
    const result = getBestAvailableImage(scenario.product);
    console.log(`${index + 1}. ${scenario.name}: ${result || 'null'}`);
});

// Test if the actual image would load
if (bestImage) {
    console.log('\n🔄 Testing actual image load...');
    const img = new Image();
    img.onload = () => {
        console.log('✅ Image loaded successfully!');
        console.log(`  Size: ${img.naturalWidth} x ${img.naturalHeight}`);
    };
    img.onerror = (error) => {
        console.error('❌ Image failed to load');
        
        // Test with fetch
        fetch(bestImage, { method: 'HEAD' })
            .then(response => {
                console.log(`🔗 HEAD request: ${response.status} ${response.statusText}`);
                console.log(`  Content-Type: ${response.headers.get('content-type')}`);
            })
            .catch(fetchError => {
                console.error(`🌐 Network error:`, fetchError);
            });
    };
    img.src = bestImage;
}
