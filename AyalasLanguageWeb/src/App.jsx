
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import ProtectedRoute from './auth/ProtectedRoute';

import { LandingPage } from './LandingPage';
import { Login } from './auth/Login';
import { Register } from './auth/Register';

//authenticated
import { ChangePassword } from './auth/ChangePassword';
import { Homepage } from './pages/Homepage';
import { Profile } from './pages/Profile';
import { LearningPathAuthoring } from './pages/content-creator/LearningPathAuthoring';

import './App.css'

function App() {
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Secured/Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Homepage />} />
            <Route path="/change-password" element={<ChangePassword />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/author/path" element={<LearningPathAuthoring />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
