
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LandingPage from './LandingPage';
import LoginPage from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ForgotPage } from './pages/auth/ForgotPage';
//authenticated
import { AccountPage } from './pages/auth/AccountPage';
import Homepage from './pages/Homepage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { LearningPathCreatePage } from './pages/content-creator/LearningPathCreatePage';
import { LearningPathUpdatePage } from './pages/content-creator/learning-path-update/LearningPathUpdatePage';
import { ExerciseUpdatePage } from './pages/content-creator/exercise-update/ExerciseUpdatePage';
import { LessonPage } from './pages/learning/LessonPage';
import { ConfirmEmailPage } from './pages/auth/ConfirmEmailPage';
import axios from 'axios';

import './App.css'
import { ContactUsPublicPage } from './pages/contactus/contactus-public';
import { ContactUsAuthenticatedUserPage } from './pages/contactus/contactus-auth';

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
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPage />} />
          <Route path="/reset/:token" element={ <ResetPasswordPage/>} />
          <Route path="/contactus" element={ <ContactUsPublicPage/>}/>

          {/* Secured/Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Homepage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/author/path/:learningPathId" element={<LearningPathUpdatePage />} />
            <Route path="/author/path" element={<LearningPathCreatePage />} />
            <Route path="/author/exercise/:exerciseId" element={<ExerciseUpdatePage />} />
            <Route path="/path/:learningPathId" element={<LessonPage />} />
            <Route path="/confirm/:token" element={ <ConfirmEmailPage/>} />
            <Route path="/usernote" element={ <ContactUsAuthenticatedUserPage/>}/>
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
