import "./global.css";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CartProvider } from "./hooks/use-cart";
import { AuthProvider } from "./hooks/use-auth";
import { CustomerAuthProvider } from "./hooks/use-customer-auth";
import { VendorAuthProvider } from "./hooks/use-vendor-auth";
import { ThemeLoader } from "./components/ThemeLoader";
import Dashboard from "./pages/Dashboard";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import ProductsWooCommerce from "./pages/ProductsWooCommerce";
import Categories from "./pages/Categories";
import Sizes from "./pages/Sizes";
import Colors from "./pages/Colors";
import Attributes from "./pages/Attributes";
import GradesRedesigned from "./pages/GradesRedesigned";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import ApiDocs from "./pages/ApiDocs";
import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerChangePassword from "./pages/CustomerChangePassword";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import CustomerOrders from "./pages/CustomerOrders";
import ProductImport from "./pages/ProductImport";
import GradeImport from "./pages/GradeImport";
import Vendors from "./pages/Vendors";
import VendorLogin from "./pages/VendorLogin";
import VendorDashboard from "./pages/VendorDashboard";
import VendorOrders from "./pages/VendorOrders";
import VendorCustomers from "./pages/VendorCustomers";
import VendorCommissions from "./pages/VendorCommissions";
import VendorProfile from "./pages/VendorProfile";
import VendorReferralRegister from "./pages/VendorReferralRegister";
import { VendorLayout } from "./components/VendorLayout";
import { VendorProtectedRoute } from "./components/VendorProtectedRoute";
import NotFound from "./pages/NotFound";
import { GlobalCartModal } from "./components/GlobalCartModal";

const queryClient = new QueryClient();

// Componente interno que usa os contexts
const AppContent = () => (
  <BrowserRouter>
    <GlobalCartModal />
    <Routes>
      {/* Store Routes (Public) */}
      <Route path="/" element={<Store />} />
      <Route path="/loja" element={<Store />} />
      <Route path="/loja/produto/:id" element={<ProductDetail />} />
      <Route path="/loja/carrinho" element={<Cart />} />
      <Route path="/loja/checkout" element={<Checkout />} />
      <Route path="/loja/pedidos" element={<CustomerOrders />} />

      {/* Customer Authentication Routes */}
      <Route path="/login" element={<CustomerLogin />} />
      <Route path="/cadastro" element={<CustomerRegister />} />
      <Route
        path="/cadastro/vendedor/:vendorId"
        element={<VendorReferralRegister />}
      />
      <Route path="/change-password" element={<CustomerChangePassword />} />

      {/* Admin Login Route (Public) */}
      <Route path="/admin/login" element={<Login />} />

      {/* Vendor Login Route (Public) */}
      <Route path="/vendor/login" element={<VendorLogin />} />

      {/* Vendor Routes (Protected) */}
      <Route
        path="/vendor"
        element={
          <VendorProtectedRoute>
            <VendorLayout>
              <VendorDashboard />
            </VendorLayout>
          </VendorProtectedRoute>
        }
      />
      <Route
        path="/vendor/orders"
        element={
          <VendorProtectedRoute>
            <VendorLayout>
              <VendorOrders />
            </VendorLayout>
          </VendorProtectedRoute>
        }
      />
      <Route
        path="/vendor/customers"
        element={
          <VendorProtectedRoute>
            <VendorLayout>
              <VendorCustomers />
            </VendorLayout>
          </VendorProtectedRoute>
        }
      />
      <Route
        path="/vendor/commissions"
        element={
          <VendorProtectedRoute>
            <VendorLayout>
              <VendorCommissions />
            </VendorLayout>
          </VendorProtectedRoute>
        }
      />
      <Route
        path="/vendor/profile"
        element={
          <VendorProtectedRoute>
            <VendorLayout>
              <VendorProfile />
            </VendorLayout>
          </VendorProtectedRoute>
        }
      />

      {/* Admin Routes (Protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Dashboard />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Orders />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/customers"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Customers />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProductsEnhanced />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products-v2"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProductsWooCommerce />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/products/import"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <ProductImport />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/categories"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Categories />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sizes"
        element={
          <AdminLayout>
            <Sizes />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/colors"
        element={
          <AdminLayout>
            <Colors />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/attributes"
        element={
          <AdminLayout>
            <Attributes />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/grades"
        element={
          <AdminLayout>
            <GradesRedesigned />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <AdminLayout>
            <Settings />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/vendors"
        element={
          <ProtectedRoute>
            <AdminLayout>
              <Vendors />
            </AdminLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notifications"
        element={
          <AdminLayout>
            <Notifications />
          </AdminLayout>
        }
      />
      <Route
        path="/admin/api"
        element={
          <AdminLayout>
            <ApiDocs />
          </AdminLayout>
        }
      />

      {/* Legacy admin routes (backward compatibility) */}
      <Route
        path="/products"
        element={
          <AdminLayout>
            <ProductsEnhanced />
          </AdminLayout>
        }
      />
      <Route
        path="/categories"
        element={
          <AdminLayout>
            <Categories />
          </AdminLayout>
        }
      />
      <Route
        path="/sizes"
        element={
          <AdminLayout>
            <Sizes />
          </AdminLayout>
        }
      />
      <Route
        path="/colors"
        element={
          <AdminLayout>
            <Colors />
          </AdminLayout>
        }
      />
      <Route
        path="/grades"
        element={
          <AdminLayout>
            <GradesRedesigned />
          </AdminLayout>
        }
      />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <VendorAuthProvider>
            <CartProvider>
              <ThemeLoader />
              <Toaster />
              <Sonner />
              <AppContent />
            </CartProvider>
          </VendorAuthProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

const rootElement = document.getElementById("root")!;

// Production-ready initialization
console.log("🚀 React App initializing...");

if (rootElement) {
  console.log("📦 Root element found, rendering React...");

  try {
    // Create and render React app
    const root = createRoot(rootElement);
    root.render(<App />);
    console.log("✅ React app rendered successfully");
  } catch (error) {
    console.error("❌ Failed to render React app:", error);
    // Fallback for production errors
    rootElement.innerHTML = `
      <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; border: 1px solid #ccc; border-radius: 8px;">
        <h1 style="color: #e74c3c;">⚠️ Erro na Aplicação</h1>
        <p>Ocorreu um erro ao carregar a aplicação. Por favor, tente recarregar a página.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;">
          🔄 Recarregar Página
        </button>
        <details style="margin-top: 20px; text-align: left;">
          <summary style="cursor: pointer;">Detalhes do erro (para desenvolvedores)</summary>
          <pre style="background: #f8f9fa; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error instanceof Error ? error.message : "Erro desconhecido"}</pre>
        </details>
      </div>
    `;
  }
} else {
  console.error("❌ Root element not found!");
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; font-family: Arial, sans-serif;">
      <h1 style="color: #e74c3c;">❌ Erro Crítico</h1>
      <p>Elemento root não encontrado. Verifique se o HTML contém &lt;div id="root"&gt;&lt;/div&gt;</p>
    </div>
  `;
}
