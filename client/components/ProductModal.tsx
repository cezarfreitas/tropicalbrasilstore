import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { PriceDisplay } from "@/components/PriceDisplay";
import { ProductImage } from "@/components/ProductImage";
import {
  ShoppingCart,
  Package,
  X,
  Minus,
  Plus,
  Lock,
  Info,
  Star,
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
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
  sell_without_stock?: boolean;
  variants: ProductVariant[];
  available_grades?: AvailableGrade[];
}

interface ProductModalProps {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onLoginClick?: () => void;
}

export function ProductModal({
  productId,
  isOpen,
  onClose,
  onLoginClick,
}: ProductModalProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantImage, setSelectedVariantImage] = useState<
    string | null
  >(null);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isAuthenticated, isApproved } = useCustomerAuth();

  useEffect(() => {
    if (productId && isOpen) {
      fetchProduct();
    }
  }, [productId, isOpen]);

  const fetchProduct = async (retryCount: number = 0) => {
    if (!productId) return;

    setLoading(true);
    try {
      // Use XMLHttpRequest directly to bypass fetch interference
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/api/store/products/${productId}`, true);
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
        // Auto-select first color if only one available
        const colors = getAvailableColors(data);
        if (colors.length === 1) {
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

    handleClose();
  };

  const handleClose = () => {
    setProduct(null);
    setSelectedColor(null);
    setSelectedGrade(null);
    setSelectedSize(null);
    setQuantity(1);
    setSelectedVariantImage(null);
    onClose();
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg mx-auto p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden max-h-[95vh] overflow-y-auto">
        <VisuallyHidden>
          <DialogTitle>
            {product
              ? `Detalhes do produto ${product.name}`
              : "Detalhes do produto"}
          </DialogTitle>
        </VisuallyHidden>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-sm text-muted-foreground">
                Carregando produto...
              </p>
            </div>
          </div>
        ) : product ? (
          <div className="bg-white">
            {/* Header with Close Button */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-medium text-sm">
                    Detalhes do Produto
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="h-8 w-8 p-0 hover:bg-gray-100"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Product Image Section */}
            <div className="relative bg-gray-50">
              <div className="aspect-square relative overflow-hidden">
                <ProductImage
                  src={selectedVariantImage || product.photo}
                  alt={product.name}
                  className="w-full h-full object-contain transition-all duration-300"
                  priority={true}
                />

                {/* Category Badge */}
                {product.category_name && (
                  <Badge
                    variant="secondary"
                    className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm border border-gray-200"
                  >
                    {product.category_name}
                  </Badge>
                )}

                {/* Image indicator */}
                {selectedVariantImage && (
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    <ImageIcon className="h-3 w-3" />
                    Variante
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="p-6 space-y-6">
              {/* Product Title & Price */}
              <div className="space-y-3">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>

                {product.base_price && (
                  <div className="flex items-center justify-between">
                    <PriceDisplay
                      price={product.base_price}
                      suggestedPrice={product.suggested_price}
                      variant="large"
                      onLoginClick={onLoginClick}
                    />

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Product Description */}
                {product.description && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Authentication Check */}
              {!isAuthenticated || !isApproved ? (
                <div className="text-center py-8 space-y-4">
                  <div className="flex justify-center">
                    <Lock className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-700">
                      🔐 Acesso Exclusivo para Clientes
                    </h3>
<<<<<<< HEAD
                    <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 mt-3">
                      <p className="text-sm font-medium text-blue-700 mb-1">
                        Entre para desbloquear:
                      </p>
                      <ul className="text-xs text-blue-600 space-y-1">
                        <li>💰 Preços especiais com desconto</li>
                        <li>🛒 Compras com facilidade</li>
                        <li>📦 Histórico de pedidos</li>
                      </ul>
                    </div>
=======
                    <p className="text-sm text-muted-foreground">
                      Faça login para ver preços e adicionar produtos ao
                      carrinho
                    </p>
>>>>>>> 4fd011bde74916a7d1b0e76dd623d3a55e6cd691
                  </div>
                  <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                    onClick={() => {
                      handleClose();
                      if (onLoginClick) {
                        onLoginClick();
                      }
                    }}
                  >
                    Fazer Login
                  </Button>
                </div>
              ) : (
                <>
                  {/* Color Variants Section */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 mb-3">
                        Cores Disponíveis
                      </h3>
                      {getAvailableColors().length === 0 ? (
                        <div className="text-center py-8">
                          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Nenhuma variação disponível para este produto
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {getAvailableColors().map((color) => (
                            <button
                              key={color.id}
                              onClick={() =>
                                handleColorSelect(color.id, color.image_url)
                              }
                              className={`relative group p-3 border-2 rounded-xl transition-all duration-200 ${
                                selectedColor === color.id
                                  ? "border-primary bg-primary/5 shadow-lg"
                                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                {/* Variant Image or Color Circle */}
                                <div className="relative">
                                  {color.image_url ? (
                                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-white">
                                      <ProductImage
                                        src={color.image_url}
                                        alt={`${product.name} - ${color.name}`}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div
                                      className="w-12 h-12 rounded-lg border border-gray-200 flex items-center justify-center text-xs font-medium text-white shadow-sm"
                                      style={{
                                        backgroundColor:
                                          color.hex_code || "#999",
                                      }}
                                    >
                                      {color.name?.charAt(0).toUpperCase()}
                                    </div>
                                  )}

                                  {/* Selection indicator */}
                                  {selectedColor === color.id && (
                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white flex items-center justify-center">
                                      <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                    </div>
                                  )}
                                </div>

                                {/* Color Name */}
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-sm text-gray-900">
                                    {color.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {color.image_url
                                      ? "Com imagem"
                                      : "Cor padrão"}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Grades or Sizes Section */}
                    {selectedColor && (
                      <div className="space-y-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {hasGrades()
                            ? "Grades Disponíveis"
                            : "Tamanhos Disponíveis"}
                        </h3>

                        <div className="space-y-3">
                          {hasGrades() ? (
                            getAvailableGradesForColor().map((grade) => {
                              const canAdd = canAddGradeToCart(grade);
                              const sortedTemplates = [...grade.templates].sort(
                                (a, b) => a.display_order - b.display_order,
                              );

                              return (
                                <button
                                  key={grade.id}
                                  onClick={() =>
                                    canAdd ? setSelectedGrade(grade.id) : null
                                  }
                                  disabled={!canAdd}
                                  className={`w-full p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                                    !canAdd
                                      ? "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
                                      : selectedGrade === grade.id
                                        ? "border-primary bg-primary/5 shadow-lg"
                                        : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                  }`}
                                >
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <div className="font-semibold text-sm text-gray-900">
                                          {grade.name}
                                        </div>
                                        {grade.description && (
                                          <div className="text-xs text-gray-600 mt-1">
                                            {grade.description}
                                          </div>
                                        )}
                                      </div>
                                      {product.base_price && (
                                        <div className="text-right">
                                          <PriceDisplay
                                            price={
                                              product.base_price *
                                              grade.total_quantity
                                            }
                                            variant="small"
                                            className="text-primary"
                                            onLoginClick={onLoginClick}
                                          />
                                        </div>
                                      )}
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-2">
                                      <div className="text-xs text-gray-600 mb-1">
                                        <span className="font-medium text-primary">
                                          {grade.total_quantity} peças total:
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-700">
                                        {sortedTemplates.map(
                                          (template, index) => (
                                            <span
                                              key={`${template.size_id}-${index}`}
                                              className="inline-block mr-3 mb-1"
                                            >
                                              <span className="font-medium">
                                                {template.size}
                                              </span>
                                              <span className="text-gray-500 ml-1">
                                                ({template.required_quantity})
                                              </span>
                                            </span>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            <div className="grid grid-cols-2 gap-3">
                              {getAvailableSizes().map((size) => (
                                <button
                                  key={size.id}
                                  onClick={() => setSelectedSize(size.id)}
                                  className={`p-3 border-2 rounded-xl text-left transition-all duration-200 ${
                                    selectedSize === size.id
                                      ? "border-primary bg-primary/5 shadow-lg"
                                      : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center">
                                      <div className="font-medium text-sm text-gray-900">
                                        {size.name}
                                      </div>
                                      {product.base_price && (
                                        <PriceDisplay
                                          price={product.base_price}
                                          variant="small"
                                          className="text-primary"
                                          onLoginClick={onLoginClick}
                                        />
                                      )}
                                    </div>
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-medium text-primary">
                                        1 peça
                                      </span>
                                      <span className="text-gray-500">
                                        {size.stock} disponível
                                      </span>
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantity & Add to Cart Section */}
                  {canAddToCart() && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-700">
                            Quantidade
                          </span>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
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
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium"
                          size="lg"
                        >
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Adicionar ao Carrinho
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">
              Produto não encontrado
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
