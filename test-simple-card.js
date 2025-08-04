// Test the new SimpleProductCard with local images
console.log("🧪 Testing SimpleProductCard with local images");

// Test product data that should have images
const testProduct = {
  id: 649,
  name: "Teste Product",
  photo: "/uploads/products/product-1754275524219-619684965.png",
  available_colors: [
    {
      id: 1,
      name: "Vermelho",
      hex_code: "#CC0000",
      image_url: "/uploads/products/teste001-vermelho-1753759781595.jpg"
    },
    {
      id: 2,
      name: "Azul", 
      hex_code: "#0066CC",
      image_url: "/uploads/products/teste001-azul-1753759786453.jpg"
    }
  ]
};

// Test local image URL construction
function testLocalImageUrl(imageUrl) {
  if (!imageUrl) return null;
  
  // Se já é uma URL completa, use como está
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Se começa com /uploads/, construa URL completa
  if (imageUrl.startsWith('/uploads/')) {
    return `http://localhost:3001${imageUrl}`;
  }
  
  // Se é apenas um nome de arquivo, assuma que está em /uploads/products/
  if (!imageUrl.includes('/')) {
    return `http://localhost:3001/uploads/products/${imageUrl}`;
  }
  
  return imageUrl;
}

console.log("📸 Testing image URLs:");
console.log("Product photo:", testLocalImageUrl(testProduct.photo));
console.log("Color 1 image:", testLocalImageUrl(testProduct.available_colors[0].image_url));
console.log("Color 2 image:", testLocalImageUrl(testProduct.available_colors[1].image_url));

// Test image priorities
function getDisplayImage(product) {
  // Priority: product photo > first color with image
  if (product.photo && product.photo.trim()) {
    return testLocalImageUrl(product.photo);
  }
  
  if (product.available_colors) {
    const firstColorWithImage = product.available_colors.find(color => 
      color.image_url && color.image_url.trim()
    );
    if (firstColorWithImage) {
      return testLocalImageUrl(firstColorWithImage.image_url);
    }
  }
  
  return null;
}

console.log("🎯 Best display image:", getDisplayImage(testProduct));

console.log("✅ SimpleProductCard test completed");
