import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Users, Check, X, Clock, Phone, Mail, User } from "lucide-react";

interface Customer {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function CustomerApproval() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/customers");
      if (response.ok) {
        const data = await response.json();
        setCustomers(data);
      } else {
        toast({
          title: "Erro",
          description: "Falha ao carregar clientes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCustomerStatus = async (customerId: number, status: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/customers/${customerId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Cliente ${status === 'approved' ? 'aprovado' : 'rejeitado'} com sucesso!`,
        });
        fetchCustomers(); // Reload the list
      } else {
        toast({
          title: "Erro",
          description: "Falha ao atualizar status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Erro",
        description: "Erro de conexão",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="h-3 w-3 mr-1" />Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="h-3 w-3 mr-1" />Rejeitado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatWhatsApp = (whatsapp: string) => {
    if (whatsapp.length === 11) {
      return `(${whatsapp.slice(0, 2)}) ${whatsapp.slice(2, 7)}-${whatsapp.slice(7)}`;
    }
    return whatsapp;
  };

  const getPassword = (whatsapp: string) => {
    return whatsapp.slice(-4);
  };

  const pendingCustomers = customers.filter(c => c.status === 'pending');
  const processedCustomers = customers.filter(c => c.status !== 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Carregando clientes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="h-8 w-8" />
          Aprovação de Clientes
        </h1>
        <p className="text-muted-foreground">
          Gerencie solicitações de cadastro de clientes
        </p>
      </div>

      {/* Pending Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Aguardando Aprovação ({pendingCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente aguardando aprovação
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Senha</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {customer.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {formatWhatsApp(customer.whatsapp)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {getPassword(customer.whatsapp)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50">
                                <Check className="h-3 w-3 mr-1" />
                                Aprovar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Aprovar Cliente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja aprovar o cliente <strong>{customer.name}</strong>?
                                  <br /><br />
                                  O cliente poderá fazer login com:
                                  <br />• Email: {customer.email}
                                  <br />• Senha: {getPassword(customer.whatsapp)}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => updateCustomerStatus(customer.id, 'approved')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  Aprovar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
                                <X className="h-3 w-3 mr-1" />
                                Rejeitar
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Rejeitar Cliente</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja rejeitar o cliente <strong>{customer.name}</strong>?
                                  Esta ação pode ser revertida posteriormente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => updateCustomerStatus(customer.id, 'rejected')}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processed Customers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Clientes Processados ({processedCustomers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {processedCustomers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum cliente processado
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Contato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedCustomers.map((customer) => (
                    <TableRow key={customer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-muted-foreground">ID: {customer.id}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3" />
                            {formatWhatsApp(customer.whatsapp)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.status)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(customer.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {customer.status === 'rejected' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateCustomerStatus(customer.id, 'approved')}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              <Check className="h-3 w-3 mr-1" />
                              Aprovar
                            </Button>
                          )}
                          {customer.status === 'approved' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => updateCustomerStatus(customer.id, 'rejected')}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              <X className="h-3 w-3 mr-1" />
                              Rejeitar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
