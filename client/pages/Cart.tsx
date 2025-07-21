import { Link } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import {
  ShoppingCart,
  Minus,
  Plus,
  Trash2,
  Package,
  Grid3x3,
} from "lucide-react";

export default function Cart() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem } =
    useCart();

  if (items.length === 0) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground/50" />
            <h2 className="mt-4 text-2xl font-bold">Seu carrinho está vazio</h2>
            <p className="mt-2 text-muted-foreground">
              Adicione algumas grades para começar suas compras
            </p>
            <Link to="/loja">
              <Button className="mt-4">Continuar Comprando</Button>
            </Link>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">Seu Carrinho</h1>

        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Cart Items */}
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-3">
                  <div className="flex gap-3">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">{item.productName}</h3>
                      <div className="flex items-center gap-1 mt-1">
                        <Grid3x3 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {item.gradeName}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {item.colorName}
                      </div>
                      <div className="font-bold text-orange-500 text-sm mt-1">
                        R$ {item.totalPrice.toFixed(2)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-xs font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="h-6 w-6 p-0"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Mobile Summary */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Itens ({totalItems})</span>
                  <span className="font-medium">R$ {totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="border-t pt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-orange-500">R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <Link to="/loja/checkout">
                    <Button className="w-full bg-orange-500 hover:bg-orange-600" size="lg">
                      Finalizar Compra
                    </Button>
                  </Link>
                  <Link to="/loja">
                    <Button variant="outline" className="w-full">
                      Continuar Comprando
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                  <p>• Compras por grades (kits)</p>
                  <p>• Mesma cor por grade</p>
                  <p>• Confirmação via WhatsApp</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Product Image */}
                    <div className="w-20 h-20 bg-muted rounded flex items-center justify-center flex-shrink-0">
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded"
                        />
                      ) : (
                        <Package className="h-8 w-8 text-muted-foreground/50" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.productName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Grid3x3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Grade Vendida
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground mt-1">
                        <span>Cor: {item.colorName}</span>
                        <span className="ml-3">Grade: {item.gradeName}</span>
                      </div>

                      <p className="font-semibold mt-2">
                        R$ {item.unitPrice.toFixed(2)} cada
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, parseInt(e.target.value) || 1)
                        }
                        className="w-16 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Total Price */}
                    <div className="text-right">
                      <p className="font-bold">
                        R$ {item.totalPrice.toFixed(2)}
                      </p>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="mt-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Resumo do Pedido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Itens ({totalItems})</span>
                  <span>R$ {totalPrice.toFixed(2)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link to="/loja/checkout">
                    <Button className="w-full" size="lg">
                      Finalizar Compra
                    </Button>
                  </Link>
                  <Link to="/loja">
                    <Button variant="outline" className="w-full">
                      Continuar Comprando
                    </Button>
                  </Link>
                </div>

                <div className="text-xs text-muted-foreground">
                  <p>• Todas as compras são feitas por grades (kits)</p>
                  <p>• Cada grade deve ser obrigatoriamente da mesma cor</p>
                  <p>• Entrega via WhatsApp após confirmação do pedido</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
