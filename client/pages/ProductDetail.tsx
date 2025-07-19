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
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
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

  const getSelectedGradeDetails = () => {
    if (!product || !selectedGrade) return null;
    return product.available_grades.find((g) => g.id === selectedGrade);
  };

  const addGradeToCart = () => {
    const grade = getSelectedGradeDetails();
    if (!grade || !product) return;

    // Calculate grade price (you might want to set specific grade prices)
    const gradePrice = product.base_price
      ? product.base_price * grade.total_quantity * 0.9
      : 0; // 10% discount for grades

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

    setQuantity(1);
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
                    <Card
                      key={grade.id}
                      className={`cursor-pointer transition-colors ${
                        selectedGrade === grade.id
                          ? "border-primary bg-primary/5"
                          : ""
                      }`}
                      onClick={() => setSelectedGrade(grade.id)}
                    >
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
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
                            </div>
                          </div>
                          <Badge variant="outline">
                            {grade.total_quantity} peças
                          </Badge>
                        </div>
                        {grade.description && (
                          <p className="text-sm text-muted-foreground">
                            {grade.description}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-2">
                          {grade.templates.map((template) => (
                            <div
                              key={template.size_id}
                              className="flex justify-between text-sm"
                            >
                              <span>Tamanho {template.size}:</span>
                              <span className="font-medium">
                                {template.required_quantity} un
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {selectedGrade && (
                    <Card>
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-4 mb-4">
                          <Label>Quantidade de Kits</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() =>
                                setQuantity(Math.max(1, quantity - 1))
                              }
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              min="1"
                              value={quantity}
                              onChange={(e) =>
                                setQuantity(parseInt(e.target.value) || 1)
                              }
                              className="w-20 text-center"
                            />
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => setQuantity(quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <Button onClick={addGradeToCart} className="w-full">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Adicionar Grade ao Carrinho
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
