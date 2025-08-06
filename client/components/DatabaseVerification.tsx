import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

interface DatabaseInfo {
  database: string;
  total_customers: number;
  recent_customers: Array<{
    email: string;
    name: string;
    minimum_order: number;
    created_at: string;
  }>;
}

export function DatabaseVerification() {
  const [dbInfo, setDbInfo] = useState<DatabaseInfo | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchDatabaseInfo = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/debug-database/verify");
      const data = await response.json();
      setDbInfo(data);
    } catch (error) {
      console.error("Error fetching database info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const checkSpecificCustomer = async () => {
    try {
      const response = await fetch("/api/debug-database/customer/cezarfreitas2011@gmail.com");
      const data = await response.json();
      alert(`Cliente encontrado: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      alert("Cliente não encontrado ou erro na consulta");
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🔍 Verificação do Banco de Dados</span>
          <Button onClick={fetchDatabaseInfo} disabled={loading} size="sm">
            {loading ? "Carregando..." : "Atualizar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {dbInfo ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <strong>Banco Atual:</strong> {dbInfo.database}
              </div>
              <div>
                <strong>Total de Clientes:</strong> {dbInfo.total_customers}
              </div>
            </div>
            
            <div>
              <strong>Últimos 10 Clientes:</strong>
              <div className="mt-2 space-y-1 text-sm">
                {dbInfo.recent_customers.map((customer, index) => (
                  <div key={index} className="p-2 bg-gray-50 rounded">
                    <strong>{customer.name}</strong> ({customer.email})
                    <br />
                    Pedido Mínimo: R$ {customer.minimum_order || 0}
                    <br />
                    Criado: {new Date(customer.created_at).toLocaleString('pt-BR')}
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={checkSpecificCustomer} variant="outline" size="sm">
              Verificar cezarfreitas2011@gmail.com
            </Button>
          </div>
        ) : (
          <div>Carregando informações do banco...</div>
        )}
      </CardContent>
    </Card>
  );
}
