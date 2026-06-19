import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute: React.FC = () => {
  const { user, loading, logout, login } = useAuth();

  const location = useLocation();

  if (loading) {
    return <div>loading ...</div>;
  }

  if (user) {
    return <Outlet context={{ user, logout, login }} />;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
