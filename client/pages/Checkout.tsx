import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StoreLayout } from "@/components/StoreLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/hooks/use-cart";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useToast } from "@/hooks/use-toast";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";
import { ProductImage } from "@/components/ProductImage";
import { MinimumOrderIndicator } from "@/components/MinimumOrderIndicator";
import {
  ShoppingCart,
  User,
  Phone,
  Mail,
  Grid3x3,
  ExternalLink,
  Package,
  Check,
  Lock,
  ArrowLeft,
  Clock,
  Shield,
  Truck,
  MessageCircle,
  CreditCard,
  MapPin,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface CustomerInfo {
  name: string;
  email: string;
  whatsapp: string;
}

export default function Checkout() {
  const { items, totalItems, totalPrice, clearCart } = useCart();
  const { customer: authCustomer, isAuthenticated } = useCustomerAuth();
  const storeSettings = useGlobalStoreSettings();
  const [customer, setCustomer] = useState<CustomerInfo>({
    name: "",
    email: "",
    whatsapp: "",
  });
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [orderId, setOrderId] = useState("");
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

  const formatPrice = (price: number) => price.toFixed(2);
  
  const formatWhatsApp = (phone: string) => {
    return phone.replace(/\D/g, '').replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatWhatsApp(value);
    setCustomer({ ...customer, whatsapp: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check minimum order value before proceeding - use customer value if exists, otherwise global
    const minimumOrderValue = (authCustomer?.minimum_order && authCustomer.minimum_order > 0)
      ? authCustomer.minimum_order
      : (storeSettings?.minimum_order_value || 0);
    if (minimumOrderValue > 0 && totalPrice < minimumOrderValue) {
      toast({
        title: "Pedido mínimo não atingido",
        description: `Adicione mais R$ ${(minimumOrderValue - totalPrice).toFixed(2).replace('.', ',')} para atingir o pedido mínimo de R$ ${minimumOrderValue.toFixed(2).replace('.', ',')}`,
        variant: "destructive",
      });
      return;
    }

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
        setOrderId(data.orderId);
        setOrderComplete(true);
        clearCart();
        toast({
          title: "✓ Pedido criado com sucesso!",
          description: `Pedido #${data.orderId} - Envie via WhatsApp para confirmar`,
        });
      } else {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar pedido");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pedido",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendWhatsApp = () => {
    const phone = "5511999999999"; // Replace with actual store WhatsApp number
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(whatsappMessage)}`;
    window.open(url, "_blank");
  };

  // Success Page
  if (orderComplete) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Success Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">
                Pedido Confirmado!
              </h1>
              <p className="text-gray-600">
                Pedido #{orderId} criado com sucesso
              </p>
            </div>

            {/* Steps */}
            <div className="space-y-6">
              {/* Step 1 - Complete */}
              <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Pedido Registrado</h3>
                  <p className="text-sm text-green-700">
                    Suas informações e produtos foram salvos com sucesso
                  </p>
                </div>
              </div>

              {/* Step 2 - Current */}
              <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-800 mb-2">
                    Enviar via WhatsApp
                  </h3>
                  <p className="text-sm text-blue-700 mb-4">
                    Clique no botão abaixo para enviar os detalhes do pedido via WhatsApp. 
                    Nossa equipe confirmará a disponibilidade e processará seu pedido.
                  </p>
                  <Button
                    onClick={sendWhatsApp}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Enviar Pedido via WhatsApp
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Step 3 - Pending */}
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-700">Confirmação e Pagamento</h3>
                  <p className="text-sm text-gray-600">
                    Nossa equipe confirmará disponibilidade e informará sobre pagamento e entrega
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <Card className="mt-8 bg-yellow-50 border-yellow-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-800 mb-1">
                      Importante
                    </h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Produtos sujeitos à disponibilidade de estoque</li>
                      <li>• Pagamento e entrega serão confirmados via WhatsApp</li>
                      <li>• Mantenha o WhatsApp ativo para nossa resposta</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Back to Store */}
            <div className="text-center mt-8">
              <Button
                variant="outline"
                onClick={() => navigate("/loja")}
                className="px-8"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar à Loja
              </Button>
            </div>
          </div>
        </div>
      </StoreLayout>
    );
  }

  // Checkout Form
  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Finalizar Compra</h1>
            <p className="text-gray-600 mt-1">
              Complete suas informações para finalizar o pedido
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => navigate("/loja/carrinho")}
            className="hidden sm:flex"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Carrinho
          </Button>
        </div>

        <CheckoutDebug />

        <div className="grid lg:grid-cols-12 gap-8">
          {/* Customer Form */}
          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Informações de Contato
                </CardTitle>
                {isAuthenticated && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Dados preenchidos automaticamente da sua conta
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Field */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium">
                      Nome Completo *
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        type="text"
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer({ ...customer, name: e.target.value })
                        }
                        placeholder="Seu nome completo"
                        className="pl-10"
                        disabled={isAuthenticated}
                        required
                      />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer({ ...customer, email: e.target.value })
                        }
                        placeholder="seu@email.com"
                        className="pl-10"
                        disabled={isAuthenticated}
                        required
                      />
                    </div>
                  </div>

                  {/* WhatsApp Field */}
                  <div className="space-y-2">
                    <Label htmlFor="whatsapp" className="text-sm font-medium">
                      WhatsApp *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="whatsapp"
                        type="tel"
                        value={customer.whatsapp}
                        onChange={(e) => handlePhoneChange(e.target.value)}
                        placeholder="(11) 99999-9999"
                        className="pl-10"
                        disabled={isAuthenticated}
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      Usaremos o WhatsApp para confirmar seu pedido
                    </p>
                  </div>

                  {/* Security Notice */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-800 text-sm">
                          Suas informações estão seguras
                        </h4>
                        <p className="text-xs text-blue-700 mt-1">
                          Seus dados são protegidos e usados apenas para processar seu pedido
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-primary hover:bg-primary/90 text-white"
                    disabled={loading || ((() => {
                      const minValue = (authCustomer?.minimum_order && authCustomer.minimum_order > 0)
                        ? authCustomer.minimum_order
                        : (storeSettings?.minimum_order_value || 0);
                      return minValue > 0 && totalPrice < minValue;
                    })())}
                  >
                    {loading ? (
                      <>
                        <Clock className="mr-2 h-5 w-5 animate-spin" />
                        Processando Pedido...
                      </>
                    ) : (
                      <>
                        <Lock className="mr-2 h-5 w-5" />
                        Confirmar Pedido
                      </>
                    )}
                  </Button>

                  {/* Minimum order message */}
                  {(() => {
                    const minValue = (authCustomer?.minimum_order && authCustomer.minimum_order > 0)
                      ? authCustomer.minimum_order
                      : (storeSettings?.minimum_order_value || 0);
                    return minValue > 0 && totalPrice < minValue && (
                      <div className="text-center">
                        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          <AlertCircle className="inline h-4 w-4 mr-1" />
                          Adicione mais R$ {(minValue - totalPrice).toFixed(2).replace('.', ',')} para atingir o pedido mínimo
                        </p>
                      </div>
                    );
                  })()}

                  {/* Back to Cart - Mobile */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/loja/carrinho")}
                    className="w-full sm:hidden"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Voltar ao Carrinho
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-6 space-y-6">
              {/* Minimum Order Indicator */}
              <MinimumOrderIndicator
                currentValue={totalPrice}
                customerMinimumValue={authCustomer?.minimum_order}
                globalMinimumValue={storeSettings?.minimum_order_value}
              />

              {/* Summary Card */}
              <Card className="border-2 border-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                    Resumo do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Items */}
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-12 h-12 bg-white rounded-lg flex-shrink-0 overflow-hidden">
                          <ProductImage
                            src={item.photo}
                            alt={item.productName}
                            className="w-full h-full object-contain"
                            loading="lazy"
                            sizes="48px"
                            fallbackIconSize="sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-1">
                            {item.productName}
                          </h4>
                          {item.type === 'grade' && (
                            <div className="text-xs text-gray-600 mt-1">
                              Grade: {item.gradeName} • Cor: {item.colorName}
                              {item.piecesPerGrade && (
                                <Badge variant="outline" className="ml-2 text-xs">
                                  {item.piecesPerGrade} itens
                                </Badge>
                              )}
                            </div>
                          )}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-500">
                              Qtd: {item.quantity}
                            </span>
                            <span className="font-bold text-primary">
                              R$ {formatPrice(item.totalPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  {/* Totals */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        Subtotal ({items.length} {items.length === 1 ? 'produto' : 'produtos'})
                      </span>
                      <span className="font-medium">
                        R$ {formatPrice(totalPrice)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total de itens</span>
                      <span className="font-medium">{totalItems}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Taxa de entrega</span>
                      <span className="font-medium text-blue-600">
                        A combinar
                      </span>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Total</span>
                      <span className="text-2xl font-bold text-primary">
                        R$ {formatPrice(totalPrice)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Process Info */}
              <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                <CardContent className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    Como funciona
                  </h4>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Confirmamos disponibilidade via WhatsApp</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Definimos pagamento e entrega</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span>Processamos e enviamos seu pedido</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Trust indicators */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                      <Shield className="h-4 w-4" />
                      Compra Segura
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs text-green-700">
                      <div className="flex items-center gap-1">
                        <Truck className="h-3 w-3" />
                        <span>Entrega rápida</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>Suporte direto</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Dados protegidos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Produtos originais</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  );
}
