import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ToastProvider } from './components/common/Toast';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { PageLoader } from './components/common/LoadingSpinner';
import { useAuth } from './hooks/useAuth';
import { PWAInstallPrompt } from './components/common/PWAInstallPrompt';

import Login from './pages/Login';
import Register from './pages/Register';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Expenses from './pages/Expenses';
import Management from './pages/Management';
import Debts from './pages/Debts';
import Settings from './pages/Settings';

function getDefaultRoute(user) {
  if (!user) return '/login';
  if (!user.settings?.onboardingComplete) return '/onboarding';
  return '/dashboard';
}

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoader />;
  }

  const defaultRoute = getDefaultRoute(user);

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={defaultRoute} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to={defaultRoute} replace /> : <Register />}
        />

        <Route
          path="/onboarding"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <Onboarding />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/expenses"
          element={
            <ProtectedRoute>
              <Expenses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/management"
          element={
            <ProtectedRoute>
              <Management />
            </ProtectedRoute>
          }
        />
        <Route
          path="/debts"
          element={
            <ProtectedRoute>
              <Debts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to={defaultRoute} replace />} />
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
      <PWAInstallPrompt />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <FinanceProvider>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </FinanceProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
