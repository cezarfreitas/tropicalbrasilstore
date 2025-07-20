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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Edit2,
  Trash2,
  Package,
  Upload,
  X,
  Copy,
  Grid3x3,
  Wand2,
  Eye,
  EyeOff,
  Palette,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
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
  grades: number[];
}

interface ExistingGrade {
  id: number;
  name: string;
  description: string;
  active: boolean;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ProductsResponse {
  data: EnhancedProduct[];
  pagination: PaginationInfo;
}

export default function ProductsEnhanced() {
  const [products, setProducts] = useState<EnhancedProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [grades, setGrades] = useState<ExistingGrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [variantViewMode, setVariantViewMode] = useState<"table" | "grid">(
    "grid",
  );

  // Pagination and filtering states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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
    grades: [],
  });
  const [selectedGrades, setSelectedGrades] = useState<number[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchSizes();
    fetchColors();
    fetchGrades();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [
    currentPage,
    pageSize,
    searchTerm,
    selectedCategory,
    selectedStatus,
    sortBy,
    sortOrder,
  ]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        category: selectedCategory,
        status: selectedStatus,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/products-enhanced?${params}`);
      if (response.ok) {
        const data: ProductsResponse = await response.json();
        setProducts(data.data);
        setPagination(data.pagination);
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
      if (response.ok) setCategories(await response.json());
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/sizes");
      if (response.ok) setSizes(await response.json());
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch("/api/colors");
      if (response.ok) setColors(await response.json());
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades-redesigned");
      if (response.ok) setGrades(await response.json());
    } catch (error) {
      console.error("Error fetching grades:", error);
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
        fetchProducts();
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
    setSelectedGrades([]);
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
      grades: [],
    });
  };

  const handleEdit = async (product: EnhancedProduct) => {
    try {
      const response = await fetch(`/api/products-enhanced/${product.id}`);
      if (response.ok) {
        const detailedProduct = await response.json();
        setEditingProduct(detailedProduct);
        const productGrades =
          detailedProduct.grades?.map((g: any) => g.id) || [];
        setSelectedGrades(productGrades);
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
          grades: productGrades,
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
        fetchProducts();
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

  const bulkCreateVariants = () => {
    const newVariants: ProductVariant[] = [];

    // Organize by color first, then add all sizes for each color
    colors.forEach((color) => {
      sizes.forEach((size) => {
        const exists = formData.variants.some(
          (v) => v.size_id === size.id && v.color_id === color.id,
        );

        if (!exists) {
          newVariants.push({
            size_id: size.id,
            color_id: color.id,
            stock: 0,
          });
        }
      });
    });

    // Sort variants by color name, then by size display_order
    newVariants.sort((a, b) => {
      const colorA = colors.find((c) => c.id === a.color_id)?.name || "";
      const colorB = colors.find((c) => c.id === b.color_id)?.name || "";

      if (colorA !== colorB) {
        return colorA.localeCompare(colorB);
      }

      const sizeA = sizes.find((s) => s.id === a.size_id)?.display_order || 0;
      const sizeB = sizes.find((s) => s.id === b.size_id)?.display_order || 0;
      return sizeA - sizeB;
    });

    setFormData({
      ...formData,
      variants: [...formData.variants, ...newVariants],
    });

    toast({
      title: "Sucesso",
      description: `${newVariants.length} variantes criadas, organizadas por cor`,
    });
  };

  const duplicateVariant = (index: number) => {
    const variant = formData.variants[index];
    const newVariant = { ...variant, id: undefined };
    setFormData({
      ...formData,
      variants: [...formData.variants, newVariant],
    });
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

  const openGradeSelectionDialog = () => {
    setGradeDialogOpen(true);
  };

  const toggleGradeSelection = (gradeId: number) => {
    const newSelectedGrades = selectedGrades.includes(gradeId)
      ? selectedGrades.filter((id) => id !== gradeId)
      : [...selectedGrades, gradeId];

    setSelectedGrades(newSelectedGrades);
    setFormData({ ...formData, grades: newSelectedGrades });
  };

  const saveGradeSelection = () => {
    setGradeDialogOpen(false);
    toast({
      title: "Sucesso",
      description: `${selectedGrades.length} grade(s) selecionada(s)`,
    });
  };

  const getColorFromVariant = (variant: ProductVariant) => {
    const color = colors.find((c) => c.id === variant.color_id);
    return color?.hex_code || "#999999";
  };

  const getSizeFromVariant = (variant: ProductVariant) => {
    const size = sizes.find((s) => s.id === variant.size_id);
    return size?.size || "";
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    setSelectedStatus("");
    setSortBy("name");
    setSortOrder("asc");
    setCurrentPage(1);
  };

  const generatePageNumbers = () => {
    if (!pagination) return [];

    const pages = [];
    const maxVisible = 5;
    const totalPages = pagination.totalPages;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= Math.min(maxVisible, totalPages); i++) {
          pages.push(i);
        }
        if (totalPages > maxVisible) {
          pages.push("...");
          pages.push(totalPages);
        }
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - maxVisible + 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading && !pagination) {
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
            Sistema completo de gestão de produtos com variantes e grades
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
                  Sistema completo com foto, variantes de tamanho/cor e seleção
                  de grades
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="basic" className="py-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="variants">
                    Variantes ({formData.variants.length})
                  </TabsTrigger>
                  <TabsTrigger value="grades">Grades</TabsTrigger>
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
                    <div className="flex items-center gap-4">
                      <Label className="text-base">
                        Variantes ({formData.variants.length})
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant={
                            variantViewMode === "grid" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setVariantViewMode("grid")}
                        >
                          Grid
                        </Button>
                        <Button
                          type="button"
                          variant={
                            variantViewMode === "table" ? "default" : "outline"
                          }
                          size="sm"
                          onClick={() => setVariantViewMode("table")}
                        >
                          Tabela
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={bulkCreateVariants}
                        size="sm"
                        variant="outline"
                      >
                        <Wand2 className="mr-1 h-3 w-3" />
                        Criar Todas
                      </Button>
                      <Button type="button" onClick={addVariant} size="sm">
                        <Plus className="mr-1 h-3 w-3" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  {formData.variants.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Package className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        Nenhuma variante configurada
                      </p>
                      <Button
                        type="button"
                        onClick={bulkCreateVariants}
                        className="mt-4"
                        variant="outline"
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Criar Todas as Combinações
                      </Button>
                    </div>
                  ) : variantViewMode === "grid" ? (
                    <div className="space-y-6">
                      {colors.map((color) => {
                        const colorVariants = formData.variants.filter(
                          (v) => v.color_id === color.id,
                        );

                        if (colorVariants.length === 0) return null;

                        return (
                          <div key={color.id} className="space-y-3">
                            <div className="flex items-center gap-3 pb-2 border-b">
                              <div
                                className="w-8 h-8 rounded-full border-2"
                                style={{
                                  backgroundColor: color.hex_code || "#999999",
                                }}
                              />
                              <h3 className="text-lg font-semibold">
                                {color.name}
                              </h3>
                              <Badge variant="outline">
                                {colorVariants.length} tamanhos
                              </Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                              {colorVariants.map((variant) => {
                                const variantIndex =
                                  formData.variants.findIndex(
                                    (v) =>
                                      v.size_id === variant.size_id &&
                                      v.color_id === variant.color_id,
                                  );

                                return (
                                  <Card
                                    key={`${variant.size_id}-${variant.color_id}`}
                                    className="relative"
                                  >
                                    <CardContent className="pt-4">
                                      <div className="absolute top-2 right-2 flex gap-1">
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() =>
                                            duplicateVariant(variantIndex)
                                          }
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6"
                                          onClick={() =>
                                            removeVariant(variantIndex)
                                          }
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>

                                      <div className="space-y-3">
                                        <div className="text-center">
                                          <div className="font-medium text-lg">
                                            {getSizeFromVariant(variant)}
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <Label className="text-xs">
                                              Tamanho
                                            </Label>
                                            <Select
                                              value={
                                                variant.size_id > 0
                                                  ? variant.size_id.toString()
                                                  : ""
                                              }
                                              onValueChange={(value) =>
                                                updateVariant(
                                                  variantIndex,
                                                  "size_id",
                                                  parseInt(value) || 0,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="h-8">
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

                                          <div>
                                            <Label className="text-xs">
                                              Cor
                                            </Label>
                                            <Select
                                              value={
                                                variant.color_id > 0
                                                  ? variant.color_id.toString()
                                                  : ""
                                              }
                                              onValueChange={(value) =>
                                                updateVariant(
                                                  variantIndex,
                                                  "color_id",
                                                  parseInt(value) || 0,
                                                )
                                              }
                                            >
                                              <SelectTrigger className="h-8">
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
                                                        className="w-3 h-3 rounded border"
                                                        style={{
                                                          backgroundColor:
                                                            color.hex_code ||
                                                            "#999999",
                                                        }}
                                                      />
                                                      {color.name}
                                                    </div>
                                                  </SelectItem>
                                                ))}
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                          <div>
                                            <Label className="text-xs">
                                              Estoque
                                            </Label>
                                            <Input
                                              type="number"
                                              min="0"
                                              className="h-8"
                                              value={variant.stock}
                                              onChange={(e) =>
                                                updateVariant(
                                                  variantIndex,
                                                  "stock",
                                                  parseInt(e.target.value) || 0,
                                                )
                                              }
                                            />
                                          </div>
                                          <div>
                                            <Label className="text-xs">
                                              Preço Override
                                            </Label>
                                            <Input
                                              type="number"
                                              step="0.01"
                                              min="0"
                                              className="h-8"
                                              value={
                                                variant.price_override || ""
                                              }
                                              onChange={(e) =>
                                                updateVariant(
                                                  variantIndex,
                                                  "price_override",
                                                  e.target.value
                                                    ? parseFloat(e.target.value)
                                                    : undefined,
                                                )
                                              }
                                              placeholder="Opcional"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="border rounded-lg">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tamanho</TableHead>
                            <TableHead>Cor</TableHead>
                            <TableHead>Estoque</TableHead>
                            <TableHead>Preço Override</TableHead>
                            <TableHead className="w-[100px]">Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {formData.variants.map((variant, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <Select
                                  value={
                                    variant.size_id > 0
                                      ? variant.size_id.toString()
                                      : ""
                                  }
                                  onValueChange={(value) =>
                                    updateVariant(
                                      index,
                                      "size_id",
                                      parseInt(value) || 0,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8">
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
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={
                                    variant.color_id > 0
                                      ? variant.color_id.toString()
                                      : ""
                                  }
                                  onValueChange={(value) =>
                                    updateVariant(
                                      index,
                                      "color_id",
                                      parseInt(value) || 0,
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-8">
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
                                            className="w-3 h-3 rounded border"
                                            style={{
                                              backgroundColor:
                                                color.hex_code || "#999999",
                                            }}
                                          />
                                          {color.name}
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  className="h-8"
                                  value={variant.stock}
                                  onChange={(e) =>
                                    updateVariant(
                                      index,
                                      "stock",
                                      parseInt(e.target.value) || 0,
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="h-8"
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
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => duplicateVariant(index)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => removeVariant(index)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="grades" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base">Grades do Produto</Label>
                    <Button
                      type="button"
                      onClick={openGradeSelectionDialog}
                      size="sm"
                    >
                      <Grid3x3 className="mr-1 h-3 w-3" />
                      Selecionar Grades
                    </Button>
                  </div>

                  <Card>
                    <CardContent className="pt-6">
                      {selectedGrades.length > 0 ? (
                        <div className="space-y-2">
                          <Label>Grades Selecionadas:</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedGrades.map((gradeId) => {
                              const grade = grades.find(
                                (g) => g.id === gradeId,
                              );
                              return grade ? (
                                <Badge key={gradeId} variant="default">
                                  {grade.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <Grid3x3 className="mx-auto h-8 w-8 mb-2" />
                          <p>Nenhuma grade selecionada</p>
                          <p className="text-sm">
                            Clique em "Selecionar Grades" para escolher grades
                            existentes
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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

      {/* Grade Selection Dialog */}
      <Dialog open={gradeDialogOpen} onOpenChange={setGradeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Selecionar Grades</DialogTitle>
            <DialogDescription>
              Escolha as grades que este produto deve usar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-80 overflow-y-auto">
              {grades.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Grid3x3 className="mx-auto h-8 w-8 mb-2" />
                  <p>Nenhuma grade cadastrada</p>
                  <p className="text-sm">
                    Cadastre grades primeiro na seção "Grade Vendida"
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {grades.map((grade) => (
                    <div
                      key={grade.id}
                      className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => toggleGradeSelection(grade.id)}
                    >
                      <Checkbox
                        checked={selectedGrades.includes(grade.id)}
                        onCheckedChange={() => toggleGradeSelection(grade.id)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{grade.name}</div>
                        {grade.description && (
                          <div className="text-sm text-muted-foreground">
                            {grade.description}
                          </div>
                        )}
                      </div>
                      <Badge variant={grade.active ? "default" : "secondary"}>
                        {grade.active ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setGradeDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={saveGradeSelection}>
              Salvar Seleção ({selectedGrades.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, SKU ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="filter-category">Categoria</Label>
              <Select
                value={selectedCategory || "all"}
                onValueChange={(value) =>
                  setSelectedCategory(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
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
              <Label htmlFor="filter-status">Status</Label>
              <Select
                value={selectedStatus || "all"}
                onValueChange={(value) =>
                  setSelectedStatus(value === "all" ? "" : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="page-size">Itens por página</Label>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
            {pagination && (
              <div className="text-sm text-muted-foreground">
                Mostrando {(currentPage - 1) * pageSize + 1} a{" "}
                {Math.min(currentPage * pageSize, pagination.total)} de{" "}
                {pagination.total} produtos
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Lista de Produtos
          </CardTitle>
          <CardDescription>
            {pagination
              ? `${pagination.total} produto${pagination.total !== 1 ? "s" : ""} encontrado${pagination.total !== 1 ? "s" : ""}`
              : "Carregando..."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-2 text-sm font-semibold">
                Nenhum produto encontrado
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Tente ajustar os filtros ou criar um novo produto.
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("name")}
                      >
                        Produto
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("base_price")}
                      >
                        Preços
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        className="h-auto p-0 font-semibold"
                        onClick={() => handleSort("total_stock")}
                      >
                        Estoque
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
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
                              Base: R${" "}
                              {typeof product.base_price === "number"
                                ? product.base_price.toFixed(2)
                                : parseFloat(
                                    product.base_price.toString(),
                                  ).toFixed(2)}
                            </div>
                          )}
                          {product.suggested_price && (
                            <div className="text-sm text-muted-foreground">
                              Sugerido: R${" "}
                              {typeof product.suggested_price === "number"
                                ? product.suggested_price.toFixed(2)
                                : parseFloat(
                                    product.suggested_price.toString(),
                                  ).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">
                            {product.total_stock}
                          </div>
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
                        <Badge
                          variant={product.active ? "default" : "secondary"}
                        >
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

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Página {pagination.page} de {pagination.totalPages}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrevPage}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>

                    <div className="flex gap-1">
                      {generatePageNumbers().map((page, index) => (
                        <Button
                          key={index}
                          variant={page === currentPage ? "default" : "outline"}
                          size="sm"
                          onClick={() =>
                            typeof page === "number" && handlePageChange(page)
                          }
                          disabled={page === "..."}
                          className="w-10"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNextPage}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
