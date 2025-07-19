import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import { CartProvider } from "./hooks/use-cart";
import Dashboard from "./pages/Dashboard";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import Categories from "./pages/Categories";
import Sizes from "./pages/Sizes";
import Colors from "./pages/Colors";
import GradesRedesigned from "./pages/GradesRedesigned";
import Store from "./pages/Store";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
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

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <AdminLayout>
                  <Dashboard />
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
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
