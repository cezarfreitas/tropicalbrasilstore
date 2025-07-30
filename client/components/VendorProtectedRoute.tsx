import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useVendorAuth } from '@/hooks/use-vendor-auth';
import { Loader2 } from 'lucide-react';

interface VendorProtectedRouteProps {
  children: React.ReactNode;
}

export function VendorProtectedRoute({ children }: VendorProtectedRouteProps) {
  const { vendor, loading } = useVendorAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    // Redirecionar para login mantendo a página de destino
    return <Navigate to="/vendor/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
