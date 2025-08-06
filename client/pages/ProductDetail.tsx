import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProductImage } from "@/components/ProductImage";
import { LoginModal } from "@/components/LoginModal";
import { getImageUrl } from "@/lib/image-utils";
import {
  ShoppingCart,
  Package,
  Minus,
  Plus,
  Lock,
  ArrowLeft,
  Info,
  Heart,
  Share2,
  ImageIcon,
} from "lucide-react";

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

interface GradeTemplate {
  size_id: number;
  required_quantity: number;
  size: string;
  display_order: number;
}

interface AvailableGrade {
  id: number;
  name: string;
  description?: string;
  color_name: string;
  hex_code?: string;
  color_id: number;
  templates: GradeTemplate[];
  total_quantity: number;
  has_full_stock?: boolean;
  has_any_stock?: boolean;
}

interface ProductDetail {
  id: number;
  name: string;
  sku?: string;
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
  sell_without_stock?: boolean;
  variants: ProductVariant[];
  available_grades?: AvailableGrade[];
}

// Helper function to safely format prices
const formatPrice = (price: any): string => {
  const numPrice = typeof price === "number" ? price : parseFloat(price) || 0;
  return numPrice.toFixed(2);
};

// Function to get proper color value from different sources
const getColorValue = (color: any) => {
  // If hex_code is provided, use it
  if (color.hex_code) {
    return color.hex_code;
  }

  // Common color name mappings for WooCommerce
  const colorMap: { [key: string]: string } = {
    branco: "#FFFFFF",
    white: "#FFFFFF",
    preto: "#000000",
    black: "#000000",
    azul: "#0066CC",
    blue: "#0066CC",
    vermelho: "#CC0000",
    red: "#CC0000",
    verde: "#228B22",
    green: "#228B22",
    "verde brasil": "#228B22",
    amarelo: "#FFFF99",
    yellow: "#FFFF99",
    "amarelo canário": "#FFFF99",
    "amarelo canario": "#FFFF99",
    rosa: "#FF6699",
    pink: "#FF6699",
    roxo: "#9966CC",
    purple: "#9966CC",
    laranja: "#FF6600",
    orange: "#FF6600",
    marrom: "#996633",
    brown: "#996633",
    cinza: "#999999",
    gray: "#999999",
    grey: "#999999",
  };

  // Try to map by color name
  const colorName = color.name?.toLowerCase();
  if (colorName && colorMap[colorName]) {
    return colorMap[colorName];
  }

  // Default fallback
  return "#E5E7EB";
};

// Function to determine text color based on background
const getTextColor = (backgroundColor: string) => {
  // Convert hex to RGB
  const hex = backgroundColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return white text for dark backgrounds, dark text for light backgrounds
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantImage, setSelectedVariantImage] = useState<
    string | null
  >(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated, isApproved } = useCustomerAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    console.log('🔐 ProductDetail Auth Check:', { isAuthenticated, isApproved });

    if (!isAuthenticated) {
      console.log('❌ User not authenticated, redirecting to login...');
      // Force immediate redirect
      window.location.href = '/login';
      return;
    }

    if (!isApproved) {
      console.log('⚠️ User authenticated but not approved');
    }
  }, [isAuthenticated, isApproved]);

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchSuggestedProducts();
    }
  }, [id]);

  const fetchSuggestedProducts = async () => {
    if (!id) return;

    setLoadingSuggestions(true);
    try {
      // Use XMLHttpRequest to avoid FullStory conflicts
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", "/api/store/products-paginated?page=1&limit=5", true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 15000; // 15 second timeout

        xhr.send();
      });

      if (response.ok) {
        const data = await response.json();
        // Filter out the current product and get random 5 products
        const filtered = data.products.filter(
          (p: any) => p.id !== parseInt(id),
        );
        const shuffled = filtered.sort(() => 0.5 - Math.random());
        setSuggestedProducts(shuffled.slice(0, 5));
      }
    } catch (error) {
      console.error("Error fetching suggested products:", error);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchProduct = async (retryCount: number = 0) => {
    if (!id) return;

    setLoading(true);
    try {
      // Use XMLHttpRequest directly to bypass fetch interference
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/api/store/products/${id}`, true);
        xhr.setRequestHeader("Accept", "application/json");
        xhr.setRequestHeader("Content-Type", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 15000; // 15 second timeout

        xhr.send();
      });

      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        // Auto-select first available color variant with stock
        const colors = getAvailableColors(data);
        if (colors.length > 0) {
          setSelectedColor(colors[0].id);
          // Set the initial variant image
          const firstVariant = data.variants?.find(
            (v: ProductVariant) => v.color_id === colors[0].id,
          );
          if (firstVariant?.image_url) {
            setSelectedVariantImage(firstVariant.image_url);
          }
        } else {
          setSelectedColor(null);
          setSelectedVariantImage(null);
        }
        // Reset gallery to first image
        setSelectedImageIndex(0);
        setSelectedGrade(null);
        setSelectedSize(null);
        setQuantity(1);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      console.error("Error fetching product:", error);

      // Simple retry for any error
      if (retryCount < 2) {
        console.log(`Retrying product fetch... (attempt ${retryCount + 1}/3)`);
        setTimeout(() => fetchProduct(retryCount + 1), 1000);
        return;
      }

      // Show user-friendly error only after all retries
      toast({
        title: "Erro ao carregar",
        description: "Tente novamente em alguns segundos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getAllAvailableImages = () => {
    const images: string[] = [];

    // Add main product photo first
    if (product?.photo) {
      images.push(product.photo);
    }

    // Add images from selected color if available
    if (selectedColor && product?.available_colors) {
      const selectedColorData = product.available_colors.find(
        (c) => c.id === selectedColor,
      );
      if (selectedColorData?.images && selectedColorData.images.length > 0) {
        // Add unique images only
        selectedColorData.images.forEach((img) => {
          if (img && !images.includes(img)) {
            images.push(img);
          }
        });
      } else if (
        selectedColorData?.image_url &&
        !images.includes(selectedColorData.image_url)
      ) {
        images.push(selectedColorData.image_url);
      }
    }

    // If no color selected or no color images, add all available images
    if ((!selectedColor || images.length <= 1) && product?.available_colors) {
      product.available_colors.forEach((color) => {
        if (color.images && color.images.length > 0) {
          color.images.forEach((img) => {
            if (img && !images.includes(img)) {
              images.push(img);
            }
          });
        } else if (color.image_url && !images.includes(color.image_url)) {
          images.push(color.image_url);
        }
      });
    }

    return images.filter((img) => img && img.trim() !== "");
  };

  const getAvailableColors = (productData = product) => {
    // First try to use available_colors if it exists (from API)
    if (productData?.available_colors && productData.available_colors.length > 0) {
      return productData.available_colors.filter((color) => {
        // If product has variants, check if this color has stock
        if (productData.variants && productData.variants.length > 0) {
          const hasStock = productData.variants.some((variant) =>
            variant.color_id === color.id && (variant.stock > 0 || productData.sell_without_stock)
          );
          return hasStock;
        }
        return true; // If no variants, show all colors
      });
    }

    // Fallback to building from variants
    if (!productData?.variants) return [];

    const colorMap = new Map();
    productData.variants.forEach((variant) => {
      // Only show colors that actually have stock or if sell_without_stock is enabled
      const hasStock = variant.stock > 0 || productData.sell_without_stock;
      if (hasStock && variant.color_id && !colorMap.has(variant.color_id)) {
        colorMap.set(variant.color_id, {
          id: variant.color_id,
          name: variant.color_name,
          hex_code: variant.hex_code,
          image_url: variant.image_url, // Include image URL
        });
      }
    });

    const colors = Array.from(colorMap.values());

    // If product has grades, filter colors to only show those with available grades
    if (
      productData?.available_grades &&
      productData.available_grades.length > 0
    ) {
      return colors.filter((color) => {
        const gradesForColor = productData.available_grades.filter(
          (grade) => grade.color_id === color.id,
        );
        return gradesForColor.some((grade) => {
          // Check if grade is available (either sell without stock is enabled or has full stock)
          return productData.sell_without_stock || grade.has_full_stock;
        });
      });
    }

    return colors;
  };

  const getAvailableSizes = () => {
    if (!product?.variants || !selectedColor) return [];

    const sizeMap = new Map();
    product.variants
      .filter((v) => {
        const matchesColor = v.color_id === selectedColor;
        const hasStock = v.stock > 0;
        const allowedWithoutStock = product.sell_without_stock;

        return matchesColor && (hasStock || allowedWithoutStock);
      })
      .forEach((variant) => {
        if (variant.size_id && !sizeMap.has(variant.size_id)) {
          sizeMap.set(variant.size_id, {
            id: variant.size_id,
            name: variant.size,
            stock: variant.stock,
          });
        }
      });

    return Array.from(sizeMap.values());
  };

  const getAvailableGradesForColor = () => {
    if (!product?.available_grades || !selectedColor) return [];

    return product.available_grades.filter(
      (grade) => grade.color_id === selectedColor,
    );
  };

  const hasGrades = () => {
    return product?.available_grades && product.available_grades.length > 0;
  };

  const canAddGradeToCart = (grade: any) => {
    if (product?.sell_without_stock) return true;
    return grade.has_full_stock;
  };

  const addToCart = () => {
    if (!product || !selectedColor) {
      toast({
        title: "Erro",
        description: "Selecione uma cor",
        variant: "destructive",
      });
      return;
    }

    const selectedColorData = getAvailableColors().find(
      (c) => c.id === selectedColor,
    );

    if (hasGrades() && selectedGrade) {
      const grade = getAvailableGradesForColor().find(
        (g) => g.id === selectedGrade,
      );

      if (!grade) return;

      if (!canAddGradeToCart(grade)) {
        toast({
          title: "Erro",
          description: "Estoque insuficiente para esta grade",
          variant: "destructive",
        });
        return;
      }

      const gradePrice = product.base_price
        ? product.base_price * grade.total_quantity
        : 0;

      addItem({
        type: "grade",
        productId: product.id,
        productName: product.name,
        colorId: selectedColor,
        colorName: selectedColorData?.name || "",
        gradeId: grade.id,
        gradeName: grade.name,
        quantity,
        unitPrice: gradePrice,
        photo: selectedVariantImage || product.photo,
        piecesPerGrade: grade.total_quantity,
      });
    } else if (!hasGrades() && selectedSize) {
      const variant = product.variants.find(
        (v) => v.color_id === selectedColor && v.size_id === selectedSize,
      );

      if (!variant || variant.stock < quantity) {
        toast({
          title: "Erro",
          description: "Estoque insuficiente",
          variant: "destructive",
        });
        return;
      }

      const unitPrice = variant.price_override || product.base_price || 0;

      addItem({
        type: "variant",
        productId: product.id,
        productName: product.name,
        colorId: selectedColor,
        colorName: selectedColorData?.name || "",
        sizeId: selectedSize,
        sizeName: variant.size || "",
        quantity,
        unitPrice,
        photo: selectedVariantImage || product.photo,
      });
    } else {
      toast({
        title: "Erro",
        description: hasGrades()
          ? "Selecione uma grade"
          : "Selecione um tamanho",
        variant: "destructive",
      });
      return;
    }

    // Reset quantity after adding to cart
    setQuantity(1);
  };

  const canAddToCart = () => {
    // Require authentication and approval to add to cart
    if (!isAuthenticated || !isApproved) return false;
    if (!selectedColor) return false;
    if (hasGrades()) {
      return selectedGrade !== null;
    } else {
      return selectedSize !== null;
    }
  };

  const handleColorSelect = (colorId: number, imageUrl?: string) => {
    setSelectedColor(colorId);

    // Find the selected color data to get its image
    const selectedColorData = getAvailableColors().find(c => c.id === colorId);
    if (selectedColorData) {
      // Use the color's image_url or the passed imageUrl
      const colorImage = selectedColorData.image_url || imageUrl;
      if (colorImage) {
        setSelectedVariantImage(colorImage);
        console.log('🎨 Selected color image:', colorImage);
      }
    }

    // Reset size/grade selection when color changes
    setSelectedGrade(null);
    setSelectedSize(null);
    // Reset image gallery to first image to show the new color
    setSelectedImageIndex(0);
  };

  // Auto-select single options
  useEffect(() => {
    if (selectedColor && hasGrades()) {
      const grades = getAvailableGradesForColor();
      if (grades.length === 1 && canAddGradeToCart(grades[0])) {
        setSelectedGrade(grades[0].id);
      }
    } else if (selectedColor && !hasGrades()) {
      const sizes = getAvailableSizes();
      if (sizes.length === 1) {
        setSelectedSize(sizes[0].id);
      }
    }
  }, [selectedColor, product]);

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const images = getAllAvailableImages();
      if (images.length <= 1) return;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          setSelectedImageIndex((prev) =>
            prev > 0 ? prev - 1 : images.length - 1,
          );
          break;
        case "ArrowRight":
          event.preventDefault();
          setSelectedImageIndex((prev) =>
            prev < images.length - 1 ? prev + 1 : 0,
          );
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [getAllAvailableImages().length]);

  if (loading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Carregando produto...
              </p>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Produto não encontrado
            </h1>
            <p className="text-muted-foreground mb-6">
              O produto que você está procurando não existe ou foi removido.
            </p>
            <Button
              onClick={() => navigate("/loja")}
              className="bg-primary hover:bg-primary/90"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar à Loja
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="w-full px-4 lg:px-6 py-3 lg:py-4">
        {/* Breadcrumb */}
        <div className="mb-2">
          <Button
            variant="ghost"
            onClick={() => navigate("/loja")}
            className="text-sm text-muted-foreground hover:text-primary p-0 h-auto mb-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à Loja
          </Button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 lg:gap-5">
          {/* Product Image Gallery Section */}
          <div>
            <div className="sticky top-2">
              <div className="rounded-lg p-2 max-w-xl mx-auto">
                {/* Main Image Display */}
                <div className="aspect-square relative mb-2">
                  <ProductImage
                    src={getImageUrl(
                      getAllAvailableImages()[selectedImageIndex] ||
                        selectedVariantImage ||
                        product.photo,
                    )}
                    product={product}
                    alt={`${product.name} - Imagem ${selectedImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    priority={true}
                  />

                  {/* Image Counter */}
                  {getAllAvailableImages().length > 1 && (
                    <div className="absolute top-1 right-1 bg-black/70 text-white px-1.5 py-0.5 rounded text-[10px]">
                      {selectedImageIndex + 1} /{" "}
                      {getAllAvailableImages().length}
                    </div>
                  )}

                  {/* Navigation Arrows */}
                  {getAllAvailableImages().length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev > 0
                              ? prev - 1
                              : getAllAvailableImages().length - 1,
                          )
                        }
                        className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all duration-200"
                      >
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() =>
                          setSelectedImageIndex((prev) =>
                            prev < getAllAvailableImages().length - 1
                              ? prev + 1
                              : 0,
                          )
                        }
                        className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-gray-800 p-1.5 rounded-full shadow transition-all duration-200"
                      >
                        <ArrowLeft className="h-3 w-3 rotate-180" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Gallery */}
                {getAllAvailableImages().length > 1 && (
                  <div className="grid grid-cols-5 gap-1">
                    {getAllAvailableImages().map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-square rounded overflow-hidden border transition-all duration-200 ${
                          selectedImageIndex === index
                            ? "border-primary border-2"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <ProductImage
                          src={getImageUrl(image)}
                          alt={`${product.name} - Miniatura ${index + 1}`}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          sizes="120px"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {/* No Images Fallback */}
                {getAllAvailableImages().length === 0 && (
                  <div className="aspect-square flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Nenhuma imagem disponível
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-3">
            {/* Product Header */}
            <div className="space-y-2">
              {/* Title and Actions */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Category Badge */}
                  {product.category_name && (
                    <div className="inline-block bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium mb-1">
                      {product.category_name}
                    </div>
                  )}
                  <h1 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">
                    {product.name}
                  </h1>
                  {/* Product SKU */}
                  {product.sku && (
                    <div className="text-xs text-gray-500 mb-2">
                      <span className="font-medium">SKU:</span> {product.sku}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Heart className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <Share2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Price Section */}
              {product.base_price && (
                <div className="bg-gray-50 rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-600 mb-0.5">
                        Preço Unitário
                      </div>
                      <PriceDisplay
                        price={product.base_price}
                        suggestedPrice={product.suggested_price}
                        variant="large"
                        onLoginClick={() => setShowLoginModal(true)}
                      />
                    </div>
                    {product.suggested_price &&
                      typeof product.suggested_price === "number" &&
                      product.suggested_price > product.base_price && (
                        <div className="text-right">
                          <div className="text-xs text-gray-600 mb-0.5">
                            Você Economiza
                          </div>
                          <div className="text-lg font-bold text-green-600">
                            R${" "}
                            {formatPrice(
                              product.suggested_price - product.base_price,
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* Color Variants Section */}
            <div className="space-y-1.5">
              <h3 className="text-base font-semibold text-gray-900">
                Cores Disponíveis
              </h3>
              {getAvailableColors().length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma cor disponível</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {getAvailableColors().map((color) => (
                    <button
                      key={color.id}
                      onClick={() => {
                        handleColorSelect(color.id, color.image_url);
                        // If this color has specific images, update gallery
                        if (color.images && color.images.length > 0) {
                          setSelectedImageIndex(0);
                        }
                      }}
                      className={`flex items-center gap-1 p-1 rounded transition-all duration-200 ${
                        selectedColor === color.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {/* Color Thumbnail */}
                      <div className="w-6 h-6 rounded border border-gray-200 overflow-hidden bg-gray-100">
                        {color.image_url ? (
                          <ProductImage
                            src={getImageUrl(color.image_url)}
                            alt={color.name}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            sizes="32px"
                          />
                        ) : (
                          <div
                            className="w-full h-full rounded"
                            style={{
                              backgroundColor: getColorValue(color),
                            }}
                          ></div>
                        )}
                      </div>

                      {/* Color Name */}
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-medium text-gray-900">
                          {color.name}
                        </span>
                        {/* Multiple images indicator */}
                        {color.images && color.images.length > 1 && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1 py-0.5 rounded">
                            {color.images.length}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grades or Sizes Section - Only for authenticated users */}
            {selectedColor && isAuthenticated && isApproved && (
              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-gray-900">
                  {hasGrades() ? "Selecione a Grade" : "Selecione o Tamanho"}
                </h3>

                <div className="space-y-1">
                  {hasGrades() ? (
                    getAvailableGradesForColor().map((grade, gradeIndex) => {
                      const canAdd = canAddGradeToCart(grade);
                      const sortedTemplates = [...grade.templates].sort(
                        (a, b) => a.display_order - b.display_order,
                      );

                      return (
                        <div
                          key={grade.id || `grade-${gradeIndex}`}
                          className={`inline-block rounded border transition-all duration-200 ${
                            !canAdd
                              ? "border-gray-200 bg-gray-50 opacity-50"
                              : selectedGrade === grade.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div
                            className="p-1.5 cursor-pointer"
                            onClick={() =>
                              canAdd ? setSelectedGrade(grade.id) : null
                            }
                          >
                            <div className="text-xs">
                              <span className="font-medium text-gray-900">
                                {grade.name}
                              </span>
                              <span className="text-gray-600 mx-1">•</span>
                              <span className="text-gray-900">
                                {grade.total_quantity} peças total
                              </span>
                              {product.base_price && (
                                <>
                                  <span className="text-gray-600 mx-1">•</span>
                                  <span className="text-primary font-medium">
                                    R${" "}
                                    {formatPrice(
                                      product.base_price * grade.total_quantity,
                                    )}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 font-mono">
                              {sortedTemplates.map((template, index) => (
                                <span
                                  key={`size-qty-${template.size_id || `no-size-${index}`}-${index}`}
                                  className="inline-block"
                                >
                                  <span className="font-medium text-gray-800">
                                    {template.size}
                                  </span>
                                  <span className="text-gray-500">
                                    ({template.required_quantity})
                                  </span>
                                  {index < sortedTemplates.length - 1 && (
                                    <span className="text-gray-400 mx-1">
                                      •
                                    </span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {getAvailableSizes().map((size) => (
                        <button
                          key={size.id}
                          onClick={() => setSelectedSize(size.id)}
                          className={`p-1.5 rounded-lg border-2 text-center transition-all ${
                            selectedSize === size.id
                              ? "border-primary bg-primary/5"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div className="font-semibold text-gray-900">
                            {size.name}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {size.stock} disponível
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Login prompt for unauthenticated users when color is selected */}
            {selectedColor && (!isAuthenticated || !isApproved) && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center space-y-3">
                <Lock className="h-8 w-8 text-gray-400 mx-auto" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {hasGrades()
                      ? "Grades Disponíveis"
                      : "Tamanhos Disponíveis"}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Para ver {hasGrades() ? "as grades" : "os tamanhos"}{" "}
                    disponíveis e adicionar ao carrinho, você precisa estar
                    logado.
                  </p>
                  <Button
                    onClick={() => setShowLoginModal(true)}
                    className="bg-primary hover:bg-primary/90 text-white"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Fazer Login
                  </Button>
                </div>
              </div>
            )}

            {/* Add to Cart Section */}
            {canAddToCart() && (
              <div className="border-t pt-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-700">
                    Quantidade:
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border border-gray-300 rounded">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-7 w-7 p-0 rounded-l"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-10 text-center text-xs font-semibold border-x">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-7 w-7 p-0 rounded-r"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>

                    <Button
                      onClick={addToCart}
                      className="bg-primary hover:bg-primary/90 text-white h-8 px-3 text-sm font-semibold rounded transition-all duration-200"
                    >
                      <ShoppingCart className="mr-1.5 h-3 w-3" />
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Product Description at bottom */}
            {product.description && (
              <div className="border-t pt-3 mt-3">
                <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                  Descrição do Produto
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Products Section - Full Width */}
      <div className="w-full px-4 lg:px-6 py-4 border-t mt-4">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-1">
            Produtos Sugeridos
          </h2>
          <p className="text-sm text-gray-600">
            Outros produtos que podem interessar você
          </p>
        </div>

        {loadingSuggestions ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 aspect-square rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {suggestedProducts.map((suggestedProduct) => (
              <Card
                key={suggestedProduct.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-gray-300 rounded-lg overflow-hidden bg-white"
              >
                <Link to={`/loja/produto/${suggestedProduct.id}`}>
                  <CardContent className="p-0">
                    {/* Product Image */}
                    <div className="aspect-square relative overflow-hidden bg-white">
                      <ProductImage
                        src={getImageUrl(suggestedProduct.photo)}
                        product={suggestedProduct}
                        alt={suggestedProduct.name}
                        className="w-full h-full object-contain group-hover:scale-102 transition-all duration-200 p-2"
                        loading="lazy"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      />

                      {/* Category Badge */}
                      {suggestedProduct.category_name && (
                        <Badge
                          variant="secondary"
                          className="absolute top-1 left-1 text-[8px] bg-primary text-white px-1 py-0.5 rounded font-medium"
                        >
                          {suggestedProduct.category_name}
                        </Badge>
                      )}

                      {/* Colors */}
                      {suggestedProduct.available_colors &&
                        suggestedProduct.available_colors.length > 0 && (
                          <div className="absolute bottom-1 right-1">
                            <div className="flex gap-0.5">
                              {suggestedProduct.available_colors
                                .slice(0, 2)
                                .map((color: any) => (
                                  <div
                                    key={color.id}
                                    className="w-3 h-3 rounded-full border border-white"
                                    title={color.name}
                                    style={{
                                      backgroundColor:
                                        color.hex_code || "#E5E7EB",
                                    }}
                                  ></div>
                                ))}
                            </div>
                          </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="p-1.5 space-y-0.5">
                      <h3 className="font-medium text-xs text-gray-900 line-clamp-2 leading-tight">
                        {suggestedProduct.name}
                      </h3>

                      {/* Pricing */}
                      {suggestedProduct.base_price && (
                        <div className="bg-gray-50 rounded p-1">
                          <PriceDisplay
                            price={suggestedProduct.base_price}
                            suggestedPrice={suggestedProduct.suggested_price}
                            variant="default"
                            className="[&>div:first-child]:text-sm"
                            onLoginClick={() => setShowLoginModal(true)}
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </StoreLayout>
  );
}
