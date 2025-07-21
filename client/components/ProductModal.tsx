import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, X, Minus, Plus } from "lucide-react";

interface ProductVariant {
  id: number;
  size_id: number;
  color_id: number;
  stock: number;
  price_override?: number;
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
}

export function ProductModal({
  productId,
  isOpen,
  onClose,
}: ProductModalProps) {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (productId && isOpen) {
      fetchProduct();
    }
  }, [productId, isOpen]);

  const fetchProduct = async () => {
    if (!productId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/store/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        // Auto-select first color if only one available
        const colors = getAvailableColors(data);
        if (colors.length === 1) {
          setSelectedColor(colors[0].id);
        } else {
          setSelectedColor(null);
        }
        setSelectedGrade(null);
        setSelectedSize(null);
        setQuantity(1);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
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
        });
      }
    });

    return Array.from(colorMap.values());
  };

  const getAvailableSizes = () => {
    if (!product?.variants || !selectedColor) return [];
    
    const sizeMap = new Map();
    product.variants
      .filter(v => v.color_id === selectedColor && v.stock > 0)
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
    
    return product.available_grades.filter(grade => grade.color_id === selectedColor);
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

    const selectedColorData = getAvailableColors().find(c => c.id === selectedColor);

    if (hasGrades() && selectedGrade) {
      const grade = getAvailableGradesForColor().find(g => g.id === selectedGrade);
      if (!grade) return;

      if (!canAddGradeToCart(grade)) {
        toast({
          title: "Erro",
          description: "Estoque insuficiente para esta grade",
          variant: "destructive",
        });
        return;
      }

      const gradePrice = product.base_price ? product.base_price * grade.total_quantity : 0;

      addItem({
        type: "grade",
        productId: product.id,
        productName: product.name,
        colorId: selectedColor,
        colorName: selectedColorData?.name || '',
        gradeId: grade.id,
        gradeName: grade.name,
        quantity,
        unitPrice: gradePrice,
        photo: product.photo,
      });

      toast({
        title: "Adicionado!",
        description: `${grade.name} - ${selectedColorData?.name}`,
      });
    } else if (!hasGrades() && selectedSize) {
      const variant = product.variants.find(v => 
        v.color_id === selectedColor && v.size_id === selectedSize
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
        colorName: selectedColorData?.name || '',
        sizeId: selectedSize,
        sizeName: variant.size || '',
        quantity,
        unitPrice,
        photo: product.photo,
      });

      toast({
        title: "Adicionado!",
        description: `${product.name} - ${selectedColorData?.name}`,
      });
    } else {
      toast({
        title: "Erro",
        description: hasGrades() ? "Selecione uma grade" : "Selecione um tamanho",
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
      <DialogContent className="max-w-sm mx-auto p-0 gap-0 overflow-hidden rounded-2xl">
        <VisuallyHidden>
          <DialogTitle>
            {product ? `Adicionar ${product.name} ao carrinho` : 'Adicionar produto ao carrinho'}
          </DialogTitle>
        </VisuallyHidden>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
          </div>
        ) : product ? (
          <div className="bg-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                  {product.photo ? (
                    <img
                      src={product.photo}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <Package className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  {product.base_price && (
                    <p className="text-orange-500 font-bold text-sm">
                      R$ {parseFloat(product.base_price.toString()).toFixed(2)}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Selection */}
            <div className="p-4 space-y-3">
              {/* Colors */}
              <div>
                <div className="text-xs font-medium text-gray-700 mb-2">Cor</div>
                <div className="flex gap-2 flex-wrap">
                  {getAvailableColors().map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSelectedColor(color.id)}
                      className={`flex items-center gap-2 p-2 border rounded-lg text-xs ${
                        selectedColor === color.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-gray-300"
                        style={{ backgroundColor: color.hex_code || '#999' }}
                      />
                      <span className="font-medium">{color.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grades or Sizes */}
              {selectedColor && (
                <div>
                  <div className="text-xs font-medium text-gray-700 mb-2">
                    {hasGrades() ? 'Grade' : 'Tamanho'}
                  </div>
                  <div className="space-y-2">
                    {hasGrades() ? (
                      getAvailableGradesForColor().map((grade) => {
                        const canAdd = canAddGradeToCart(grade);
                        // Sort templates by display order
                        const sortedTemplates = [...grade.templates].sort((a, b) => a.display_order - b.display_order);

                        return (
                          <button
                            key={grade.id}
                            onClick={() => canAdd ? setSelectedGrade(grade.id) : null}
                            disabled={!canAdd}
                            className={`p-3 border rounded-xl text-left transition-all duration-200 ${
                              !canAdd
                                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                : selectedGrade === grade.id
                                  ? 'border-orange-500 bg-orange-50 shadow-sm'
                                  : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="space-y-1.5">
                              {/* Grade Header */}
                              <div className="flex justify-between items-center">
                                <div className="font-semibold text-sm text-gray-900">
                                  {grade.name}
                                </div>
                                {product.base_price && (
                                  <div className="text-orange-500 font-bold text-sm">
                                    R$ {(product.base_price * grade.total_quantity).toFixed(2)}
                                  </div>
                                )}
                              </div>

                              {/* Simple Grade Breakdown */}
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-orange-600">
                                  {grade.total_quantity} peças:
                                </span>
                                <span className="ml-1">
                                  {sortedTemplates.map((template, index) => (
                                    <span key={`${template.size_id}-${index}`}>
                                      {template.size}({template.required_quantity}){index < sortedTemplates.length - 1 ? ' • ' : ''}
                                    </span>
                                  ))}
                                </span>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {getAvailableSizes().map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedSize(size.id)}
                            className={`p-2.5 border rounded-xl text-left transition-all duration-200 ${
                              selectedSize === size.id
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-sm">{size.name}</div>
                                {product.base_price && (
                                  <div className="text-orange-500 font-bold text-xs">
                                    R$ {parseFloat(product.base_price.toString()).toFixed(2)}
                                  </div>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="font-medium text-orange-600">1 peça</span>
                                <span className="ml-2">{size.stock} disponível</span>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Quantity & Add Button */}
              {canAddToCart() && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setQuantity(quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>

                  <Button 
                    onClick={addToCart}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    size="sm"
                  >
                    <ShoppingCart className="mr-1 h-3 w-3" />
                    Adicionar
                  </Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">Produto não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
