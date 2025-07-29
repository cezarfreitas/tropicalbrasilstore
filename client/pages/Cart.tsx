import { Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { ProductImage } from "@/components/ProductImage";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Package,
  Grid3x3,
  ArrowLeft,
  Check,
  Truck,
  Shield,
} from "lucide-react";

export default function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } =
    useCart();

  // Empty cart state
  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto px-4">
            <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Seu carrinho está vazio
              </h2>
              <p className="text-gray-600">
                Explore nossa coleção e encontre os produtos perfeitos para você
              </p>
            </div>
            <Link to="/loja">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-white px-8"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Explorar Produtos
              </Button>
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  const formatPrice = (price: number) => price.toFixed(2);

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-6 lg:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 lg:mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
              Carrinho de Compras
            </h1>
            <p className="text-gray-600 mt-1">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'} no seu carrinho
            </p>
          </div>
          <Link to="/loja">
            <Button variant="outline" className="hidden sm:flex">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continuar Comprando
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Cart Items - Mobile and Desktop */}
          <div className="lg:col-span-8 space-y-4">
            {items.map((item, index) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-4 lg:p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 lg:w-24 lg:h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {item.photo ? (
                        <ProductImage
                          src={item.photo}
                          alt={item.productName}
                          className="w-full h-full object-contain"
                          loading="lazy"
                          sizes="(max-width: 1024px) 80px, 96px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-2 mb-2">
                            {item.productName}
                          </h3>
                          
                          {/* Grade and Color Info */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {item.gradeName && (
                              <Badge variant="secondary" className="text-xs">
                                <Grid3x3 className="h-3 w-3 mr-1" />
                                {item.gradeName}
                              </Badge>
                            )}
                            {item.colorName && (
                              <Badge variant="outline" className="text-xs">
                                {item.colorName}
                              </Badge>
                            )}
                            {item.piecesPerGrade && (
                              <Badge variant="outline" className="text-xs">
                                {item.piecesPerGrade} peças
                              </Badge>
                            )}
                          </div>

                          {/* Price per unit */}
                          <div className="text-sm text-gray-600 mb-2">
                            R$ {formatPrice(item.unitPrice)} por {item.type === 'grade' ? 'grade' : 'unidade'}
                          </div>
                        </div>

                        {/* Remove button - Desktop */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="hidden lg:flex text-gray-400 hover:text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Quantity and Total - Mobile/Desktop Layout */}
                      <div className="flex items-center justify-between">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1 lg:gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="h-8 w-8 p-0"
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <div className="w-12 lg:w-16">
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={item.quantity}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1;
                                updateQuantity(item.id, Math.max(1, Math.min(99, value)));
                              }}
                              className="text-center h-8 text-sm border-gray-200"
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateQuantity(item.id, Math.min(99, item.quantity + 1))}
                            className="h-8 w-8 p-0"
                            disabled={item.quantity >= 99}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Total Price and Remove - Mobile */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-bold text-lg text-primary">
                              R$ {formatPrice(item.totalPrice)}
                            </div>
                            {item.quantity > 1 && (
                              <div className="text-xs text-gray-500">
                                {item.quantity} × R$ {formatPrice(item.unitPrice)}
                              </div>
                            )}
                          </div>
                          
                          {/* Remove button - Mobile */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="lg:hidden text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Continue Shopping - Mobile */}
            <div className="lg:hidden pt-4">
              <Link to="/loja">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Continuar Comprando
                </Button>
              </Link>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Summary Card */}
              <Card className="border-2 border-primary/10">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                      </span>
                      <span className="font-medium">
                        R$ {formatPrice(totalPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Frete</span>
                      <span className="font-medium text-green-600">
                        Consultar no checkout
                      </span>
                    </div>
                  </div>

                  <Separator />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      R$ {formatPrice(totalPrice)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-3 pt-2">
                    <Link to="/loja/checkout">
                      <Button 
                        size="lg" 
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        <Check className="mr-2 h-5 w-5" />
                        Finalizar Compra
                      </Button>
                    </Link>
                  </div>

                  {/* Trust indicators */}
                  <div className="pt-4 border-t space-y-3">
                    <h4 className="font-medium text-sm text-gray-900">
                      Informações Importantes
                    </h4>
                    <div className="space-y-2 text-xs text-gray-600">
                      <div className="flex items-start gap-2">
                        <Grid3x3 className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>Vendas por grades (kits completos)</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Shield className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>Mesma cor obrigatória por grade</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <Truck className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                        <span>Confirmação via WhatsApp</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Promo/Benefits Card */}
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="font-medium text-green-800 text-sm">
                      Vantagens da compra por grade
                    </span>
                  </div>
                  <ul className="text-xs text-green-700 space-y-1">
                    <li>• Melhor preço por peça</li>
                    <li>• Mix completo de tamanhos</li>
                    <li>• Ideal para revenda</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
