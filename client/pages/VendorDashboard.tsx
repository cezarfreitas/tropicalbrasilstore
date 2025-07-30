import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useVendorDashboard } from '@/hooks/use-vendor-dashboard';
import { useVendorAuth } from '@/hooks/use-vendor-auth';
import {
  ShoppingBag,
  Users,
  DollarSign,
  TrendingUp,
  Calendar,
  Eye,
  RefreshCw,
  Link as LinkIcon,
  Copy
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function VendorDashboard() {
  const { vendor } = useVendorAuth();
  const { stats, loading, fetchStats, fetchOrders, fetchMonthlyCommissions } = useVendorDashboard();
  const { toast } = useToast();
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    monthlyReferrals: 0
  });
  const [loadingReferrals, setLoadingReferrals] = useState(true);

  useEffect(() => {
    loadRecentOrders();
    loadMonthlyCommissions();
    loadReferralStats();
  }, []);

  const loadRecentOrders = async () => {
    setLoadingOrders(true);
    const data = await fetchOrders(1, 5);
    if (data) {
      setRecentOrders(data.orders);
    }
    setLoadingOrders(false);
  };

  const loadMonthlyCommissions = async () => {
    const data = await fetchMonthlyCommissions();
    if (data) {
      setMonthlyData(data);
    }
  };

  const loadReferralStats = async () => {
    try {
      const response = await fetch(`/api/vendor/referral/stats/${vendor?.id}`);
      if (response.ok) {
        const data = await response.json();
        setReferralStats(data);
      }
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoadingReferrals(false);
    }
  };

  const handleRefresh = async () => {
    await fetchStats();
    await loadRecentOrders();
    await loadMonthlyCommissions();
    await loadReferralStats();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/cadastro/vendedor/${vendor?.id}`;

    // Função para fallback com textarea
    const fallbackCopy = () => {
      const textArea = document.createElement('textarea');
      textArea.value = link;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
          toast({
            title: "Link copiado!",
            description: "Link de referência copiado para a área de transferência.",
          });
        } else {
          throw new Error('document.execCommand falhou');
        }
      } catch (err) {
        document.body.removeChild(textArea);
        throw err;
      }
    };

    // Tentar Clipboard API primeiro, mas com fallback imediato se falhar
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(link)
        .then(() => {
          toast({
            title: "Link copiado!",
            description: "Link de referência copiado para a área de transferência.",
          });
        })
        .catch(() => {
          // Se Clipboard API falhar por qualquer motivo, usar fallback
          try {
            fallbackCopy();
          } catch (error) {
            console.error('Erro ao copiar link:', error);
            toast({
              title: "Erro ao copiar",
              description: "Não foi possível copiar o link. Tente selecionar e copiar manualmente.",
              variant: "destructive",
            });
          }
        });
    } else {
      // Se Clipboard API não estiver disponível, usar fallback diretamente
      try {
        fallbackCopy();
      } catch (error) {
        console.error('Erro ao copiar link:', error);
        toast({
          title: "Erro ao copiar",
          description: "Não foi possível copiar o link. Tente selecionar e copiar manualmente.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'Pendente', variant: 'secondary' as const },
      processing: { label: 'Processando', variant: 'default' as const },
      shipped: { label: 'Enviado', variant: 'outline' as const },
      completed: { label: 'Concluído', variant: 'default' as const },
      cancelled: { label: 'Cancelado', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] ||
      { label: status, variant: 'secondary' as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Bem-vindo de volta, {vendor?.name}!
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? '...' : stats?.todayOrders || 0} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalCustomers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              clientes atribuídos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Totais</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : formatCurrency(stats?.totalSales || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              volume total de vendas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? '...' : stats?.totalOrders || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              pedidos processados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Indicações</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loadingReferrals ? '...' : referralStats.totalReferrals}
            </div>
            <p className="text-xs text-muted-foreground">
              {loadingReferrals ? '...' : referralStats.monthlyReferrals} este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Link Referência</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Ativo</div>
            <p className="text-xs text-muted-foreground">
              <Link to="/vendor/profile" className="text-primary hover:underline">
                Ver no perfil
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <LinkIcon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-900">Link de Referência</CardTitle>
              <CardDescription className="text-blue-700">
                Compartilhe este link para que clientes se cadastrem automaticamente como seus
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={`${window.location.origin}/cadastro/vendedor/${vendor?.id}`}
              readOnly
              className="font-mono text-sm bg-white"
            />
            <Button onClick={copyReferralLink} size="icon" className="shrink-0">
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Total de Indicações</span>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {loadingReferrals ? '...' : referralStats.totalReferrals}
              </p>
            </div>

            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Este Mês</span>
              </div>
              <p className="text-xl font-bold text-blue-800">
                {loadingReferrals ? '...' : referralStats.monthlyReferrals}
              </p>
            </div>
          </div>

          <div className="text-sm text-blue-700 bg-white p-3 rounded-lg border border-blue-200">
            <p className="font-medium mb-1">💡 Como funciona:</p>
            <ul className="space-y-1 text-xs">
              <li>• Clientes que se cadastrarem através deste link serão automaticamente atribuídos a você</li>
              <li>• O cadastro será aprovado automaticamente</li>
              <li>• Você pode acompanhar suas indicações na seção "Clientes"</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pedidos Recentes</CardTitle>
                <CardDescription>
                  Últimos 5 pedidos atribuídos a você
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/vendor/orders">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver todos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingOrders ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando pedidos...
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum pedido encontrado
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        Pedido #{order.id}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer_name} • {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <p className="text-sm font-medium">
                        {formatCurrency(order.total_amount)}
                      </p>
                      {getStatusBadge(order.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Commissions */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Vendas Mensais</CardTitle>
                <CardDescription>
                  Últimos 6 meses
                </CardDescription>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link to="/vendor/orders">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Ver pedidos
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma venda encontrada
              </div>
            ) : (
              <div className="space-y-4">
                {monthlyData.slice(0, 6).map((month) => (
                  <div key={month.month} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {new Date(month.month + '-01').toLocaleDateString('pt-BR', {
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatCurrency(month.total_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        em vendas
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações da Conta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">

            <div>
              <p className="text-sm font-medium text-muted-foreground">Email</p>
              <p className="text-sm">{vendor?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="default">Ativo</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
