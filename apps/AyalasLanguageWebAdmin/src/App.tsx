
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
import UsersPage from './pages/auth/users/UsersPage';
import ContactUsGridPage from './pages/contactus/ContactUsGridPage';
import LogGridPage from './pages/log/LogGridPage';
import LearningPathsGridPage from './pages/content/LearningPathsGridPage';
import ExercisesGridPage from './pages/content/ExercisesGridPage';
import { LearningPathPage } from './pages/content/LearningPathPage';
import LoginsGridPage from './pages/auth/users/LoginsGridPage';
import { UserPage } from './pages/auth/users/UserPage';
import JobGridPage from './pages/job/JobGridPage';

function App() {
  useEffect(() => {
    //allow backend to write auth cookie
    axios.defaults.withCredentials = true;
  }, [])
  
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
    
          {/* Secured/Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/home" element={<Homepage />} />
            <Route path="/logins" element={<LoginsGridPage/>} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/user/:userId" element={<UserPage />} />
            <Route path="/contactus" element={<ContactUsGridPage />} />
            <Route path="/log" element={<LogGridPage />} />
            <Route path="/jobs" element={<JobGridPage />} />
            <Route path="/paths" element={<LearningPathsGridPage />} />
            <Route path="/exercises" element={<ExercisesGridPage />} />
            <Route path="/path/:learningPathId" element={<LearningPathPage />} />
          </Route>

          {/* Fallback 404 Route */}
          <Route path="*" element={<div>Admin Page Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App
