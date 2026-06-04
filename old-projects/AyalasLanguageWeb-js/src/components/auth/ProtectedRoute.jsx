// src/components/ProtectedRoute.jsx
import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

const ProtectedRoute = () => {
  const { user, loading, logout, login } = useAuth();

  useEffect(() => {
    if (user?.languageSettings?.targetLanguageIsRightToLeft) {
      document.body.setAttribute('data-rtl', 'true');
    } else {
      document.body.removeAttribute('data-rtl'); // Cleanly removes it for LTR
    }

    return () => {
      document.body.removeAttribute('data-rtl'); // Cleanup on logout/unmount
    };
  }, [user?.languageSettings?.targetLanguageIsRightToLeft]);

  if (loading) {
    return (
      <div>loading ...</div>
    );
  }

  // If there is no user, redirect to login page
  if (user) {
    //import right to left css conditionally
    if (user.languageSettings && user.languageSettings.targetLanguageIsRightToLeft) {
      import('../../assets/RightToLeft.css');
    }

    return (
      <Outlet context={{ user, logout, login }} />
    );
  }
  else {
    return (
      <Navigate to="/login" replace />
    );
  }
};

export default ProtectedRoute;