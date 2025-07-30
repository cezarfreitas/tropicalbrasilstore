import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Vendor {
  id: number;
  name: string;
  email: string;
  avatar_url?: string;

}

interface VendorAuthContextType {
  vendor: Vendor | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
  updateProfile: (data: Partial<Vendor>) => Promise<boolean>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
}

const VendorAuthContext = createContext<VendorAuthContextType | undefined>(undefined);

export function VendorAuthProvider({ children }: { children: ReactNode }) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('vendor_token');
  const setToken = (token: string) => localStorage.setItem('vendor_token', token);
  const removeToken = () => localStorage.removeItem('vendor_token');

  // Verificar se o vendedor está logado ao carregar a página
  useEffect(() => {
    const token = getToken();
    if (token) {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/vendor/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendor(data.vendor);
      } else {
        removeToken();
        setVendor(null);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      removeToken();
      setVendor(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/vendor/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        setToken(data.token);
        setVendor(data.vendor);
        return true;
      } else {
        console.error('Erro no login:', data.error);
        return false;
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const token = getToken();
      if (token) {
        await fetch('/api/vendor/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      removeToken();
      setVendor(null);
    }
  };

  const updateProfile = async (data: Partial<Vendor>): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) return false;

      const response = await fetch('/api/vendor/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        // Atualizar dados locais
        setVendor(prev => prev ? { ...prev, ...data } : null);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      return false;
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const token = getToken();
      if (!token) return false;

      const response = await fetch('/api/vendor/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return false;
    }
  };

  return (
    <VendorAuthContext.Provider value={{
      vendor,
      login,
      logout,
      loading,
      updateProfile,
      changePassword
    }}>
      {children}
    </VendorAuthContext.Provider>
  );
}

export function useVendorAuth() {
  const context = useContext(VendorAuthContext);
  if (context === undefined) {
    throw new Error('useVendorAuth must be used within a VendorAuthProvider');
  }
  return context;
}
