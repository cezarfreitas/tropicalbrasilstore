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
import { Checkbox } from "@/components/ui/checkbox";
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
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ProductImage } from "@/components/ProductImage";
import { CompactImageUpload } from "@/components/CompactImageUpload";
import { StockConfigurationGuide } from "@/components/StockConfigurationGuide";

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
  image_url?: string; // Manter para compatibilidade
  images?: string[]; // Array de até 5 imagens
  stock_total: number;
  active: boolean;
  is_main_catalog?: boolean; // Indica se é a variante principal do catálogo
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
  gender_id?: number;
  type_id?: number;
  base_price?: number;
  suggested_price?: number;
  sku?: string;
  parent_sku?: string;
  active?: boolean;
  sell_without_stock?: boolean;
  color_variants: ColorVariant[];
  category_name?: string;
  gender_name?: string;
  type_name?: string;
  variant_count?: number;
  total_stock?: number;
  available_colors?: string;
  color_data?: string;
  grade_count?: number;
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
  const [genders, setGenders] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [sizes, setSizes] = useState<Size[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Multi-selection state
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [bulkActionsOpen, setBulkActionsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] =
    useState<WooCommerceProduct | null>(null);

  // Form data
  const [formData, setFormData] = useState<WooCommerceProduct & { stock_type?: 'size' | 'grade' }>({
    name: "",
    description: "",
    category_id: undefined,
    gender_id: undefined,
    type_id: undefined,
    base_price: undefined,
    suggested_price: undefined,
    sku: "",
    parent_sku: "",
    active: true,
    sell_without_stock: false,
    color_variants: [],
    stock_type: 'grade', // Padrão: estoque por grade
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

  // Função para obter a imagem da variante principal ou a primeira disponível
  const getMainVariantImage = (product: WooCommerceProduct): string => {
    // Primeiro tenta encontrar a variante marcada como principal
    const mainVariant = product.color_variants?.find(v => v.is_main_catalog);
    if (mainVariant) {
      // Prioriza array de imagens, depois image_url
      if (mainVariant.images && mainVariant.images.length > 0) {
        return mainVariant.images[0];
      }
      if (mainVariant.image_url) {
        return mainVariant.image_url;
      }
    }

    // Se não houver principal marcada, usa a primeira variante com imagem
    const firstVariantWithImage = product.color_variants?.find(v =>
      (v.images && v.images.length > 0) || v.image_url
    );

    if (firstVariantWithImage) {
      if (firstVariantWithImage.images && firstVariantWithImage.images.length > 0) {
        return firstVariantWithImage.images[0];
      }
      return firstVariantWithImage.image_url || "";
    }

    return "";
  };

  // Função para marcar uma variante como principal do catálogo
  const setMainVariant = (variantIndex: number) => {
    const updatedVariants = formData.color_variants.map((variant, index) => ({
      ...variant,
      is_main_catalog: index === variantIndex
    }));

    setFormData({
      ...formData,
      color_variants: updatedVariants
    });
  };

  // Função para adicionar imagem ao array da variante
  const addImageToVariant = (variantIndex: number, imageUrl: string) => {
    const updatedVariants = [...formData.color_variants];
    const variant = updatedVariants[variantIndex];

    if (!variant.images) {
      variant.images = [];
    }

    // Máximo de 5 imagens
    if (variant.images.length < 5) {
      variant.images.push(imageUrl);
      // Manter image_url como primeira imagem para compatibilidade
      if (!variant.image_url) {
        variant.image_url = imageUrl;
      }
    }

    setFormData({
      ...formData,
      color_variants: updatedVariants
    });
  };

  // Função para remover imagem do array da variante
  const removeImageFromVariant = (variantIndex: number, imageIndex: number) => {
    const updatedVariants = [...formData.color_variants];
    const variant = updatedVariants[variantIndex];

    if (variant.images && variant.images.length > imageIndex) {
      variant.images.splice(imageIndex, 1);

      // Atualizar image_url se removeu a primeira imagem
      if (imageIndex === 0) {
        variant.image_url = variant.images.length > 0 ? variant.images[0] : "";
      }
    }

    setFormData({
      ...formData,
      color_variants: updatedVariants
    });
  };

  // Função para reordenar imagens
  const reorderVariantImages = (variantIndex: number, fromIndex: number, toIndex: number) => {
    const updatedVariants = [...formData.color_variants];
    const variant = updatedVariants[variantIndex];

    if (variant.images && variant.images.length > Math.max(fromIndex, toIndex)) {
      const [removed] = variant.images.splice(fromIndex, 1);
      variant.images.splice(toIndex, 0, removed);

      // Atualizar image_url se mudou a primeira posição
      variant.image_url = variant.images[0] || "";
    }

    setFormData({
      ...formData,
      color_variants: updatedVariants
    });
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
    fetchGenders();
    fetchTypes();
    fetchColors();
    fetchSizes();
    fetchGrades();
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        _t: Date.now().toString(), // Cache busting
      });

      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory && selectedCategory !== "all")
        params.append("category", selectedCategory);
      if (selectedStatus && selectedStatus !== "all")
        params.append("status", selectedStatus);

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

  const fetchGenders = async () => {
    try {
      const response = await fetch("/api/genders");
      if (response.ok) {
        const data = await response.json();
        setGenders(data);
      }
    } catch (error) {
      console.error("Error fetching genders:", error);
    }
  };

  const fetchTypes = async () => {
    try {
      const response = await fetch("/api/types");
      if (response.ok) {
        const data = await response.json();
        setTypes(data);
      }
    } catch (error) {
      console.error("Error fetching types:", error);
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
      gender_id: undefined,
      type_id: undefined,
      base_price: undefined,
      suggested_price: undefined,
      sku: "",
      parent_sku: "",
      active: true,
      sell_without_stock: false,
      color_variants: [],
      stock_type: 'grade', // Padrão: estoque por grade
    } as any);
    setDialogOpen(true);
  };

  const handleEditProduct = async (product: WooCommerceProduct) => {
    try {
      const response = await fetch(`/api/products-woocommerce/${product.id}`);
      if (response.ok) {
        const fullProduct = await response.json();

        // Ensure all variants have grade_ids initialized
        if (fullProduct.color_variants) {
          fullProduct.color_variants = fullProduct.color_variants.map(
            (variant: ColorVariant) => ({
              ...variant,
              grade_ids: variant.grade_ids || [], // Initialize if undefined
            }),
          );
        }

        setEditingProduct(fullProduct);
        // Ensure no null values in form data
        const cleanedFormData = {
          ...fullProduct,
          name: fullProduct.name || "",
          description: fullProduct.description || "",
          sku: fullProduct.sku || "",
          parent_sku: fullProduct.parent_sku || "",
          color_variants: (fullProduct.color_variants || []).map((variant: ColorVariant) => ({
            ...variant,
            variant_name: variant.variant_name || "",
            variant_sku: variant.variant_sku || "",
            image_url: variant.image_url || "",
            images: variant.images || (variant.image_url ? [variant.image_url] : []),
            grade_ids: variant.grade_ids || [],
            size_stocks: variant.size_stocks || [],
          }))
        };
        setFormData(cleanedFormData);
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
      images: [],
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

  const updateColorVariant = (
    index: number,
    field: keyof ColorVariant,
    value: any,
  ) => {
    const updatedVariants = [...formData.color_variants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: value,
    };

    // Auto-generate variant name and SKU when color changes
    if (field === "color_id") {
      const color = colors.find((c) => c.id === value);
      if (color) {
        updatedVariants[index].variant_name =
          `${formData.name} - ${color.name}`;
        updatedVariants[index].variant_sku =
          `${formData.sku || "PROD"}-${color.name.toUpperCase()}`;
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
    gradeIds.forEach((gradeId) => {
      const grade = grades.find((g) => g.id === gradeId);
      if (grade && grade.templates) {
        grade.templates.forEach((template: any) => {
          const size = sizes.find((s) => s.id === template.size_id);
          if (size && !allAvailableSizes.find((s) => s.id === size.id)) {
            allAvailableSizes.push(size);
          }
        });
      }
    });

    // Update size_stocks to match available sizes
    const existingSizeStocks = updatedVariants[variantIndex].size_stocks;
    updatedVariants[variantIndex].size_stocks = allAvailableSizes.map(
      (size) => {
        const existing = existingSizeStocks.find(
          (ss) => ss.size_id === size.id,
        );
        return {
          size_id: size.id,
          stock: existing?.stock || 0,
        };
      },
    );

    // Update total stock
    updatedVariants[variantIndex].stock_total = updatedVariants[
      variantIndex
    ].size_stocks.reduce((sum, ss) => sum + ss.stock, 0);

    setFormData({
      ...formData,
      color_variants: updatedVariants,
    });
  };

  const updateSizeStock = (
    variantIndex: number,
    sizeId: number,
    stock: number,
  ) => {
    const updatedVariants = [...formData.color_variants];
    const sizeStockIndex = updatedVariants[variantIndex].size_stocks.findIndex(
      (ss) => ss.size_id === sizeId,
    );

    if (sizeStockIndex >= 0) {
      updatedVariants[variantIndex].size_stocks[sizeStockIndex].stock = stock;
    }

    // Update total stock for variant
    updatedVariants[variantIndex].stock_total = updatedVariants[
      variantIndex
    ].size_stocks.reduce((sum, ss) => sum + ss.stock, 0);

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

  // Helper function to parse and display color circles
  const renderColorCircles = (colorData?: string) => {
    if (!colorData) return null;

    const colors = colorData
      .split(",")
      .map((item) => {
        const [name, hexCode] = item.split(":");
        return { name: name?.trim(), hexCode: hexCode?.trim() };
      })
      .filter((color) => color.name && color.hexCode);

    if (colors.length === 0) return null;

    return (
      <div className="flex items-center justify-center gap-1 flex-wrap">
        {colors.slice(0, 5).map((color, index) => (
          <div
            key={index}
            className="w-5 h-5 rounded-full border-2 border-white shadow-md ring-1 ring-gray-200 hover:scale-110 transition-transform cursor-pointer"
            style={{ backgroundColor: color.hexCode }}
            title={`${color.name} (${color.hexCode})`}
          />
        ))}
        {colors.length > 5 && (
          <div className="w-5 h-5 rounded-full bg-gray-100 border-2 border-white shadow-md ring-1 ring-gray-200 flex items-center justify-center">
            <span className="text-xs font-medium text-gray-600">
              +{colors.length - 5}
            </span>
          </div>
        )}
      </div>
    );
  };

  // Multi-selection functions
  const toggleProductSelection = (productId: number) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p.id!));
    }
  };

  const bulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      setSaving(true);
      const promises = selectedProducts.map((id) =>
        fetch(`/api/products-woocommerce/${id}`, { method: "DELETE" }),
      );

      await Promise.all(promises);

      toast({
        title: "Sucesso",
        description: `${selectedProducts.length} produtos excluídos com sucesso.`,
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao excluir produtos selecionados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const bulkToggleStatus = async (active: boolean) => {
    if (selectedProducts.length === 0) return;

    try {
      setSaving(true);
      const promises = selectedProducts.map((id) =>
        fetch(`/api/products-woocommerce/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        }),
      );

      await Promise.all(promises);

      toast({
        title: "Sucesso",
        description: `${selectedProducts.length} produtos ${active ? "ativados" : "desativados"} com sucesso.`,
      });

      setSelectedProducts([]);
      fetchProducts();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao alterar status dos produtos selecionados.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
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
          <h1 className="text-3xl font-bold tracking-tight">Produtos V2</h1>
          <p className="text-muted-foreground">
            Sistema de produtos com variantes apenas por cor (estilo
            WooCommerce)
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedProducts([]);
              fetchProducts();
            }}
            disabled={loading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>
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

                      {/* Row with Category, Gender, and Type */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="category">Categoria</Label>
                          <Select
                            value={formData.category_id?.toString() || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                category_id: value
                                  ? parseInt(value)
                                  : undefined,
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
                          <Label htmlFor="gender">Gênero</Label>
                          <Select
                            value={formData.gender_id?.toString() || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                gender_id: value ? parseInt(value) : undefined,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar gênero" />
                            </SelectTrigger>
                            <SelectContent>
                              {genders.map((gender) => (
                                <SelectItem
                                  key={gender.id}
                                  value={gender.id.toString()}
                                >
                                  {gender.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor="type">Tipo</Label>
                          <Select
                            value={formData.type_id?.toString() || ""}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                type_id: value ? parseInt(value) : undefined,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                              {types.map((type) => (
                                <SelectItem
                                  key={type.id}
                                  value={type.id.toString()}
                                >
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="base_price">Preço Base</Label>
                        <Input
                          id="base_price"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.base_price != null ? formData.base_price.toString() : ""}
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
                          value={formData.suggested_price != null ? formData.suggested_price.toString() : ""}
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
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Descrição do produto"
                        rows={3}
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
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="sell_without_stock"
                        checked={formData.sell_without_stock}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            sell_without_stock: checked,
                          })
                        }
                      />
                      <Label htmlFor="sell_without_stock">
                        Vender Infinito
                      </Label>
                    </div>

                    {/* Configuração de Tipo de Estoque */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Controle de Estoque</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            (formData as any).stock_type === 'grade'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, stock_type: 'grade' } as any)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              (formData as any).stock_type === 'grade'
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            }`} />
                            <Label className="font-medium">Estoque por Grade</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cada grade tem uma quantidade específica (ex: 25 pares) independente dos tamanhos
                          </p>
                        </div>
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            (formData as any).stock_type === 'size'
                              ? 'border-primary bg-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData({ ...formData, stock_type: 'size' } as any)}
                        >
                          <div className="flex items-center space-x-2 mb-2">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              (formData as any).stock_type === 'size'
                                ? 'border-primary bg-primary'
                                : 'border-gray-300'
                            }`} />
                            <Label className="font-medium">Estoque por Tamanho</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Cada tamanho/cor tem estoque individual (ex: 5 pares tam 38 azul, 3 pares tam 39 azul)
                          </p>
                        </div>
                      </div>
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
                      <Button type="button" onClick={addColorVariant} size="sm">
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
                        {formData.color_variants.map(
                          (variant, variantIndex) => {
                            const selectedColor = colors.find(
                              (c) => c.id === variant.color_id,
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
                                            backgroundColor:
                                              selectedColor.hex_code,
                                          }}
                                        />
                                      )}
                                      <CardTitle className="text-lg">
                                        {selectedColor?.name ||
                                          "Cor não selecionada"}
                                      </CardTitle>
                                      <Badge variant="outline">
                                        {variant.stock_total} total
                                      </Badge>
                                    </div>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() =>
                                        removeColorVariant(variantIndex)
                                      }
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
                                        value={
                                          variant.color_id?.toString() || ""
                                        }
                                        onValueChange={(value) =>
                                          updateColorVariant(
                                            variantIndex,
                                            "color_id",
                                            parseInt(value),
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
                                                    backgroundColor:
                                                      color.hex_code,
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
                                            e.target.value,
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
                                        value={variant.price != null ? variant.price.toString() : ""}
                                        onChange={(e) =>
                                          updateColorVariant(
                                            variantIndex,
                                            "price",
                                            e.target.value
                                              ? parseFloat(e.target.value)
                                              : undefined,
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
                                        <div
                                          key={grade.id}
                                          className="flex items-center space-x-2"
                                        >
                                          <input
                                            type="checkbox"
                                            id={`grade-${variantIndex}-${grade.id}`}
                                            checked={
                                              variant.grade_ids?.includes(
                                                grade.id,
                                              ) || false
                                            }
                                            onChange={(e) => {
                                              const newGradeIds = e.target
                                                .checked
                                                ? [
                                                    ...(variant.grade_ids ||
                                                      []),
                                                    grade.id,
                                                  ]
                                                : (
                                                    variant.grade_ids || []
                                                  ).filter(
                                                    (id) => id !== grade.id,
                                                  );
                                              updateVariantGrades(
                                                variantIndex,
                                                newGradeIds,
                                              );
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
                                                (R${" "}
                                                {grade.total_price.toFixed(2)})
                                              </span>
                                            )}
                                          </label>
                                        </div>
                                      ))}
                                      {(!variant.grade_ids ||
                                        variant.grade_ids.length === 0) && (
                                        <div className="text-xs text-muted-foreground">
                                          Selecione pelo menos uma grade vendida
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <div>
                                      <Label className="text-sm font-medium">
                                        Imagens da Variante (até 5 fotos)
                                      </Label>
                                      <p className="text-xs text-muted-foreground mb-3">
                                        A primeira imagem será usada como principal
                                      </p>

                                      {/* Galeria de imagens existentes */}
                                      {variant.images && variant.images.length > 0 && (
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                                          {variant.images.map((imageUrl, imageIndex) => (
                                            <div key={imageIndex} className="relative group">
                                              <div className="aspect-square rounded-lg border overflow-hidden bg-gray-50">
                                                <img
                                                  src={imageUrl}
                                                  alt={`Imagem ${imageIndex + 1}`}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                              {imageIndex === 0 && (
                                                <Badge
                                                  variant="default"
                                                  className="absolute top-1 left-1 text-xs"
                                                >
                                                  Principal
                                                </Badge>
                                              )}
                                              <div className="absolute top-1 right-1 flex gap-1">
                                                {imageIndex > 0 && (
                                                  <Button
                                                    type="button"
                                                    size="icon"
                                                    variant="secondary"
                                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => reorderVariantImages(variantIndex, imageIndex, 0)}
                                                    title="Tornar principal"
                                                  >
                                                    <TrendingUp className="h-3 w-3" />
                                                  </Button>
                                                )}
                                                <Button
                                                  type="button"
                                                  size="icon"
                                                  variant="destructive"
                                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                  onClick={() => removeImageFromVariant(variantIndex, imageIndex)}
                                                >
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Upload de nova imagem */}
                                      {(!variant.images || variant.images.length < 5) && (
                                        <CompactImageUpload
                                          value=""
                                          onChange={(url) => addImageToVariant(variantIndex, url)}
                                          label={variant.images && variant.images.length > 0 ? "Adicionar mais uma imagem" : "Primeira imagem"}
                                          placeholder="URL da imagem ou carregar arquivo"
                                        />
                                      )}

                                      {variant.images && variant.images.length >= 5 && (
                                        <p className="text-xs text-muted-foreground text-center py-2 bg-gray-50 rounded-lg">
                                          Máximo de 5 imagens atingido
                                        </p>
                                      )}
                                    </div>

                                    {/* Switch para variante principal do catálogo */}
                                    {((variant.images && variant.images.length > 0) || variant.image_url) && (
                                      <div className="flex items-center gap-2">
                                        <Switch
                                          id={`main-catalog-${variantIndex}`}
                                          checked={variant.is_main_catalog || false}
                                          onCheckedChange={() => setMainVariant(variantIndex)}
                                        />
                                        <Label
                                          htmlFor={`main-catalog-${variantIndex}`}
                                          className="text-sm font-medium"
                                        >
                                          Usar como foto principal do catálogo
                                        </Label>
                                        {variant.is_main_catalog && (
                                          <Badge variant="default" className="ml-2">
                                            Principal
                                          </Badge>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  {/* Controle de Estoque - Baseado no tipo selecionado */}
                                  {(formData as any).stock_type === 'grade' ? (
                                    /* ESTOQUE POR GRADE */
                                    <div>
                                      <Label className="text-sm font-medium mb-3 block">
                                        🎯 Estoque por Grade
                                      </Label>
                                      {!variant.grade_ids || variant.grade_ids.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                          Selecione pelo menos uma grade vendida primeiro
                                        </div>
                                      ) : (
                                        <div className="space-y-3">
                                          {variant.grade_ids.map((gradeId) => {
                                            const grade = grades.find(g => g.id === gradeId);
                                            if (!grade) return null;

                                            return (
                                              <div key={gradeId} className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
                                                <div>
                                                  <span className="font-medium">{grade.name}</span>
                                                  <div className="text-sm text-muted-foreground">
                                                    Cor: {colors.find(c => c.id === variant.color_id)?.name}
                                                  </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                  <Label className="text-sm">Quantidade:</Label>
                                                  <Input
                                                    type="number"
                                                    min="0"
                                                    placeholder="25"
                                                    className="w-20 text-center"
                                                    onChange={(e) => {
                                                      console.log('Estoque grade:', gradeId, variant.color_id, e.target.value);
                                                    }}
                                                  />
                                                </div>
                                              </div>
                                            );
                                          })}
                                          <div className="text-xs text-blue-600 italic p-2 bg-blue-50 rounded">
                                            💡 Cada grade tem uma quantidade total (ex: 25 pares) independente dos tamanhos
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    /* ESTOQUE POR TAMANHO */
                                    <div>
                                      <Label className="text-sm font-medium mb-3 block">
                                        📏 Estoque por Tamanho
                                      </Label>
                                      {!variant.grade_ids || variant.grade_ids.length === 0 ? (
                                        <div className="text-center py-4 text-muted-foreground text-sm">
                                          Selecione pelo menos uma grade vendida primeiro
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                          {(() => {
                                            const selectedGrades = grades.filter(
                                              (g) => variant.grade_ids?.includes(g.id) || false
                                            );
                                            const allSizeIds = selectedGrades.reduce(
                                              (acc, grade) => {
                                                if (grade.templates) {
                                                  grade.templates.forEach((template: any) => {
                                                    if (template.size_id && !acc.includes(template.size_id)) {
                                                      acc.push(template.size_id);
                                                    }
                                                  });
                                                }
                                                return acc;
                                              },
                                              [] as number[]
                                            );

                                            const availableSizes = sizes.filter(
                                              (size) => allSizeIds.includes(size.id)
                                            );

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
                                      <div className="text-xs text-green-600 italic p-2 bg-green-50 rounded mt-3">
                                        💡 Cada tamanho/cor tem estoque individual (ex: 5 tam 38, 3 tam 39)
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          },
                        )}
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
      </div>

      {/* Guia de Configuração */}
      <StockConfigurationGuide />

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
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
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
            <CardTitle>Produtos ({totalProducts})</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Página {currentPage} de {totalPages}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {selectedProducts.length} produto
                    {selectedProducts.length > 1 ? "s" : ""} selecionado
                    {selectedProducts.length > 1 ? "s" : ""}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleStatus(true)}
                      disabled={saving}
                    >
                      Ativar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleStatus(false)}
                      disabled={saving}
                    >
                      Desativar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={bulkDelete}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedProducts([])}
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-gray-200 overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-muted/50">
                  <TableHead className="w-12 p-3">
                    <Checkbox
                      checked={
                        selectedProducts.length === products.length &&
                        products.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="min-w-[280px] p-3 font-semibold">
                    Produto
                  </TableHead>
                  <TableHead className="w-[120px] p-3 font-semibold text-center">
                    Categoria
                  </TableHead>
                  <TableHead className="w-[140px] p-3 font-semibold text-center">
                    Variantes
                  </TableHead>
                  <TableHead className="w-[100px] p-3 font-semibold text-center">
                    Grades
                  </TableHead>
                  <TableHead className="w-[100px] p-3 font-semibold text-center">
                    Estoque
                  </TableHead>
                  <TableHead className="w-[90px] p-3 font-semibold text-center">
                    Infinito
                  </TableHead>
                  <TableHead className="w-[80px] p-3 font-semibold text-center">
                    Status
                  </TableHead>
                  <TableHead className="w-[100px] p-3 font-semibold text-right">
                    Ações
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? // Loading skeleton
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow
                        key={`skeleton-${index}`}
                        className="animate-pulse"
                      >
                        <TableCell className="p-3">
                          <div className="w-4 h-4 bg-gray-200 rounded"></div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                            <div className="space-y-2">
                              <div className="h-4 w-32 bg-gray-200 rounded"></div>
                              <div className="h-3 w-20 bg-gray-200 rounded"></div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-16 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-14 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-8 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-12 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-10 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="h-6 w-14 bg-gray-200 rounded mx-auto"></div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex justify-end gap-1">
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                            <div className="w-8 h-8 bg-gray-200 rounded"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  : products.map((product) => (
                      <TableRow
                        key={product.id}
                        className={`transition-colors hover:bg-muted/50 ${
                          selectedProducts.includes(product.id!)
                            ? "bg-blue-50 hover:bg-blue-100"
                            : ""
                        }`}
                      >
                        <TableCell className="p-3">
                          <div className="flex items-center justify-center">
                            <Checkbox
                              checked={selectedProducts.includes(product.id!)}
                              onCheckedChange={() =>
                                toggleProductSelection(product.id!)
                              }
                              aria-label={`Selecionar ${product.name}`}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 shadow-sm">
                              <ProductImage
                                src={getMainVariantImage(product) || ""}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-sm leading-tight mb-1 truncate">
                                {product.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                <span className="inline-block">
                                  SKU: {product.sku || "N/A"}
                                </span>
                              </div>
                              {product.suggested_price &&
                                !isNaN(Number(product.suggested_price)) &&
                                Number(product.suggested_price) > 0 && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    R${" "}
                                    {Number(product.suggested_price).toFixed(2)}
                                  </div>
                                )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="text-sm font-medium">
                            {product.category_name ? (
                              <span className="inline-block px-2 py-1 bg-gray-100 rounded-md text-xs">
                                {product.category_name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">
                                N/A
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="space-y-2">
                            <Badge
                              variant="outline"
                              className="text-xs font-medium"
                            >
                              {product.variant_count || 0} cores
                            </Badge>
                            <div className="flex justify-center">
                              {renderColorCircles(product.color_data)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="flex justify-center">
                            {product.grade_count ? (
                              <Badge
                                variant="outline"
                                className="text-blue-600 bg-blue-50 border-blue-200 text-xs"
                              >
                                {product.grade_count}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                0
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="flex justify-center">
                            <Badge
                              variant={
                                product.total_stock ? "default" : "secondary"
                              }
                              className={`text-xs font-medium ${
                                product.total_stock
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {product.total_stock || 0}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="flex justify-center">
                            <Badge
                              variant={
                                product.sell_without_stock
                                  ? "default"
                                  : "secondary"
                              }
                              className={`text-xs font-medium ${
                                product.sell_without_stock
                                  ? "bg-blue-100 text-blue-700 border-blue-200"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {product.sell_without_stock ? "SIM" : "NÃO"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="p-3 text-center">
                          <div className="flex justify-center">
                            <Badge
                              variant={product.active ? "default" : "secondary"}
                              className={`text-xs font-medium ${
                                product.active
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-red-100 text-red-700 border-red-200"
                              }`}
                            >
                              {product.active ? "Ativo" : "Inativo"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="h-8 w-8 p-0 hover:bg-blue-100 hover:text-blue-600"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id!)}
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </div>

          {products.length === 0 && !loading && (
            <div className="text-center py-12 px-6 bg-gray-50 rounded-lg border border-gray-200 border-dashed">
              <div className="max-w-sm mx-auto">
                <Package className="mx-auto h-16 w-16 text-muted-foreground/40" />
                <h3 className="mt-6 text-lg font-semibold text-gray-900">
                  Nenhum produto encontrado
                </h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  {searchTerm || selectedCategory || selectedStatus
                    ? "Nenhum produto corresponde aos filtros aplicados. Tente ajustar os critérios de busca."
                    : "Comece criando seu primeiro produto com variantes de cores e grades personalizadas."}
                </p>
                {!searchTerm && !selectedCategory && !selectedStatus && (
                  <Button onClick={handleNewProduct} className="mt-6 px-6">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar Primeiro Produto
                  </Button>
                )}
              </div>
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
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
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
