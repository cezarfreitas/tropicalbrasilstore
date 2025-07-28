import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  ImageIcon
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
  const numPrice = typeof price === 'number' ? price : parseFloat(price) || 0;
  return numPrice.toFixed(2);
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
  const [selectedVariantImage, setSelectedVariantImage] = useState<string | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated, isApproved } = useCustomerAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

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
        xhr.timeout = 8000; // 8 second timeout

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
          const firstVariant = data.variants?.find((v: ProductVariant) => v.color_id === colors[0].id);
          if (firstVariant?.image_url) {
            setSelectedVariantImage(firstVariant.image_url);
          }
        } else {
          setSelectedColor(null);
          setSelectedVariantImage(null);
        }
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

  const getAvailableColors = (productData = product) => {
    if (!productData?.variants) return [];

    const colorMap = new Map();
    productData.variants.forEach((variant) => {
      // Only show colors that have stock
      if (variant.stock > 0 && !colorMap.has(variant.color_id)) {
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
      .filter((v) => v.color_id === selectedColor && v.stock > 0)
      .forEach((variant) => {
        if (!sizeMap.has(variant.size_id)) {
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
      });

      toast({
        title: "✓ Adicionado ao carrinho",
        description: `${grade.name}`,
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

      toast({
        title: "✓ Adicionado ao carrinho",
        description: `${selectedColorData?.name}`,
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
    if (!selectedColor) return false;
    if (hasGrades()) {
      return selectedGrade !== null;
    } else {
      return selectedSize !== null;
    }
  };

  const handleColorSelect = (colorId: number, imageUrl?: string) => {
    setSelectedColor(colorId);
    if (imageUrl) {
      setSelectedVariantImage(imageUrl);
    }
    // Reset size/grade selection when color changes
    setSelectedGrade(null);
    setSelectedSize(null);
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

  if (loading) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">Carregando produto...</p>
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
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Produto não encontrado</h1>
            <p className="text-muted-foreground mb-6">O produto que você está procurando não existe ou foi removido.</p>
            <Button onClick={() => navigate("/loja")} className="bg-primary hover:bg-primary/90">
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
      <div className="container mx-auto px-4 py-4">
        {/* Breadcrumb */}
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/loja")}
            className="text-sm text-muted-foreground hover:text-primary p-0 h-auto mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar à Loja
          </Button>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">
          {/* Product Image Section */}
          <div className="lg:col-span-2">
            <div className="sticky top-4">
              <div className="aspect-square relative">
                <ProductImage
                  src={selectedVariantImage || product.photo}
                  alt={product.name}
                  className="w-full h-full object-contain"
                  priority={true}
                />

                {/* Category Badge */}
                {product.category_name && (
                  <span className="absolute top-0 left-0 text-xs text-gray-500">
                    {product.category_name}
                  </span>
                )}

                {/* Image indicator */}
                {selectedVariantImage && (
                  <span className="absolute bottom-0 right-0 text-xs text-gray-500">
                    Variante
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="lg:col-span-3 space-y-6">
            {/* Product Header */}
            <div className="space-y-4">
              {/* Title and Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  {product.description && (
                    <p className="text-sm text-gray-600">
                      {product.description}
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Section - Prominent */}
              {product.base_price && (
                <div className="py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">
                        Preço Unitário
                      </div>
                      <PriceDisplay
                        price={product.base_price}
                        suggestedPrice={product.suggested_price}
                        variant="large"
                        onLoginClick={() => setShowLoginModal(true)}
                      />
                    </div>
                    {isAuthenticated && isApproved && product.suggested_price && typeof product.suggested_price === 'number' && product.suggested_price > product.base_price && (
                      <div className="text-right">
                        <div className="text-xs text-gray-500 mb-1">Economia</div>
                        <div className="text-sm text-green-600 font-semibold">
                          R$ {formatPrice(product.suggested_price - product.base_price)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Authentication Check */}
            {!isAuthenticated || !isApproved ? (
              <div className="text-center py-6 space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  <span className="font-medium text-gray-900">Login necessário</span>
                </div>
                <Button
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  onClick={() => setShowLoginModal(true)}
                >
                  Fazer Login
                </Button>
              </div>
            ) : (
              <>
                {/* Color Variants Section */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      Cores ({getAvailableColors().length})
                    </h3>
                    {getAvailableColors().length === 0 ? (
                      <p className="text-sm text-gray-500 py-2">Nenhuma cor disponível</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {getAvailableColors().map((color) => (
                          <button
                            key={color.id}
                            onClick={() => handleColorSelect(color.id, color.image_url)}
                            className="flex items-center gap-2 p-2 hover:opacity-75 transition-opacity"
                          >
                            {/* Variant Image or Color Circle */}
                            {color.image_url ? (
                              <div className="w-6 h-6 rounded overflow-hidden">
                                <ProductImage
                                  src={color.image_url}
                                  alt={`${product.name} - ${color.name}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center text-xs font-medium text-white"
                                style={{ backgroundColor: color.hex_code || "#999" }}
                              >
                                {color.name?.charAt(0).toUpperCase()}
                              </div>
                            )}

                            {/* Color Name */}
                            <span className={`text-sm ${selectedColor === color.id ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                              {color.name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Grades or Sizes Section */}
                  {selectedColor && (
                    <div className="space-y-3">
                      <h3 className="text-base font-semibold text-gray-900">
                        {hasGrades() ? "Grades" : "Tamanhos"}
                      </h3>
                      
                      <div className="space-y-4">
                        {hasGrades() ? (
                          getAvailableGradesForColor().map((grade) => {
                            const canAdd = canAddGradeToCart(grade);
                            const sortedTemplates = [...grade.templates].sort(
                              (a, b) => a.display_order - b.display_order,
                            );

                            return (
                              <button
                                key={grade.id}
                                onClick={() => canAdd ? setSelectedGrade(grade.id) : null}
                                disabled={!canAdd}
                                className={`w-full p-3 text-left transition-opacity ${
                                  !canAdd
                                    ? "opacity-40 cursor-not-allowed"
                                    : "hover:opacity-75"
                                }`}
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <div className="flex-1">
                                    <h4 className={`text-sm mb-1 ${selectedGrade === grade.id ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                                      {grade.name}
                                    </h4>
                                    <span className="text-xs text-gray-500">
                                      {grade.total_quantity} peças
                                    </span>
                                  </div>

                                  {product.base_price && (
                                    <div className="text-right">
                                      <PriceDisplay
                                        price={product.base_price * grade.total_quantity}
                                        variant="small"
                                        className="text-gray-900 font-semibold"
                                        onLoginClick={() => setShowLoginModal(true)}
                                      />
                                      <div className="text-xs text-gray-500">
                                        R$ {formatPrice(product.base_price)} cada
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                                  {sortedTemplates.map((template, index) => (
                                    <span key={`${template.size_id}-${index}`}>
                                      {template.size}({template.required_quantity})
                                    </span>
                                  ))}
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="grid grid-cols-4 gap-3">
                            {getAvailableSizes().map((size) => (
                              <button
                                key={size.id}
                                onClick={() => setSelectedSize(size.id)}
                                className="p-2 text-center hover:opacity-75 transition-opacity"
                              >
                                <div className={`text-sm ${selectedSize === size.id ? 'font-semibold text-gray-900' : 'font-medium text-gray-600'}`}>
                                  {size.name}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {size.stock} disponível
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to Cart Section */}
                {canAddToCart() && (
                  <div className="border border-gray-200 rounded-lg p-4 sticky bottom-4 bg-white">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-700">Qtd:</span>
                        <div className="flex items-center gap-1 border border-gray-200 rounded">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuantity(quantity + 1)}
                            className="h-8 w-8 p-0"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={addToCart}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground h-10 flex-1 max-w-48"
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </StoreLayout>
  );
}
