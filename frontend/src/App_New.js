import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import FacultyLoginPage from './pages/auth/FacultyLoginPage';
import StudentLoginPage from './pages/auth/StudentLoginPage';
import ParentLoginPage from './pages/auth/ParentLoginPage';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/auth/register" element={<RegisterPage />} />
            <Route path="/auth/admin" element={<AdminLoginPage />} />
            <Route path="/auth/faculty" element={<FacultyLoginPage />} />
            <Route path="/auth/student" element={<StudentLoginPage />} />
            <Route path="/auth/parent" element={<ParentLoginPage />} />
            <Route path="/auth/admin-register" element={<AdminRegisterPage />} />
            <Route path="/auth/faculty-register" element={<FacultyRegisterPage />} />
            <Route path="/auth/student-register" element={<StudentRegisterPage />} />
            <Route path="/auth/parent-register" element={<ParentRegisterPage />} />
            <Route path="/test-ui" element={<TestUI />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ThemeProvider>
      <Toaster />
    </React.Fragment>
  );
}

export default App;
