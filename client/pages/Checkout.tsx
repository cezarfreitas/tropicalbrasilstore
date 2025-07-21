import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  Grid3x3,
  ExternalLink,
  Package,
} from "lucide-react";

interface CustomerInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { customer: authCustomer, isAuthenticated } = useCustomerAuth();
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Pre-fill form with authenticated customer data
  useEffect(() => {
    if (isAuthenticated && authCustomer) {
      setCustomer({
        name: authCustomer.name,
        email: authCustomer.email,
        whatsapp: authCustomer.whatsapp,
      });
    }
  }, [isAuthenticated, authCustomer]);

  // Redirect if cart is empty
  if (items.length === 0 && !orderComplete) {
    navigate("/loja/carrinho");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Use XMLHttpRequest to avoid fetch interference
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/store-old/orders", true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.setRequestHeader("Accept", "application/json");

        xhr.onload = () => {
          const headers = new Headers();
          xhr
            .getAllResponseHeaders()
            .split("\r\n")
            .forEach((line) => {
              const [key, value] = line.split(": ");
              if (key && value) headers.set(key, value);
            });

          const response = new Response(xhr.responseText, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers: headers,
          });
          resolve(response);
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));
        xhr.timeout = 10000;

        xhr.send(
          JSON.stringify({
            customer,
            items,
          }),
        );
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappMessage(data.whatsappMessage);
        setOrderComplete(true);
        clearCart();
        toast({
          title: "✓ Pedido criado!",
          description: `Pedido #${data.orderId}`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar pedido");
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = () => {
    const phone = "5511999999999"; // Replace with actual store WhatsApp number
    const url = `https://wa.me/${phone}?text=${whatsappMessage}`;
    window.open(url, "_blank");
  };

  if (orderComplete) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-2xl mx-auto text-center">
            {/* Success Icon */}
            <div className="mb-6 sm:mb-8">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-green-600 mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground px-4">
                Seu pedido foi registrado com sucesso. Agora envie os detalhes
                via WhatsApp para finalizar.
              </p>
            </div>

            {/* WhatsApp Card */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base sm:text-lg">
                  Próximo Passo: Enviar via WhatsApp
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Clique no botão abaixo para enviar os detalhes do seu pedido
                  via WhatsApp. Nossa equipe entrará em contato para confirmar e
                  processar seu pedido.
                </p>

                <Button
                  onClick={sendWhatsApp}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Enviar Pedido via WhatsApp
                  <ExternalLink className="ml-2 h-3 w-3 sm:h-4 sm:w-4" />
                </Button>

                <div className="text-xs text-muted-foreground">
                  <p>
                    Após enviar o WhatsApp, nossa equipe confirmará a
                    disponibilidade dos produtos e informará sobre pagamento e
                    entrega.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Button
              variant="outline"
              onClick={() => navigate("/loja")}
              className="mt-4 w-full sm:w-auto"
            >
              Voltar à Loja
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-8">
          Finalizar Compra
        </h1>

        {/* Mobile Layout */}
        <div className="block lg:hidden space-y-4">
          {/* Order Summary First on Mobile */}
          <Card className="bg-orange-50 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Resumo do Pedido
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 py-2 border-b last:border-b-0"
                >
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center flex-shrink-0">
                    {item.photo ? (
                      <img
                        src={item.photo}
                        alt={item.productName}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <Package className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-xs truncate">
                      {item.productName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.gradeName} - {item.colorName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Qtd: {item.quantity}
                    </p>
                  </div>
                  <p className="font-bold text-sm text-orange-500">
                    R$ {item.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}

              <div className="border-t pt-3">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-orange-500">
                    R$ {totalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p>• Pagamento será confirmado via WhatsApp</p>
                <p>• Entrega será combinada após confirmação</p>
                <p>• Produtos sujeitos à disponibilidade</p>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <User className="h-4 w-4" />
                Suas Informações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm">
                    Nome Completo
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={customer.name}
                    onChange={(e) =>
                      setCustomer({ ...customer, name: e.target.value })
                    }
                    placeholder="Seu nome completo"
                    className="mt-1"
                    disabled={isAuthenticated}
                    required
                  />
                  {isAuthenticated && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ✓ Dados preenchidos automaticamente da sua conta
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="email" className="text-sm">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={customer.email}
                    onChange={(e) =>
                      setCustomer({ ...customer, email: e.target.value })
                    }
                    placeholder="seu@email.com"
                    className="mt-1"
                    disabled={isAuthenticated}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="whatsapp" className="text-sm">
                    WhatsApp
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    value={customer.whatsapp}
                    onChange={(e) =>
                      setCustomer({ ...customer, whatsapp: e.target.value })
                    }
                    placeholder="(11) 99999-9999"
                    className="mt-1"
                    disabled={isAuthenticated}
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Usaremos o WhatsApp para confirmar seu pedido
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 mt-6"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? "Processando..." : "Confirmar Pedido"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Desktop Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-8">
          {/* Customer Information */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Suas Informações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      type="text"
                      value={customer.name}
                      onChange={(e) =>
                        setCustomer({ ...customer, name: e.target.value })
                      }
                      placeholder="Seu nome completo"
                      disabled={isAuthenticated}
                      required
                    />
                    {isAuthenticated && (
                      <p className="text-xs text-muted-foreground mt-1">
                        ✓ Dados preenchidos automaticamente da sua conta
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customer.email}
                      onChange={(e) =>
                        setCustomer({ ...customer, email: e.target.value })
                      }
                      placeholder="seu@email.com"
                      disabled={isAuthenticated}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={customer.whatsapp}
                      onChange={(e) =>
                        setCustomer({ ...customer, whatsapp: e.target.value })
                      }
                      placeholder="(11) 99999-9999"
                      disabled={isAuthenticated}
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Usaremos o WhatsApp para confirmar seu pedido
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={loading}
                  >
                    {loading ? "Processando..." : "Confirmar Pedido"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Resumo do Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {item.photo ? (
                          <img
                            src={item.photo}
                            alt={item.productName}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <Grid3x3 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Grade: {item.gradeName} - {item.colorName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qtd: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold">
                      R$ {item.totalPrice.toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t pt-4">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>R$ {totalPrice.toFixed(2)}</span>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Pagamento será confirmado via WhatsApp</p>
                  <p>• Entrega será combinada após confirmação</p>
                  <p>• Produtos sujeitos à disponibilidade de estoque</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
