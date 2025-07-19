import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "@/components/ProductModal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Package,
  ShoppingCart,
  Filter,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";

interface StoreProduct {
  id: number;
  name: string;
  description?: string;
  base_price?: number;
  suggested_price?: number;
  photo?: string;
  category_name?: string;
  variant_count: number;
  total_stock: number;
  available_colors?: Array<{
    id: number;
    name: string;
    hex_code?: string;
  }>;
}

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

interface CategorySidebarProps {
  categories: FilterOption[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
}

function CategorySidebar({
  categories,
  selectedCategory,
  onCategorySelect,
}: CategorySidebarProps) {
  return (
    <nav className="space-y-1">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategorySelect(category.id)}
          className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            selectedCategory === category.id
              ? "bg-primary text-primary-foreground"
              : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          }`}
        >
          <span>{category.name}</span>
          {selectedCategory === category.id && (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ))}
    </nav>
  );
}

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const productsPerPage = 20;

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedColor, setSelectedColor] = useState<string>("all");
  const [selectedGradeType, setSelectedGradeType] = useState<string>("all");

  // Filter options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [colors, setColors] = useState<FilterOption[]>([]);
  const [gradeTypes, setGradeTypes] = useState<FilterOption[]>([]);

  useEffect(() => {
    fetchProducts();
    fetchFilterData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, selectedCategory, selectedColor, selectedGradeType]);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/store/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      // Fetch categories
      const categoriesResponse = await fetch("/api/categories");
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json();
        setCategories([
          { id: "all", name: "Todas as Categorias" },
          ...categoriesData.map((cat: any) => ({
            id: cat.id.toString(),
            name: cat.name,
          })),
        ]);
      }

      // Fetch colors
      const colorsResponse = await fetch("/api/colors");
      if (colorsResponse.ok) {
        const colorsData = await colorsResponse.json();
        setColors([
          { id: "all", name: "Todas as Cores" },
          ...colorsData.map((color: any) => ({
            id: color.id.toString(),
            name: color.name,
          })),
        ]);
      }

      // Mock grade types (you can replace with real API call)
      setGradeTypes([
        { id: "all", name: "Todos os Tipos" },
        { id: "pequena", name: "Grade Pequena" },
        { id: "media", name: "Grade Média" },
        { id: "grande", name: "Grade Grande" },
      ]);
    } catch (error) {
      console.error("Error fetching filter data:", error);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.category_name
          ?.toLowerCase()
          .includes(selectedCategory.toLowerCase()),
      );
    }

    // Note: Color and grade type filtering would need additional product data
    // For now, we'll just filter by category
    setFilteredProducts(filtered);
  };

  const openModal = (productId: number) => {
    setSelectedProductId(productId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProductId(null);
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedColor("all");
    setSelectedGradeType("all");
  };

  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedColor !== "all" ||
    selectedGradeType !== "all";

  if (loading) {
    return (
      <StoreLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">
              Carregando produtos...
            </p>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="flex h-screen bg-gray-50">
        {/* Mobile sidebar overlay */}
        <div
          className={`fixed inset-0 z-50 lg:hidden ${
            sidebarOpen ? "block" : "hidden"
          }`}
        >
          <div
            className="fixed inset-0 bg-black/20"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">Categorias</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="p-4">
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={(categoryId) => {
                  setSelectedCategory(categoryId);
                  setSidebarOpen(false);
                }}
              />
            </div>
          </div>
        </div>

        {/* Desktop sidebar */}
        <div className="hidden lg:flex lg:w-64 lg:flex-col">
          <div className="flex-1 bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
            <div className="px-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Categorias
              </h2>
              <CategorySidebar
                categories={categories}
                selectedCategory={selectedCategory}
                onCategorySelect={setSelectedCategory}
              />
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-4 w-4 mr-2" />
              Categorias
            </Button>
            <h1 className="text-lg font-semibold">Chinelos Store</h1>
          </div>

          <div className="container mx-auto px-4 py-5 pb-8">
            {/* Hero Section - Removed */}
            <div />

            {/* Additional Filters */}
            <div className="mb-8">
              <div className="flex flex-wrap items-center gap-4 bg-white border rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <Filter className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Filtros adicionais:
                  </span>
                </div>

                {/* Color Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Cor:</label>
                  <Select
                    value={selectedColor}
                    onValueChange={setSelectedColor}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((color) => (
                        <SelectItem key={color.id} value={color.id}>
                          {color.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grade Type Filter */}
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Tipo:</label>
                  <Select
                    value={selectedGradeType}
                    onValueChange={setSelectedGradeType}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      {gradeTypes.map((gradeType) => (
                        <SelectItem key={gradeType.id} value={gradeType.id}>
                          {gradeType.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="text-xs ml-auto"
                  >
                    Limpar Filtros
                  </Button>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Nossos Produtos</h2>
                <span className="text-sm text-muted-foreground">
                  {filteredProducts.length} produto
                  {filteredProducts.length !== 1 ? "s" : ""} encontrado
                  {filteredProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="mx-auto h-16 w-16 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum produto disponível
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    No momento não temos produtos em estoque.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <Card
                      key={product.id}
                      className="overflow-hidden h-full transition-transform hover:scale-105"
                    >
                      <div className="aspect-square bg-muted flex items-center justify-center">
                        {product.photo ? (
                          <img
                            src={product.photo}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="h-12 w-12 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="p-4 space-y-3">
                        {/* Header - Nome e Categoria */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-sm line-clamp-2 leading-tight min-h-[32px]">
                            {product.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            {product.category_name && (
                              <Badge
                                variant="secondary"
                                className="text-xs px-2 py-1"
                              >
                                {product.category_name}
                              </Badge>
                            )}
                            <div className="flex items-center justify-center gap-1">
                              {product.available_colors &&
                              product.available_colors.length > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  {product.available_colors
                                    .slice(0, 5)
                                    .map((color, index) => (
                                      <div
                                        key={color.id}
                                        className="relative group"
                                      >
                                        <div
                                          className="w-4 h-4 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer"
                                          style={{
                                            backgroundColor:
                                              color.hex_code || "#999999",
                                            boxShadow:
                                              "0 0 0 1px rgba(0,0,0,0.1)",
                                          }}
                                        />
                                        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                          {color.name}
                                        </div>
                                      </div>
                                    ))}
                                  {product.available_colors.length > 5 && (
                                    <span className="text-xs text-muted-foreground font-medium ml-1">
                                      +{product.available_colors.length - 5}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                                  {product.variant_count} cores
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="text-center space-y-1">
                          <div className="flex items-center justify-center gap-3">
                            {product.base_price && (
                              <div>
                                <div className="text-2xl font-bold text-primary">
                                  R$ {parseFloat(product.base_price).toFixed(2)}
                                </div>
                                <div className="text-xs text-muted-foreground font-medium">
                                  UNITÁRIO
                                </div>
                              </div>
                            )}

                            {product.suggested_price &&
                              product.suggested_price !==
                                product.base_price && (
                                <div className="text-right">
                                  <div className="text-sm text-muted-foreground">
                                    R${" "}
                                    {parseFloat(
                                      product.suggested_price,
                                    ).toFixed(2)}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    sugerido
                                  </div>
                                </div>
                              )}
                          </div>
                        </div>

                        {/* Add to Cart Button */}
                        <div className="border-t pt-3">
                          <Button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              openModal(product.id);
                            }}
                            className="w-full h-8 text-xs font-medium"
                            size="sm"
                          >
                            <ShoppingCart className="mr-2 h-3 w-3" />
                            Adicionar ao Carrinho
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProductModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </StoreLayout>
  );
}
