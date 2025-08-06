import React from 'react';
import { ShoppingCart, Target, CheckCircle } from 'lucide-react';

interface MinimumOrderIndicatorProps {
  currentValue: number;
  minimumValue: number;
  currency?: string;
}

export const MinimumOrderIndicator: React.FC<MinimumOrderIndicatorProps> = ({
  currentValue,
  minimumValue,
  currency = 'R$'
}) => {
  // Debug logs
  console.log('MinimumOrderIndicator props:', { currentValue, minimumValue, currency });

  // Se não há pedido mínimo configurado, não exibe o componente
  if (minimumValue <= 0) {
    console.log('MinimumOrderIndicator: not showing because minimumValue <= 0');
    return null;
  }

  const progress = Math.min((currentValue / minimumValue) * 100, 100);
  const remaining = Math.max(minimumValue - currentValue, 0);
  const isCompleted = currentValue >= minimumValue;

  const formatPrice = (price: number) => {
    return `${currency} ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isCompleted ? (
            <CheckCircle className="h-5 w-5 text-green-600" />
          ) : (
            <Target className="h-5 w-5 text-blue-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {isCompleted ? 'Pedido mínimo atingido!' : 'Pedido mínimo'}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {formatPrice(currentValue)} / {formatPrice(minimumValue)}
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
