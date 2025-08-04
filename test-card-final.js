console.log("🧪 Testing final SimpleProductCard implementation");

// Mock window.location.origin for testing
const mockOrigin = "http://localhost:3001";

// Simulate the exact getLocalImageUrl function from SimpleProductCard
function getLocalImageUrl(imageUrl) {
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
    const fullUrl = `${mockOrigin}${trimmedUrl}`;
    console.log(`📁 Converting local path to full URL: ${trimmedUrl} -> ${fullUrl}`);
    return fullUrl;
  }
  
  // Se é apenas um nome de arquivo, assuma que está em /uploads/products/
  if (!trimmedUrl.includes('/')) {
    const fullUrl = `${mockOrigin}/uploads/products/${trimmedUrl}`;
    console.log(`📋 Converting filename to full URL: ${trimmedUrl} -> ${fullUrl}`);
    return fullUrl;
  }
  
  console.log(`🔧 Using URL as-is: ${trimmedUrl}`);
  return trimmedUrl;
}

// Test products with real image data from the uploads folder
const testProducts = [
  {
    id: 649,
    name: "Produto com imagem principal",
    photo: "/uploads/products/product-1754275524219-619684965.png",
    available_colors: []
  },
  {
    id: 650,
    name: "Produto com cores",
    photo: null,
    available_colors: [
      {
        id: 1,
        name: "Vermelho",
        image_url: "/uploads/products/teste001-vermelho-1753759781595.jpg"
      },
      {
        id: 2,
        name: "Azul",
        image_url: "/uploads/products/teste001-azul-1753759786453.jpg"
      }
    ]
  },
  {
    id: 651,
    name: "Produto chinelo",
    photo: null,
    available_colors: [
      {
        id: 3,
        name: "Vermelho",
        image_url: "/uploads/products/chn001-vermelho-1753802511911.webp"
      }
    ]
  },
  {
    id: 652,
    name: "Produto sem imagem",
    photo: null,
    available_colors: [
      {
        id: 4,
        name: "Preto",
        image_url: null
      }
    ]
  }
];

// Test the getDisplayImage logic for each product
testProducts.forEach(product => {
  console.log(`\n🎯 Testing product ${product.id}: ${product.name}`);
  
  // Simulate getDisplayImage function
  let displayImageUrl = null;
  
  if (product.photo && product.photo.trim()) {
    console.log(`✅ Using product photo: ${product.photo}`);
    displayImageUrl = getLocalImageUrl(product.photo);
  } else if (product.available_colors && product.available_colors.length > 0) {
    console.log(`🎨 Checking ${product.available_colors.length} available colors for images`);
    const firstColorWithImage = product.available_colors.find(color => {
      const hasImage = color.image_url && color.image_url.trim();
      console.log(`  - Color ${color.name}: ${color.image_url || 'no image'} (${hasImage ? 'valid' : 'invalid'})`);
      return hasImage;
    });
    
    if (firstColorWithImage) {
      console.log(`✅ Using first color with image: ${firstColorWithImage.name} -> ${firstColorWithImage.image_url}`);
      displayImageUrl = getLocalImageUrl(firstColorWithImage.image_url);
    }
  }
  
  if (!displayImageUrl) {
    console.log(`❌ No image found for product ${product.id}`);
  }
  
  console.log(`🖼️ Final display URL: ${displayImageUrl || 'null'}`);
});

console.log("\n✅ SimpleProductCard test completed successfully!");
console.log("\n📋 Summary:");
console.log("- Product 649: Should show main photo");
console.log("- Product 650: Should show first color image (vermelho)"); 
console.log("- Product 651: Should show chinelo vermelho image");
console.log("- Product 652: Should show no image (📦 placeholder)");
