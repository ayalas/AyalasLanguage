
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from  './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './LandingPage';
import LoginPage from './pages/auth/LoginPage';

//authenticated
import Homepage from './pages/Homepage';
import axios from 'axios';

import './App.css'

function App() {
  useEffect(() => {
    //allow backend to write auth cookie
    axios.defaults.withCredentials = true;
  }, [])
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/admin/" element={<LandingPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
    
          {/* Secured/Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/home" element={<Homepage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<div>Admin Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
