import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import HomePage    from './pages/public/HomePage';
import ContactPage from './pages/public/ContactPage';
import { TestimonialsPage, ProjectsPage, ServicesPage, AboutPage } from './pages/public/PublicPages';

// Auth pages
import LoginPage     from './pages/auth/LoginPage';
import OTPVerifyPage from './pages/auth/OTPVerifyPage';

// Dashboards
import ManagerDashboard  from './pages/manager/ManagerDashboard';
import ProducerDashboard from './pages/producer/ProducerDashboard';
import ClientDashboard   from './pages/client/ClientDashboard';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{
          style: {
            background: '#1E1036',
            color: '#fff',
            border: '1px solid rgba(147,51,234,0.4)',
            borderRadius: '12px',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#F5C842', secondary: '#130A24' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 4000,
        }} />

        <Routes>
          {/* Public */}
          <Route path="/"             element={<HomePage />} />
          <Route path="/about"        element={<AboutPage />} />
          <Route path="/services"     element={<ServicesPage />} />
          <Route path="/projects"     element={<ProjectsPage />} />
          <Route path="/testimonials" element={<TestimonialsPage />} />
          <Route path="/contact"      element={<ContactPage />} />

          {/* Auth */}
          <Route path="/login"      element={<LoginPage />} />
          <Route path="/otp-verify" element={<OTPVerifyPage />} />

          {/* Manager */}
          <Route path="/dashboard/manager"  element={<ProtectedRoute roles={['manager']}><ManagerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/manager/*" element={<ProtectedRoute roles={['manager']}><ManagerDashboard /></ProtectedRoute>} />

          {/* Producer */}
          <Route path="/dashboard/producer"  element={<ProtectedRoute roles={['producer']}><ProducerDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/producer/*" element={<ProtectedRoute roles={['producer']}><ProducerDashboard /></ProtectedRoute>} />

          {/* Client */}
          <Route path="/dashboard/client"  element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />
          <Route path="/dashboard/client/*" element={<ProtectedRoute roles={['client']}><ClientDashboard /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
