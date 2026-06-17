import React, { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

const ProtectedRoute: React.FC = () => {
  const { user, loading, logout, login } = useAuth();

  const location = useLocation();

  useEffect(() => {
    if (user?.languageSettings?.targetLanguageIsRightToLeft) {
      document.body.setAttribute('data-rtl', 'true');
    } else {
      document.body.removeAttribute('data-rtl');
    }

    return () => {
      document.body.removeAttribute('data-rtl');
    };
  }, [user?.languageSettings?.targetLanguageIsRightToLeft]);

  if (loading) {
    return <div>loading ...</div>;
  }

  if (user) {
    if (user.languageSettings && user.languageSettings.targetLanguageIsRightToLeft) {
      import('../../assets/RightToLeft.css');
    }
    return <Outlet context={{ user, logout, login }} />;
  }

  return <Navigate to="/login" state={{ from: location }} replace />;
};

export default ProtectedRoute;
