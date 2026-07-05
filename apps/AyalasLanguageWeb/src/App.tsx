
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
import { ContactUsPublicPage } from './pages/contactus/ContactUsPublicPage';
import { ContactUsAuthenticatedUserPage } from './pages/contactus/ContactUsAuthenticatedUserPage';
import { PublicRoute } from './components/auth/PublicRoute';
import { AboutPublicPage } from './pages/about/AboutPublicPage';
import { AboutAuthenticatedUserPage } from './pages/about/AboutAuthenticatedUserPage';

function App() {
  useEffect(() => {
    //allow backend to write auth cookie
    axios.defaults.withCredentials = true;
  }, [])
  
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes that redirect to an authenticated page if logged in */}
          <Route path="/" element={<PublicRoute><LandingPage /></PublicRoute>}/>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/contactus" element={ <PublicRoute authPath='/usernote'><ContactUsPublicPage/></PublicRoute>}/>
          {/* Public Routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot" element={<ForgotPage />} />
          <Route path="/reset/:token" element={ <ResetPasswordPage/>} />
          <Route path="/about" element={ <PublicRoute authPath='/userabout'><AboutPublicPage/></PublicRoute>} />

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
          </Route>
          <Route element={<ProtectedRoute publicPath='/about' />}>
            <Route path="/userabout" element={ <AboutAuthenticatedUserPage/>}/>
          </Route>
          <Route element={<ProtectedRoute publicPath='/contactus' />}>
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
