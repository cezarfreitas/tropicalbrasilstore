import { useState, useEffect } from 'react';

interface DashboardStats {
  totalOrders: number;
  todayOrders: number;
  totalCustomers: number;
  totalCommissions: number;
  monthCommissions: number;
  totalSales: number;
}

interface Order {
  id: number;
  customer_name: string;
  customer_email: string;
  total: number;
  status: string;
  created_at: string;
  commission_amount?: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

interface Commission {
  id: number;
  order_id: number;
  commission_amount: number;
  commission_percentage: number;
  order_total: number;
  customer_name: string;
  created_at: string;
}

interface MonthlyCommission {
  month: string;
  total_commissions: number;
  total_amount: number;
}

export function useVendorDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = () => localStorage.getItem('vendor_token');

  const fetchStats = async () => {
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendor/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async (page = 1, limit = 20, status = 'all') => {
    try {
      const token = getToken();
      if (!token) return null;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status
      });

      const response = await fetch(`/api/vendor/dashboard/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      return null;
    }
  };

  const fetchCustomers = async (page = 1, limit = 20, search = '') => {
    try {
      const token = getToken();
      if (!token) return null;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search
      });

      const response = await fetch(`/api/vendor/dashboard/customers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return null;
    }
  };

  const fetchCommissions = async (page = 1, limit = 20, month?: string) => {
    try {
      const token = getToken();
      if (!token) return null;

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (month) {
        params.append('month', month);
      }

      const response = await fetch(`/api/vendor/dashboard/commissions?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar comissões:', error);
      return null;
    }
  };

  const fetchMonthlyCommissions = async () => {
    try {
      const token = getToken();
      if (!token) return null;

      const response = await fetch('/api/vendor/dashboard/commissions/monthly', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.monthlyCommissions;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar comissões mensais:', error);
      return null;
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    fetchStats,
    fetchOrders,
    fetchCustomers,
    fetchCommissions,
    fetchMonthlyCommissions
  };
}
