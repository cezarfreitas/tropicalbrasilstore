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
import Login from "./pages/Login";
import CustomerLogin from "./pages/CustomerLogin";
import CustomerRegister from "./pages/CustomerRegister";
import CustomerChangePassword from "./pages/CustomerChangePassword";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import ProductImport from "./pages/ProductImport";
import NotFound from "./pages/NotFound";
import { GlobalCartModal } from "./components/GlobalCartModal";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <CartProvider>
            <ThemeLoader />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <GlobalCartModal />
              <Routes>
                {/* Store Routes (Public) */}
                <Route path="/" element={<Store />} />
                <Route path="/loja" element={<Store />} />
                <Route path="/loja/produto/:id" element={<ProductDetail />} />
                <Route path="/loja/carrinho" element={<Cart />} />
                <Route path="/loja/checkout" element={<Checkout />} />

                {/* Customer Authentication Routes */}
                <Route path="/login" element={<CustomerLogin />} />
                <Route path="/cadastro" element={<CustomerRegister />} />
                <Route
                  path="/change-password"
                  element={<CustomerChangePassword />}
                />

                {/* Admin Login Route (Public) */}
                <Route path="/admin/login" element={<Login />} />

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
                  path="/admin/notifications"
                  element={
                    <AdminLayout>
                      <Notifications />
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
          </CartProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
