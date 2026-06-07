import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageLoader } from '@/components/common/LoadingSpinner';

export const ProtectedRoute = ({ children, requireOnboarding = true }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const onboardingComplete = user.settings?.onboardingComplete === true;

  if (requireOnboarding && !onboardingComplete && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  if (!requireOnboarding && onboardingComplete && location.pathname === '/onboarding') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
