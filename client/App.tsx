import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AdminLayout } from "./components/AdminLayout";
import Dashboard from "./pages/Dashboard";
import ProductsEnhanced from "./pages/ProductsEnhanced";
import Categories from "./pages/Categories";
import Sizes from "./pages/Sizes";
import Colors from "./pages/Colors";
import GradesRedesigned from "./pages/GradesRedesigned";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <AdminLayout>
                <Dashboard />
              </AdminLayout>
            }
          />
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
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
