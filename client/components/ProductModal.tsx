import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, X, Minus, Plus, Check } from "lucide-react";

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
  const [step, setStep] = useState<'color' | 'selection' | 'quantity'>('color');
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
        // Reset selections when new product loads
        setSelectedColor(null);
        setSelectedGrade(null);
        setSelectedSize(null);
        setQuantity(1);
        setStep('color');
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableColors = () => {
    if (!product?.variants) return [];
    
    const colorMap = new Map();
    product.variants.forEach((variant) => {
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
        title: "Grade adicionada!",
        description: `${quantity}x ${grade.name} - ${selectedColorData?.name}`,
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
        title: "Produto adicionado!",
        description: `${quantity}x ${product.name} - ${selectedColorData?.name}`,
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
    setStep('color');
    onClose();
  };

  const handleColorSelect = (colorId: number) => {
    setSelectedColor(colorId);
    setSelectedGrade(null);
    setSelectedSize(null);
    setStep('selection');
  };

  const handleSelectionComplete = () => {
    if ((hasGrades() && selectedGrade) || (!hasGrades() && selectedSize)) {
      setStep('quantity');
    }
  };

  const canProceed = () => {
    if (step === 'color') return selectedColor !== null;
    if (step === 'selection') return (hasGrades() && selectedGrade) || (!hasGrades() && selectedSize);
    return true;
  };

  const getStepTitle = () => {
    switch (step) {
      case 'color': return 'Escolha a cor';
      case 'selection': return hasGrades() ? 'Escolha a grade' : 'Escolha o tamanho';
      case 'quantity': return 'Quantidade';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-w-full h-full sm:h-auto sm:max-h-[90vh] p-0 overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>
            {product ? `Adicionar ${product.name} ao carrinho` : 'Adicionar produto ao carrinho'}
          </DialogTitle>
        </VisuallyHidden>
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          </div>
        ) : product ? (
          <div className="flex flex-col h-full">
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white sticky top-0 z-10">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="font-medium text-lg">{product.name}</h2>
              <div className="w-8" />
            </div>

            {/* Product Image */}
            <div className="aspect-square sm:aspect-video bg-muted relative">
              {product.photo ? (
                <img
                  src={product.photo}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Package className="h-16 w-16 text-muted-foreground/50" />
                </div>
              )}
              
              {/* Price overlay */}
              {product.base_price && (
                <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="text-lg font-bold text-orange-500">
                    R$ {parseFloat(product.base_price.toString()).toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {hasGrades() ? 'por peça' : 'unitário'}
                  </div>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
              {/* Step Indicator */}
              <div className="flex items-center justify-center space-x-2 py-2">
                <div className={`w-2 h-2 rounded-full ${step === 'color' ? 'bg-orange-500' : selectedColor ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 'selection' ? 'bg-orange-500' : (hasGrades() ? selectedGrade : selectedSize) ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div className={`w-2 h-2 rounded-full ${step === 'quantity' ? 'bg-orange-500' : 'bg-gray-300'}`} />
              </div>

              <div className="text-center">
                <h3 className="text-lg font-medium">{getStepTitle()}</h3>
              </div>

              {/* Color Selection */}
              {step === 'color' && (
                <div className="grid grid-cols-2 gap-3">
                  {getAvailableColors().map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleColorSelect(color.id)}
                      className={`p-4 border-2 rounded-xl flex items-center gap-3 transition-all ${
                        selectedColor === color.id
                          ? 'border-orange-500 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.hex_code || '#999999' }}
                      />
                      <span className="font-medium text-left">{color.name}</span>
                      {selectedColor === color.id && (
                        <Check className="h-5 w-5 text-orange-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Grade/Size Selection */}
              {step === 'selection' && selectedColor && (
                <div className="space-y-3">
                  {hasGrades() ? (
                    getAvailableGradesForColor().length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        Nenhuma grade disponível para esta cor
                      </p>
                    ) : (
                      getAvailableGradesForColor().map((grade) => {
                        const canAdd = canAddGradeToCart(grade);
                        const hasStock = grade.has_full_stock;
                        
                        return (
                          <button
                            key={grade.id}
                            onClick={() => canAdd ? setSelectedGrade(grade.id) : null}
                            disabled={!canAdd}
                            className={`w-full p-4 border-2 rounded-xl text-left transition-all ${
                              !canAdd
                                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                : selectedGrade === grade.id
                                  ? 'border-orange-500 bg-orange-50'
                                  : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className="font-medium text-base">{grade.name}</h4>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {grade.total_quantity} peças
                                  </Badge>
                                  <Badge variant={canAdd ? (hasStock ? "default" : "secondary") : "destructive"} className="text-xs">
                                    {product?.sell_without_stock
                                      ? "Disponível"
                                      : hasStock
                                        ? "Estoque OK"
                                        : grade.has_any_stock
                                          ? "Estoque parcial"
                                          : "Sem estoque"}
                                  </Badge>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {grade.templates.map(t => t.size).join(', ')}
                                </div>
                              </div>
                              <div className="text-right ml-4">
                                {selectedGrade === grade.id && (
                                  <Check className="h-5 w-5 text-orange-500 mb-2" />
                                )}
                                {product.base_price && (
                                  <div className={`font-bold ${canAdd ? 'text-orange-500' : 'text-muted-foreground'}`}>
                                    R$ {(product.base_price * grade.total_quantity).toFixed(2)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      {getAvailableSizes().length === 0 ? (
                        <p className="text-muted-foreground text-center py-8 col-span-2">
                          Nenhum tamanho disponível para esta cor
                        </p>
                      ) : (
                        getAvailableSizes().map((size) => (
                          <button
                            key={size.id}
                            onClick={() => setSelectedSize(size.id)}
                            className={`p-4 border-2 rounded-xl text-center transition-all ${
                              selectedSize === size.id
                                ? 'border-orange-500 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300'
                            }`}
                          >
                            <div className="font-medium text-lg">{size.name}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {size.stock} disponível
                            </div>
                            {selectedSize === size.id && (
                              <Check className="h-5 w-5 text-orange-500 mx-auto mt-2" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Quantity Selection */}
              {step === 'quantity' && (
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="text-lg font-medium mb-2">Quantidade</div>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="h-12 w-12"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 h-12 text-center text-lg font-medium"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setQuantity(quantity + 1)}
                        className="h-12 w-12"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Summary */}
                  <Card className="bg-orange-50 border-orange-200">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-2">Resumo do pedido</div>
                        <div className="text-lg font-medium">
                          {quantity}x {product.name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Cor: {getAvailableColors().find(c => c.id === selectedColor)?.name}
                        </div>
                        {hasGrades() && selectedGrade && (
                          <div className="text-sm text-muted-foreground">
                            Grade: {getAvailableGradesForColor().find(g => g.id === selectedGrade)?.name}
                          </div>
                        )}
                        {!hasGrades() && selectedSize && (
                          <div className="text-sm text-muted-foreground">
                            Tamanho: {getAvailableSizes().find(s => s.id === selectedSize)?.name}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Bottom Navigation */}
            <div className="p-4 border-t bg-white">
              <div className="flex gap-3">
                {step !== 'color' && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (step === 'quantity') setStep('selection');
                      else if (step === 'selection') setStep('color');
                    }}
                    className="flex-1"
                  >
                    Voltar
                  </Button>
                )}
                
                {step === 'quantity' ? (
                  <Button
                    onClick={addToCart}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
                    size="lg"
                  >
                    <ShoppingCart className="mr-2 h-4 w-4" />
                    Adicionar ao Carrinho
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      if (step === 'color' && selectedColor) setStep('selection');
                      else if (step === 'selection') handleSelectionComplete();
                    }}
                    disabled={!canProceed()}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-300"
                    size="lg"
                  >
                    Continuar
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">Produto não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
