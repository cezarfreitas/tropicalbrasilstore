import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  Phone,
  User,
  Eye,
  UserPlus,
  UserMinus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Vendor {
  id: number;
  name: string;
  email: string;
  phone?: string;

  active: boolean;
  avatar_url?: string;
  bio?: string;
  notification_email: boolean;
  notification_whatsapp: boolean;
  created_at: string;
  total_orders: number;
  total_sales: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  total_orders: number;
  total_spent: number;
  last_order_date?: string;
  vendor_assigned_at?: string;
}

interface VendorStats {
  vendors: {
    total_vendors: number;
    active_vendors: number;
    inactive_vendors: number;
  };
  sales: {
    total_orders_with_vendors: number;
    total_sales_with_vendors: number;
  };
  customers: {
    total_customers: number;
    assigned_customers: number;
    unassigned_customers: number;
  };
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [unassignedCustomers, setUnassignedCustomers] = useState<Customer[]>([]);
  const [selectedVendorCustomers, setSelectedVendorCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Modal states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [customersDialogOpen, setCustomersDialogOpen] = useState(false);
  const [assignCustomerDialogOpen, setAssignCustomerDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [saving, setSaving] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    commission_percentage: 0,
    active: true,
    avatar_url: "",
    bio: "",
    notification_email: true,
    notification_whatsapp: true,
    password: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
    fetchStats();
    fetchUnassignedCustomers();
  }, [searchTerm, statusFilter]);

  const fetchVendors = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const response = await fetch(`/api/vendors?${params}`);
      if (response.ok) {
        const data = await response.json();
        setVendors(data.vendors);
      }
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os vendedores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/vendors/stats/overview");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchUnassignedCustomers = async () => {
    try {
      const response = await fetch("/api/vendors/unassigned/customers");
      if (response.ok) {
        const data = await response.json();
        setUnassignedCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error fetching unassigned customers:", error);
    }
  };

  const fetchVendorCustomers = async (vendorId: number) => {
    try {
      const response = await fetch(`/api/vendors/${vendorId}/customers`);
      if (response.ok) {
        const data = await response.json();
        setSelectedVendorCustomers(data.customers);
      }
    } catch (error) {
      console.error("Error fetching vendor customers:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingVendor
        ? `/api/vendors/${editingVendor.id}`
        : "/api/vendors";
      const method = editingVendor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: editingVendor
            ? "Vendedor atualizado com sucesso"
            : "Vendedor criado com sucesso",
        });
        setDialogOpen(false);
        fetchVendors();
        fetchStats();
        resetForm();
      } else {
        let errorMessage = "Erro ao salvar vendedor";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar vendedor",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      email: vendor.email,
      phone: vendor.phone || "",

      active: vendor.active,
      avatar_url: vendor.avatar_url || "",
      bio: vendor.bio || "",
      notification_email: vendor.notification_email,
      notification_whatsapp: vendor.notification_whatsapp,
      password: "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    if (!confirm(`Tem certeza que deseja excluir o vendedor ${vendor.name}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/vendors/${vendor.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Vendedor excluído com sucesso",
        });
        fetchVendors();
        fetchStats();
      } else {
        let errorMessage = "Erro na operação";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao excluir vendedor",
        variant: "destructive",
      });
    }
  };

  const handleViewCustomers = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    fetchVendorCustomers(vendor.id);
    setCustomersDialogOpen(true);
  };

  const handleAssignCustomer = async (customerId: number) => {
    if (!selectedVendor) return;

    try {
      const response = await fetch(
        `/api/vendors/${selectedVendor.id}/customers/${customerId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assigned_by: "Admin" }),
        }
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cliente atribuído ao vendedor com sucesso",
        });
        fetchUnassignedCustomers();
        fetchVendorCustomers(selectedVendor.id);
        fetchStats();
        setAssignCustomerDialogOpen(false);
      } else {
        let errorMessage = "Erro na operação";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error assigning customer:", error);
      toast({
        title: "Erro",
        description: "Erro ao atribuir cliente",
        variant: "destructive",
      });
    }
  };

  const handleUnassignCustomer = async (customerId: number) => {
    if (!selectedVendor) return;

    try {
      const response = await fetch(
        `/api/vendors/${selectedVendor.id}/customers/${customerId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Cliente removido do vendedor com sucesso",
        });
        fetchUnassignedCustomers();
        fetchVendorCustomers(selectedVendor.id);
        fetchStats();
      } else {
        let errorMessage = "Erro na operação";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("Error unassigning customer:", error);
      toast({
        title: "Erro",
        description: "Erro ao remover cliente",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
  
      active: true,
      avatar_url: "",
      bio: "",
      notification_email: true,
      notification_whatsapp: true,
      password: "",
    });
    setEditingVendor(null);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Vendedores</h1>
          <p className="text-muted-foreground">
            Gerencie vendedores, comissões e atribuição de clientes
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Vendedor
        </Button>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vendedores Ativos
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.vendors.active_vendors}
              </div>
              <p className="text-xs text-muted-foreground">
                de {stats.vendors.total_vendors} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vendas com Vendedores
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.sales.total_sales_with_vendors)}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.sales.total_orders_with_vendors} pedidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Vendas com Vendedores
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.sales.total_sales_with_vendors)}
              </div>
              <p className="text-xs text-muted-foreground">
                Via vendedores
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Clientes Atribuídos
              </CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.customers.assigned_customers}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.customers.unassigned_customers} sem vendedor
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="vendors" className="space-y-4">
        <TabsList>
          <TabsTrigger value="vendors">Vendedores</TabsTrigger>
          <TabsTrigger value="unassigned">
            Clientes sem Vendedor ({unassignedCustomers.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vendors" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lista de Vendedores</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Buscar vendedores..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Comiss��o</TableHead>
                    <TableHead>Vendas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {vendor.avatar_url ? (
                              <img
                                src={vendor.avatar_url}
                                alt={vendor.name}
                                className="h-8 w-8 rounded-full"
                              />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                                <User className="h-4 w-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {vendor.bio && vendor.bio.substring(0, 50)}
                              {vendor.bio && vendor.bio.length > 50 && "..."}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {vendor.email}
                          </div>
                          {vendor.phone && (
                            <div className="flex items-center text-sm">
                              <Phone className="h-3 w-3 mr-1" />
                              {vendor.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>

                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(vendor.total_sales)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {vendor.total_orders} pedidos
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={vendor.active ? "default" : "secondary"}
                        >
                          {vendor.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCustomers(vendor)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(vendor)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(vendor)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unassigned" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Clientes sem Vendedor Atribuído</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Histórico</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {unassignedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{customer.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {customer.whatsapp}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">
                            {formatCurrency(customer.total_spent)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {customer.total_orders} pedidos
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedVendor(null);
                            setAssignCustomerDialogOpen(true);
                          }}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Atribuir Vendedor
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Criar/Editar Vendedor */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingVendor ? "Editar Vendedor" : "Novo Vendedor"}
            </DialogTitle>
            <DialogDescription>
              {editingVendor
                ? "Atualize as informações do vendedor"
                : "Adicione um novo vendedor ao sistema"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="commission">Comissão (%)</Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={formData.commission_percentage}
                  onChange={(e) =>
                    setFormData({ ...formData, commission_percentage: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>

            </div>

            <div>
              <Label htmlFor="bio">Biografia</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Breve descrição sobre o vendedor..."
              />
            </div>

            <div>
              <Label htmlFor="avatar">URL do Avatar</Label>
              <Input
                id="avatar"
                value={formData.avatar_url}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
                placeholder="https://exemplo.com/avatar.jpg"
              />
            </div>

            {!editingVendor && (
              <div>
                <Label htmlFor="password">Senha (opcional)</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  placeholder="Deixe vazio para não criar acesso"
                />
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, active: checked })
                  }
                />
                <Label htmlFor="active">Vendedor Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="email-notifications"
                  checked={formData.notification_email}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notification_email: checked })
                  }
                />
                <Label htmlFor="email-notifications">
                  Notificações por Email
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="whatsapp-notifications"
                  checked={formData.notification_whatsapp}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, notification_whatsapp: checked })
                  }
                />
                <Label htmlFor="whatsapp-notifications">
                  Notificações por WhatsApp
                </Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  resetForm();
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                {saving
                  ? "Salvando..."
                  : editingVendor
                    ? "Atualizar"
                    : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal de Clientes do Vendedor */}
      <Dialog open={customersDialogOpen} onOpenChange={setCustomersDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Clientes de {selectedVendor?.name}
            </DialogTitle>
            <DialogDescription>
              Clientes atribuídos a este vendedor
            </DialogDescription>
            <div className="flex justify-end">
              <Button
                onClick={() => setAssignCustomerDialogOpen(true)}
                size="sm"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Atribuir Cliente
              </Button>
            </div>
          </DialogHeader>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Histórico</TableHead>
                <TableHead>Atribuído em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedVendorCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm">{customer.email}</div>
                      <div className="text-sm text-muted-foreground">
                        {customer.whatsapp}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {formatCurrency(customer.total_spent)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {customer.total_orders} pedidos
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {customer.vendor_assigned_at &&
                        new Date(customer.vendor_assigned_at).toLocaleDateString(
                          "pt-BR"
                        )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUnassignCustomer(customer.id)}
                    >
                      <UserMinus className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DialogContent>
      </Dialog>

      {/* Modal de Atribuir Cliente */}
      <Dialog open={assignCustomerDialogOpen} onOpenChange={setAssignCustomerDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atribuir Cliente a Vendedor</DialogTitle>
            <DialogDescription>
              Selecione um vendedor para atribuir o cliente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Selecionar Vendedor</Label>
              <Select
                value={selectedVendor?.id.toString() || ""}
                onValueChange={(value) => {
                  const vendor = vendors.find(v => v.id.toString() === value);
                  setSelectedVendor(vendor || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha um vendedor..." />
                </SelectTrigger>
                <SelectContent>
                  {vendors.filter(v => v.active).map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id.toString()}>
                      {vendor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedVendor && (
              <div className="max-h-64 overflow-y-auto">
                <Label>Clientes Disponíveis</Label>
                <div className="space-y-2 mt-2">
                  {unassignedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {customer.email} �� {formatCurrency(customer.total_spent)}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleAssignCustomer(customer.id)}
                      >
                        Atribuir
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
