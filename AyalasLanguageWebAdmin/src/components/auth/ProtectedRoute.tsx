import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';
import { ROLE_TYPE } from '../../constants/admin';

const ProtectedRoute: React.FC = () => {
  const { user, loading, logout, login } = useAuth();

  const location = useLocation();

  if (loading) {
    return <div>loading ...</div>;
  }

  if (user && user.role == ROLE_TYPE.ADMIN) {
    return <Outlet context={{ user, logout, login }} />;
  }

  return <Navigate to="/admin/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
