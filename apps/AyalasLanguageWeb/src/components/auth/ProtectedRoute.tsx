import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

interface ProtectedRouteProps {
  publicPath?: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({publicPath = "/login"}) => {
  const { user, loading, logout, login } = useAuth();

  const location = useLocation();

  if (loading) {
    return <div>loading ...</div>;
  }

  if (user) {
    return <Outlet context={{ user, logout, login }} />;
  }

  return <Navigate to={publicPath} state={{ from: location }} replace />;
};

export default ProtectedRoute;
