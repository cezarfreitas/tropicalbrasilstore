// Test script to run in browser console
console.log('🧪 Testing Product 649 Image Loading...');

// Simulate getImageUrl function
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

// Test the product 649 image URL
const product649ImageUrl = '/uploads/products/product-1754273096747-655259694.png';
const processedUrl = getImageUrl(product649ImageUrl);

console.log('📋 Product 649 Image Test:');
console.log(`  Original URL: ${product649ImageUrl}`);
console.log(`  Processed URL: ${processedUrl}`);

// Test if image loads
if (processedUrl) {
    const img = new Image();
    img.onload = () => {
        console.log('✅ Image loaded successfully!');
        console.log(`  Size: ${img.naturalWidth} x ${img.naturalHeight}`);
    };
    img.onerror = (error) => {
        console.error('❌ Image failed to load:', error);
        
        // Test network access
        fetch(processedUrl, { method: 'HEAD' })
            .then(response => {
                console.log(`🔗 HEAD request: ${response.status} ${response.statusText}`);
                console.log(`  Content-Type: ${response.headers.get('content-type')}`);
            })
            .catch(fetchError => {
                console.error(`🌐 Network error:`, fetchError);
            });
    };
    img.src = processedUrl;
    
    console.log(`🔄 Testing image load for: ${processedUrl}`);
}

// Check if we're on the admin page and can see products
if (window.location.pathname.includes('/admin/products-v2')) {
    console.log('🎯 On admin products page - checking for product data...');
    
    setTimeout(() => {
        // Look for product cards or data
        const productElements = document.querySelectorAll('[class*="product"], [class*="card"]');
        console.log(`📦 Found ${productElements.length} potential product elements`);
        
        // Look for images with error
        const images = document.querySelectorAll('img');
        const brokenImages = Array.from(images).filter(img => 
            img.complete && (img.naturalHeight === 0 || img.naturalWidth === 0)
        );
        
        console.log(`🖼️ Total images: ${images.length}`);
        console.log(`❌ Broken images: ${brokenImages.length}`);
        
        if (brokenImages.length > 0) {
            console.log('🔍 Broken image URLs:');
            brokenImages.forEach((img, index) => {
                console.log(`  ${index + 1}. ${img.src}`);
            });
        }
    }, 2000);
}
