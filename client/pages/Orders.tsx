import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Package,
  Eye,
  Calendar,
  DollarSign,
  Users,
  ShoppingBag,
  Phone,
  Mail,
  Loader2,
  Clock,
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Edit,
  FileSpreadsheet,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: number;
  customer_email: string;
  customer_name: string;
  customer_whatsapp: string;
  total_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  item_count: number;
}

interface OrderItem {
  id: number;
  product_name: string;
  product_sku: string;
  sku_variant: string;
  size: string;
  color_name: string;
  color_hex: string;
  grade_name: string;
  grade_description: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  type: string;
}

interface OrderDetails extends Order {
  items: OrderItem[];
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  confirmed_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
  total_revenue: number;
  average_order_value: number;
  today_orders: number;
  week_orders: number;
  month_orders: number;
}

const statusConfig = {
  pending: { label: "Pendente", color: "yellow" as const },
  confirmed: { label: "Confirmado", color: "blue" as const },
  processing: { label: "Processando", color: "purple" as const },
  shipped: { label: "Enviado", color: "orange" as const },
  delivered: { label: "Entregue", color: "green" as const },
  cancelled: { label: "Cancelado", color: "red" as const },
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<OrderStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false);
    const [statusUpdating, setStatusUpdating] = useState<number | null>(null);
  const [exporting, setExporting] = useState(false);

  // Search, filter and pagination states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  // Edit order states
  const [editingOrder, setEditingOrder] = useState<OrderDetails | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { toast } = useToast();

    useEffect(() => {
    fetchOrders();
    fetchStats();
  }, []);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchFilteredOrders();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, dateFilter, sortBy, sortOrder, currentPage, pageSize]);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/orders/stats/summary");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchOrderDetails = async (orderId: number) => {
    setOrderDetailsLoading(true);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedOrder(data);
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do pedido",
        variant: "destructive",
      });
    } finally {
      setOrderDetailsLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: number, newStatus: string) => {
    setStatusUpdating(orderId);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setOrders(
          orders.map((order) =>
            order.id === orderId ? { ...order, status: newStatus } : order,
          ),
        );
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
        fetchStats(); // Refresh stats
        toast({
          title: "Sucesso",
          description: "Status do pedido atualizado com sucesso",
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido",
        variant: "destructive",
      });
    } finally {
      setStatusUpdating(null);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch("/api/admin/orders/export/excel");

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;

        // Get filename from response headers or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        let filename = `pedidos_${new Date().toISOString().split("T")[0]}.xlsx`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso",
          description: "Relatório de pedidos exportado com sucesso!",
        });
      } else {
        throw new Error("Falha ao exportar dados");
      }
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar os dados para Excel",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return <Badge variant="outline">{status}</Badge>;

    const variants = {
      yellow: "default" as const,
      blue: "default" as const,
      purple: "secondary" as const,
      orange: "default" as const,
      green: "default" as const,
      red: "destructive" as const,
    };

    return (
      <Badge
        variant={variants[config.color]}
        className={`bg-${config.color}-100 text-${config.color}-800`}
      >
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">
            Carregando pedidos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Pedidos</h1>
          <p className="text-muted-foreground">
            Gerencie todos os pedidos da loja
          </p>
        </div>
        <Button
          onClick={exportToExcel}
          disabled={exporting || orders.length === 0}
          variant="outline"
        >
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {exporting ? "Exportando..." : "Exportar Excel"}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Pedidos
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_orders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.today_orders} hoje
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending_orders}</div>
              <p className="text-xs text-muted-foreground">
                Aguardando confirmação
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Receita Total
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Ticket médio: {formatCurrency(stats.average_order_value)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Esta Semana</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.week_orders}</div>
              <p className="text-xs text-muted-foreground">
                {stats.month_orders} este mês
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">#{order.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{order.customer_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {order.customer_email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{order.item_count} item(s)</TableCell>
                  <TableCell>{formatCurrency(order.total_amount)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>{formatDate(order.created_at)}</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchOrderDetails(order.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>
                            Detalhes do Pedido #{order.id}
                          </DialogTitle>
                        </DialogHeader>
                        {orderDetailsLoading ? (
                          <div className="flex items-center justify-center p-8">
                            <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                        ) : selectedOrder ? (
                          <div className="space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Informações do Cliente
                                </h4>
                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    {selectedOrder.customer_name}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {selectedOrder.customer_email}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    {selectedOrder.customer_whatsapp}
                                  </div>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Status do Pedido
                                </h4>
                                <Select
                                  value={selectedOrder.status}
                                  onValueChange={(value) =>
                                    updateOrderStatus(selectedOrder.id, value)
                                  }
                                  disabled={statusUpdating === selectedOrder.id}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {Object.entries(statusConfig).map(
                                      ([value, config]) => (
                                        <SelectItem key={value} value={value}>
                                          {config.label}
                                        </SelectItem>
                                      ),
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>

                            {/* Order Items */}
                            <div>
                              <h4 className="font-semibold mb-2">
                                Itens do Pedido
                              </h4>
                              <div className="space-y-2">
                                {selectedOrder.items.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                                        <Package className="h-6 w-6 text-muted-foreground" />
                                      </div>
                                      <div>
                                        <div className="font-medium">
                                          {item.product_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          {item.product_sku &&
                                            `SKU: ${item.product_sku}`}
                                          {item.sku_variant &&
                                            ` • Variante: ${item.sku_variant}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Grade: {item.grade_name} • Cor:{" "}
                                          {item.color_name}
                                          {item.size &&
                                            ` • Tamanho: ${item.size}`}
                                        </div>
                                        <div className="text-sm text-muted-foreground">
                                          Quantidade: {item.quantity} kit(s)
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-medium">
                                        {formatCurrency(item.total_price)}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {formatCurrency(item.unit_price)} cada
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t pt-4">
                              <div className="flex justify-between items-center font-semibold text-lg">
                                <span>Total:</span>
                                <span>
                                  {formatCurrency(selectedOrder.total_amount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {orders.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhum pedido encontrado
              </h3>
              <p className="mt-2 text-muted-foreground">
                Os pedidos aparecerão aqui quando os clientes fizerem compras.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
