import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  companyOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false, companyOnly = false }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    // If not logged in, redirect to general signin page
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Admin-only protection
  if (adminOnly && user.userType !== 'admin') {
    return <Navigate to="/" replace />; // Redirect non-admins away from admin routes
  }

  // Company-only protection
  if (companyOnly && user.userType !== 'company') {
    return <Navigate to="/dashboard" replace />; // Redirect non-companies away from company dashboard
  }

  // Redirect regular users from admin login if they somehow get there
  if (location.pathname.startsWith('/admin') && user.userType !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Redirect to appropriate dashboard if trying to access general dashboard route
  if (location.pathname === '/dashboard') {
    if (user.userType === 'company') {
      return <Navigate to="/company-dashboard" replace />;
    }
    // If user is customer, stay on /dashboard
  }

  return <>{children}</>;
}
