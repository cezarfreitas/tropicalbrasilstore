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
      <div className="container mx-auto px-2 py-2">
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

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Product Image Section */}
          <div>
            <div className="sticky top-2">
              <div className="bg-gray-50 rounded-2xl p-4">
                <div className="aspect-square relative">
                  <ProductImage
                    src={selectedVariantImage || product.photo}
                    alt={product.name}
                    className="w-full h-full object-contain"
                    priority={true}
                  />

                  {/* Category Badge */}
                  {product.category_name && (
                    <div className="absolute top-2 left-2 bg-white px-1.5 py-0.5 rounded-full text-xs font-medium text-gray-700 shadow-sm">
                      {product.category_name}
                    </div>
                  )}

                  {/* Image indicator */}
                  {selectedVariantImage && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white px-1.5 py-0.5 rounded-full text-xs">
                      Variante
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-4">
            {/* Product Header */}
            <div className="space-y-3">
              {/* Title and Actions */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-1.5 leading-tight">
                    {product.name}
                  </h1>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Heart className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Price Section */}
              {product.base_price && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">
                        Preço Unitário
                      </div>
                      <PriceDisplay
                        price={product.base_price}
                        suggestedPrice={product.suggested_price}
                        variant="large"
                        onLoginClick={() => setShowLoginModal(true)}
                      />
                    </div>
                    {product.suggested_price && typeof product.suggested_price === 'number' && product.suggested_price > product.base_price && (
                      <div className="text-right">
                        <div className="text-sm text-gray-600 mb-1">Você Economiza</div>
                        <div className="text-xl font-bold text-green-600">
                          R$ {formatPrice(product.suggested_price - product.base_price)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Color Variants Section */}
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-gray-900">
                Cores Disponíveis
              </h3>
              {getAvailableColors().length === 0 ? (
                <p className="text-gray-500">Nenhuma cor disponível</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {getAvailableColors().map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id, color.image_url)}
                      className={`flex items-center gap-1.5 p-1.5 rounded-lg transition-all ${
                        selectedColor === color.id
                          ? "bg-primary/10 border-2 border-primary"
                          : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {/* Variant Image or Color Circle */}
                      {color.image_url ? (
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200">
                          <ProductImage
                            src={color.image_url}
                            alt={`${product.name} - ${color.name}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-sm font-medium text-white"
                          style={{ backgroundColor: color.hex_code || "#999" }}
                        >
                          {color.name?.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Color Name */}
                      <span className="font-medium text-gray-900">
                        {color.name}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Grades or Sizes Section */}
            {selectedColor && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  {hasGrades() ? "Selecione a Grade" : "Selecione o Tamanho"}
                </h3>

                <div className="space-y-1.5">
                  {hasGrades() ? (
                    getAvailableGradesForColor().map((grade) => {
                      const canAdd = canAddGradeToCart(grade);
                      const sortedTemplates = [...grade.templates].sort(
                        (a, b) => a.display_order - b.display_order,
                      );

                      return (
                        <div
                          key={grade.id}
                          className={`inline-block rounded-lg border-2 transition-all ${
                            !canAdd
                              ? "border-gray-200 bg-gray-50 opacity-50"
                              : selectedGrade === grade.id
                                ? "border-primary bg-primary/5"
                                : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <div
                            className="p-2 cursor-pointer"
                            onClick={() => canAdd ? setSelectedGrade(grade.id) : null}
                          >
                            <div className="text-sm">
                              <span className="font-medium text-gray-900">{grade.name}</span>
                              <span className="text-gray-600 mx-1">•</span>
                              <span className="text-gray-900">{grade.total_quantity} peças total</span>
                              {product.base_price && (
                                <>
                                  <span className="text-gray-600 mx-1">•</span>
                                  <span className="text-primary font-medium">
                                    R$ {formatPrice(product.base_price * grade.total_quantity)}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 font-mono">
                              {sortedTemplates.map((template, index) => (
                                <span key={`size-qty-${template.size_id}-${index}`} className="inline-block">
                                  <span className="font-medium text-gray-800">{template.size}</span>
                                  <span className="text-gray-500">({template.required_quantity})</span>
                                  {index < sortedTemplates.length - 1 && (
                                    <span className="text-gray-400 mx-1">•</span>
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

            {/* Add to Cart Section */}
            {canAddToCart() && (
              <div className="border-t pt-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Quantidade:</label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-gray-300 rounded-lg">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-9 w-9 p-0 rounded-l-lg"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center text-sm font-semibold border-x">
                        {quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-9 w-9 p-0 rounded-r-lg"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <Button
                      onClick={addToCart}
                      className="bg-primary hover:bg-primary/90 text-white h-9 px-4 text-sm font-semibold rounded-lg shadow-sm hover:shadow-md transition-all"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Adicionar ao Carrinho
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Cart Summary */}
            {totalItems > 0 && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">
                  Resumo do Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                </h3>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs bg-gray-50 p-2 rounded">
                      <div className="flex-1">
                        <span className="font-medium text-gray-900">{item.productName}</span>
                        {item.colorName && (
                          <span className="text-gray-600 ml-1">• {item.colorName}</span>
                        )}
                        {item.gradeName && (
                          <span className="text-gray-600 ml-1">• {item.gradeName}</span>
                        )}
                        {item.sizeName && (
                          <span className="text-gray-600 ml-1">• {item.sizeName}</span>
                        )}
                        <div className="text-gray-500 mt-1">
                          Qtd: {item.quantity} • R$ {(item.unitPrice || 0).toFixed(2).replace('.', ',')} cada
                        </div>
                      </div>
                      <div className="text-primary font-medium text-right">
                        R$ {(item.totalPrice || 0).toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-2 mt-3 flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total:</span>
                  <span className="font-bold text-primary text-lg">
                    R$ {(totalPrice || 0).toFixed(2).replace('.', ',')}
                  </span>
                </div>
                <Button
                  onClick={() => navigate('/loja/carrinho')}
                  className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  Finalizar Compra
                </Button>
              </div>
            )}

            {/* Product Description at bottom */}
            {product.description && (
              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Descrição do Produto
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
              </div>
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
