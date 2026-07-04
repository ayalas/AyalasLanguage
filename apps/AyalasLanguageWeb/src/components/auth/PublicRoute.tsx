import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './useAuth';

interface PublicRouteProps {
  authPath?: string;
  children: React.ReactElement;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ authPath = "/home", children }) => {
  const { user, loading } = useAuth();

  // While checking the API, return null or a loading spinner
  // This is what stops the Landing Page from "flashing"
  if (loading) {
    return null; 
  }

  // If we have a user, they shouldn't be here. Redirect to home.
  if (user) {
    return <Navigate to={authPath} replace />;
  }

  // Otherwise, show the landing page/login/register
  return children;
};