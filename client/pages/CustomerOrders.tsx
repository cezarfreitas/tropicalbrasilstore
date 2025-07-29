import { useState, useEffect } from "react";
import { Package2, Calendar, CreditCard, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StoreLayout } from "@/components/StoreLayout";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { ProductImage } from "@/components/ProductImage";

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    photo?: string;
    colorName?: string;
    gradeName?: string;
  }>;
}

const statusConfig = {
  pending: {
    label: "Aguardando Confirmação",
    color: "bg-yellow-500",
    icon: Clock,
    description: "Seu pedido está sendo analisado"
  },
  confirmed: {
    label: "Confirmado",
    color: "bg-blue-500", 
    icon: CheckCircle,
    description: "Pedido confirmado e em preparação"
  },
  shipped: {
    label: "Enviado",
    color: "bg-purple-500",
    icon: Truck,
    description: "Pedido foi enviado"
  },
  delivered: {
    label: "Entregue",
    color: "bg-green-500",
    icon: CheckCircle,
    description: "Pedido foi entregue com sucesso"
  },
  cancelled: {
    label: "Cancelado",
    color: "bg-red-500",
    icon: AlertCircle,
    description: "Pedido foi cancelado"
  }
};

export default function CustomerOrders() {
  const { isAuthenticated, customer } = useCustomerAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && customer) {
      fetchOrders();
    }
  }, [isAuthenticated, customer]);

  const fetchOrders = async () => {
    try {
      const response = await new Promise<Response>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("GET", `/api/customer-orders/${customer?.id}`, true);
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

        xhr.send();
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Set empty orders array on error
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <StoreLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Package2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Acesso Restrito
            </h1>
            <p className="text-gray-600 mb-6">
              Você precisa estar logado para ver seus pedidos.
            </p>
            <Button onClick={() => window.location.href = "/login"}>
              Fazer Login
            </Button>
          </div>
        </div>
      </StoreLayout>
    );
  }

  return (
    <StoreLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Meus Pedidos</h1>
          <p className="text-gray-600">
            Acompanhe o status dos seus pedidos
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Carregando pedidos...</span>
          </div>
        ) : orders.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Package2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum pedido encontrado
              </h3>
              <p className="text-gray-600 mb-6">
                Você ainda não fez nenhum pedido. Que tal começar agora?
              </p>
              <Button onClick={() => window.location.href = "/loja"}>
                Explorar Produtos
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const config = statusConfig[order.status as keyof typeof statusConfig];
              const StatusIcon = config.icon;
              
              return (
                <Card key={order.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Package2 className="h-5 w-5 text-primary" />
                          <CardTitle className="text-lg">Pedido #{order.id}</CardTitle>
                        </div>
                        <Badge 
                          className={`${config.color} text-white flex items-center gap-1`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-lg font-bold text-primary flex items-center gap-1">
                          <CreditCard className="h-4 w-4" />
                          R$ {order.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </CardHeader>
                  
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-gray-900 mb-3">
                        Itens do Pedido ({order.items.length})
                      </h4>
                      
                      {order.items.map((item) => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden border">
                            {item.photo ? (
                              <ProductImage
                                src={item.photo}
                                alt={item.productName}
                                className="w-full h-full object-contain"
                                loading="lazy"
                                sizes="64px"
                                fallbackIconSize="sm"
                              />
                            ) : (
                              <Package2 className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-900 mb-1">
                              {item.productName}
                            </h5>
                            <div className="text-sm text-gray-600 space-y-1">
                              {item.colorName && (
                                <p>Cor: {item.colorName}</p>
                              )}
                              {item.gradeName && (
                                <p>Grade: {item.gradeName}</p>
                              )}
                              <p>Quantidade: {item.quantity}</p>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary">
                              R$ {(item.unitPrice * item.quantity).toFixed(2)}
                            </p>
                            {item.quantity > 1 && (
                              <p className="text-sm text-gray-600">
                                {item.quantity} × R$ {item.unitPrice.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </StoreLayout>
  );
}
