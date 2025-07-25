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

  const fetchFilteredOrders = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        search: searchTerm,
        status: statusFilter,
        date: dateFilter,
        sortBy: sortBy,
        sortOrder: sortOrder,
      });

      const response = await fetch(`/api/admin/orders/filtered?${params}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || data);
      }
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
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

  const exportSingleOrder = async (orderId: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/export/excel`);

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `pedido_${orderId}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso",
          description: `Pedido #${orderId} exportado com sucesso!`,
        });
      } else {
        throw new Error("Falha ao exportar pedido");
      }
    } catch (error) {
      console.error("Error exporting order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível exportar o pedido",
        variant: "destructive",
      });
    }
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setDateFilter("");
    setSortBy("created_at");
    setSortOrder("desc");
    setCurrentPage(1);
  };

  const handleEditOrder = (order: Order) => {
    fetchOrderDetails(order.id).then(() => {
      if (selectedOrder) {
        setEditingOrder(selectedOrder);
        setEditDialogOpen(true);
      }
    });
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

      {/* Compact Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID, cliente ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select
              value={statusFilter || "all"}
              onValueChange={(value) =>
                setStatusFilter(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(statusConfig).map(([value, config]) => (
                  <SelectItem key={value} value={value}>
                    {config.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

                        {/* Date Filter */}
            <Select
              value={dateFilter || "all"}
              onValueChange={(value) => setDateFilter(value === "all" ? "" : value)}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Esta semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="year">Este ano</SelectItem>
              </SelectContent>
            </Select>

            {/* Page Size */}
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => {
                setPageSize(parseInt(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Pedidos</CardTitle>
        </CardHeader>
        <CardContent>
                    <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("id")}
                  >
                    Pedido
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("customer_email")}
                  >
                    Cliente
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Itens</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("total_amount")}
                  >
                    Total
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("status")}
                  >
                    Status
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 font-semibold"
                    onClick={() => handleSort("created_at")}
                  >
                    Data
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
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
                    <div className="flex items-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => fetchOrderDetails(order.id)}
                            title="Ver detalhes"
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

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => exportSingleOrder(order.id)}
                        title="Exportar pedido"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEditOrder(order)}
                        title="Editar pedido"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
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

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editar Pedido #{editingOrder?.id}
            </DialogTitle>
          </DialogHeader>
          {editingOrder && (
            <EditOrderForm
              order={editingOrder}
              onUpdate={() => {
                fetchFilteredOrders();
                fetchStats();
                setEditDialogOpen(false);
              }}
              onCancel={() => setEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Edit Order Form Component
function EditOrderForm({
  order,
  onUpdate,
  onCancel
}: {
  order: OrderDetails;
  onUpdate: () => void;
  onCancel: () => void;
}) {
  const [items, setItems] = useState(order.items);
  const [products, setProducts] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
    fetchColors();
    fetchSizes();
    fetchGrades();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        setProducts(await response.json());
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchColors = async () => {
    try {
      const response = await fetch("/api/colors");
      if (response.ok) {
        setColors(await response.json());
      }
    } catch (error) {
      console.error("Error fetching colors:", error);
    }
  };

  const fetchSizes = async () => {
    try {
      const response = await fetch("/api/sizes");
      if (response.ok) {
        setSizes(await response.json());
      }
    } catch (error) {
      console.error("Error fetching sizes:", error);
    }
  };

  const fetchGrades = async () => {
    try {
      const response = await fetch("/api/grades-redesigned");
      if (response.ok) {
        setGrades(await response.json());
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  };

  const updateItem = async (itemId: number, quantity: number, unit_price: number) => {
    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items/${itemId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ quantity, unit_price }),
      });

      if (response.ok) {
        setItems(items.map(item =>
          item.id === itemId
            ? { ...item, quantity, unit_price, total_price: quantity * unit_price }
            : item
        ));
        toast({
          title: "Sucesso",
          description: "Item atualizado com sucesso",
        });
      } else {
        throw new Error("Erro ao atualizar item");
      }
    } catch (error) {
      console.error("Error updating item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o item",
        variant: "destructive",
      });
    }
  };

  const removeItem = async (itemId: number) => {
    if (!confirm("Tem certeza que deseja remover este item?")) return;

    try {
      const response = await fetch(`/api/admin/orders/${order.id}/items/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems(items.filter(item => item.id !== itemId));
        toast({
          title: "Sucesso",
          description: "Item removido com sucesso",
        });
      } else {
        throw new Error("Erro ao remover item");
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast({
        title: "Erro",
        description: "Não foi possível remover o item",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold mb-2">Informações do Cliente</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {order.customer_name}
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {order.customer_email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              {order.customer_whatsapp}
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Informações do Pedido</h4>
          <div className="space-y-2 text-sm">
            <div>Status: <Badge>{order.status}</Badge></div>
            <div>Total: <strong>{formatCurrency(order.total_amount)}</strong></div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-4">Itens do Pedido</h4>
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-4 border rounded-lg">
              <div className="flex-1">
                <div className="font-medium">{item.product_name}</div>
                <div className="text-sm text-muted-foreground">
                  {item.product_sku && `SKU: ${item.product_sku}`}
                  {item.sku_variant && ` • Variante: ${item.sku_variant}`}
                </div>
                <div className="text-sm text-muted-foreground">
                  Grade: {item.grade_name} • Cor: {item.color_name}
                  {item.size && ` • Tamanho: ${item.size}`}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div>
                  <label className="text-xs">Qtd</label>
                  <Input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => {
                      const newQuantity = parseInt(e.target.value) || 1;
                      updateItem(item.id, newQuantity, item.unit_price);
                    }}
                    className="w-16 h-8"
                  />
                </div>

                <div>
                  <label className="text-xs">Preço</label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={item.unit_price}
                    onChange={(e) => {
                      const newPrice = parseFloat(e.target.value) || 0;
                      updateItem(item.id, item.quantity, newPrice);
                    }}
                    className="w-20 h-8"
                  />
                </div>

                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="font-medium">{formatCurrency(item.total_price)}</div>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => removeItem(item.id)}
                  className="h-8 w-8"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <div className="text-lg font-semibold">
          Total do Pedido: {formatCurrency(items.reduce((sum, item) => sum + item.total_price, 0))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onUpdate}>
            Salvar Alterações
          </Button>
        </div>
      </div>
    </div>
  );
}
