
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './LandingPage';
import LoginPage from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
//authenticated
import { ChangePasswordPage } from './pages/auth/ChangePasswordPage';
import Homepage from './pages/Homepage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { LearningPathCreatePage } from './pages/content-creator/LearningPathCreatePage';
import { LearningPathUpdatePage } from './pages/content-creator/learning-path-update/LearningPathUpdatePage';
import { LessonPage } from './pages/learning/LessonPage';

import './App.css'

function App() {
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Secured/Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Homepage />} />
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/author/path/:learningPathId" element={<LearningPathUpdatePage />} />
            <Route path="/author/path" element={<LearningPathCreatePage />} />
            <Route path="/path/:learningPathId" element={<LessonPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
