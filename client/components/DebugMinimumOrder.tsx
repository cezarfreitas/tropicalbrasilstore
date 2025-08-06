import React, { useState, useEffect } from "react";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";
import { Button } from "@/components/ui/button";

export const DebugMinimumOrder: React.FC = () => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const storeSettings = useGlobalStoreSettings();
  const [customerData, setCustomerData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Helper function to safely format currency
  const formatCurrency = (value: any): string => {
    const num = Number(value) || 0;
    return `R$ ${num.toFixed(2).replace(".", ",")}`;
  };

  const setTestMinimumOrder = async (amount: number) => {
    if (!customer?.email) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/debug-minimum-order/set-test-minimum/${encodeURIComponent(customer.email)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ minimumOrder: amount }),
        },
      );

      const result = await response.json();
      if (result.success) {
        alert(`✅ ${result.message}`);
        // Recarregar a página para ver a mudança
        window.location.reload();
      } else {
        alert(`❌ Erro: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Erro: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customer?.email) {
      // Buscar dados completos do cliente via API
      fetch(`/api/admin/customers/${encodeURIComponent(customer.email)}`)
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          throw new Error(`HTTP ${res.status}`);
        })
        .then((data) => setCustomerData(data))
        .catch((err) => console.error("Erro ao buscar dados do cliente:", err));
    }
  }, [customer]);

  // Mostrar sempre para debug (remover depois)
  if (!isAuthenticated) {
    return (
      <div className="fixed bottom-4 right-4 bg-red-100 border-2 border-red-400 rounded-lg p-4 max-w-sm shadow-lg z-50">
        <h4 className="font-bold text-red-800 mb-2">
          🔍 Debug: Usuário não logado
        </h4>
        <p className="text-sm text-red-700">
          Faça login para ver as configurações de pedido mínimo
        </p>
      </div>
    );
  }

  const customerMinimum = Number(customer?.minimum_order) || 0;
  const globalMinimum = Number(storeSettings?.minimum_order_value) || 0;
  const effectiveMinimum =
    customerMinimum > 0 ? customerMinimum : globalMinimum;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <h4 className="font-bold text-yellow-800 mb-2">
        🔍 Debug: Pedido Mínimo
      </h4>

      <div className="text-sm space-y-1">
        <div>
          <strong>📧 Cliente:</strong> {customer.email}
        </div>

        <div>
          <strong>💰 Pedido Mínimo (Cliente):</strong>
          <span
            className={
              customerMinimum > 0 ? "text-green-600 font-bold" : "text-gray-500"
            }
          >
            {formatCurrency(customerMinimum)}
          </span>
        </div>

        <div>
          <strong>🌐 Pedido Mínimo (Global):</strong>
          <span
            className={globalMinimum > 0 ? "text-blue-600" : "text-gray-500"}
          >
            {formatCurrency(globalMinimum)}
          </span>
        </div>

        <div className="border-t pt-2 mt-2">
          <strong>✅ Valor Efetivo:</strong>
          <span
            className={
              effectiveMinimum > 0 ? "text-red-600 font-bold" : "text-gray-500"
            }
          >
            {formatCurrency(effectiveMinimum)}
          </span>
        </div>

        {effectiveMinimum === 0 && (
          <div className="text-gray-600 text-xs mt-2">
            ℹ️ Sem pedido mínimo configurado
          </div>
        )}

        {customerData && (
          <div className="text-xs text-gray-600 mt-2">
            📊 Dados da API:{" "}
            {JSON.stringify(
              {
                minimum_order: customerData.minimum_order,
                total_orders: customerData.total_orders,
                total_spent: customerData.total_spent,
              },
              null,
              2,
            )}
          </div>
        )}

        {/* Botões de teste para configurar pedido mínimo */}
        {customer && (
          <div className="mt-3 border-t pt-3">
            <p className="text-xs font-semibold mb-2">🔧 Configurar Teste:</p>
            <div className="flex gap-1 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestMinimumOrder(50)}
                disabled={isLoading}
                className="text-xs h-6 px-2"
              >
                R$ 50
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestMinimumOrder(100)}
                disabled={isLoading}
                className="text-xs h-6 px-2"
              >
                R$ 100
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestMinimumOrder(200)}
                disabled={isLoading}
                className="text-xs h-6 px-2"
              >
                R$ 200
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setTestMinimumOrder(0)}
                disabled={isLoading}
                className="text-xs h-6 px-2"
              >
                Remover
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugMinimumOrder;
