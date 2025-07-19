import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProductModal } from "@/components/ProductModal";
import { Package, Grid3x3, Star, ShoppingCart } from "lucide-react";

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
}

interface FilterOption {
  id: string;
  name: string;
  count?: number;
}

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      <div className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Bem-vindo à Chinelos Store
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Descubra nossa coleção completa de chinelos. Todas as compras são
            feitas por grades (kits) com quantidades obrigatórias por tamanho.
          </p>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader className="text-center">
              <Grid3x3 className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Compra por Grade</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Kits com quantidades obrigatórias por tamanho da mesma cor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Package className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Uma Cor por Grade</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Cada grade deve ser obrigatoriamente da mesma cor
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <Star className="h-12 w-12 mx-auto text-primary mb-2" />
              <CardTitle className="text-lg">Qualidade</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-sm text-muted-foreground">
                Produtos de alta qualidade das melhores marcas brasileiras
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">Filtrar Produtos</h3>
          <div className="space-y-4">
            {/* Category Filter */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Categoria
              </h4>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={
                      selectedCategory === category.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-xs"
                  >
                    {category.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Cor
              </h4>
              <div className="flex flex-wrap gap-2">
                {colors.map((color) => (
                  <Button
                    key={color.id}
                    variant={selectedColor === color.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedColor(color.id)}
                    className="text-xs"
                  >
                    {color.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Grade Type Filter */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">
                Tipo de Grade
              </h4>
              <div className="flex flex-wrap gap-2">
                {gradeTypes.map((gradeType) => (
                  <Button
                    key={gradeType.id}
                    variant={
                      selectedGradeType === gradeType.id ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setSelectedGradeType(gradeType.id)}
                    className="text-xs"
                  >
                    {gradeType.name}
                  </Button>
                ))}
              </div>
            </div>
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
              {products.map((product) => (
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
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                          {product.variant_count} cores
                        </span>
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
                          product.suggested_price !== product.base_price && (
                            <div className="text-right">
                              <div className="text-sm text-muted-foreground">
                                R${" "}
                                {parseFloat(product.suggested_price).toFixed(2)}
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

      <ProductModal
        productId={selectedProductId}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </StoreLayout>
  );
}
