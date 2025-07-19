import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  User,
  Mail,
  Phone,
  Package,
  Grid3x3,
  ExternalLink,
} from "lucide-react";

interface CustomerInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
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

  // Redirect if cart is empty
  if (items.length === 0 && !orderComplete) {
    navigate("/loja/carrinho");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/store/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer,
          items,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setWhatsappMessage(data.whatsappMessage);
        setOrderComplete(true);
        clearCart();
        toast({
          title: "Pedido criado com sucesso!",
          description: `Pedido #${data.orderId} foi registrado.`,
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
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingCart className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-muted-foreground">
                Seu pedido foi registrado com sucesso. Agora envie os detalhes
                via WhatsApp para finalizar.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Próximo Passo: Enviar via WhatsApp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Clique no botão abaixo para enviar os detalhes do seu pedido
                  via WhatsApp. Nossa equipe entrará em contato para confirmar e
                  processar seu pedido.
                </p>

                <Button onClick={sendWhatsApp} className="w-full" size="lg">
                  <Phone className="mr-2 h-5 w-5" />
                  Enviar Pedido via WhatsApp
                  <ExternalLink className="ml-2 h-4 w-4" />
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
              className="mt-4"
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

        <div className="grid lg:grid-cols-2 gap-8">
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
                      required
                    />
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
                        {item.type === "individual" ? (
                          <Package className="h-5 w-5 text-muted-foreground" />
                        ) : (
                          <Grid3x3 className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {item.productName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.type === "individual" ? (
                            <>
                              {item.colorName} - {item.sizeName}
                            </>
                          ) : (
                            <>
                              Grade: {item.gradeName} - {item.colorName}
                            </>
                          )}
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
