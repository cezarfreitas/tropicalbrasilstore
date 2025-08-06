import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useGlobalStoreSettings } from '@/hooks/use-global-store-settings';

export const DebugMinimumOrder: React.FC = () => {
  const { customer, isAuthenticated } = useCustomerAuth();
  const storeSettings = useGlobalStoreSettings();
  const [customerData, setCustomerData] = useState<any>(null);

  useEffect(() => {
    if (customer?.email) {
      // Buscar dados completos do cliente via API
      fetch(`/api/admin/customers/${encodeURIComponent(customer.email)}`)
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error(`HTTP ${res.status}`);
        })
        .then(data => setCustomerData(data))
        .catch(err => console.error('Erro ao buscar dados do cliente:', err));
    }
  }, [customer]);

  if (!isAuthenticated) {
    return null;
  }

  const customerMinimum = customer?.minimum_order || 0;
  const globalMinimum = storeSettings?.minimum_order_value || 0;
  const effectiveMinimum = customerMinimum > 0 ? customerMinimum : globalMinimum;

  return (
    <div className="fixed bottom-4 right-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-4 max-w-sm shadow-lg z-50">
      <h4 className="font-bold text-yellow-800 mb-2">🔍 Debug: Pedido Mínimo</h4>
      
      <div className="text-sm space-y-1">
        <div>
          <strong>📧 Cliente:</strong> {customer.email}
        </div>
        
        <div>
          <strong>💰 Pedido Mínimo (Cliente):</strong> 
          <span className={customerMinimum > 0 ? 'text-green-600 font-bold' : 'text-gray-500'}>
            R$ {customerMinimum.toFixed(2).replace('.', ',')}
          </span>
        </div>
        
        <div>
          <strong>🌐 Pedido Mínimo (Global):</strong> 
          <span className={globalMinimum > 0 ? 'text-blue-600' : 'text-gray-500'}>
            R$ {globalMinimum.toFixed(2).replace('.', ',')}
          </span>
        </div>
        
        <div className="border-t pt-2 mt-2">
          <strong>✅ Valor Efetivo:</strong>
          <span className={effectiveMinimum > 0 ? 'text-red-600 font-bold' : 'text-gray-500'}>
            R$ {effectiveMinimum.toFixed(2).replace('.', ',')}
          </span>
        </div>

        {effectiveMinimum === 0 && (
          <div className="text-gray-600 text-xs mt-2">
            ℹ️ Sem pedido mínimo configurado
          </div>
        )}

        {customerData && (
          <div className="text-xs text-gray-600 mt-2">
            📊 Dados da API: {JSON.stringify({
              minimum_order: customerData.minimum_order,
              total_orders: customerData.total_orders,
              total_spent: customerData.total_spent
            }, null, 2)}
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugMinimumOrder;
