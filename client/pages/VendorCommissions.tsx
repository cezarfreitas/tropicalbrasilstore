import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useVendorDashboard } from '@/hooks/use-vendor-dashboard';
import { useVendorAuth } from '@/hooks/use-vendor-auth';
import { DollarSign, TrendingUp, Calendar, RefreshCw } from 'lucide-react';

export default function VendorCommissions() {
  const { vendor } = useVendorAuth();
  const { fetchCommissions, fetchMonthlyCommissions } = useVendorDashboard();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState('all');

  useEffect(() => {
    loadCommissions();
    loadMonthlyData();
  }, [page, selectedMonth]);

  const loadCommissions = async () => {
    setLoading(true);
    const data = await fetchCommissions(page, 20, selectedMonth === 'all' ? undefined : selectedMonth);
    if (data) {
      setCommissions(data.commissions);
      setTotalPages(data.pagination.pages);
    }
    setLoading(false);
  };

  const loadMonthlyData = async () => {
    const data = await fetchMonthlyCommissions();
    if (data) {
      setMonthlyData(data);
    }
  };

  const handleRefresh = () => {
    setPage(1);
    loadCommissions();
    loadMonthlyData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
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

  const formatMonth = (monthString: string) => {
    return new Date(monthString + '-01').toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getMonthOptions = () => {
    const months = [];
    const currentDate = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthValue = date.toISOString().slice(0, 7); // YYYY-MM format
      const monthLabel = date.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric'
      });
      months.push({ value: monthValue, label: monthLabel });
    }
    
    return months;
  };

  const totalCommissions = monthlyData.reduce((sum, month) => sum + month.total_amount, 0);
  const currentMonth = monthlyData.find(m => 
    m.month === new Date().toISOString().slice(0, 7)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Comissões</h1>
          <p className="text-muted-foreground">
            Acompanhe seus ganhos e comissões
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Acumulado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalCommissions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Todas as comissões
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Este Mês</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(currentMonth?.total_amount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {currentMonth?.total_commissions || 0} comissão(ões)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Percentual</CardTitle>
            <Badge variant="outline">{vendor?.commission_percentage}%</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vendor?.commission_percentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Comissão por venda
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Mensal</CardTitle>
          <CardDescription>
            Comissões dos últimos 12 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma comissão registrada
            </div>
          ) : (
            <div className="space-y-3">
              {monthlyData.slice(0, 6).map((month) => (
                <div key={month.month} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatMonth(month.month)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatCurrency(month.total_amount)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {month.total_commissions} comissão(ões)
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Commissions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detalhes das Comissões</CardTitle>
              <CardDescription>
                Histórico detalhado das suas comissões
              </CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por mês" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos os meses</SelectItem>
                {getMonthOptions().map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando comissões...</p>
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {selectedMonth ? 'Nenhuma comissão encontrada para este mês' : 'Nenhuma comissão registrada'}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Valor do Pedido</TableHead>
                      <TableHead>Percentual</TableHead>
                      <TableHead>Comissão</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions.map((commission) => (
                      <TableRow key={commission.id}>
                        <TableCell className="font-medium">
                          #{commission.order_id}
                        </TableCell>
                        <TableCell>
                          {commission.customer_name}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(commission.order_total)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {commission.commission_percentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-green-600 font-medium">
                            {formatCurrency(commission.commission_amount)}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(commission.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {page} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Próxima
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
