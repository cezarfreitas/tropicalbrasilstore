import "./global.css";

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
import Dashboard from "./pages/Dashboard";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import Categories from "./pages/Categories";
import Sizes from "./pages/Sizes";
import Colors from "./pages/Colors";
import GradesRedesigned from "./pages/GradesRedesigned";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import Login from "./pages/Login";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <Routes>
            {/* Store Routes (Public) */}
            <Route path="/" element={<Store />} />
            <Route path="/loja" element={<Store />} />
            <Route path="/loja/produto/:id" element={<ProductDetail />} />
            <Route path="/loja/carrinho" element={<Cart />} />
            <Route path="/loja/checkout" element={<Checkout />} />

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
                <AdminLayout>
                  <Customers />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/products"
              element={
                <AdminLayout>
                  <ProductsEnhanced />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <AdminLayout>
                  <Categories />
                </AdminLayout>
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
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
