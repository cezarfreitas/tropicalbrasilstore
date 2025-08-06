import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { DynamicTitle } from "@/components/DynamicTitle";
import { TitleTest } from "@/components/TitleTest";

// TODO: Import all existing components and pages
// These would need to be moved from ../client/* to ./src/*

function App() {
  return (
    <>
      <DynamicTitle />
      <Routes>
        <Route path="/" element={<Navigate to="/loja" replace />} />
        <Route
          path="/loja"
          element={
            <div>
              <div>Store Page - TODO: Import from client/pages/Store.tsx</div>
              <TitleTest />
            </div>
          }
        />
        <Route
          path="/admin"
          element={
            <div>Admin Page - TODO: Import from client/pages/Dashboard.tsx</div>
          }
        />
        <Route
          path="/admin/*"
          element={<div>Admin Routes - TODO: Import all admin routes</div>}
        />
        <Route
          path="/vendor/*"
          element={<div>Vendor Routes - TODO: Import all vendor routes</div>}
        />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
        }}
      />
    </>
  );
}

export default App;
