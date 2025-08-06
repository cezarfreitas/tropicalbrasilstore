import React from 'react';
import { ShoppingCart, Target, CheckCircle } from 'lucide-react';

interface MinimumOrderIndicatorProps {
  currentValue: number;
  customerMinimumValue?: number;
  globalMinimumValue?: number;
  currency?: string;
  theme?: 'default' | 'sidebar';
}

export const MinimumOrderIndicator: React.FC<MinimumOrderIndicatorProps> = ({
  currentValue,
  customerMinimumValue,
  globalMinimumValue,
  currency = 'R$',
  theme = 'default'
}) => {
  // Convert all values to numbers to ensure safe calculations
  const safeCurrentValue = Number(currentValue) || 0;
  const safeCustomerMinimum = Number(customerMinimumValue) || 0;
  const safeGlobalMinimum = Number(globalMinimumValue) || 0;

  // Usa o valor do cliente se existir e for maior que 0, senão usa o valor global
  const minimumValue = (safeCustomerMinimum > 0) ? safeCustomerMinimum : safeGlobalMinimum;


  // Se não há pedido mínimo configurado, não exibe o componente
  if (minimumValue <= 0) {
    return null;
  }

  const progress = Math.min((safeCurrentValue / minimumValue) * 100, 100);
  const remaining = Math.max(minimumValue - safeCurrentValue, 0);
  const isCompleted = safeCurrentValue >= minimumValue;

  const formatPrice = (price: any) => {
    const num = Number(price) || 0;
    return `${currency} ${num.toFixed(2).replace('.', ',')}`;
  };

  const containerClass = theme === 'sidebar'
    ? "bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 mb-2"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3 mb-3";

  return (
    <div className={containerClass}>
      {/* Valores em uma linha */}
      <div className={`text-xs mb-1 ${theme === 'sidebar' ? 'text-white/90' : 'text-gray-700'}`}>
        {formatPrice(safeCurrentValue)} / {formatPrice(minimumValue)}
      </div>

      {/* Barra de progresso ultra fina */}
      <div className={`w-full rounded-full h-1 mb-1 overflow-hidden ${theme === 'sidebar' ? 'bg-white/20' : 'bg-gray-200'}`}>
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            isCompleted
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Mensagem ultra compacta */}
      {!isCompleted && (
        <div className={`text-xs ${theme === 'sidebar' ? 'text-white/70' : 'text-gray-600'}`}>
          Faltam {formatPrice(remaining)}
        </div>
      )}
    </div>
  );
};

export default MinimumOrderIndicator;
