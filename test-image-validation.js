// Test image URL validation

const url =
  "https://projetoinfluencer.vteximg.com.br/arquivos/ids/6953678-640-960/Chinelo-Tropical-Brasil-Institucion-Flip-Flop-Branco-Com-Azul.jpg";

function isValidImageUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    const hostname = parsedUrl.hostname.toLowerCase();

    // Check if URL ends with image extension
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp"];
    const hasImageExtension = imageExtensions.some((ext) =>
      pathname.endsWith(ext),
    );

    // Check for common image hosting patterns
    const isImageHost =
      hostname.includes("vteximg") ||
      hostname.includes("shopify") ||
      hostname.includes("cloudinary") ||
      hostname.includes("amazonaws") ||
      pathname.includes("image") ||
      pathname.includes("photo") ||
      pathname.includes("img");

    // Check for image-like path patterns (like vtex urls)
    const hasImagePath =
      pathname.includes("-640-") || // vtex dimensions pattern
      pathname.includes("ids/") || // vtex ids pattern
      pathname.match(/\d+x\d+/) || // dimension patterns
      pathname.includes("upload");

    console.log("URL:", url);
    console.log("Hostname:", hostname);
    console.log("Pathname:", pathname);
    console.log("Has image extension:", hasImageExtension);
    console.log("Is image host:", isImageHost);
    console.log("Has image path:", hasImagePath);

    return hasImageExtension || isImageHost || hasImagePath;
  } catch (e) {
    console.log("Error parsing URL:", e.message);
    return false;
  }
}

console.log("Result:", isValidImageUrl(url));
