import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Grid3x3, Minus, Plus } from "lucide-react";

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

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/store/products/${id}`);
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

    // Calculate grade price - quantity times unit price
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

    // Reset quantity for this grade
    updateGradeQuantity(grade.id, 1);
  };

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Carregando produto...
            </p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  if (!product) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            {product.photo ? (
              <img
                src={product.photo}
                alt={product.name}
                className="w-full h-full object-cover rounded-lg"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="flex items-center justify-center w-full h-full"><svg class="h-32 w-32 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg></div>';
                  }
                }}
              />
            ) : (
              <Package className="h-32 w-32 text-muted-foreground/50" />
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {product.category_name && (
                <Badge variant="secondary" className="mt-2">
                  {product.category_name}
                </Badge>
              )}
              {product.description && (
                <p className="text-muted-foreground mt-4">
                  {product.description}
                </p>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Grid3x3 className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Grades Disponíveis</h2>
              </div>

              {product.available_grades.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <Grid3x3 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-2 text-muted-foreground">
                      Nenhuma grade disponível para este produto
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {product.available_grades.map((grade) => (
                    <Card key={grade.id} className="border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">
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
                              <div className="space-y-1">
                                <p className="text-xl font-bold text-primary">
                                  R${" "}
                                  {(
                                    product.base_price * grade.total_quantity
                                  ).toFixed(2)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  preço da grade
                                </p>
                                <div className="border-t pt-2 mt-2">
                                  <p className="text-sm font-medium">
                                    R${" "}
                                    {parseFloat(product.base_price).toFixed(2)}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    preço unitário
                                  </p>
                                  {product.suggested_price && (
                                    <>
                                      <p className="text-sm text-muted-foreground mt-1">
                                        R${" "}
                                        {parseFloat(
                                          product.suggested_price,
                                        ).toFixed(2)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        preço sugerido
                                      </p>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {grade.templates.map((template) => (
                            <div
                              key={template.size_id}
                              className="flex justify-between text-sm p-2 bg-muted rounded"
                            >
                              <span>Tamanho {template.size}:</span>
                              <span className="font-medium">
                                {template.required_quantity} un
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Label className="text-sm">Quantidade:</Label>
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

                          <Button
                            onClick={() => addGradeToCart(grade)}
                            className="ml-4"
                          >
                            <ShoppingCart className="mr-2 h-4 w-4" />
                            Adicionar ao Carrinho
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
