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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Check,
  XCircle,
  Clock,
  UserCheck,
  Key,
  Trash2,
  Shield,
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
  status?: "pending" | "approved" | "rejected";
  id?: number;
  minimum_order?: number;
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
  pending_approvals: number;
}

interface PendingCustomer {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

const statusConfig = {
  pending: { label: "Pendente", color: "yellow" as const },
  confirmed: { label: "Confirmado", color: "blue" as const },
  processing: { label: "Processando", color: "purple" as const },
  shipped: { label: "Enviado", color: "orange" as const },
  delivered: { label: "Entregue", color: "green" as const },
  cancelled: { label: "Cancelado", color: "red" as const },
};

const customerStatusConfig = {
  pending: { label: "Aguardando Aprovação", color: "yellow", icon: Clock },
  approved: { label: "Aprovado", color: "green", icon: Check },
  rejected: { label: "Rejeitado", color: "red", icon: XCircle },
};

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pendingCustomers, setPendingCustomers] = useState<PendingCustomer[]>(
    [],
  );
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerDetails | null>(null);
  const [customerDetailsLoading, setCustomerDetailsLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    whatsapp: "",
    status: "approved" as "pending" | "approved" | "rejected",
    newPassword: "",
    minimum_order: 0,
  });
  const [updating, setUpdating] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState<string | null>(null);
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", name: "", whatsapp: "", minimum_order: 0 });
  const [adding, setAdding] = useState(false);
  const [approvingCustomer, setApprovingCustomer] = useState<number | null>(
    null,
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
    fetchStats();
    fetchPendingCustomers();
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

  const fetchPendingCustomers = async () => {
    try {
      const response = await fetch("/api/customers/pending");
      if (response.ok) {
        const data = await response.json();
        setPendingCustomers(data);
      }
    } catch (error) {
      console.error("Error fetching pending customers:", error);
    } finally {
      setPendingLoading(false);
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

  const handleCustomerApproval = async (
    customerId: number,
    status: "approved" | "rejected",
  ) => {
    setApprovingCustomer(customerId);
    try {
      const response = await fetch(`/api/customers/${customerId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        // Remove from pending list
        setPendingCustomers((prev) => prev.filter((c) => c.id !== customerId));

        // Refresh stats
        fetchStats();

        toast({
          title: "Sucesso",
          description: `Cliente ${status === "approved" ? "aprovado" : "rejeitado"} com sucesso`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description:
            error.error || "Não foi possível atualizar o status do cliente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setApprovingCustomer(null);
    }
  };

  const getCustomerPassword = (whatsapp: string) => {
    const digits = whatsapp.replace(/\D/g, "");
    return digits.slice(-4);
  };

  const startEdit = (customer: Customer) => {
    setEditingCustomer(customer.email);
    setEditForm({
      name: customer.name,
      email: customer.email,
      whatsapp: customer.whatsapp,
      status: customer.status || "approved",
      newPassword: "",
      minimum_order: customer.minimum_order || 0,
    });
  };

  const cancelEdit = () => {
    setEditingCustomer(null);
    setEditForm({
      name: "",
      email: "",
      whatsapp: "",
      status: "approved",
      newPassword: "",
      minimum_order: 0,
    });
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

  const deleteCustomer = async (email: string) => {
    setDeletingCustomer(email);
    try {
      const response = await fetch(
        `/api/admin/customers/${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        },
      );

      if (response.ok) {
        setCustomers(customers.filter((customer) => customer.email !== email));
        toast({
          title: "Sucesso",
          description: "Cliente deletado com sucesso",
        });
        fetchStats();
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível deletar o cliente",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Erro",
        description: "Não foi possível deletar o cliente",
        variant: "destructive",
      });
    } finally {
      setDeletingCustomer(null);
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
        setAddForm({ email: "", name: "", whatsapp: "", minimum_order: 0 });
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
    setAddForm({ email: "", name: "", whatsapp: "", minimum_order: 0 });
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

  const getCustomerStatusBadge = (
    status: "pending" | "approved" | "rejected",
  ) => {
    const config = customerStatusConfig[status];
    const Icon = config.icon;

    const variants = {
      yellow: "secondary" as const,
      green: "default" as const,
      red: "destructive" as const,
    };

    return (
      <Badge
        variant={variants[config.color]}
        className="flex items-center gap-1"
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading && pendingLoading) {
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
            Gerencie a base de clientes e aprovações da loja
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                Aguardando Aprovação
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending_approvals || pendingCustomers.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Cadastros pendentes
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

      {/* Tabs for Customers and Pending Approvals */}
      <Tabs defaultValue="customers" className="space-y-4">
        <TabsList>
          <TabsTrigger value="customers" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clientes Aprovados
          </TabsTrigger>
          <TabsTrigger value="pending" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Aguardando Aprovação
            {pendingCustomers.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {pendingCustomers.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers">
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes Aprovados</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Pedidos</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Último Pedido</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((customer) => (
                    <TableRow key={customer.email}>
                      <TableCell>
                        {editingCustomer === customer.email ? (
                          <div className="space-y-2">
                            <Input
                              value={editForm.name}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  name: e.target.value,
                                })
                              }
                              placeholder="Nome"
                              className="h-8"
                            />
                            <Input
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  email: e.target.value,
                                })
                              }
                              placeholder="Email"
                              className="h-8"
                              type="email"
                            />
                          </div>
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
                          <div className="space-y-2">
                            <Input
                              value={editForm.whatsapp}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  whatsapp: e.target.value,
                                })
                              }
                              className="h-8"
                              placeholder="(11) 99999-9999"
                            />
                            <Input
                              value={editForm.newPassword}
                              onChange={(e) =>
                                setEditForm({
                                  ...editForm,
                                  newPassword: e.target.value,
                                })
                              }
                              className="h-8"
                              placeholder="Nova senha (opcional)"
                              type="password"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {customer.whatsapp}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingCustomer === customer.email ? (
                          <Select
                            value={editForm.status}
                            onValueChange={(
                              value: "pending" | "approved" | "rejected",
                            ) => setEditForm({ ...editForm, status: value })}
                          >
                            <SelectTrigger className="h-8 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="approved">
                                <div className="flex items-center gap-2">
                                  <Check className="h-3 w-3 text-green-600" />
                                  Aprovado
                                </div>
                              </SelectItem>
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3 text-yellow-600" />
                                  Pendente
                                </div>
                              </SelectItem>
                              <SelectItem value="rejected">
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-3 w-3 text-red-600" />
                                  Rejeitado
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          getCustomerStatusBadge(customer.status || "approved")
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {customer.total_orders}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.completed_orders} concluídos
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(customer.total_spent)}
                      </TableCell>
                      <TableCell>
                        {formatDate(customer.last_order_date)}
                      </TableCell>
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
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={
                                      deletingCustomer === customer.email
                                    }
                                  >
                                    {deletingCustomer === customer.email ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4 text-red-600" />
                                    )}
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Deletar Cliente
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja deletar o cliente{" "}
                                      {customer.name}? Esta ação não pode ser
                                      desfeita e todos os dados do cliente serão
                                      perdidos.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancelar
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        deleteCustomer(customer.email)
                                      }
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Deletar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
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
                                                      {order.item_count} item(s)
                                                      •{" "}
                                                      {formatDate(
                                                        order.created_at,
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="text-right">
                                                    <div className="font-medium">
                                                      {formatCurrency(
                                                        order.total_amount,
                                                      )}
                                                    </div>
                                                    <div className="text-sm">
                                                      {getStatusBadge(
                                                        order.status,
                                                      )}
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
                    Os clientes aprovados aparecerão aqui quando fizerem o
                    primeiro pedido.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Clientes Aguardando Aprovação</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analise e aprove novos cadastros de clientes
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Senha Padrão</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data do Cadastro</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.whatsapp}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          <code className="bg-muted px-2 py-1 rounded text-sm">
                            {getCustomerPassword(customer.whatsapp)}
                          </code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          4 últimos dígitos do celular
                        </p>
                      </TableCell>
                      <TableCell>
                        {getCustomerStatusBadge(customer.status)}
                      </TableCell>
                      <TableCell>{formatDate(customer.created_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={approvingCustomer === customer.id}
                              >
                                {approvingCustomer === customer.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                                Aprovar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Aprovar Cliente
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja aprovar o cliente{" "}
                                  {customer.name}? Após a aprovação, ele poderá
                                  fazer login e ver os preços.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleCustomerApproval(
                                      customer.id,
                                      "approved",
                                    )
                                  }
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Aprovar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={approvingCustomer === customer.id}
                              >
                                <XCircle className="h-4 w-4" />
                                Rejeitar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Rejeitar Cliente
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja rejeitar o cadastro de{" "}
                                  {customer.name}? Esta ação não poderá ser
                                  desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleCustomerApproval(
                                      customer.id,
                                      "rejected",
                                    )
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Rejeitar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {pendingCustomers.length === 0 && (
                <div className="text-center py-8">
                  <UserCheck className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold">
                    Nenhum cadastro pendente
                  </h3>
                  <p className="mt-2 text-muted-foreground">
                    Quando clientes se cadastrarem, eles aparecerão aqui para
                    aprovação.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
