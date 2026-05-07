import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public pages
import HomePage    from './pages/public/HomePage';
import ContactPage from './pages/public/ContactPage';
import { TestimonialsPage, ProjectsPage, ServicesPage, AboutPage } from './pages/public/PublicPages';

// Auth
import LoginPage     from './pages/auth/LoginPage';
import OTPVerifyPage from './pages/auth/OTPVerifyPage';

// Shared (all authenticated roles)
import MessagesPage      from './pages/shared/MessagesPage';
import AssetsPage        from './pages/shared/AssetsPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import SettingsPage      from './pages/shared/SettingsPage';

// Manager
import ManagerDashboard        from './pages/manager/ManagerDashboard';
import ManagerLeadsPage        from './pages/manager/LeadsPage';
import ManagerPipelinePage     from './pages/manager/PipelinePage';
import ManagerFinancialsPage   from './pages/manager/FinancialsPage';
import ManagerCertificatesPage from './pages/manager/CertificatesPage';
import ManagerCalendarPage     from './pages/manager/CalendarPage';
import ContentCMSPage          from './pages/manager/ContentCMSPage';

// Producer
import ProducerDashboard    from './pages/producer/ProducerDashboard';
import ProducerTasksPage    from './pages/producer/TasksPage';
import ProducerUploadPage   from './pages/producer/UploadPage';
import ProducerEarningsPage from './pages/producer/EarningsPage';
import ProducerCalendarPage from './pages/producer/CalendarPage';

// Client
import ClientDashboard        from './pages/client/ClientDashboard';
import ClientProjectsPage     from './pages/client/ProjectsPage';
import ClientVaultPage        from './pages/client/VaultPage';
import ClientCertificatesPage from './pages/client/CertificatesPage';
import ClientCalendarPage     from './pages/client/CalendarPage';

const MGR = (el) => <ProtectedRoute roles={['manager']}>{el}</ProtectedRoute>;
const PRD = (el) => <ProtectedRoute roles={['producer']}>{el}</ProtectedRoute>;
const CLI = (el) => <ProtectedRoute roles={['client']}>{el}</ProtectedRoute>;
const ANY = (el) => <ProtectedRoute roles={['manager','producer','client']}>{el}</ProtectedRoute>;

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
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/otp-verify"   element={<OTPVerifyPage />} />

          {/* ── MANAGER ── */}
          <Route path="/dashboard/manager"                element={MGR(<ManagerDashboard />)} />
          <Route path="/dashboard/manager/leads"          element={MGR(<ManagerLeadsPage />)} />
          <Route path="/dashboard/manager/pipeline"       element={MGR(<ManagerPipelinePage />)} />
          <Route path="/dashboard/manager/assets"         element={MGR(<AssetsPage />)} />
          <Route path="/dashboard/manager/financials"     element={MGR(<ManagerFinancialsPage />)} />
          <Route path="/dashboard/manager/certificates"   element={MGR(<ManagerCertificatesPage />)} />
          <Route path="/dashboard/manager/calendar"       element={MGR(<ManagerCalendarPage />)} />
          <Route path="/dashboard/manager/notifications"  element={MGR(<NotificationsPage />)} />
          <Route path="/dashboard/manager/messages"       element={MGR(<MessagesPage />)} />
          <Route path="/dashboard/manager/content"        element={MGR(<ContentCMSPage />)} />
          <Route path="/dashboard/manager/settings"       element={MGR(<SettingsPage />)} />

          {/* ── PRODUCER ── */}
          <Route path="/dashboard/producer"               element={PRD(<ProducerDashboard />)} />
          <Route path="/dashboard/producer/tasks"         element={PRD(<ProducerTasksPage />)} />
          <Route path="/dashboard/producer/assets"        element={PRD(<AssetsPage />)} />
          <Route path="/dashboard/producer/upload"        element={PRD(<ProducerUploadPage />)} />
          <Route path="/dashboard/producer/earnings"      element={PRD(<ProducerEarningsPage />)} />
          <Route path="/dashboard/producer/notifications" element={PRD(<NotificationsPage />)} />
          <Route path="/dashboard/producer/messages"      element={PRD(<MessagesPage />)} />
          <Route path="/dashboard/producer/calendar"      element={PRD(<ProducerCalendarPage />)} />
          <Route path="/dashboard/producer/settings"      element={PRD(<SettingsPage />)} />

          {/* ── CLIENT ── */}
          <Route path="/dashboard/client"                 element={CLI(<ClientDashboard />)} />
          <Route path="/dashboard/client/projects"        element={CLI(<ClientProjectsPage />)} />
          <Route path="/dashboard/client/vault"           element={CLI(<ClientVaultPage />)} />
          <Route path="/dashboard/client/certificates"    element={CLI(<ClientCertificatesPage />)} />
          <Route path="/dashboard/client/notifications"   element={CLI(<NotificationsPage />)} />
          <Route path="/dashboard/client/messages"        element={CLI(<MessagesPage />)} />
          <Route path="/dashboard/client/calendar"        element={CLI(<ClientCalendarPage />)} />
          <Route path="/dashboard/client/settings"        element={CLI(<SettingsPage />)} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
