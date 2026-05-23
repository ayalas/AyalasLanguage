// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div>loading ...</div>
    );
  }

  // If there is no user, redirect to login page
  return user ? <Outlet context={{ user, logout }} /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;