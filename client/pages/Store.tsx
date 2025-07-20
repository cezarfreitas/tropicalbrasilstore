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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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

interface FiltersSidebarProps {
  categories: FilterOption[];
  colors: FilterOption[];
  selectedCategory: string;
  selectedColors: string[];
  selectedGrades: string[];
  priceRange: [number, number];
  maxPrice: number;
  onCategorySelect: (categoryId: string) => void;
  onColorToggle: (colorId: string) => void;
  onGradeToggle: (gradeId: string) => void;
  onPriceRangeChange: (range: [number, number]) => void;
  onClearFilters: () => void;
}

function FiltersSidebar({
  categories,
  colors,
  selectedCategory,
  selectedColors,
  selectedGrades,
  priceRange,
  maxPrice,
  onCategorySelect,
  onColorToggle,
  onGradeToggle,
  onPriceRangeChange,
  onClearFilters,
}: FiltersSidebarProps) {
  const hasActiveFilters =
    selectedCategory !== "all" ||
    selectedColors.length > 0 ||
    selectedGrades.length > 0 ||
    (priceRange[0] > 0 || priceRange[1] < maxPrice);

  const gradeOptions = [
    { id: "feminino", name: "Feminino" },
    { id: "masculino", name: "Masculino" },
    { id: "infantil", name: "Infantil" },
    { id: "premium", name: "Premium" },
  ];

  return (
    <div className="space-y-6">
      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <div className="pb-4 border-b">
          <Button
            onClick={onClearFilters}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <X className="h-4 w-4 mr-2" />
            Limpar Filtros
          </Button>
        </div>
      )}

      {/* Categories */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Categorias</h3>
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
              {category.count && (
                <span className="text-xs text-muted-foreground">
                  {category.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Colors */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cores</h3>
        <div className="space-y-2">
          {colors.map((color) => (
            <label
              key={color.id}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedColors.includes(color.id)}
                onChange={() => onColorToggle(color.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{color.name}</span>
              {color.count && (
                <span className="text-xs text-muted-foreground ml-auto">
                  {color.count}
                </span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* Grades/Types */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tipos</h3>
        <div className="space-y-2">
          {gradeOptions.map((grade) => (
            <label
              key={grade.id}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedGrades.includes(grade.id)}
                onChange={() => onGradeToggle(grade.id)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{grade.name}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Preço</h3>
        <div className="space-y-4">
          <div className="px-2">
            <input
              type="range"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value)])}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>R$ {priceRange[0].toFixed(2)}</span>
            <span>R$ {priceRange[1].toFixed(2)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              min="0"
              max={maxPrice}
              value={priceRange[0]}
              onChange={(e) => onPriceRangeChange([parseInt(e.target.value) || 0, priceRange[1]])}
              placeholder="Min"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              min="0"
              max={maxPrice}
              value={priceRange[1]}
              onChange={(e) => onPriceRangeChange([priceRange[0], parseInt(e.target.value) || maxPrice])}
              placeholder="Max"
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
            />
          </div>
        </div>
      </div>
    </div>
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
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice, setMaxPrice] = useState<number>(200);

  // Filter options
  const [categories, setCategories] = useState<FilterOption[]>([]);
  const [colors, setColors] = useState<FilterOption[]>([]);
  const [allProducts, setAllProducts] = useState<StoreProduct[]>([]);

    useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [currentPage, selectedCategory, selectedColors, selectedGrades, priceRange, allProducts]);

    const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/store-old/products");
      if (response.ok) {
        const productsData = await response.json();
        setAllProducts(productsData);

        // Extract filter options
        const uniqueCategories = new Set<string>();
        const uniqueColors = new Set<string>();
        let maxProductPrice = 0;

        productsData.forEach((product: StoreProduct) => {
          if (product.category_name) {
            uniqueCategories.add(product.category_name);
          }
          if (product.available_colors) {
            product.available_colors.forEach(color => uniqueColors.add(color.name));
          }
          const price = product.suggested_price || product.base_price || 0;
          maxProductPrice = Math.max(maxProductPrice, price);
        });

        setCategories([
          { id: "all", name: "Todas as Categorias", count: productsData.length },
          ...Array.from(uniqueCategories).map(cat => ({
            id: cat.toLowerCase(),
            name: cat,
            count: productsData.filter((p: StoreProduct) => p.category_name === cat).length
          }))
        ]);

        setColors([
          ...Array.from(uniqueColors).map(color => ({
            id: color.toLowerCase(),
            name: color,
            count: productsData.filter((p: StoreProduct) =>
              p.available_colors?.some(c => c.name === color)
            ).length
          }))
        ]);

        setMaxPrice(Math.ceil(maxProductPrice));
        setPriceRange([0, Math.ceil(maxProductPrice)]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...allProducts];

    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((product) =>
        product.category_name?.toLowerCase() === selectedCategory
      );
    }

    // Color filter
    if (selectedColors.length > 0) {
      filtered = filtered.filter((product) =>
        product.available_colors?.some(color =>
          selectedColors.includes(color.name.toLowerCase())
        )
      );
    }

    // Grade/Type filter
    if (selectedGrades.length > 0) {
      filtered = filtered.filter((product) => {
        const productName = product.name.toLowerCase();
        return selectedGrades.some(grade => {
          switch (grade) {
            case "feminino":
              return productName.includes("feminino") || productName.includes("mulher");
            case "masculino":
              return productName.includes("masculino") || productName.includes("homem");
            case "infantil":
              return productName.includes("infantil") || productName.includes("criança");
            case "premium":
              return productName.includes("premium") || productName.includes("confort");
            default:
              return false;
          }
        });
      });
    }

    // Price filter
    filtered = filtered.filter((product) => {
      const price = product.suggested_price || product.base_price || 0;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Apply pagination
    const total = filtered.length;
    const totalPages = Math.ceil(total / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const paginatedProducts = filtered.slice(startIndex, endIndex);

    setProducts(filtered);
    setFilteredProducts(paginatedProducts);
    setTotalProducts(total);
    setTotalPages(totalPages);
  };

    // Filter manipulation functions
  const handleColorToggle = (colorId: string) => {
    setSelectedColors(prev =>
      prev.includes(colorId)
        ? prev.filter(id => id !== colorId)
        : [...prev, colorId]
    );
    setCurrentPage(1);
  };

  const handleGradeToggle = (gradeId: string) => {
    setSelectedGrades(prev =>
      prev.includes(gradeId)
        ? prev.filter(id => id !== gradeId)
        : [...prev, gradeId]
    );
    setCurrentPage(1);
  };

  const handlePriceRangeChange = (range: [number, number]) => {
    setPriceRange(range);
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedColors([]);
    setSelectedGrades([]);
    setPriceRange([0, maxPrice]);
    setCurrentPage(1);
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
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("ellipsis");
        pages.push(totalPages);
      }
    }

    return pages;
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {(currentPage - 1) * productsPerPage + 1} a{" "}
                    {Math.min(currentPage * productsPerPage, totalProducts)} de{" "}
                    {totalProducts} produtos
                  </div>

                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() =>
                            currentPage > 1 && handlePageChange(currentPage - 1)
                          }
                          className={
                            currentPage <= 1
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>

                      {generatePageNumbers().map((page, index) =>
                        page === "ellipsis" ? (
                          <PaginationItem key={`ellipsis-${index}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        ) : (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page as number)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ),
                      )}

                      <PaginationItem>
                        <PaginationNext
                          onClick={() =>
                            currentPage < totalPages &&
                            handlePageChange(currentPage + 1)
                          }
                          className={
                            currentPage >= totalPages
                              ? "pointer-events-none opacity-50"
                              : "cursor-pointer"
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
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
