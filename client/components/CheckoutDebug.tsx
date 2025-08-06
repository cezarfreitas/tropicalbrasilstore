import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useGlobalStoreSettings } from "@/hooks/use-global-store-settings";

export function CheckoutDebug() {
  const { customer: authCustomer, isAuthenticated } = useCustomerAuth();
  const storeSettings = useGlobalStoreSettings();
  const [customerData, setCustomerData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkCustomerData = async () => {
    if (!authCustomer?.email) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/debug-database/customer/${encodeURIComponent(authCustomer.email)}`);
      const data = await response.json();
      setCustomerData(data);
    } catch (error) {
      console.error("Error checking customer data:", error);
    } finally {
      setLoading(false);
    }
  };

  const setCustomerMinimum = async (amount: number) => {
    if (!authCustomer?.email) return;

    setLoading(true);
    try {
      const response = await fetch("/api/set-customer-minimum", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: authCustomer.email,
          minimum_order: amount
        })
      });

      const data = await response.json();
      if (response.ok) {
        alert(`Pedido mínimo definido para R$ ${amount.toFixed(2)}`);
        // Refresh customer data
        await checkCustomerData();
        // Refresh page to update auth customer data
        window.location.reload();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && authCustomer?.email) {
      checkCustomerData();
    }
  }, [isAuthenticated, authCustomer?.email]);

  const minimumOrderValue = (authCustomer?.minimum_order && authCustomer.minimum_order > 0)
    ? authCustomer.minimum_order
    : (storeSettings?.minimum_order_value || 0);

  return (
    <Card className="mb-6 border-2 border-orange-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-orange-800">
          <span>🔍 Checkout Debug - Pedido Mínimo</span>
          <Button onClick={checkCustomerData} disabled={loading} size="sm">
            {loading ? "Carregando..." : "Atualizar"}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Auth Status:</strong> {isAuthenticated ? "Logado" : "Não logado"}
            </div>
            <div>
              <strong>Valor Mínimo Calculado:</strong> R$ {minimumOrderValue.toFixed(2)}
            </div>
          </div>

          <div>
            <strong>Cliente Auth:</strong>
            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs">
              {JSON.stringify({
                email: authCustomer?.email,
                name: authCustomer?.name,
                minimum_order: authCustomer?.minimum_order
              }, null, 2)}
            </pre>
          </div>

          <div>
            <strong>Store Settings:</strong>
            <pre className="mt-1 p-2 bg-gray-50 rounded text-xs">
              {JSON.stringify({
                minimum_order_value: storeSettings?.minimum_order_value,
                store_name: storeSettings?.store_name
              }, null, 2)}
            </pre>
          </div>

          {customerData && (
            <div>
              <strong>Dados Diretos do Banco:</strong>
              <pre className="mt-1 p-2 bg-gray-50 rounded text-xs">
                {JSON.stringify(customerData, null, 2)}
              </pre>
            </div>
          )}

          <div className="p-2 bg-blue-50 rounded">
            <strong>Lógica de Cálculo:</strong>
            <ol className="mt-1 text-xs space-y-1">
              <li>1. Se customer.minimum_order existe e &gt; 0: usa valor do cliente</li>
              <li>2. Senão: usa storeSettings.minimum_order_value</li>
              <li>3. Cliente: {authCustomer?.minimum_order || "undefined"}</li>
              <li>4. Global: {storeSettings?.minimum_order_value || "undefined"}</li>
              <li>5. Resultado: R$ {minimumOrderValue.toFixed(2)}</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
