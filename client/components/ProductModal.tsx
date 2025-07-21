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
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Grid3x3, Minus, Plus, X } from "lucide-react";

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
  available_grades: AvailableGrade[];
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
  const [quantities, setQuantities] = useState<Record<number, number>>({});
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
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGradeQuantity = (gradeId: number) => {
    return quantities[gradeId] || 1;
  };

  const updateGradeQuantity = (gradeId: number, quantity: number) => {
    setQuantities((prev) => ({
      ...prev,
      [gradeId]: Math.max(1, quantity),
    }));
  };

  const addGradeToCart = (grade: AvailableGrade) => {
    if (!product) return;

    const quantity = getGradeQuantity(grade.id);

    const gradePrice = product.base_price
      ? product.base_price * grade.total_quantity
      : 0;

    addItem({
      type: "grade",
      productId: product.id,
      productName: product.name,
      colorId: grade.color_id,
      colorName: grade.color_name,
      gradeId: grade.id,
      gradeName: grade.name,
      quantity,
      unitPrice: gradePrice,
      photo: product.photo,
    });

    toast({
      title: "Grade adicionada ao carrinho",
      description: `${quantity}x ${grade.name} - ${grade.color_name}`,
    });

    updateGradeQuantity(grade.id, 1);
    onClose();
  };

  const handleClose = () => {
    setProduct(null);
    setQuantities({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Grid3x3 className="h-5 w-5" />
            Selecionar Grade
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
                        R$ {parseFloat(product.base_price).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        preço unitário
                      </p>
                    </div>
                    {product.suggested_price && (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          R$ {parseFloat(product.suggested_price).toFixed(2)}
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

                        {/* Grades */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold">
                {product.available_grades && product.available_grades.length > 0
                  ? "Grades Disponíveis"
                  : "Compra por Unidade"}
              </h4>

              {!product.available_grades || product.available_grades.length === 0 ? (
                <Card>
                  <CardContent className="py-6">
                    <div className="text-center space-y-4">
                      <Package className="mx-auto h-12 w-12 text-primary" />
                      <div>
                        <p className="text-lg font-medium">Compra por Unidade</p>
                        <p className="text-sm text-muted-foreground">
                          Este produto não possui grades pré-definidas. Você pode comprá-lo por unidade.
                        </p>
                      </div>

                      {product.base_price && (
                        <div className="flex items-center justify-center gap-4 pt-4">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Quantidade:</Label>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateGradeQuantity(0, getGradeQuantity(0) - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={getGradeQuantity(0)}
                              onChange={(e) => updateGradeQuantity(0, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center text-sm"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateGradeQuantity(0, getGradeQuantity(0) + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            onClick={() => addUnitToCart()}
                            size="lg"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Adicionar R$ {(product.base_price * getGradeQuantity(0)).toFixed(2)}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                product.available_grades.map((grade) => (
                  <Card key={grade.id} className="border">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">
                            {grade.name}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{
                                backgroundColor: grade.hex_code || "#999999",
                              }}
                            />
                            <span className="text-sm text-muted-foreground">
                              {grade.color_name}
                            </span>
                            <Badge variant="outline" className="ml-2">
                              {grade.total_quantity} peças
                            </Badge>
                          </div>
                          {grade.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {grade.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {product.base_price && (
                            <div>
                              <p className="text-lg font-bold text-primary">
                                R${" "}
                                {(
                                  product.base_price * grade.total_quantity
                                ).toFixed(2)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                preço da grade
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
                        {grade.templates.map((template) => (
                          <div
                            key={template.size_id}
                            className="flex justify-between text-sm p-2 bg-muted rounded"
                          >
                            <span>Tam. {template.size}:</span>
                            <span className="font-medium">
                              {template.required_quantity}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Qtd:</Label>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateGradeQuantity(
                                grade.id,
                                getGradeQuantity(grade.id) - 1,
                              )
                            }
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            value={getGradeQuantity(grade.id)}
                            onChange={(e) =>
                              updateGradeQuantity(
                                grade.id,
                                parseInt(e.target.value) || 1,
                              )
                            }
                            className="w-16 h-8 text-center text-sm"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              updateGradeQuantity(
                                grade.id,
                                getGradeQuantity(grade.id) + 1,
                              )
                            }
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button onClick={() => addGradeToCart(grade)}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Adicionar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
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
