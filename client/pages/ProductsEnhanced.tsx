import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Edit2, Trash2, Package, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProductVariant {
  id?: number;
  size_id: number;
  color_id: number;
  stock: number;
  price_override?: number;
  sku_variant?: string;
  size?: string;
  color_name?: string;
  hex_code?: string;
}

interface EnhancedProduct {
  id: number;
  name: string;
  description?: string;
  category_id?: number;
  category_name?: string;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  photo?: string;
  stock: number;
  active: boolean;
  variant_count: number;
  total_stock: number;
  variants?: ProductVariant[];
  grades?: any[];
}

interface CreateProductRequest {
  name: string;
  description?: string;
  category_id?: number;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  photo?: string;
  stock?: number;
  variants: ProductVariant[];
}

export default function ProductsEnhanced() {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<EnhancedProduct | null>(
    null,
  );
  const [formData, setFormData] = useState<CreateProductRequest>({
    name: "",
    description: "",
    category_id: undefined,
    base_price: undefined,
    suggested_price: undefined,
    sku: "",
    photo: "",
    stock: 0,
    variants: [],
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [productsRes, categoriesRes, sizesRes, colorsRes] =
        await Promise.all([
          fetch("/api/products-enhanced"),
          fetch("/api/categories"),
          fetch("/api/sizes"),
          fetch("/api/colors"),
        ]);

      if (productsRes.ok) setProducts(await productsRes.json());
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
      if (sizesRes.ok) setSizes(await sizesRes.json());
      if (colorsRes.ok) setColors(await colorsRes.json());
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingProduct
        ? `/api/products-enhanced/${editingProduct.id}`
        : "/api/products-enhanced";
      const method = editingProduct ? "PUT" : "POST";

      const submitData = {
        ...formData,
        category_id: formData.category_id || null,
        base_price: formData.base_price || null,
        suggested_price: formData.suggested_price || null,
        sku: formData.sku || null,
        photo: formData.photo || null,
        stock: formData.stock || 0,
      };

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingProduct
            ? "Produto atualizado com sucesso"
            : "Produto criado com sucesso",
        });
        setDialogOpen(false);
        resetForm();
        fetchData();
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro desconhecido");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category_id: undefined,
      base_price: undefined,
      suggested_price: undefined,
      sku: "",
      photo: "",
      stock: 0,
      variants: [],
    });
  };

  const handleEdit = async (product: EnhancedProduct) => {
    // Fetch detailed product info including variants
    try {
      const response = await fetch(`/api/products-enhanced/${product.id}`);
      if (response.ok) {
        const detailedProduct = await response.json();
        setEditingProduct(detailedProduct);
        setFormData({
          name: detailedProduct.name,
          description: detailedProduct.description || "",
          category_id: detailedProduct.category_id || undefined,
          base_price: detailedProduct.base_price || undefined,
          suggested_price: detailedProduct.suggested_price || undefined,
          sku: detailedProduct.sku || "",
          photo: detailedProduct.photo || "",
          stock: detailedProduct.stock || 0,
          variants: detailedProduct.variants || [],
          grades: detailedProduct.grades?.map((g: any) => g.id) || [],
        });
        setDialogOpen(true);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do produto",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const response = await fetch(`/api/products-enhanced/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso",
        });
        fetchData();
      } else {
        throw new Error("Erro ao excluir produto");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleNewProduct = () => {
    resetForm();
    setDialogOpen(true);
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...formData.variants,
        {
          size_id: 0,
          color_id: 0,
          stock: 0,
        },
      ],
    });
  };

  const removeVariant = (index: number) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const updateVariant = (
    index: number,
    field: keyof ProductVariant,
    value: any,
  ) => {
    const newVariants = [...formData.variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData({ ...formData, variants: newVariants });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData({ ...formData, photo: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando produtos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Produtos Completos
          </h1>
          <p className="text-muted-foreground">
            Sistema completo de gestão de produtos com fotos, variantes e
            estoque
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  Sistema completo com foto, variantes de tamanho/cor e estoque
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="py-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="variants">Variantes</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nome do Produto</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Ex: Chinelo Havaianas Masculino"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="sku">SKU</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        placeholder="Ex: CHM001"
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Descrição do produto"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="category">Categoria</Label>
                      <Select
                        value={formData.category_id?.toString() || ""}
                        onValueChange={(value) =>
                          setFormData({
                            ...formData,
                            category_id: value ? parseInt(value) : undefined,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem
                              key={category.id}
                              value={category.id.toString()}
                            >
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="base_price">Preço (R$)</Label>
                      <Input
                        id="base_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.base_price || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            base_price: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="suggested_price">
                        Preço Sugerido (R$)
                      </Label>
                      <Input
                        id="suggested_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.suggested_price || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            suggested_price: e.target.value
                              ? parseFloat(e.target.value)
                              : undefined,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="stock">Estoque Geral</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        value={formData.stock || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="photo">Foto do Produto</Label>
                      <div className="flex gap-2">
                        <Input
                          id="photo"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setFormData({ ...formData, photo: "" })
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      {formData.photo && (
                        <img
                          src={formData.photo}
                          alt="Preview"
                          className="w-20 h-20 object-cover rounded border"
                        />
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">
                      Variantes (Tamanho + Cor + Estoque)
                    </Label>
                    <Button type="button" onClick={addVariant} size="sm">
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Variante
                    </Button>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhuma variante configurada
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.variants.map((variant, index) => (
                        <Card key={index}>
                          <CardContent className="pt-4">
                            <div className="grid grid-cols-5 gap-4 items-end">
                              <div className="grid gap-2">
                                <Label>Tamanho</Label>
                                <Select
                                  value={variant.size_id.toString()}
                                  onValueChange={(value) =>
                                    updateVariant(
                                      index,
                                      "size_id",
                                      parseInt(value),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Tamanho" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {sizes.map((size) => (
                                      <SelectItem
                                        key={size.id}
                                        value={size.id.toString()}
                                      >
                                        {size.size}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Cor</Label>
                                <Select
                                  value={variant.color_id.toString()}
                                  onValueChange={(value) =>
                                    updateVariant(
                                      index,
                                      "color_id",
                                      parseInt(value),
                                    )
                                  }
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Cor" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colors.map((color) => (
                                      <SelectItem
                                        key={color.id}
                                        value={color.id.toString()}
                                      >
                                        <div className="flex items-center gap-2">
                                          <div
                                            className="w-4 h-4 rounded border"
                                            style={{
                                              backgroundColor:
                                                color.hex_code || "#999999",
                                            }}
                                          ></div>
                                          {color.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="grid gap-2">
                                <Label>Estoque</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={variant.stock}
                                  onChange={(e) =>
                                    updateVariant(
                                      index,
                                      "stock",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </div>
                              <div className="grid gap-2">
                                <Label>Preço Override</Label>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={variant.price_override || ""}
                                  onChange={(e) =>
                                    updateVariant(
                                      index,
                                      "price_override",
                                      e.target.value
                                        ? parseFloat(e.target.value)
                                        : undefined,
                                    )
                                  }
                                  placeholder="Opcional"
                                />
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={() => removeVariant(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduct ? "Atualizar" : "Criar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos Completos
          </CardTitle>
          <CardDescription>
            {products.length === 0
              ? "Nenhum produto cadastrado"
              : `${products.length} produto${products.length !== 1 ? "s" : ""} cadastrado${products.length !== 1 ? "s" : ""}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhum produto cadastrado
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Comece criando seu primeiro produto completo.
              </p>
              <div className="mt-6">
                <Button onClick={handleNewProduct}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Produto
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Preços</TableHead>
                  <TableHead>Estoque</TableHead>
                  <TableHead>Variantes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.photo && (
                          <img
                            src={product.photo}
                            alt={product.name}
                            className="w-12 h-12 rounded object-cover border"
                          />
                        )}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {product.sku && `SKU: ${product.sku}`}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category_name ? (
                        <Badge variant="secondary">
                          {product.category_name}
                        </Badge>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {product.base_price && (
                          <div className="text-sm">
                            Base: R$ {parseFloat(product.base_price).toFixed(2)}
                          </div>
                        )}
                        {product.suggested_price && (
                          <div className="text-sm text-muted-foreground">
                            Sugerido: R${" "}
                            {parseFloat(product.suggested_price).toFixed(2)}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{product.total_stock}</div>
                        <div className="text-xs text-muted-foreground">
                          total
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {product.variant_count} variantes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={product.active ? "default" : "secondary"}>
                        {product.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
