// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>; // Or a nice spinner component
  }

  // If there is no user, redirect to login page
  return user ? <Outlet context={{user}} /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;