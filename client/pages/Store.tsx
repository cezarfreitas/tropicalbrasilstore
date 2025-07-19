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

export default function Store() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

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

        {/* Products Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Nossos Produtos</h2>
          {products.length === 0 ? (
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
                  className="overflow-hidden h-full transition-transform hover:scale-105 cursor-pointer"
                  onClick={() => openModal(product.id)}
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
                  <div className="p-3">
                    <div className="mb-2">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-1">
                        {product.name}
                      </h3>
                      {product.category_name && (
                        <Badge variant="secondary" className="text-xs">
                          {product.category_name}
                        </Badge>
                      )}
                    </div>

                    {product.base_price && (
                      <div className="text-center mb-2">
                        <p className="text-xl font-bold text-primary">
                          R$ {parseFloat(product.base_price).toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          preço unitário
                        </p>
                      </div>
                    )}

                    {product.suggested_price &&
                      product.suggested_price !== product.base_price && (
                        <div className="text-center mb-2">
                          <p className="text-xs text-muted-foreground">
                            Sugerido: R${" "}
                            {parseFloat(product.suggested_price).toFixed(2)}
                          </p>
                        </div>
                      )}

                    <div className="flex justify-center text-xs text-muted-foreground border-t pt-2 mb-3">
                      <span>{product.variant_count} Cores</span>
                    </div>

                    <div className="space-y-2">
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          openModal(product.id);
                        }}
                        className="w-full"
                        size="sm"
                      >
                        <ShoppingCart className="mr-2 h-3 w-3" />
                        Adicionar ao Carrinho
                      </Button>

                      <Link
                        to={`/loja/produto/${product.id}`}
                        className="w-full"
                      >
                        <Button variant="outline" size="sm" className="w-full">
                          <Grid3x3 className="mr-2 h-3 w-3" />
                          Ver Detalhes
                        </Button>
                      </Link>
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
