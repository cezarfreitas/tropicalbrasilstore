import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Grid3x3, Minus, Plus, Palette } from "lucide-react";

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
}

interface ProductDetail {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
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
      const response = await fetch(`/api/store-old/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
        // Reset selections when new product loads
        setSelectedColor(null);
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
      // Add grade to cart
      const grade = getAvailableGradesForColor().find(g => g.id === selectedGrade);
      if (!grade) return;

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
        title: "Grade adicionada ao carrinho",
        description: `${quantity}x ${grade.name} - ${selectedColorData?.name}`,
      });
    } else if (!hasGrades() && selectedSize) {
      // Add individual variant to cart
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
        title: "Produto adicionado ao carrinho",
        description: `${quantity}x ${product.name} - ${selectedColorData?.name} - ${variant.size}`,
      });
    } else if (!hasGrades() && product.base_price) {
      // Add unit to cart (fallback)
      addItem({
        type: "unit",
        productId: product.id,
        productName: product.name,
        colorId: selectedColor,
        colorName: selectedColorData?.name || '',
        quantity,
        unitPrice: product.base_price,
        photo: product.photo,
      });

      toast({
        title: "Produto adicionado ao carrinho",
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

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Adicionar ao Carrinho
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : product ? (
          <div className="space-y-6">
            {/* Product Header */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-32 h-32 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                {product.photo ? (
                  <img
                    src={product.photo}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="h-12 w-12 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold">{product.name}</h3>
                {product.category_name && (
                  <Badge variant="secondary" className="mt-1">
                    {product.category_name}
                  </Badge>
                )}
                {product.description && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {product.description}
                  </p>
                )}
                {product.base_price && (
                  <div className="mt-3 flex items-center gap-4">
                    <div>
                      <p className="text-lg font-bold text-primary">
                        R$ {parseFloat(product.base_price.toString()).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        preço {hasGrades() ? 'por peça' : 'unitário'}
                      </p>
                    </div>
                    {product.suggested_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          R$ {parseFloat(product.suggested_price.toString()).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          preço sugerido
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Selection Interface */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5" />
                {hasGrades() ? 'Selecione Cor e Grade' : 'Selecione Cor e Tamanho'}
              </h4>

              {/* Color Selection */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">1. Escolha a Cor</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {getAvailableColors().map((color) => (
                      <button
                        key={color.id}
                        onClick={() => {
                          setSelectedColor(color.id);
                          setSelectedGrade(null);
                          setSelectedSize(null);
                        }}
                        className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                          selectedColor === color.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <div
                          className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                          style={{ backgroundColor: color.hex_code || '#999999' }}
                        />
                        <span className="font-medium">{color.name}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Grade or Size Selection */}
              {selectedColor && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      2. Escolha {hasGrades() ? 'a Grade' : 'o Tamanho'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasGrades() ? (
                      <div className="space-y-3">
                        {getAvailableGradesForColor().length === 0 ? (
                          <p className="text-muted-foreground text-center py-4">
                            Nenhuma grade disponível para esta cor
                          </p>
                        ) : (
                          getAvailableGradesForColor().map((grade) => (
                            <button
                              key={grade.id}
                              onClick={() => setSelectedGrade(grade.id)}
                              className={`w-full p-4 border rounded-lg text-left transition-colors ${
                                selectedGrade === grade.id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{grade.name}</h4>
                                  {grade.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                      {grade.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="outline">
                                      {grade.total_quantity} peças
                                    </Badge>
                                    <div className="text-sm text-muted-foreground">
                                      Tamanhos: {grade.templates.map(t => t.size).join(', ')}
                                    </div>
                                  </div>
                                </div>
                                {product.base_price && (
                                  <div className="text-right">
                                    <p className="font-bold text-primary">
                                      R$ {(product.base_price * grade.total_quantity).toFixed(2)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      total da grade
                                    </p>
                                  </div>
                                )}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {getAvailableSizes().length === 0 ? (
                          <p className="text-muted-foreground text-center py-4 col-span-full">
                            Nenhum tamanho disponível para esta cor
                          </p>
                        ) : (
                          getAvailableSizes().map((size) => (
                            <button
                              key={size.id}
                              onClick={() => setSelectedSize(size.id)}
                              className={`p-3 border rounded-lg text-center transition-colors ${
                                selectedSize === size.id
                                  ? 'border-primary bg-primary/10'
                                  : 'border-border hover:border-primary/50'
                              }`}
                            >
                              <div className="font-medium">{size.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {size.stock} disponível
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quantity and Add to Cart */}
              {canAddToCart() && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Label className="text-sm font-medium">Quantidade:</Label>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-16 h-8 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setQuantity(quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <Button onClick={addToCart} size="lg">
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Adicionar ao Carrinho
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Produto não encontrado</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
