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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Users,
  Eye,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  DollarSign,
  UserPlus,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Customer {
  email: string;
  name: string;
  whatsapp: string;
  created_at: string;
  updated_at: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
  completed_orders: number;
}

interface CustomerOrder {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  item_count: number;
}

interface CustomerDetails extends Customer {
  orders: CustomerOrder[];
}

interface CustomerStats {
  total_customers: number;
  new_customers_week: number;
  new_customers_month: number;
  active_customers_month: number;
}

const statusConfig = {
  pending: { label: "Pendente", color: "yellow" as const },
  confirmed: { label: "Confirmado", color: "blue" as const },
  processing: { label: "Processando", color: "purple" as const },
  shipped: { label: "Enviado", color: "orange" as const },
  delivered: { label: "Entregue", color: "green" as const },
  cancelled: { label: "Cancelado", color: "red" as const },
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetails | null>(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: "", whatsapp: "" });
  const [updating, setUpdating] = useState(false);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", whatsapp: "" });
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/admin/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/admin/customers/stats/summary");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchCustomerDetails = async (email: string) => {
    setCustomerDetailsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(email)}`,
      );
      if (response.ok) {
        const data = await response.json();
        setSelectedCustomer(data);
      }
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do cliente",
        variant: "destructive",
      });
    } finally {
      setCustomerDetailsLoading(false);
    }
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer.email);
    setEditForm({
      name: customer.name,
      whatsapp: customer.whatsapp,
    });
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditForm({ name: "", whatsapp: "" });
  };

  const saveCustomer = async (email: string) => {
    setUpdating(true);
    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(email)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editForm),
        },
      );

      if (response.ok) {
        setCustomers(
          customers.map((customer) =>
            customer.email === email ? { ...customer, ...editForm } : customer,
          ),
        );
        if (selectedCustomer && selectedCustomer.email === email) {
          setSelectedCustomer({ ...selectedCustomer, ...editForm });
        }
        setEditingCustomer(null);
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso",
        });
      }
    } catch (error) {
      console.error("Error updating customer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o cliente",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const addCustomer = async () => {
    setAdding(true);
    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(addForm),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cliente criado com sucesso",
        });
        setIsAddingCustomer(false);
        setAddForm({ email: "", name: "", whatsapp: "" });
        fetchCustomers();
        fetchStats();
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.error || "Não foi possível criar o cliente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o cliente",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const cancelAdd = () => {
    setIsAddingCustomer(false);
    setAddForm({ email: "", name: "", whatsapp: "" });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Nunca";
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
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
            Carregando clientes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie a base de clientes da loja
          </p>
        </div>
        <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Cliente
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Cliente</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={addForm.email}
                  onChange={(e) =>
                    setAddForm({ ...addForm, email: e.target.value })
                  }
                  placeholder="cliente@exemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={addForm.name}
                  onChange={(e) =>
                    setAddForm({ ...addForm, name: e.target.value })
                  }
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  value={addForm.whatsapp}
                  onChange={(e) =>
                    setAddForm({ ...addForm, whatsapp: e.target.value })
                  }
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={addCustomer}
                  disabled={adding || !addForm.email || !addForm.name}
                  className="flex-1"
                >
                  {adding ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UserPlus className="h-4 w-4 mr-2" />
                  )}
                  Criar Cliente
                </Button>
                <Button
                  variant="outline"
                  onClick={cancelAdd}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Clientes
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_customers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.new_customers_week} novos esta semana
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Novos este Mês
              </CardTitle>
              <UserPlus className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.new_customers_month}
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes cadastrados
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ativos este Mês
              </CardTitle>
              <ShoppingBag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.active_customers_month}
              </div>
              <p className="text-xs text-muted-foreground">Fizeram pedidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Taxa de Conversão
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.total_customers > 0
                  ? Math.round(
                      (stats.active_customers_month / stats.total_customers) *
                        100,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                Clientes que compraram
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Pedidos</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Último Pedido</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead className="w-[150px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.email}>
                  <TableCell>
                    {editingCustomer === customer.email ? (
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="h-8"
                      />
                    ) : (
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email}
                        </div>
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingCustomer === customer.email ? (
                      <Input
                        value={editForm.whatsapp}
                        onChange={(e) =>
                          setEditForm({ ...editForm, whatsapp: e.target.value })
                        }
                        className="h-8"
                        placeholder="(11) 99999-9999"
                      />
                    ) : (
                      <div className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {customer.whatsapp}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{customer.total_orders}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.completed_orders} concluídos
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(customer.total_spent)}</TableCell>
                  <TableCell>{formatDate(customer.last_order_date)}</TableCell>
                  <TableCell>{formatDate(customer.created_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {editingCustomer === customer.email ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => saveCustomer(customer.email)}
                            disabled={updating}
                          >
                            {updating ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Save className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelEdit}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(customer)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  fetchCustomerDetails(customer.email)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>
                                  Detalhes do Cliente: {customer.name}
                                </DialogTitle>
                              </DialogHeader>
                              {customerDetailsLoading ? (
                                <div className="flex items-center justify-center p-8">
                                  <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                              ) : selectedCustomer ? (
                                <div className="space-y-6">
                                  {/* Customer Info */}
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h4 className="font-semibold mb-2">
                                        Informações de Contato
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4" />
                                          {selectedCustomer.email}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          {selectedCustomer.whatsapp}
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Calendar className="h-4 w-4" />
                                          Cliente desde{" "}
                                          {formatDate(
                                            selectedCustomer.created_at,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div>
                                      <h4 className="font-semibold mb-2">
                                        Estatísticas
                                      </h4>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          Total de pedidos:{" "}
                                          {selectedCustomer.total_orders}
                                        </div>
                                        <div>
                                          Total gasto:{" "}
                                          {formatCurrency(
                                            selectedCustomer.total_spent,
                                          )}
                                        </div>
                                        <div>
                                          Último pedido:{" "}
                                          {formatDate(
                                            selectedCustomer.last_order_date,
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Order History */}
                                  <div>
                                    <h4 className="font-semibold mb-2">
                                      Histórico de Pedidos
                                    </h4>
                                    {selectedCustomer.orders.length > 0 ? (
                                      <div className="space-y-2">
                                        {selectedCustomer.orders.map(
                                          (order) => (
                                            <div
                                              key={order.id}
                                              className="flex items-center justify-between p-3 border rounded-lg"
                                            >
                                              <div>
                                                <div className="font-medium">
                                                  Pedido #{order.id}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                  {order.item_count} item(s) •{" "}
                                                  {formatDate(order.created_at)}
                                                </div>
                                              </div>
                                              <div className="text-right">
                                                <div className="font-medium">
                                                  {formatCurrency(
                                                    order.total_amount,
                                                  )}
                                                </div>
                                                <div className="text-sm">
                                                  {getStatusBadge(order.status)}
                                                </div>
                                              </div>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    ) : (
                                      <p className="text-muted-foreground">
                                        Nenhum pedido encontrado.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : null}
                            </DialogContent>
                          </Dialog>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {customers.length === 0 && (
            <div className="text-center py-8">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhum cliente encontrado
              </h3>
              <p className="mt-2 text-muted-foreground">
                Os clientes aparecerão aqui quando fizerem o primeiro pedido.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
