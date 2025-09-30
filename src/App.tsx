import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import Login from "@/pages/Login";
import { Dashboard } from "@/pages/dashboard";
import React, { Suspense } from "react";
import Users from "./pages/dashboard/Users";
import Vehicles from "./pages/dashboard/Vehicles";
// Lazy load the Tracking component to prevent potential module conflicts
const Tracking = React.lazy(() => import("./pages/dashboard/Tracking"));
import NotFound from "./pages/NotFound";
import Reports from "./pages/dashboard/Reports";
import { Companies } from "./pages/dashboard/Companies";
import { ReceiptsReport } from "./pages/dashboard/ReceiptsReport";


const queryClient = new QueryClient();

// Route wrapper component to handle initial redirect
const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Carregando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
        } 
      />
      <Route 
        path="/login" 
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Dashboard />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/usuarios" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Users />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/veiculos" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Vehicles />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/rastreamento" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
                <Tracking />
              </Suspense>
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/relatorios" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Reports />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/empresas" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <Companies />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard/receipts-report" 
        element={
          <ProtectedRoute>
            <DashboardLayout>
              <ReceiptsReport />
            </DashboardLayout>
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
