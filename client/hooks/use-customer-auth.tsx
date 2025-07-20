import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface Customer {
  id: number;
  name: string;
  email: string;
  whatsapp: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface CustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (name: string, email: string, whatsapp: string) => Promise<{ success: boolean; message: string }>;
  loading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

const CUSTOMER_AUTH_KEY = "chinelos_customer_auth";

interface CustomerAuthProviderProps {
  children: ReactNode;
}

export function CustomerAuthProvider({ children }: CustomerAuthProviderProps) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = customer !== null;
  const isApproved = customer?.status === 'approved';

  // Check if customer is already authenticated on mount
  useEffect(() => {
    const savedCustomer = localStorage.getItem(CUSTOMER_AUTH_KEY);
    if (savedCustomer) {
      try {
        const customerData = JSON.parse(savedCustomer);
        setCustomer(customerData);
      } catch (e) {
        localStorage.removeItem(CUSTOMER_AUTH_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
        localStorage.setItem(CUSTOMER_AUTH_KEY, JSON.stringify(customerData));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const register = async (name: string, email: string, whatsapp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await fetch("/api/customers/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, whatsapp }),
      });

      const result = await response.json();
      
      if (response.ok) {
        return { success: true, message: "Cadastro realizado! Aguarde aprovação do administrador." };
      } else {
        return { success: false, message: result.error || "Erro ao realizar cadastro." };
      }
    } catch (error) {
      console.error("Register error:", error);
      return { success: false, message: "Erro de conexão. Tente novamente." };
    }
  };

  const logout = () => {
    setCustomer(null);
    localStorage.removeItem(CUSTOMER_AUTH_KEY);
  };

  return (
    <CustomerAuthContext.Provider value={{ 
      customer, 
      isAuthenticated, 
      isApproved, 
      login, 
      logout, 
      register, 
      loading 
    }}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return context;
}
