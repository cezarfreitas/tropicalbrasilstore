import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Package, Grid3x3, Minus, Plus } from "lucide-react";

interface ProductVariant {
  id: number;
  size_id: number;
  color_id: number;
  stock: number;
  price_override?: number;
  size: string;
  display_order: number;
  color_name: string;
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
  available_grades: AvailableGrade[];
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
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

  const getAvailableSizes = () => {
    if (!product || !selectedColor) return [];
    return product.variants
      .filter((v) => v.color_id === selectedColor && v.stock > 0)
      .map((v) => ({ id: v.size_id, name: v.size, stock: v.stock }))
      .sort((a, b) => a.id - b.id);
  };

  const getAvailableColors = () => {
    if (!product) return [];
    const colors = product.variants
      .filter((v) => v.stock > 0)
      .reduce((acc, v) => {
        if (!acc.find((c) => c.id === v.color_id)) {
          acc.push({
            id: v.color_id,
            name: v.color_name,
            hex_code: v.hex_code,
          });
        }
        return acc;
      }, [] as any[]);
    return colors;
  };

  const getSelectedVariant = () => {
    if (!product || !selectedSize || !selectedColor) return null;
    return product.variants.find(
      (v) => v.size_id === selectedSize && v.color_id === selectedColor,
    );
  };

  const getSelectedGradeDetails = () => {
    if (!product || !selectedGrade) return null;
    return product.available_grades.find((g) => g.id === selectedGrade);
  };

  const addIndividualToCart = () => {
    const variant = getSelectedVariant();
    if (!variant || !product) return;

    const price = variant.price_override || product.base_price || 0;

    addItem({
      type: "individual",
      productId: product.id,
      productName: product.name,
      colorId: selectedColor!,
      colorName: variant.color_name,
      sizeId: selectedSize!,
      sizeName: variant.size,
      quantity,
      unitPrice: price,
      photo: product.photo,
    });

    toast({
      title: "Adicionado ao carrinho",
      description: `${quantity}x ${product.name} - ${variant.color_name} - ${variant.size}`,
    });

    setQuantity(1);
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

            <div className="flex items-center gap-4">
              {product.base_price && (
                <p className="text-3xl font-bold">
                  R$ {parseFloat(product.base_price).toFixed(2)}
                </p>
              )}
              {product.suggested_price &&
                product.suggested_price !== product.base_price && (
                  <p className="text-xl text-muted-foreground line-through">
                    R$ {parseFloat(product.suggested_price).toFixed(2)}
                  </p>
                )}
            </div>

            <Tabs defaultValue="individual" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="individual">
                  <Package className="mr-2 h-4 w-4" />
                  Compra Individual
                </TabsTrigger>
                <TabsTrigger value="grade">
                  <Grid3x3 className="mr-2 h-4 w-4" />
                  Grade Vendida
                </TabsTrigger>
              </TabsList>

              <TabsContent value="individual" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Escolha Cor e Tamanho</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Color Selection */}
                    <div>
                      <Label>Cor</Label>
                      <div className="flex gap-2 mt-2">
                        {getAvailableColors().map((color) => (
                          <button
                            key={color.id}
                            onClick={() => {
                              setSelectedColor(color.id);
                              setSelectedSize(null);
                            }}
                            className={`flex items-center gap-2 px-3 py-2 rounded border ${
                              selectedColor === color.id
                                ? "border-primary bg-primary/10"
                                : "border-border"
                            }`}
                          >
                            <div
                              className="w-4 h-4 rounded border"
                              style={{
                                backgroundColor: color.hex_code || "#999999",
                              }}
                            />
                            <span className="text-sm">{color.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Size Selection */}
                    {selectedColor && (
                      <div>
                        <Label>Tamanho</Label>
                        <Select
                          value={selectedSize?.toString() || ""}
                          onValueChange={(value) =>
                            setSelectedSize(parseInt(value))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tamanho" />
                          </SelectTrigger>
                          <SelectContent>
                            {getAvailableSizes().map((size) => (
                              <SelectItem
                                key={size.id}
                                value={size.id.toString()}
                              >
                                {size.name} ({size.stock} disponível)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Quantity */}
                    {selectedSize && (
                      <div>
                        <Label>Quantidade</Label>
                        <div className="flex items-center gap-2 mt-2">
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
                            max={getSelectedVariant()?.stock || 1}
                            value={quantity}
                            onChange={(e) =>
                              setQuantity(parseInt(e.target.value) || 1)
                            }
                            className="w-20 text-center"
                          />
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              setQuantity(
                                Math.min(
                                  getSelectedVariant()?.stock || 1,
                                  quantity + 1,
                                ),
                              )
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={addIndividualToCart}
                      disabled={!selectedSize || !selectedColor}
                      className="w-full"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Adicionar ao Carrinho
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="grade" className="space-y-4">
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
                                    backgroundColor:
                                      grade.hex_code || "#999999",
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
