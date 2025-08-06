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
    ? "bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 mb-3"
    : "bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Target className="h-5 w-5 text-blue-600" />
          )}
          <span className={`text-sm font-medium ${theme === 'sidebar' ? 'text-white/90' : 'text-gray-700'}`}>
            {isCompleted ? 'Pedido mínimo atingido!' : 'Pedido mínimo'}
          </span>
        </div>
        <div className={`text-sm ${theme === 'sidebar' ? 'text-white/70' : 'text-gray-600'}`}>
          {formatPrice(safeCurrentValue)} / {formatPrice(minimumValue)}
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 mb-2 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              isCompleted 
                ? 'bg-gradient-to-r from-green-500 to-green-600' 
                : 'bg-gradient-to-r from-blue-500 to-indigo-600'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {/* Indicador de posição atual */}
        <div 
          className="absolute top-0 h-3 w-1 bg-white border border-gray-300 rounded-sm shadow-sm"
          style={{ left: `${Math.min(progress, 96)}%` }}
        />
      </div>

      {/* Mensagem de feedback */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1.5">
          <ShoppingCart className="h-4 w-4 text-gray-500" />
          {isCompleted ? (
            <span className="text-sm text-green-700 font-medium">
              Parabéns! Você pode finalizar seu pedido.
            </span>
          ) : (
            <span className="text-sm text-gray-600">
              Adicione mais <strong>{formatPrice(remaining)}</strong> para atingir o mínimo
            </span>
          )}
        </div>
        
        {!isCompleted && (
          <div className="text-xs text-gray-500">
            {Math.round(progress)}% completo
          </div>
        )}
      </div>
    </div>
  );
};

export default MinimumOrderIndicator;
