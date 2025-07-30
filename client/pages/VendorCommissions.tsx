import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, TrendingUp, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function VendorCommissions() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Comissões</h1>
        <p className="text-muted-foreground">
          Informações sobre o sistema de comissões
        </p>
      </div>

      {/* Notification Card */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-orange-600" />
            <div>
              <CardTitle className="text-orange-900">Sistema de Comissões Removido</CardTitle>
              <CardDescription className="text-orange-700">
                O sistema de comissões foi removido da plataforma
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-orange-800">
            A partir de agora, o sistema de comissões não está mais ativo. 
            Os vendedores continuam tendo acesso a todas as outras funcionalidades da plataforma.
          </p>
          
          <div className="bg-white p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-orange-900 mb-2">Funcionalidades Disponíveis:</h3>
            <ul className="space-y-2 text-sm text-orange-800">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Dashboard com estatísticas de vendas
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Gestão de clientes atribuídos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Acompanhamento de pedidos
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Links de referência para novos clientes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                Relatórios de performance
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/vendor/customers')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meus Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">Gerenciar</div>
            <p className="text-xs text-muted-foreground">
              Visualizar e gerenciar clientes atribuídos
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate('/vendor/performance')}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">Relatórios</div>
            <p className="text-xs text-muted-foreground">
              Acompanhar métricas de performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/vendor')}
            >
              Voltar ao Dashboard
            </Button>
            <Button 
              onClick={() => navigate('/vendor/customers')}
            >
              Ver Meus Clientes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
