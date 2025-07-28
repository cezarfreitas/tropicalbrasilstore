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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Copy,
  X,
  Save,
  Loader2,
  Image as ImageIcon,
  ShoppingCart,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/components/ProductImage";
import { CompactImageUpload } from "@/components/CompactImageUpload";

interface SizeStock {
  size_id: number;
  stock: number;
  size?: string;
  display_order?: number;
}

interface ColorVariant {
  id?: number;
  color_id: number;
  variant_name: string;
  variant_sku?: string;
  price?: number;
  sale_price?: number;
  image_url?: string;
  stock_total: number;
  active: boolean;
  grade_ids: number[]; // Multiple grades per variant
  size_stocks: SizeStock[];
  color_name?: string;
  hex_code?: string;
}

interface WooCommerceProduct {
  id?: number;
  name: string;
  description?: string;
  category_id?: number;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  parent_sku?: string;
  photo?: string;
  active?: boolean;
  sell_without_stock?: boolean;
  color_variants: ColorVariant[];
  category_name?: string;
  variant_count?: number;
  total_stock?: number;
  available_colors?: string;
}

interface Category {
  id: number;
  name: string;
}

interface Color {
  id: number;
  name: string;
  hex_code: string;
}

interface Size {
  id: number;
  size: string;
  display_order: number;
}

interface SizeGroup {
  id: number;
  name: string;
  description: string;
  icon: string;
  sizes: string[];
  active: number;
}

export default function ProductsWooCommerce() {
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Multi-selection state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WooCommerceProduct | null>(null);
  
  // Form data
  const [formData, setFormData] = useState<WooCommerceProduct>({
    name: "",
    description: "",
    category_id: undefined,
    base_price: undefined,
    suggested_price: undefined,
    sku: "",
    parent_sku: "",
    photo: "",
    active: true,
    sell_without_stock: false,
    color_variants: [],
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchColors();
    fetchSizes();
    fetchGrades();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);



  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "all") params.append("status", selectedStatus);

      const response = await fetch(`/api/products-woocommerce?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.data);
        setTotalPages(data.pagination.totalPages);
        setTotalProducts(data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os produtos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch("/api/colors");
      if (response.ok) {
        const data = await response.json();
        setColors(data);
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/sizes");
      if (response.ok) {
        const data = await response.json();
        setSizes(data);
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades");
      if (response.ok) {
        const data = await response.json();
        setGrades(data);
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      description: "",
      category_id: undefined,
      base_price: undefined,
      suggested_price: undefined,
      sku: "",
      parent_sku: "",
      photo: "",
      active: true,
      sell_without_stock: false,
      color_variants: [],
    });
    setDialogOpen(true);
  };

  const handleEditProduct = async (product: WooCommerceProduct) => {
    try {
      const response = await fetch(`/api/products-woocommerce/${product.id}`);
      if (response.ok) {
        const fullProduct = await response.json();

        // Ensure all variants have grade_ids initialized
        if (fullProduct.color_variants) {
          fullProduct.color_variants = fullProduct.color_variants.map((variant: ColorVariant) => ({
            ...variant,
            grade_ids: variant.grade_ids || [], // Initialize if undefined
          }));
        }

        setEditingProduct(fullProduct);
        setFormData(fullProduct);
        setDialogOpen(true);
      }
    } catch (error) {
      console.error("Error fetching product details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do produto",
        variant: "destructive",
      });
    }
  };

  const addColorVariant = () => {
    const newVariant: ColorVariant = {
      color_id: 0,
      variant_name: "",
      variant_sku: "",
      price: undefined,
      sale_price: undefined,
      image_url: "",
      stock_total: 0,
      active: true,
      grade_ids: [], // Start with no grades selected
      size_stocks: [], // Will be populated when grades are selected
    };

    setFormData({
      ...formData,
      color_variants: [...formData.color_variants, newVariant],
    });
  };

  const updateColorVariant = (index: number, field: keyof ColorVariant, value: any) => {
    const updatedVariants = [...formData.color_variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };

    // Auto-generate variant name and SKU when color changes
    if (field === "color_id") {
      const color = colors.find((c) => c.id === value);
      if (color) {
        updatedVariants[index].variant_name = `${formData.name} - ${color.name}`;
        updatedVariants[index].variant_sku = `${formData.sku || "PROD"}-${color.name.toUpperCase()}`;
      }
    }

    setFormData({
      ...formData,
      color_variants: updatedVariants,
    });
  };

  const updateVariantGrades = (variantIndex: number, gradeIds: number[]) => {
    const updatedVariants = [...formData.color_variants];
    updatedVariants[variantIndex].grade_ids = gradeIds;

    // Get all available sizes from selected grades
    const allAvailableSizes: Size[] = [];
    gradeIds.forEach(gradeId => {
      const grade = grades.find(g => g.id === gradeId);
      if (grade && grade.templates) {
        grade.templates.forEach((template: any) => {
          const size = sizes.find(s => s.id === template.size_id);
          if (size && !allAvailableSizes.find(s => s.id === size.id)) {
            allAvailableSizes.push(size);
          }
        });
      }
    });

    // Update size_stocks to match available sizes
    const existingSizeStocks = updatedVariants[variantIndex].size_stocks;
    updatedVariants[variantIndex].size_stocks = allAvailableSizes.map(size => {
      const existing = existingSizeStocks.find(ss => ss.size_id === size.id);
      return {
        size_id: size.id,
        stock: existing?.stock || 0,
      };
    });

    // Update total stock
    updatedVariants[variantIndex].stock_total = updatedVariants[variantIndex].size_stocks.reduce(
      (sum, ss) => sum + ss.stock,
      0
    );

    setFormData({
      ...formData,
      color_variants: updatedVariants,
    });
  };

  const updateSizeStock = (variantIndex: number, sizeId: number, stock: number) => {
    const updatedVariants = [...formData.color_variants];
    const sizeStockIndex = updatedVariants[variantIndex].size_stocks.findIndex(
      (ss) => ss.size_id === sizeId
    );

    if (sizeStockIndex >= 0) {
      updatedVariants[variantIndex].size_stocks[sizeStockIndex].stock = stock;
    }

    // Update total stock for variant
    updatedVariants[variantIndex].stock_total = updatedVariants[variantIndex].size_stocks.reduce(
      (sum, ss) => sum + ss.stock,
      0
    );

    setFormData({
      ...formData,
      color_variants: updatedVariants,
    });
  };

  const removeColorVariant = (index: number) => {
    setFormData({
      ...formData,
      color_variants: formData.color_variants.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingProduct
        ? `/api/products-woocommerce/${editingProduct.id}`
        : "/api/products-woocommerce";
      
      const method = editingProduct ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingProduct
            ? "Produto atualizado com sucesso"
            : "Produto criado com sucesso",
        });
        setDialogOpen(false);
        fetchProducts();
      } else {
        throw new Error("Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const response = await fetch(`/api/products-woocommerce/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Produto excluído com sucesso",
        });
        fetchProducts();
      } else {
        throw new Error("Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto",
        variant: "destructive",
      });
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
            Produtos V2
          </h1>
          <p className="text-muted-foreground">
            Sistema de produtos com variantes apenas por cor (estilo WooCommerce)
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewProduct}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingProduct ? "Editar Produto" : "Novo Produto"}
                </DialogTitle>
                <DialogDescription>
                  Sistema WooCommerce - Variantes apenas por cor
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="py-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
                  <TabsTrigger value="variants">
                    Variantes de Cor ({formData.color_variants.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome do Produto*</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome do produto"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="sku">SKU Base</Label>
                      <Input
                        id="sku"
                        value={formData.sku}
                        onChange={(e) =>
                          setFormData({ ...formData, sku: e.target.value })
                        }
                        placeholder="SKU do produto"
                      />
                    </div>
                    <div>
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
                          <SelectValue placeholder="Selecionar categoria" />
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

                    <div>
                      <Label htmlFor="base_price">Preço Base</Label>
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
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <Label htmlFor="suggested_price">Preço Sugerido</Label>
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
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      placeholder="Descrição do produto"
                      rows={3}
                    />
                  </div>
                  <div>
                    <CompactImageUpload
                      value={formData.photo || ""}
                      onChange={(url) =>
                        setFormData({ ...formData, photo: url })
                      }
                      label="Foto Principal"
                      placeholder="URL da foto ou carregar arquivo"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="active"
                      checked={formData.active}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, active: checked })
                      }
                    />
                    <Label htmlFor="active">Produto Ativo</Label>
                  </div>
                </TabsContent>

                <TabsContent value="variants" className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-base">
                        Variantes de Cor ({formData.color_variants.length})
                      </Label>
                      <div className="text-sm text-muted-foreground mt-1">
                        Cada variante pode ter múltiplas grades vendidas
                      </div>
                    </div>
                    <Button
                      type="button"
                      onClick={addColorVariant}
                      size="sm"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Adicionar Cor
                    </Button>
                  </div>

                  {formData.color_variants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhuma variante de cor configurada
                      </p>
                      <Button
                        type="button"
                        onClick={addColorVariant}
                        className="mt-4"
                        variant="outline"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar Primeira Cor
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.color_variants.map((variant, variantIndex) => {
                        const selectedColor = colors.find(
                          (c) => c.id === variant.color_id
                        );

                        return (
                          <Card key={variantIndex} className="relative">
                            <CardHeader className="pb-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  {selectedColor && (
                                    <div
                                      className="w-6 h-6 rounded-full border-2"
                                      style={{
                                        backgroundColor: selectedColor.hex_code,
                                      }}
                                    />
                                  )}
                                  <CardTitle className="text-lg">
                                    {selectedColor?.name || "Cor não selecionada"}
                                  </CardTitle>
                                  <Badge variant="outline">
                                    {variant.stock_total} total
                                  </Badge>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeColorVariant(variantIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                  <Label>Cor*</Label>
                                  <Select
                                    value={variant.color_id?.toString() || ""}
                                    onValueChange={(value) =>
                                      updateColorVariant(
                                        variantIndex,
                                        "color_id",
                                        parseInt(value)
                                      )
                                    }
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecionar cor" />
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
                                                backgroundColor: color.hex_code,
                                              }}
                                            />
                                            {color.name}
                                          </div>
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label>SKU da Variante</Label>
                                  <Input
                                    value={variant.variant_sku || ""}
                                    onChange={(e) =>
                                      updateColorVariant(
                                        variantIndex,
                                        "variant_sku",
                                        e.target.value
                                      )
                                    }
                                    placeholder="SKU específico desta cor"
                                  />
                                </div>
                                <div>
                                  <Label>Preço (opcional)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={variant.price || ""}
                                    onChange={(e) =>
                                      updateColorVariant(
                                        variantIndex,
                                        "price",
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : undefined
                                      )
                                    }
                                    placeholder="Preço específico"
                                  />
                                </div>
                              </div>

                              <div>
                                <Label className="text-sm font-medium">
                                  Grade Vendida* (selecione uma ou mais)
                                </Label>
                                <div className="mt-2 space-y-2">
                                  {grades.map((grade) => (
                                    <div key={grade.id} className="flex items-center space-x-2">
                                      <input
                                        type="checkbox"
                                        id={`grade-${variantIndex}-${grade.id}`}
                                        checked={variant.grade_ids?.includes(grade.id) || false}
                                        onChange={(e) => {
                                          const newGradeIds = e.target.checked
                                            ? [...(variant.grade_ids || []), grade.id]
                                            : (variant.grade_ids || []).filter(id => id !== grade.id);
                                          updateVariantGrades(variantIndex, newGradeIds);
                                        }}
                                        className="rounded border-gray-300"
                                      />
                                      <label
                                        htmlFor={`grade-${variantIndex}-${grade.id}`}
                                        className="text-sm flex items-center gap-2 cursor-pointer"
                                      >
                                        <span>{grade.name}</span>
                                        {grade.total_price && (
                                          <span className="text-xs text-muted-foreground">
                                            (R$ {grade.total_price.toFixed(2)})
                                          </span>
                                        )}
                                      </label>
                                    </div>
                                  ))}
                                  {(!variant.grade_ids || variant.grade_ids.length === 0) && (
                                    <div className="text-xs text-muted-foreground">
                                      Selecione pelo menos uma grade vendida
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div>
                                <CompactImageUpload
                                  value={variant.image_url || ""}
                                  onChange={(url) =>
                                    updateColorVariant(
                                      variantIndex,
                                      "image_url",
                                      url
                                    )
                                  }
                                  label="Imagem da Variante"
                                  placeholder="URL da imagem ou carregar arquivo"
                                />
                              </div>

                              <div>
                                <Label className="text-sm font-medium mb-3 block">
                                  Estoque por Tamanho
                                </Label>
                                {(!variant.grade_ids || variant.grade_ids.length === 0) ? (
                                  <div className="text-center py-4 text-muted-foreground text-sm">
                                    Selecione pelo menos uma grade vendida primeiro
                                  </div>
                                ) : (
                                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                    {(() => {
                                      const selectedGrades = grades.filter(g => variant.grade_ids?.includes(g.id) || false);
                                      const allSizeIds = selectedGrades.reduce((acc, grade) => {
                                        if (grade.templates) {
                                          grade.templates.forEach((template: any) => {
                                            if (template.size_id && !acc.includes(template.size_id)) {
                                              acc.push(template.size_id);
                                            }
                                          });
                                        }
                                        return acc;
                                      }, [] as number[]);

                                      const availableSizes = sizes.filter(size => allSizeIds.includes(size.id));

                                      return availableSizes
                                        .sort((a, b) => a.display_order - b.display_order)
                                        .map((size) => {
                                          const sizeStock = variant.size_stocks.find(
                                            (ss) => ss.size_id === size.id
                                          );
                                          return (
                                            <div key={size.id} className="text-center">
                                              <Label className="text-xs block mb-1">
                                                {size.size}
                                              </Label>
                                              <Input
                                                type="number"
                                                min="0"
                                                value={sizeStock?.stock || 0}
                                                onChange={(e) =>
                                                  updateSizeStock(
                                                    variantIndex,
                                                    size.id,
                                                    parseInt(e.target.value) || 0
                                                  )
                                                }
                                                className="h-8 text-center"
                                              />
                                            </div>
                                          );
                                        });
                                    })()}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  {editingProduct ? "Atualizar" : "Criar"} Produto
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Produtos ({totalProducts})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Página {currentPage} de {totalPages}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Variantes</TableHead>
                <TableHead>Grades</TableHead>
                <TableHead>Estoque Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded border overflow-hidden">
                        <ProductImage
                          src={product.photo || ""}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-muted-foreground">
                          SKU: {product.sku || "N/A"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category_name || "N/A"}</TableCell>
                  <TableCell>
                    <div>
                      <Badge variant="outline">
                        {product.variant_count || 0} cores
                      </Badge>
                      {product.available_colors && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {product.available_colors}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.grade_count ? (
                      <Badge variant="outline" className="text-blue-600">
                        {product.grade_count} grades
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        Sem grades
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.total_stock ? "default" : "secondary"}>
                      {product.total_stock || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.active ? "default" : "secondary"}>
                      {product.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditProduct(product)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteProduct(product.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {products.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum produto encontrado</h3>
              <p className="mt-2 text-muted-foreground">
                Comece criando seu primeiro produto WooCommerce.
              </p>
              <Button onClick={handleNewProduct} className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Criar Produto
              </Button>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Próxima
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
