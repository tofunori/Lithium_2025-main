import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  redirectPath?: string;
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  redirectPath = '/login',
  children,
}) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  // If still loading auth state, you could show a loading spinner
  if (loading) {
    return <div className="text-center p-5"><div className="spinner-border" role="status"></div></div>;
  }

  // If not authenticated, redirect to the login page
  // We keep the "from" path in state to redirect back after login
  if (!currentUser) {
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If there are children, render them, otherwise render the outlet for nested routes
  return <>{children ? children : <Outlet />}</>;
};

export default ProtectedRoute;